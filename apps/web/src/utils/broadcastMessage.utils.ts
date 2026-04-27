import {
  BROADCAST_MESSAGE_EXPIRY_MS,
  BROADCAST_POST_EXPIRY_GRACE_MS,
} from '@/constants/broadcastMessage.constants';
import type { BroadcastMessage } from '@/types';

/** Wall-clock expiry for countdown / pending checks; prefers API `expiresAt` when present. */
export function getBroadcastExpiresAtMs(message: Pick<BroadcastMessage, 'createdAt' | 'expiresAt'>): number {
  if (message.expiresAt != null && message.expiresAt !== '') {
    return new Date(message.expiresAt).getTime();
  }
  return new Date(message.createdAt).getTime() + BROADCAST_MESSAGE_EXPIRY_MS;
}

export function isBroadcastPendingStillActive(
  message: Pick<BroadcastMessage, 'createdAt' | 'expiresAt' | 'status'>
): boolean {
  return (
    message.status === 'PENDING' && getBroadcastExpiresAtMs(message) > Date.now()
  );
}

/** PENDING broadcasts still shown in UI until grace after wall-clock expiry (server assign/refund). */
export function isBroadcastPendingInPostTimerGrace(
  message: Pick<BroadcastMessage, 'createdAt' | 'expiresAt' | 'status'>
): boolean {
  return (
    message.status === 'PENDING' &&
    getBroadcastExpiresAtMs(message) + BROADCAST_POST_EXPIRY_GRACE_MS > Date.now()
  );
}
