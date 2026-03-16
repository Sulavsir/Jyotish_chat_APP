/**
 * Astrologer Coin Earnings Service
 * Earnings from client coin deductions (chat, broadcast, appointment) with commission %
 */

import { prisma } from '@jyotish/database';
import type { AstrologerCoinEarningSource, Prisma } from '@prisma/client';

export interface AstrologerCoinEarningRow {
  id: string;
  astrologerId: string;
  coinTransactionId: string | null;
  chatId: string | null;
  broadcastMessageId: string | null;
  appointmentId: string | null;
  source: AstrologerCoinEarningSource;
  clientCoinsDeducted: number;
  commissionPercent: number;
  astrologerCoinsEarned: number;
  createdAt: Date;
  clientName: string | null;
}

export interface GetAstrologerEarningsFilters {
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
  source?: AstrologerCoinEarningSource;
}

export interface AstrologerEarningsSummary {
  totalCoins: number;
  bySource: Record<AstrologerCoinEarningSource, number>;
  period?: { from: Date; to: Date };
}

export interface GetAstrologerEarningsResult {
  items: AstrologerCoinEarningRow[];
  total: number;
  summary: AstrologerEarningsSummary;
}

/**
 * Get paginated earnings list and summary for an astrologer
 */
export async function getAstrologerEarnings(
  astrologerId: string,
  filters: GetAstrologerEarningsFilters = {}
): Promise<GetAstrologerEarningsResult> {
  const { from, to, limit = 50, offset = 0, source } = filters;
  const where: Prisma.AstrologerCoinEarningWhereInput = {
    astrologerId,
  };
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }
  if (source) where.source = source;

  const [items, total] = await Promise.all([
    prisma.astrologerCoinEarning.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      skip: offset,
    }),
    prisma.astrologerCoinEarning.count({ where }),
  ]);

  const summaryWhere = { astrologerId, ...(from || to ? { createdAt: where.createdAt } : {}) };
  const aggregates = await prisma.astrologerCoinEarning.groupBy({
    by: ['source'],
    where: summaryWhere,
    _sum: { astrologerCoinsEarned: true },
  });

  const bySource = {
    CHAT_MESSAGE: 0,
    BROADCAST_MESSAGE: 0,
    APPOINTMENT: 0,
    KUNDALI_REVIEW: 0,
  } as Record<AstrologerCoinEarningSource, number>;
  let totalCoins = 0;
  for (const row of aggregates) {
    const sum = row._sum.astrologerCoinsEarned ?? 0;
    bySource[row.source] = sum;
    totalCoins += sum;
  }

  const summary: AstrologerEarningsSummary = {
    totalCoins,
    bySource,
    ...(from && to ? { period: { from, to } } : {}),
  };

  const txIds = [...new Set(items.map((e) => e.coinTransactionId).filter(Boolean))] as string[];
  const chatIds = [...new Set(items.map((e) => e.chatId).filter(Boolean))] as string[];
  const appIds = [...new Set(items.map((e) => e.appointmentId).filter(Boolean))] as string[];

  const [txList, chatList, appList] = await Promise.all([
    txIds.length > 0
      ? prisma.coinTransaction.findMany({
          where: { id: { in: txIds } },
          select: { id: true, user: { select: { name: true } } },
        })
      : [],
    chatIds.length > 0
      ? prisma.chat.findMany({
          where: { id: { in: chatIds } },
          select: { id: true, clientParticipant: { select: { name: true } } },
        })
      : [],
    appIds.length > 0
      ? prisma.appointment.findMany({
          where: { id: { in: appIds } },
          select: { id: true, client: { select: { name: true } } },
        })
      : [],
  ]);

  const nameByTxId = new Map(txList.map((t) => [t.id, t.user?.name ?? null]));
  const nameByChatId = new Map(chatList.map((c) => [c.id, c.clientParticipant?.name ?? null]));
  const nameByAppId = new Map(appList.map((a) => [a.id, a.client?.name ?? null]));

  return {
    items: items.map((e) => {
      const clientName =
        (e.coinTransactionId && nameByTxId.get(e.coinTransactionId)) ??
        (e.chatId && nameByChatId.get(e.chatId)) ??
        (e.appointmentId && nameByAppId.get(e.appointmentId)) ??
        null;
      return {
        id: e.id,
        astrologerId: e.astrologerId,
        coinTransactionId: e.coinTransactionId,
        chatId: e.chatId,
        broadcastMessageId: e.broadcastMessageId,
        appointmentId: e.appointmentId,
        source: e.source,
        clientCoinsDeducted: e.clientCoinsDeducted,
        commissionPercent: e.commissionPercent,
        astrologerCoinsEarned: e.astrologerCoinsEarned,
        createdAt: e.createdAt,
        clientName,
      };
    }),
    total,
    summary,
  };
}

