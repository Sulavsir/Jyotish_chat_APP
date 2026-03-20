/**
 * Broadcast Message Socket Handlers
 * Real-time handlers for "Everyone Jyotish" broadcast messaging
 */

import { Server, Socket } from 'socket.io';
import * as broadcastMessageService from '../services/broadcastMessage.service';
import { prisma } from '@jyotish/database';
import { NotificationService } from '../services/notification.service';
import { NotificationType, AstrologerCategory } from '@jyotish/shared';

export function broadcastMessageHandlers(io: Server, socket: Socket) {
  const userId = socket.data.userId;
  const userRole = socket.data.userRole;
  const notificationService = new NotificationService();

  /**
   * Client sends a broadcast message to all astrologers
   */
  socket.on(
    'broadcast:sendMessage',
    async (data: {
      content: string;
      type?: string;
      birthDetails?: {
        dateOfBirth?: string;
        timeOfBirth?: string;
        placeOfBirth?: string;
        gender?: string;
      };
    }) => {
      try {
        if (userRole !== 'CLIENT') {
          socket.emit('broadcast:error', { message: 'Only clients can send broadcast messages' });
          return;
        }

        const content = (data.content || '').trim();
        if (!content) {
          socket.emit('broadcast:error', {
            message: 'Message cannot be empty',
            code: 'VALIDATION_ERROR',
          });
          return;
        }
        if (content.length > 300) {
          socket.emit('broadcast:error', {
            message: 'Message cannot exceed 300 characters',
            code: 'VALIDATION_ERROR',
          });
          return;
        }

        const metadata =
          data.birthDetails &&
          (data.birthDetails.dateOfBirth ||
            data.birthDetails.timeOfBirth ||
            data.birthDetails.placeOfBirth)
            ? { birthDetails: data.birthDetails }
            : undefined;

        const message = await broadcastMessageService.createBroadcastMessage({
          clientId: userId,
          content: data.content,
          type: data.type as any,
          metadata,
        });

        // Send confirmation to client
        socket.emit('broadcast:messageSent', message);

        // Broadcast the new message to eligible in-house astrologers in real-time
        const eligibleAstrologers = await prisma.astrologer.findMany({
          where: {
            isActive: true,
            inhouseAstrologer: true,
          },
          select: { id: true },
        });

        // Emit to eligible astrologers only
        eligibleAstrologers.forEach((astrologer) => {
          io.to(`user:${astrologer.id}`).emit('broadcast:newMessage', message);
        });
        console.log(
          `📢 Broadcasting new message to eligible astrologers (excluding PREMIUM):`,
          message.id
        );

        // Build a display name for the client (name → phone → email fallback)
        const clientDisplayName =
          (message.client as any)?.name ||
          (message.client as any)?.phone ||
          (message.client as any)?.email ||
          'A client';
        const astrologerNotifMessage = `${clientDisplayName} is requesting to chat with an astrologer`;

        // Create notifications for each eligible in-house astrologer
        const notificationPromises = eligibleAstrologers.map((astrologer) =>
          notificationService.createNotification({
            astrologerId: astrologer.id,
            type: NotificationType.BROADCAST_MESSAGE,
            title: 'New Chat Request',
            message: astrologerNotifMessage,
            metadata: {
              broadcastMessageId: message.id,
              clientId: message.clientId,
              isConfidential: true,
            },
          })
        );

        await Promise.all(notificationPromises);

        // Notify each eligible astrologer via socket (per-astrologer so the name is included)
        eligibleAstrologers.forEach((astrologer) => {
          io.to(`user:${astrologer.id}`).emit('notification:new', {
            type: 'BROADCAST_MESSAGE',
            title: 'New Chat Request',
            message: astrologerNotifMessage,
            metadata: {
              broadcastMessageId: message.id,
              clientId: message.clientId,
            },
          });
        });
      } catch (error: unknown) {
        const err = error as any;
        console.error('Error sending broadcast message:', error);

        const messageText: string = err?.message || 'Failed to send message';
        const isActiveChat = messageText.toLowerCase().includes('active chat');
        const isInsufficientCoins = messageText.toLowerCase().includes('insufficient coins');

        socket.emit('broadcast:error', {
          message: messageText,
          code: isActiveChat
            ? 'ACTIVE_CHAT_EXISTS'
            : isInsufficientCoins
              ? 'INSUFFICIENT_COINS'
              : 'SEND_FAILED',
        });
      }
    }
  );

  /**
   * Astrologer accepts a broadcast message
   */
  socket.on('broadcast:acceptMessage', async (data: { messageId: string }) => {
    try {
      if (userRole !== 'ASTROLOGER') {
        socket.emit('broadcast:error', {
          message: 'Only astrologers can accept broadcast messages',
        });
        return;
      }

      // Only in-house astrologers can accept broadcast messages
      const astrologerRecord = await prisma.astrologer.findUnique({
        where: { id: userId },
        select: { inhouseAstrologer: true },
      });

      if (!astrologerRecord || !astrologerRecord.inhouseAstrologer) {
        socket.emit('broadcast:error', {
          message: 'Only in-house astrologers can accept broadcast messages',
        });
        return;
      }

      const result = await broadcastMessageService.acceptBroadcastMessage({
        messageId: data.messageId,
        astrologerId: userId,
      });

      // Notify the astrologer who accepted
      socket.emit('broadcast:messageAccepted', result);

      // Notify the client with chat details and initial messages
      io.to(`user:${result.message.clientId}`).emit('broadcast:yourMessageAccepted', {
        message: result.message,
        chat: result.chat,
        astrologer: result.message.acceptedAstrologer,
        initialMessages: result.initialMessages,
      });

      // Persist a notification for the client so it appears in their notification bell
      const astrologerDisplayName =
        (result.message.acceptedAstrologer as any)?.name || 'An astrologer';
      const clientAcceptedMsg = `Your request has been accepted by ${astrologerDisplayName}. Starting your chat now.`;

      notificationService
        .createNotification({
          userId: result.message.clientId,
          type: NotificationType.BROADCAST_ACCEPTED,
          title: 'Chat Request Accepted',
          message: clientAcceptedMsg,
          metadata: {
            broadcastMessageId: result.message.id,
            chatId: result.chat.id,
            astrologerId: userId,
          },
        })
        .catch((e) => console.error('Failed to create client acceptance notification:', e));

      io.to(`user:${result.message.clientId}`).emit('notification:new', {
        type: 'BROADCAST_ACCEPTED',
        title: 'Chat Request Accepted',
        message: clientAcceptedMsg,
        metadata: {
          broadcastMessageId: result.message.id,
          chatId: result.chat.id,
        },
      });

      // Get other in-house astrologers (exclude the acceptor)
      const otherEligibleAstrologers = await prisma.astrologer.findMany({
        where: {
          id: { not: userId },
          inhouseAstrologer: true,
        },
        select: { id: true },
      });

      // Create notifications only for eligible astrologers (PREMIUM should not see broadcast-related notifications)
      const acceptNotificationPromises = otherEligibleAstrologers.map((astrologer) =>
        notificationService.createNotification({
          astrologerId: astrologer.id,
          type: NotificationType.BROADCAST_ACCEPTED,
          title: 'Request No Longer Available',
          message:
            'This user request is no longer active. It has already been accepted by another astrologer for counselling.',
          metadata: {
            broadcastMessageId: result.message.id,
            acceptedBy: userId,
          },
        })
      );

      await Promise.all(acceptNotificationPromises);

      // Include all accepted IDs (primary + batch siblings) so every astrologer removes the whole group
      const allAcceptedIds = result.allAcceptedMessageIds ?? [result.message.id];

      const requestAcceptedPayload = {
        messageId: result.message.id,
        allAcceptedMessageIds: allAcceptedIds,
        message:
          'This user request is no longer active. It has already been accepted by another astrologer for counselling.',
        acceptedBy: {
          id: result.message.acceptedAstrologer?.id ?? userId,
          name: result.message.acceptedAstrologer?.name,
        },
      };

      const clientName = result.message.client?.name || result.message.client?.phone || 'Client';

      const acceptedByPayload = {
        messageId: result.message.id,
        allAcceptedMessageIds: allAcceptedIds,
        acceptedBy: {
          id: result.message.acceptedAstrologer?.id ?? userId,
          name: result.message.acceptedAstrologer?.name,
        },
        acceptedAt: result.message.acceptedAt,
        clientName,
      };

      otherEligibleAstrologers.forEach((a) => {
        io.to(`user:${a.id}`).emit('notification:requestAccepted', requestAcceptedPayload);
        io.to(`user:${a.id}`).emit('broadcast:messageAcceptedByAstrologer', acceptedByPayload);
      });
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error accepting broadcast message:', error);
      const errorCode = err?.message?.includes('active chat')
        ? 'ACTIVE_CHAT_EXISTS'
        : 'ACCEPT_FAILED';
      socket.emit('broadcast:error', {
        message: err?.message || 'Failed to accept message',
        code: errorCode,
      });
    }
  });

  /**
   * Get pending broadcast messages (astrologers)
   */
  socket.on('broadcast:getPendingMessages', async () => {
    try {
      if (userRole !== 'ASTROLOGER') {
        socket.emit('broadcast:error', { message: 'Only astrologers can view broadcast messages' });
        return;
      }

      // Pass astrologerId to filter out PREMIUM astrologers
      const messages = await broadcastMessageService.getPendingBroadcastMessages(userId);
      socket.emit('broadcast:pendingMessages', messages);
    } catch (error: unknown) {
      console.error('Error getting pending broadcast messages:', error);
      socket.emit('broadcast:error', { message: 'Failed to load messages' });
    }
  });

  /**
   * Get my broadcast messages (clients)
   */
  socket.on('broadcast:getMyMessages', async () => {
    try {
      if (userRole !== 'CLIENT') {
        socket.emit('broadcast:error', {
          message: 'Only clients can view their broadcast messages',
        });
        return;
      }

      const messages = await broadcastMessageService.getClientBroadcastMessages(userId);
      socket.emit('broadcast:myMessages', messages);
    } catch (error: unknown) {
      console.error('Error getting client broadcast messages:', error);
      socket.emit('broadcast:error', { message: 'Failed to load your messages' });
    }
  });

  /**
   * Client cancels a pending broadcast message.
   * Backend cancels, refunds coin, and notifies astrologers to remove from list.
   */
  socket.on('broadcast:cancelMessage', async (data: { messageId: string }) => {
    try {
      if (userRole !== 'CLIENT') {
        socket.emit('broadcast:error', {
          message: 'Only clients can cancel their broadcast messages',
        });
        return;
      }

      const messageId = data?.messageId;
      if (!messageId || typeof messageId !== 'string') {
        socket.emit('broadcast:error', { message: 'Invalid message ID' });
        return;
      }

      const { message, refundAmount } = await broadcastMessageService.cancelBroadcastMessage(
        messageId,
        userId
      );

      socket.emit('broadcast:messageCancelled', {
        messageId: message.id,
        message,
        cancelledAt: message.updatedAt,
        refundAmount,
      });

      // Notify all astrologers so they remove this message from their list
      io.to('astrologers').emit('broadcast:messageCancelled', {
        messageId: message.id,
        cancelledAt: message.updatedAt,
      });
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error cancelling broadcast message:', error);
      socket.emit('broadcast:error', {
        message: err?.message || 'Failed to cancel broadcast message',
        code: 'CANCEL_FAILED',
      });
    }
  });
}
