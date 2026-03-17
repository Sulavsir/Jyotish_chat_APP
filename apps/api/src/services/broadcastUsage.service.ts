/**
 * Broadcast Usage Service
 * Shared utilities for determining whether a client has used broadcast before.
 */

import { prisma } from '@jyotish/database';
import { BroadcastMessageStatus } from '@prisma/client';

/**
 * Check if a client has ever used broadcast before.
 *
 * Behaviour detail:
 * If a broadcast message is free-trial and expires, it should not be counted as used.
 */
export async function hasUserUsedBroadcast(clientId: string): Promise<boolean> {
  if (!('broadcastMessage' in prisma)) {
    return false;
  }

  const existing = await prisma.broadcastMessage.findFirst({
    where: {
      clientId,
      NOT: {
        AND: [
          {
            metadata: {
              path: ['freeTrial'],
              equals: true,
            },
          },
          { status: BroadcastMessageStatus.EXPIRED },
        ],
      },
    },
    select: { id: true },
  });

  return !!existing;
}