/**
 * Get summary only (total and by source) for an astrologer
 */
export async function getAstrologerEarningsSummary(
  astrologerId: string,
  from?: Date,
  to?: Date
): Promise<AstrologerEarningsSummary> {
  const where: Parameters<typeof prisma.astrologerCoinEarning.groupBy>[0]['where'] = {
    astrologerId,
  };
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }
  const aggregates = await prisma.astrologerCoinEarning.groupBy({
    by: ['source'],
    where,
    _sum: { astrologerCoinsEarned: true },
  });
  const bySource = {
    CHAT_MESSAGE: 0,
    BROADCAST_MESSAGE: 0,
    APPOINTMENT: 0,
    KUNDALI_REVIEW: 0,
  } as Record<AstrologerCoinEarningSource, number>;
  let totalCoins = 0;
  for (const row of aggregates) {
    const sum = row._sum.astrologerCoinsEarned ?? 0;
    bySource[row.source] = sum;
    totalCoins += sum;
  }
  return {
    totalCoins,
    bySource,
    ...(from && to ? { period: { from, to } } : {}),
  };
}

export interface AstrologerWithCoinEarningRow {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  category: string;
  rating: number | null;
  totalCoinEarnings: number;
}

export interface ListAstrologersWithCoinEarningsResult {
  astrologers: AstrologerWithCoinEarningRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * List astrologers with their total coin earnings (for admin earnings page)
 */
export async function listAstrologersWithCoinEarnings(params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<ListAstrologersWithCoinEarningsResult> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 10));
  const search = params.search?.trim();
  const skip = (page - 1) * limit;

  const where: Prisma.AstrologerWhereInput = {
    isDeleted: false,
  };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
    ];
  }

  const [astrologers, total] = await Promise.all([
    prisma.astrologer.findMany({
      where: {
        ...where,
        isDeleted: false,
      },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        category: true,
        rating: true,
      },
      orderBy: { name: 'asc' },
    }),
    prisma.astrologer.count({
      where: {
        ...where,
        isDeleted: false,
      },
    }),
  ]);

  const astrologerIds = astrologers.map((a) => a.id);
  const earningsAgg =
    astrologerIds.length > 0
      ? await prisma.astrologerCoinEarning.groupBy({
          by: ['astrologerId'],
          where: { astrologerId: { in: astrologerIds } },
          _sum: { astrologerCoinsEarned: true },
        })
      : [];
  const earningsMap = new Map(
    earningsAgg.map((e) => [e.astrologerId, e._sum.astrologerCoinsEarned ?? 0])
  );

  const astrologersWithEarnings: AstrologerWithCoinEarningRow[] = astrologers.map((a) => ({
    id: a.id,
    name: a.name,
    email: a.email,
    phone: a.phone,
    category: a.category,
    rating: a.rating,
    totalCoinEarnings: earningsMap.get(a.id) ?? 0,
  }));

  return {
    astrologers: astrologersWithEarnings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}
