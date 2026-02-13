/**
 * Appointment Session Worker
 * - At session start: find CONFIRMED appointments in their 30-min window, getOrCreateChatForAppointment,
 *   create "Session started" notifications (with chatId) for client and astrologer.
 * - At session end: end chats linked to appointments whose window has passed; send system message.
 */

import { Job } from 'bullmq';
import { prisma } from '@jyotish/database';
import { NotificationType } from '@jyotish/shared';
import { ParticipantType } from '@prisma/client';
import { ChatStatus } from '@prisma/client';
import { getOrCreateChatForAppointment } from '../services/chatService';
import { NotificationService } from '../services/notification.service';

const notificationService = new NotificationService();

export async function appointmentSessionProcessor(job: Job) {
  const now = new Date();
  const nowMs = now.getTime();

  // ---- Session start: appointments where scheduledAt <= now < scheduledAt + duration ----
  const inWindowAppointments = await prisma.appointment.findMany({
    where: {
      status: 'CONFIRMED',
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
          type: 'TEXT',
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
