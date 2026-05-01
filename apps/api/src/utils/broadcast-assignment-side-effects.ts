import { prisma } from '@jyotish/database';
import { NotificationType } from '@jyotish/shared';
import { NotificationService } from '../services/notification.service';
import { getSocketInstance } from './socket-instance';

/** Minimal shape of `acceptBroadcastMessage` result for socket + notification fan-out. */
export type BroadcastAcceptanceForSideEffects = {
  chat: { id: string } | null;
  message: {
    id: string;
    clientId: string;
    acceptedAt: Date | null;
    acceptedAstrologer?: { id: string; name: string | null } | null;
    client?: { name: string | null; phone?: string | null } | null;
  };
  initialMessages: unknown[];
  allAcceptedMessageIds?: string[];
};

/**
 * Socket + notification side effects after a broadcast is assigned (manual accept, admin assign, or timer auto-assign).
 * Keeps client / jyotish / other jyotish UI in sync with the HTTP and socket accept paths.
 */
export async function emitPostBroadcastAssignment(params: {
  accepted: BroadcastAcceptanceForSideEffects;
  assignedAstrologerId: string;
  messageId: string;
  assignedByAdmin?: boolean;
  autoAssignedFromTimer?: boolean;
}): Promise<void> {
  const {
    accepted,
    assignedAstrologerId,
    messageId,
    assignedByAdmin = false,
    autoAssignedFromTimer = false,
  } = params;

  const chatId = accepted.chat?.id;
  const clientId = accepted.message?.clientId;

  if (!chatId || !clientId) {
    return;
  }

  const io = getSocketInstance();
  if (!io) {
    return;
  }

  const notificationService = new NotificationService();
  const astrologerName = accepted.message?.acceptedAstrologer?.name || 'An astrologer';

  try {
    io.to(`user:${assignedAstrologerId}`).emit('broadcast:messageAccepted', {
      ...accepted,
      assignedByAdmin,
      autoAssignedFromTimer,
    });
  } catch {
    // non-fatal
  }

  try {
    io.to(`user:${clientId}`).emit('broadcast:yourMessageAccepted', {
      message: accepted.message,
      chat: accepted.chat,
      astrologer: accepted.message?.acceptedAstrologer,
      initialMessages: accepted.initialMessages,
      autoAssignedFromTimer,
      assignedByAdmin,
    });
  } catch {
    // non-fatal
  }

  const clientAcceptedMsg = `Your request has been accepted by ${astrologerName}. Starting your chat now.`;

  try {
    const clientNotification = await notificationService.createNotification({
      userId: clientId,
      type: NotificationType.BROADCAST_ACCEPTED,
      title: 'Chat Request Accepted',
      message: clientAcceptedMsg,
      metadata: { broadcastMessageId: messageId, chatId },
    });
    io.to(`user:${clientId}`).emit('notification:new', clientNotification);
  } catch {
    // non-fatal
  }

  const astrologerAssignMsg = assignedByAdmin
    ? 'Admin assigned you this broadcast request. Opening chat…'
    : autoAssignedFromTimer
      ? 'A broadcast request was assigned to you automatically when the client’s timer ended. Opening chat…'
      : undefined;

  if (astrologerAssignMsg) {
    try {
      const astrologerNotification = await notificationService.createNotification({
        astrologerId: assignedAstrologerId,
        type: NotificationType.BROADCAST_ACCEPTED,
        title: assignedByAdmin ? 'Broadcast Assigned by Admin' : 'Broadcast Auto-Assigned',
        message: astrologerAssignMsg,
        metadata: { broadcastMessageId: messageId, chatId },
      });
      io.to(`user:${assignedAstrologerId}`).emit('notification:new', astrologerNotification);
    } catch {
      // non-fatal
    }
  }

  try {
    const clientName = accepted.message.client?.name || 'Client';

    const otherEligibleAstrologers = await prisma.astrologer.findMany({
      where: {
        id: { not: assignedAstrologerId },
        inhouseAstrologer: true,
        isActive: true,
        isDeleted: false,
      },
      select: { id: true, name: true, inhouseAstrologer: true },
    });

    const allAcceptedMessageIds = accepted.allAcceptedMessageIds ?? [messageId];
    const acceptedAt = accepted.message?.acceptedAt;

    const acceptedByPayload = {
      messageId,
      allAcceptedMessageIds,
      acceptedBy: { id: assignedAstrologerId, name: astrologerName },
      acceptedAt,
      clientName,
    };

    const requestAcceptedPayload = {
      messageId,
      allAcceptedMessageIds,
      message: `${clientName}'s request is no longer active. It has already been accepted.`,
      acceptedBy: { id: assignedAstrologerId, name: astrologerName },
    };

    await Promise.all(
      otherEligibleAstrologers.map(async (a) => {
        try {
          await notificationService.createNotification({
            astrologerId: a.id,
            type: NotificationType.BROADCAST_ACCEPTED,
            title: 'Request No Longer Available',
            message: `${clientName}'s request is no longer active. It has already been accepted by another astrologer for counselling.`,
            metadata: { broadcastMessageId: messageId, acceptedBy: assignedAstrologerId },
          });
        } catch {
          // non-fatal
        }

        io.to(`user:${a.id}`).emit('notification:requestAccepted', requestAcceptedPayload);
        io.to(`user:${a.id}`).emit('broadcast:messageAcceptedByAstrologer', acceptedByPayload);
      })
    );
  } catch {
    // non-fatal
  }
}
