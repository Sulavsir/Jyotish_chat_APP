/**
 * Appointment Session Worker (Full Kundali Review)
 * - ~1h before: reminder emails (when address exists) + in-app notifications (client + Jyotish).
 * - At session start: open chat, "consultation is ready" notifications + socket for live UI, Jyotish ring.
 * - After window: end linked chats.
 */

import { Job } from 'bullmq';
import { prisma } from '@jyotish/database';
import {
  AstrologerNotificationSoundCue,
  KUNDALI_APPOINTMENT_GROUP_KEY,
  KUNDALI_APPOINTMENT_NOTIFICATION_EVENT,
  NotificationType,
  TIME,
} from '@jyotish/shared';
import {
  AppointmentStatus,
  BookingType,
  ChatStatus,
  MessageType,
  ParticipantType,
} from '@prisma/client';
import { getOrCreateChatForAppointment } from '../services/chatService';
import { emailService } from '../services/email.service';
import {
  createAndEmitUserNotification,
  createSessionReadyNotifications,
} from '../services/appointmentSessionNotification.service';
import { emitAstrologerNotificationSoundToUser } from '../utils/astrologer-notification-sound';
import { getSocketInstance } from '../utils/socket-instance';

const BOOKING_TYPE_LABELS = {
  [BookingType.KUNDALI_REVIEW]: 'Appointment for Full Kundali Review',
} as Record<BookingType, string>;

/** Only scan recent CONFIRMED appointments to keep the job cheap. */
const ACTIVE_SESSION_LOOKBACK_MS = 6 * TIME.ONE_HOUR;

export async function appointmentSessionProcessor(job: Job) {
  const now = new Date();
  const nowMs = now.getTime();
  const recentLowerBound = new Date(nowMs - ACTIVE_SESSION_LOOKBACK_MS);

  await processSessionStarts(now, nowMs, recentLowerBound);
  await processOneHourReminders(nowMs);
  await processSessionEnds(nowMs);
}

async function processSessionStarts(now: Date, nowMs: number, recentLowerBound: Date) {
  const inWindowAppointments = await prisma.appointment.findMany({
    where: {
      status: AppointmentStatus.CONFIRMED,
      bookingType: BookingType.KUNDALI_REVIEW,
      scheduledAt: { lte: now, gte: recentLowerBound },
    },
    select: {
      id: true,
      clientId: true,
      astrologerId: true,
      scheduledAt: true,
      duration: true,
      client: { select: { name: true } },
      astrologer: { select: { name: true } },
    },
  });

  let io: ReturnType<typeof getSocketInstance> | null = null;
  try {
    io = getSocketInstance();
  } catch {
    io = null;
  }

  for (const apt of inWindowAppointments) {
    const startMs = new Date(apt.scheduledAt).getTime();
    const endMs = startMs + apt.duration * 60 * 1000;
    if (nowMs < startMs || nowMs >= endMs) continue;

    const chat = await getOrCreateChatForAppointment(apt.id);
    if (!chat) continue;

    const groupKey = KUNDALI_APPOINTMENT_GROUP_KEY.SESSION_READY(apt.id);

    const alreadyOpened = await prisma.notification.findFirst({
      where: { userId: apt.clientId, groupKey },
    });
    if (alreadyOpened) continue;

    const clientName = apt.client.name || 'Client';
    const astrologerName = apt.astrologer.name || 'Jyotish';

    await createSessionReadyNotifications({
      clientId: apt.clientId,
      astrologerId: apt.astrologerId,
      clientName,
      astrologerName,
      appointmentId: apt.id,
      chatId: chat.id,
      groupKey,
    });

    if (io) {
      emitAstrologerNotificationSoundToUser(
        io,
        apt.astrologerId,
        AstrologerNotificationSoundCue.DIRECT_CHAT_OR_KUNDALI_REVIEW
      );
    }
  }
}

