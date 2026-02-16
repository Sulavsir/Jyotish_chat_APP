/**
 * Appointment Session Worker
 * - At session start: find CONFIRMED appointments in their 30-min window, getOrCreateChatForAppointment,
 *   create "Session started" notifications (with chatId) for client and astrologer.
 * - At session end: end chats linked to appointments whose window has passed; send system message.
 * - 1 hour before: send SMTP reminder email to client and astrologer (Book Appointment & Full Kundali Review).
 */

import { Job } from 'bullmq';
import { prisma } from '@jyotish/database';
import { NotificationType } from '@jyotish/shared';
import {
  AppointmentStatus,
  BookingType,
  ChatStatus,
  MessageType,
  ParticipantType,
} from '@prisma/client';
import { getOrCreateChatForAppointment } from '../services/chatService';
import { NotificationService } from '../services/notification.service';
import { emailService } from '../services/email.service';

const notificationService = new NotificationService();

const BOOKING_TYPE_LABELS: Record<BookingType, string> = {
  [BookingType.APPOINTMENT]: 'Appointment',
  [BookingType.KUNDALI_REVIEW]: 'Full Kundali Review',
};

export async function appointmentSessionProcessor(job: Job) {
  const now = new Date();
  const nowMs = now.getTime();

  // ---- Session start: appointments where scheduledAt <= now < scheduledAt + duration ----
  const inWindowAppointments = await prisma.appointment.findMany({
    where: {
      status: AppointmentStatus.CONFIRMED,
      scheduledAt: { lte: now },
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

  for (const apt of inWindowAppointments) {
    const startMs = new Date(apt.scheduledAt).getTime();
    const endMs = startMs + apt.duration * 60 * 1000;
    if (nowMs < startMs || nowMs >= endMs) continue;

    const chat = await getOrCreateChatForAppointment(apt.id);
    if (!chat) continue;

    const groupKey = `session_started_${apt.id}`;
    const existingClient = await prisma.notification.findFirst({
      where: { userId: apt.clientId, groupKey, createdAt: { gte: new Date(nowMs - 35 * 60 * 1000) } },
    });
    const existingAstrologer = await prisma.notification.findFirst({
      where: { astrologerId: apt.astrologerId, groupKey, createdAt: { gte: new Date(nowMs - 35 * 60 * 1000) } },
    });

    if (!existingClient) {
      await notificationService.createNotification({
        userId: apt.clientId,
        title: 'Session started',
        message: `Your session with ${apt.astrologer.name} has started. Open chat to connect.`,
        type: NotificationType.SYSTEM,
        groupKey,
        metadata: { chatId: chat.id, appointmentId: apt.id, event: 'SESSION_STARTED' },
      });
    }
    if (!existingAstrologer) {
      await notificationService.createNotification({
        astrologerId: apt.astrologerId,
        title: 'Session started',
        message: `Your session with ${apt.client.name} has started. Open chat to connect.`,
        type: NotificationType.SYSTEM,
        groupKey,
        metadata: { chatId: chat.id, appointmentId: apt.id, event: 'SESSION_STARTED' },
      });
    }
  }

  // 1 hour before: send reminder email to client and astrologer 
  const windowStart = new Date(nowMs + 55 * 60 * 1000);
  const windowEnd = new Date(nowMs + 65 * 60 * 1000);
  const reminderAppointments = await prisma.appointment.findMany({
    where: {
      status: AppointmentStatus.CONFIRMED,
      scheduledAt: { gte: windowStart, lte: windowEnd },
      bookingType: { in: [BookingType.APPOINTMENT, BookingType.KUNDALI_REVIEW] },
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
    const groupKey = `appointment_reminder_1h_${apt.id}`;
    const existingReminder = await prisma.notification.findFirst({
      where: { groupKey, createdAt: { gte: new Date(nowMs - 2 * 60 * 60 * 1000) } },
    });
    if (existingReminder) continue;

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
      await notificationService.createNotification({
        userId: apt.clientId,
        title: 'Appointment reminder sent',
        message: `Reminder email sent for ${typeLabel} in 1 hour.`,
        type: NotificationType.SYSTEM,
        groupKey,
        metadata: { appointmentId: apt.id, event: 'APPOINTMENT_REMINDER_1H' },
      });
    } catch (err) {
      console.error(`❌ Failed to send appointment reminder email for ${apt.id}:`, err);
    }
  }

  // ---- Session end: chats with appointmentId where appointment window has ended ----
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
