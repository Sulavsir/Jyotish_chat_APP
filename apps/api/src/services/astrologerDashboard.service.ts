/**
 * Astrologer Dashboard Service
 * Aggregates all dashboard data (stats, recent activity, today tip) into a single response.
 * Includes today’s and this month’s earnings from AstrologerCoinEarning; use /earnings?from=&to= for filtered history.
 */

import { prisma } from '@jyotish/database';
import { tipService } from './tip.service';
import type { QuestionnaireLanguage } from '@jyotish/shared';
import { AppointmentStatus, type AstrologerCoinEarningSource } from '@prisma/client';
import { ASTROLOGER_ACCOUNT_STATUS } from '../constants/astrologer.constants';

function emptyEarningsBySource(): Record<AstrologerCoinEarningSource, number> {
  return {
    CHAT_MESSAGE: 0,
    BROADCAST_MESSAGE: 0,
    APPOINTMENT: 0,
    KUNDALI_REVIEW: 0,
  };
}

export interface TodaysConsultations {
  total: number;
  completed: number;
  upcoming: number;
}

export interface PendingChats {
  total: number;
  urgent: number;
}

export interface MonthlyEarnings {
  amount: number;
  currency: string;
  changePercent: number;
}

/** Today's credited balance (same calendar day as server, same units as monthlyEarnings). */
export interface TodaysEarnings {
  amount: number;
  currency: string;
  transactionCount: number;
  bySource: Record<AstrologerCoinEarningSource, number>;
}

export interface RecentActivityItem {
  id: string;
  type: 'consultation' | 'chat' | 'appointment';
  title: string;
  description: string;
  clientName: string;
  timestamp: string;
  avatar?: string | null;
}

export interface TodayTip {
  text: string;
}

export interface AstrologerDashboardStats {
  todaysConsultations: TodaysConsultations;
  totalConsultations: number;
  pendingChats: PendingChats;
  todaysEarnings: TodaysEarnings;
  monthlyEarnings: MonthlyEarnings;
  recentActivity: RecentActivityItem[];
  todayTip: TodayTip;
}

export interface OnlineAstrologerPeer {
  id: string;
  name: string;
  profilePhoto: string | null;
  category: string;
  rating: number;
  totalConsultations: number;
  isOnline: boolean;
}

const RECENT_ACTIVITY_LIMIT = 3;

