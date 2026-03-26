/**
 * In-app (and push-ready) notifications for payment success and failure across all gateways.
 * Respects NotificationSettings.paymentNotifications; emits socket `notification:new` for real-time UI.
 */

import { prisma } from '@jyotish/database';
import { NotificationType, formatPaymentMethodDisplay } from '@jyotish/shared';
import { NotificationService } from './notification.service';
import { getSocketInstance } from '../utils/socket-instance';
import type { PaymentNotificationMetadata } from '../types/paymentNotification.types';

async function userWantsPaymentNotifications(userId: string): Promise<boolean> {
  const row = await prisma.notificationSettings.findUnique({
    where: { userId },
    select: { paymentNotifications: true },
  });
  if (!row) return true;
  return row.paymentNotifications;
}

function formatMoney(amount: number, currency: string): string {
  const n = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: currency === 'NPR' ? 'NPR' : currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

function emitSocket(userId: string, payload: Awaited<ReturnType<NotificationService['createNotification']>>) {
  try {
    const io = getSocketInstance();
    if (io) {
      io.to(`user:${userId}`).emit('notification:new', payload);
    }
  } catch (e) {
    console.error('[paymentNotification] socket emit failed', e);
  }
}

export async function notifyClientPaymentSuccess(params: {
  userId: string;
  paymentId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  coinsAdded?: number;
  planActivated?: boolean;
}): Promise<void> {
  try {
    if (!(await userWantsPaymentNotifications(params.userId))) return;

    const gateway = formatPaymentMethodDisplay(params.paymentMethod);
    let message: string;
    if (params.planActivated) {
      message = `Your payment of ${formatMoney(params.amount, params.currency)} via ${gateway} was successful. Your subscription is active.`;
    } else if (params.coinsAdded != null && params.coinsAdded > 0) {
      message = `Your payment of ${formatMoney(params.amount, params.currency)} via ${gateway} was successful. ${params.coinsAdded} balance credits were added to your account.`;
    } else {
      message = `Your payment of ${formatMoney(params.amount, params.currency)} via ${gateway} was successful.`;
    }

    const metadata: PaymentNotificationMetadata = {
      paymentId: params.paymentId,
      outcome: 'SUCCESS',
      amount: params.amount,
      currency: params.currency,
      paymentMethod: params.paymentMethod,
      coinsAdded: params.coinsAdded,
      planActivated: params.planActivated,
    };

    const notificationService = new NotificationService();
    const notification = await notificationService.createNotification({
      userId: params.userId,
      title: 'Payment successful',
      message,
      type: NotificationType.PAYMENT,
      metadata,
    });
    emitSocket(params.userId, notification);
  } catch (e) {
    console.error('[paymentNotification] notifyClientPaymentSuccess failed', e);
  }
}

export async function notifyClientPaymentFailed(params: {
  userId: string;
  paymentId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  reason?: string;
}): Promise<void> {
  try {
    if (!(await userWantsPaymentNotifications(params.userId))) return;

    const gateway = formatPaymentMethodDisplay(params.paymentMethod);
    const base = `We could not complete your payment of ${formatMoney(params.amount, params.currency)} via ${gateway}.`;
    const reasonSuffix = params.reason?.trim()
      ? ` ${params.reason.trim().endsWith('.') ? params.reason.trim() : `${params.reason.trim()}.`}`
      : '';
    const message =
      `${base}${reasonSuffix} If your bank or wallet shows a debit but your balance here did not update, contact your bank or payment provider with your order reference; they can confirm capture or reversal.`.trim();

    const metadata: PaymentNotificationMetadata = {
      paymentId: params.paymentId,
      outcome: 'FAILED',
      amount: params.amount,
      currency: params.currency,
      paymentMethod: params.paymentMethod,
      reason: params.reason,
    };

    const notificationService = new NotificationService();
    const notification = await notificationService.createNotification({
      userId: params.userId,
      title: 'Payment unsuccessful',
      message,
      type: NotificationType.PAYMENT,
      metadata,
    });
    emitSocket(params.userId, notification);
  } catch (e) {
    console.error('[paymentNotification] notifyClientPaymentFailed failed', e);
  }
}
