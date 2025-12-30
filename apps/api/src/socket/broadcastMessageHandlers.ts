/**
 * Broadcast Message Socket Handlers
 * Real-time handlers for "Everyone Jyotish" broadcast messaging
 */

import { Server, Socket } from 'socket.io';
import * as broadcastMessageService from '../services/broadcastMessage.service';
import { prisma } from '@jyotish/database';
import { NotificationService } from '../services/notification.service';
import { NotificationType } from '@jyotish/shared';

export function broadcastMessageHandlers(io: Server, socket: Socket) {
  const userId = socket.data.userId;
  const userRole = socket.data.userRole;
  const notificationService = new NotificationService();

  /**
   * Client sends a broadcast message to all astrologers
   */
  socket.on('broadcast:sendMessage', async (data: { content: string; type?: string }) => {
    try {
      if (userRole !== 'CLIENT') {
        socket.emit('broadcast:error', { message: 'Only clients can send broadcast messages' });
        return;
      }

      const message = await broadcastMessageService.createBroadcastMessage({
        clientId: userId,
        content: data.content,
        type: data.type as any,
      });

      // Send confirmation to client
      socket.emit('broadcast:messageSent', message);

      // Create notifications for all astrologers (confidential - no message content shown)
      const astrologers = await prisma.user.findMany({
        where: { role: 'ASTROLOGER' },
        select: { id: true },
      });

      // Create notifications for each astrologer
      const notificationPromises = astrologers.map((astrologer) =>
        notificationService.createNotification({
          userId: astrologer.id,
          type: NotificationType.BROADCAST_MESSAGE,
          title: 'New Chat Request',
          message: 'A client is requesting to chat with an astrologer',
          metadata: {
            broadcastMessageId: message.id,
            clientId: message.clientId,
            isConfidential: true, // Don't show message content
          },
        })
      );

      await Promise.all(notificationPromises);

      // Notify all astrologers via socket about the new notification
      io.to('astrologers').emit('notification:new', {
        type: 'BROADCAST_MESSAGE',
        title: 'New Chat Request',
        message: 'A client is requesting to chat with an astrologer',
      });
    } catch (error: any) {
      console.error('Error sending broadcast message:', error);
      // Send specific error message (e.g., active chat exists)
      socket.emit('broadcast:error', {
        message: error.message || 'Failed to send message',
        code: error.message?.includes('active chat') ? 'ACTIVE_CHAT_EXISTS' : 'SEND_FAILED',
      });
    }
  });

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

      const result = await broadcastMessageService.acceptBroadcastMessage({
        messageId: data.messageId,
        astrologerId: userId,
      });

      // Notify the astrologer who accepted
      socket.emit('broadcast:messageAccepted', result);

      // Notify the client
      io.to(`user:${result.message.clientId}`).emit('broadcast:yourMessageAccepted', {
        message: result.message,
        chat: result.chat,
        astrologer: result.message.acceptedAstrologer,
      });

      // Get all other astrologers (excluding the one who accepted)
      const otherAstrologers = await prisma.user.findMany({
        where: {
          role: 'ASTROLOGER',
          id: { not: userId }, // Exclude the astrologer who accepted
        },
        select: { id: true },
      });

      // Create notifications for all other astrologers
      const acceptNotificationPromises = otherAstrologers.map((astrologer) =>
        notificationService.createNotification({
          userId: astrologer.id,
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

      // Notify all other astrologers via socket
      io.to('astrologers').emit('notification:requestAccepted', {
        messageId: result.message.id,
        message:
          'This user request is no longer active. It has already been accepted by another astrologer for counselling.',
      });
    } catch (error: any) {
      console.error('Error accepting broadcast message:', error);
      // Send specific error code for active chat
      const errorCode = error.message?.includes('active chat')
        ? 'ACTIVE_CHAT_EXISTS'
        : 'ACCEPT_FAILED';
      socket.emit('broadcast:error', {
        message: error.message || 'Failed to accept message',
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

      const messages = await broadcastMessageService.getPendingBroadcastMessages();
      socket.emit('broadcast:pendingMessages', messages);
    } catch (error: any) {
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
    } catch (error: any) {
      console.error('Error getting client broadcast messages:', error);
      socket.emit('broadcast:error', { message: 'Failed to load your messages' });
    }
  });
}