export async function getAstrologerDashboardStats(
  astrologerId: string,
  language?: QuestionnaireLanguage
): Promise<AstrologerDashboardStats> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const [
    pendingChatsCount,
    monthlyEarningsAgg,
    lastMonthEarningsAgg,
    todaysAppointments,
    completedAppointmentsCount,
    recentAppointments,
    consultations,
    chatsForActivity,
    tips,
    consultationsCount,
    todaysEarningsGroupBy,
    todaysEarningsCount,
  ] = await Promise.all([
    prisma.chat.count({
      where: {
        participant2Id: astrologerId,
        status: 'ACTIVE',
        isLocked: false,
        waitingForReply: true,
      },
    }),
    prisma.astrologerCoinEarning.aggregate({
      _sum: { astrologerCoinsEarned: true },
      where: {
        astrologerId,
        createdAt: { gte: monthStart },
      },
    }),
    prisma.astrologerCoinEarning.aggregate({
      _sum: { astrologerCoinsEarned: true },
      where: {
        astrologerId,
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
      },
    }),
    prisma.appointment.findMany({
      where: {
        astrologerId,
        scheduledAt: { gte: todayStart, lte: todayEnd },
      },
      include: {
        client: { select: { id: true, name: true, phone: true, profilePhoto: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    }),
    prisma.appointment.count({
      where: { astrologerId, status: AppointmentStatus.COMPLETED },
    }),
    prisma.appointment.findMany({
      where: { astrologerId },
      include: {
        client: { select: { id: true, name: true, phone: true, profilePhoto: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: RECENT_ACTIVITY_LIMIT * 2,
    }),
    prisma.consultation.findMany({
      where: { astrologerId },
      include: {
        client: { select: { id: true, name: true, phone: true, profilePhoto: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: RECENT_ACTIVITY_LIMIT * 2,
    }),
    prisma.chat.findMany({
      where: {
        participant2Id: astrologerId,
        lastMessageAt: { not: null },
      },
      select: {
        id: true,
        lastMessageAt: true,
        lastMessageText: true,
        updatedAt: true,
        clientParticipant: {
          select: { id: true, name: true, phone: true, profilePhoto: true },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: RECENT_ACTIVITY_LIMIT * 2,
    }),
    tipService.getTipsForDate({
      audience: 'JYOTISH',
      language: language ?? 'ENGLISH',
    }),
    prisma.consultation.count({ where: { astrologerId } }),
    prisma.astrologerCoinEarning.groupBy({
      by: ['source'],
      where: {
        astrologerId,
        createdAt: { gte: todayStart, lte: todayEnd },
      },
      _sum: { astrologerCoinsEarned: true },
    }),
    prisma.astrologerCoinEarning.count({
      where: {
        astrologerId,
        createdAt: { gte: todayStart, lte: todayEnd },
      },
    }),
  ]);

  const todaysCompleted = todaysAppointments.filter(
    (a) => a.status === 'COMPLETED' || a.status === 'IN_PROGRESS'
  ).length;
  const todaysUpcoming = todaysAppointments.filter(
    (a) => a.status === 'PENDING' || a.status === 'CONFIRMED'
  ).length;

  const monthlyAmount = monthlyEarningsAgg._sum?.astrologerCoinsEarned ?? 0;
  const lastMonthAmount = lastMonthEarningsAgg._sum?.astrologerCoinsEarned ?? 0;
  const changePercent =
    lastMonthAmount > 0
      ? Math.round(((monthlyAmount - lastMonthAmount) / lastMonthAmount) * 100)
      : monthlyAmount > 0
        ? 100
        : 0;

  const todaysBySource = emptyEarningsBySource();
  for (const row of todaysEarningsGroupBy) {
    todaysBySource[row.source] = row._sum.astrologerCoinsEarned ?? 0;
  }
  const todaysEarningsAmount = Object.values(todaysBySource).reduce((a, b) => a + b, 0);

  const DESCRIPTION_MAX_LEN = 60;
  const truncate = (s: string, max: number) =>
    s.length <= max ? s : `${s.slice(0, max).trim()}...`;

  const appointmentActivities: RecentActivityItem[] = recentAppointments
    .slice(0, RECENT_ACTIVITY_LIMIT)
    .map((apt) => ({
      id: apt.id,
      type: 'appointment' as const,
      title: 'New appointment booked',
      description: 'Appointment scheduled',
      clientName: apt.client?.name || apt.client?.phone || 'Client',
      timestamp: apt.createdAt.toISOString(),
      avatar: apt.client?.profilePhoto ?? null,
    }));

  const consultationActivities: RecentActivityItem[] = consultations
    .slice(0, RECENT_ACTIVITY_LIMIT)
    .map((c) => ({
      id: c.id,
      type: 'consultation' as const,
      title: 'New consultation booked',
      description: truncate(c.type || 'Consultation', DESCRIPTION_MAX_LEN),
      clientName: c.client?.name || c.client?.phone || 'Client',
      timestamp: c.createdAt.toISOString(),
      avatar: c.client?.profilePhoto ?? null,
    }));

  const chatActivities: RecentActivityItem[] = chatsForActivity.map((chat) => ({
    id: chat.id,
    type: 'chat' as const,
    title: 'Chat message received',
    description: truncate(chat.lastMessageText || 'New message', DESCRIPTION_MAX_LEN),
    clientName: chat.clientParticipant?.name || chat.clientParticipant?.phone || 'Client',
    timestamp: (chat.lastMessageAt ?? chat.updatedAt).toISOString(),
    avatar: chat.clientParticipant?.profilePhoto ?? null,
  }));

  const allActivities = [
    ...appointmentActivities,
    ...consultationActivities,
    ...chatActivities,
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const recentActivity = allActivities.slice(0, RECENT_ACTIVITY_LIMIT);

  const tipText = tips[0]?.text ?? '';

  return {
    todaysConsultations: {
      total: todaysAppointments.length,
      completed: todaysCompleted,
      upcoming: todaysUpcoming,
    },
    totalConsultations: consultationsCount + completedAppointmentsCount,
    pendingChats: {
      total: pendingChatsCount,
      urgent: 0,
    },
    todaysEarnings: {
      amount: todaysEarningsAmount,
      currency: 'NPR',
      transactionCount: todaysEarningsCount,
      bySource: todaysBySource,
    },
    monthlyEarnings: {
      amount: monthlyAmount,
      currency: 'NPR',
      changePercent,
    },
    recentActivity,
    todayTip: { text: tipText },
  };
}

/**
 * Returns other online astrologers for astrologer dashboard.
 * Excludes current astrologer to avoid self-listing.
 */
export async function getOnlineAstrologerPeers(
  currentAstrologerId: string,
  limit: number = 12
): Promise<OnlineAstrologerPeer[]> {
  const rows = await prisma.astrologer.findMany({
    where: {
      id: { not: currentAstrologerId },
      isDeleted: false,
      isActive: true,
      isOnline: true,
      accountStatus: ASTROLOGER_ACCOUNT_STATUS.APPROVED,
    },
    select: {
      id: true,
      name: true,
      profilePhoto: true,
      category: true,
      rating: true,
      totalConsultations: true,
      isOnline: true,
    },
    orderBy: [{ rating: 'desc' }, { totalConsultations: 'desc' }, { name: 'asc' }],
    take: limit,
  });

  return rows.map((row) => ({
    ...row,
    rating: row.rating ?? 0,
  }));
}
