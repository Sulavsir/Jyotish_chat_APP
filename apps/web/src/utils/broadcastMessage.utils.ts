import { BROADCAST_MESSAGE_EXPIRY_MS } from '@/constants/broadcastMessage.constants';
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
