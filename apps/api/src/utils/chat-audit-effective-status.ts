import { BroadcastMessageStatus, InstantChatRequestStatus } from '@prisma/client';

/**
 * DB row may still be PENDING until expireOldMessages / expireOldRequests runs.
 * For admin chat audit, treat wall-clock past expiry as EXPIRED so UI matches reality.
 */
export function effectiveBroadcastAuditStatus(
  status: BroadcastMessageStatus,
  expiresAt: Date
): BroadcastMessageStatus {
  if (status === BroadcastMessageStatus.PENDING && expiresAt.getTime() < Date.now()) {
    return BroadcastMessageStatus.EXPIRED;
  }
  return status;
}

export function effectiveInstantChatAuditStatus(
  status: InstantChatRequestStatus,
  expiresAt: Date
): InstantChatRequestStatus {
  if (status === InstantChatRequestStatus.PENDING && expiresAt.getTime() < Date.now()) {
    return InstantChatRequestStatus.EXPIRED;
  }
  return status;
}

/** Prisma where fragment for GET /admin/chat-audit when filtering by status. */
export function broadcastStatusFilterWhere(status: string): Record<string, unknown> {
  const now = new Date();
  switch (status) {
    case 'PENDING':
      return { status: 'PENDING', expiresAt: { gt: now } };
    case 'EXPIRED':
      return {
        OR: [
          { status: 'EXPIRED' },
          { status: 'PENDING', expiresAt: { lt: now } },
        ],
      };
    case 'ACCEPTED':
    case 'CANCELLED':
      return { status };
    default:
      return { status };
  }
}

export function instantChatStatusFilterWhere(status: string): Record<string, unknown> {
  const now = new Date();
  switch (status) {
    case 'PENDING':
      return { status: 'PENDING', expiresAt: { gt: now } };
    case 'EXPIRED':
      return {
        OR: [
          { status: 'EXPIRED' },
          { status: 'PENDING', expiresAt: { lt: now } },
        ],
      };
    case 'ACCEPTED':
    case 'CANCELLED':
      return { status };
    default:
      return { status };
  }
}
