/**
 * Persist appointment-related notifications and push them over Socket.IO (same pattern as chat notifications).
 */

import {
  KUNDALI_APPOINTMENT_SOCKET_EVENT,
  KUNDALI_APPOINTMENT_NOTIFICATION_EVENT,
  NotificationType,
  type AppointmentSessionReadyPayload,
} from '@jyotish/shared';
import { NotificationService } from './notification.service';
import { getSocketInstance } from '../utils/socket-instance';
import type { CreateNotificationData, NotificationEntity } from '../types';

const notificationService = new NotificationService();

function emitToUserRoom(userId: string, notification: NotificationEntity): void {
  try {
    const io = getSocketInstance();
    io.to(`user:${userId}`).emit('notification:new', notification);
  } catch (err) {
    console.error('[appointmentSession] Failed to emit notification:new', err);
  }
}

function emitSessionReady(payload: AppointmentSessionReadyPayload, clientId: string, astrologerId: string): void {
  try {
    const io = getSocketInstance();
    io.to(`user:${clientId}`).emit(KUNDALI_APPOINTMENT_SOCKET_EVENT.SESSION_READY, payload);
    io.to(`user:${astrologerId}`).emit(KUNDALI_APPOINTMENT_SOCKET_EVENT.SESSION_READY, payload);
  } catch (err) {
    console.error('[appointmentSession] Failed to emit appointment:sessionReady', err);
  }
}

export async function createAndEmitUserNotification(
  data: CreateNotificationData
): Promise<NotificationEntity> {
  const notification = await notificationService.createNotification(data);
  const userId = notification.userId ?? notification.astrologerId;
  if (userId) emitToUserRoom(userId, notification);
  return notification;
}

export async function createSessionReadyNotifications(params: {
  clientId: string;
  astrologerId: string;
  clientName: string;
  astrologerName: string;
  appointmentId: string;
  chatId: string;
  groupKey: string;
}): Promise<void> {
  const { clientId, astrologerId, clientName, astrologerName, appointmentId, chatId, groupKey } =
    params;

  const metadata = {
    chatId,
    appointmentId,
    event: KUNDALI_APPOINTMENT_NOTIFICATION_EVENT.SESSION_READY,
  };

  const [clientNotif, astroNotif] = await Promise.all([
    notificationService.createNotification({
      userId: clientId,
      title: 'Your consultation is ready',
      message: `Your Full Kundali Review with ${astrologerName} is open — tap to join the chat.`,
      type: NotificationType.SYSTEM,
      groupKey,
      metadata,
    }),
    notificationService.createNotification({
      astrologerId,
      title: 'Your consultation is ready',
      message: `Your Full Kundali Review with ${clientName} is open — tap to join the chat.`,
      type: NotificationType.SYSTEM,
      groupKey: `${groupKey}:jyotish`,
      metadata,
    }),
  ]);

  emitToUserRoom(clientId, clientNotif);
  emitToUserRoom(astrologerId, astroNotif);

  emitSessionReady({ appointmentId, chatId }, clientId, astrologerId);
}