async function processOneHourReminders(nowMs: number) {
  const windowStart = new Date(nowMs + TIME.ONE_HOUR - 5 * TIME.ONE_MINUTE);
  const windowEnd = new Date(nowMs + TIME.ONE_HOUR + 5 * TIME.ONE_MINUTE);

  const reminderAppointments = await prisma.appointment.findMany({
    where: {
      status: AppointmentStatus.CONFIRMED,
      bookingType: BookingType.KUNDALI_REVIEW,
      scheduledAt: { gte: windowStart, lte: windowEnd },
    },
    select: {
      id: true,
      scheduledAt: true,
      duration: true,
      bookingType: true,
      clientId: true,
      astrologerId: true,
      client: { select: { name: true, email: true } },
      astrologer: { select: { name: true, email: true } },
    },
  });

  for (const apt of reminderAppointments) {
    const clientGroupKey = KUNDALI_APPOINTMENT_GROUP_KEY.REMINDER_1H_CLIENT(apt.id);

    const alreadySent = await prisma.notification.findFirst({
      where: { userId: apt.clientId, groupKey: clientGroupKey },
    });
    if (alreadySent) continue;

    const typeLabel = BOOKING_TYPE_LABELS[apt.bookingType];
    const clientName = apt.client.name || 'Client';
    const scheduledAt = new Date(apt.scheduledAt);

    try {
      if (apt.client.email) {
        await emailService.sendAppointmentReminderEmail(
          clientName,
          apt.client.email,
          {
            appointmentTypeLabel: typeLabel,
            clientName,
            scheduledAt,
            durationMinutes: apt.duration,
          }
        );
      }
      if (apt.astrologer.email) {
        await emailService.sendAppointmentReminderEmail(
          apt.astrologer.name,
          apt.astrologer.email,
          {
            appointmentTypeLabel: typeLabel,
            clientName,
            scheduledAt,
            durationMinutes: apt.duration,
          }
        );
      }

      const reminderMeta = {
        appointmentId: apt.id,
        astrologerId: apt.astrologerId,
        scheduledAt: apt.scheduledAt.toISOString(),
        event: KUNDALI_APPOINTMENT_NOTIFICATION_EVENT.REMINDER_1H,
      };

      await createAndEmitUserNotification({
        userId: apt.clientId,
        title: 'Consultation in 1 hour',
        message: `Your ${typeLabel} with ${apt.astrologer.name ?? 'your Jyotish'} starts at ${scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        type: NotificationType.CONSULTATION_REMINDER,
        groupKey: clientGroupKey,
        metadata: reminderMeta,
      });

      await createAndEmitUserNotification({
        astrologerId: apt.astrologerId,
        title: 'Consultation in 1 hour',
        message: `Your ${typeLabel} with ${clientName} starts at ${scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        type: NotificationType.CONSULTATION_REMINDER,
        groupKey: KUNDALI_APPOINTMENT_GROUP_KEY.REMINDER_1H_JYOTISH(apt.id),
        metadata: reminderMeta,
      });
    } catch (err) {
      console.error(`❌ Failed Kundali reminder flow for appointment ${apt.id}:`, err);
    }
  }
}

async function processSessionEnds(nowMs: number) {
  const endedAppointmentChats = await prisma.chat.findMany({
    where: {
      appointmentId: { not: null },
      status: ChatStatus.ACTIVE,
    },
    select: { id: true, appointmentId: true, participant1Id: true, participant2Id: true },
  });

  for (const c of endedAppointmentChats) {
    if (!c.appointmentId) continue;
    const apt = await prisma.appointment.findUnique({
      where: { id: c.appointmentId },
      select: { scheduledAt: true, duration: true },
    });
    if (!apt) continue;
    const endMs = new Date(apt.scheduledAt).getTime() + apt.duration * 60 * 1000;
    if (nowMs < endMs) continue;

    const sessionEndContent = 'Your session has ended. Thank you for your time.';
    await prisma.$transaction([
      prisma.message.create({
        data: {
          chatId: c.id,
          senderId: c.participant2Id,
          receiverId: c.participant1Id,
          senderType: ParticipantType.ASTROLOGER,
          receiverType: ParticipantType.CLIENT,
          content: sessionEndContent,
          type: MessageType.TEXT,
          metadata: { system: true, event: 'SESSION_ENDED' },
        },
      }),
      prisma.chat.update({
        where: { id: c.id },
        data: { status: ChatStatus.ENDED, appointmentId: null },
      }),
    ]);
  }
}
