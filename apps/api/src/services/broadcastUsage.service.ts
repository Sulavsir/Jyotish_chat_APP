/**
 * Broadcast Usage Service
 * Shared utilities for determining whether a client has used broadcast before.
 */

import { prisma } from '@jyotish/database';
import { BroadcastMessageStatus } from '@prisma/client';

/**
 * True once the client has had at least one broadcast **accepted by an astrologer**
 * (first-broadcast discount / `hasFreeBroadcastAvailable` only then is false).
 *
 * Does **not** consume the first-broadcast offer: **PENDING**, **EXPIRED** (no one accepted), **CANCELLED**.
 */
export async function hasUserUsedBroadcast(clientId: string): Promise<boolean> {
  if (!('broadcastMessage' in prisma)) {
    return false;
  }

  const accepted = await prisma.broadcastMessage.findFirst({
    where: {
      clientId,
      status: BroadcastMessageStatus.ACCEPTED,
    },
    select: { id: true },
  });

  return !!accepted;
}

