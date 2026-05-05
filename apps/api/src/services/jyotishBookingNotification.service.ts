/**
 * In-app notifications when a jyotish service booking is approved or rejected by admin.
 * Uses consultationNotifications preference; emits socket notification:new like payments.
 */

import { prisma } from '@jyotish/database';
import type { JyotishBookingStatus, JyotishBookingType } from '@jyotish/database';
import { NotificationType } from '@jyotish/shared';
import { NotificationService } from './notification.service';
import { getSocketInstance } from '../utils/socket-instance';
import type { JyotishBookingNotificationMetadata } from '../types/jyotishBookingNotification.types';

async function userWantsConsultationChannelNotifications(userId: string): Promise<boolean> {
  const row = await prisma.notificationSettings.findUnique({
    where: { userId },
    select: { consultationNotifications: true },
  });
  if (!row) return true;
  return row.consultationNotifications;
}

function bookingTypePhrase(type: JyotishBookingType): string {
  if (type === 'PANDIT') return 'Pujari Ji (Pandit)';
  if (type === 'VAASTU') return 'Vaastu Shastri';
  return 'Katha Vachak';
}

function emitSocket(userId: string, payload: Awaited<ReturnType<NotificationService['createNotification']>>) {
  try {
    const io = getSocketInstance();
    io.to(`user:${userId}`).emit('notification:new', payload);
  } catch {
    /* socket not wired (tests / bootstrap) — non-fatal */
  }
}

export async function notifyClientJyotishBookingDecision(input: {
  clientId: string;
  bookingId: string;
  bookingType: JyotishBookingType;
  category: string;
  bookingDateIso: Date;
  nextStatus: JyotishBookingStatus;
  previousStatus: JyotishBookingStatus;
}): Promise<void> {
  const { clientId } = input;
  if (input.previousStatus === input.nextStatus) return;

  let event: JyotishBookingNotificationMetadata['event'] | null = null;
  if (input.previousStatus !== 'APPROVED' && input.nextStatus === 'APPROVED') event = 'APPROVED';
  else if (input.previousStatus !== 'REJECTED' && input.nextStatus === 'REJECTED') event = 'REJECTED';
  else return;

  try {
    if (!(await userWantsConsultationChannelNotifications(clientId))) return;

    const kind = bookingTypePhrase(input.bookingType);
    const dateStr =
      typeof input.bookingDateIso?.toISOString === 'function'
        ? input.bookingDateIso.toISOString().split('T')[0]
        : '';

    let title: string;
    let message: string;
    if (event === 'APPROVED') {
      title = 'Booking approved';
      message =
        `${kind} request for "${input.category.trim()}" on ${dateStr} has been approved. ` +
        `Review details anytime in My Bookings.`;
    } else {
      title = 'Booking update';
      message =
        `${kind} request for "${input.category.trim()}" on ${dateStr} was not approved. ` +
        `Open My Bookings for details.`;
    }

    const metadata: JyotishBookingNotificationMetadata = {
      event,
      jyotishBookingId: input.bookingId,
      bookingType: input.bookingType,
      category: input.category.trim(),
      bookingDate: dateStr,
      status: input.nextStatus,
    };

    const notificationService = new NotificationService();
    const notification = await notificationService.createNotification({
      userId: clientId,
      title,
      message,
      type: NotificationType.JYOTISH_BOOKING,
      metadata,
    });
    emitSocket(clientId, notification);
  } catch (e) {
    console.error('[jyotishBookingNotification] notifyClientJyotishBookingDecision failed', e);
  }
}
