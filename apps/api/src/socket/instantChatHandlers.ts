/**
 * Socket.io handlers for Instant Chat Requests
 * Handles real-time broadcasting of instant chat requests to online astrologers
 */

import { Server, Socket } from 'socket.io';
import { NotificationType } from '@jyotish/shared';
import * as instantChatService from '../services/instantChat.service';
import { notificationService } from '../services/notification.service';
import { getSocketInstance } from '../utils/socket-instance';

export function setupInstantChatHandlers(io: Server, socket: Socket) {
  const userId = socket.data.user?.id;

  if (!userId) {
    console.error('User ID not found in socket data');
    return;
  }

  /**
   * Client creates instant chat request
   * Broadcasts to all online astrologers
   */
  socket.on('instantChat:create', async (data: { message?: string }) => {
    try {
      const request = await instantChatService.createInstantChatRequest(userId, data.message);

      // Send confirmation to client
      socket.emit('instantChat:created', {
        success: true,
        request,
      });

      // Broadcast to all online astrologers
      io.emit('instantChat:newRequest', {
        request,
      });

      // Create notifications for all online astrologers
      // Note: This could be optimized to only notify online users
      // For now, we'll let the frontend filter for online astrologers
      console.log('New instant chat request created:', request.id);
    } catch (error: any) {
      socket.emit('instantChat:error', {
        success: false,
        message: error.message || 'Failed to create instant chat request',
      });
    }
  });

  /**
   * Astrologer accepts instant chat request
   * Notifies the client and removes request from other astrologers
   */
  socket.on('instantChat:accept', async (data: { requestId: string }) => {
    try {
      const result = await instantChatService.acceptInstantChatRequest(data.requestId, userId);

      // Send confirmation to astrologer
      socket.emit('instantChat:accepted', {
        success: true,
        request: result.request,
        chatId: result.chatId,
      });

      // Notify client that their request was accepted
      io.to(`user_${result.request.clientId}`).emit('instantChat:requestAccepted', {
        request: result.request,
        chatId: result.chatId,
        astrologer: result.request.acceptedAstrologer,
      });

      // Broadcast to all other astrologers that this request is no longer available
      io.emit('instantChat:requestTaken', {
        requestId: data.requestId,
        acceptedBy: userId,
      });

      // Create notification for client
      await notificationService.createNotification({
        userId: result.request.clientId,
        title: 'Chat Request Accepted',
        message: `${result.request.acceptedAstrologer?.name || 'An astrologer'} accepted your instant chat request`,
        type: NotificationType.CHAT_MESSAGE,
        metadata: {
          chatId: result.chatId,
          requestId: data.requestId,
        },
      });

      // Schedule auto-removal of request bar after 40 seconds
      setTimeout(() => {
        io.to(`user_${userId}`).emit('instantChat:removeRequestBar', {
          requestId: data.requestId,
        });
      }, 40000); // 40 seconds
    } catch (error: any) {
      socket.emit('instantChat:error', {
        success: false,
        message: error.message || 'Failed to accept instant chat request',
      });
    }
  });

  /**
   * Client cancels instant chat request
   */
  socket.on('instantChat:cancel', async (data: { requestId: string }) => {
    try {
      const request = await instantChatService.cancelInstantChatRequest(data.requestId, userId);

      // Send confirmation to client
      socket.emit('instantChat:cancelled', {
        success: true,
        request,
      });

      // Broadcast to all astrologers that this request was cancelled
      io.emit('instantChat:requestCancelled', {
        requestId: data.requestId,
      });
    } catch (error: any) {
      socket.emit('instantChat:error', {
        success: false,
        message: error.message || 'Failed to cancel instant chat request',
      });
    }
  });

  /**
   * Get pending requests (for astrologers joining)
   */
  socket.on('instantChat:getPending', async () => {
    try {
      const requests = await instantChatService.getPendingInstantChatRequests();

      socket.emit('instantChat:pendingList', {
        success: true,
        requests,
      });
    } catch (error: any) {
      socket.emit('instantChat:error', {
        success: false,
        message: error.message || 'Failed to fetch pending requests',
      });
    }
  });
}

/**
 * Background job to expire old requests
 * Should be called periodically (e.g., every minute)
 */
export async function expireOldInstantChatRequests() {
  try {
    const expiredCount = await instantChatService.expireOldRequests();

    if (expiredCount > 0) {
      const io = getSocketInstance();
      if (io) {
        // Notify about expired requests
        io.emit('instantChat:requestsExpired', {
          count: expiredCount,
        });
      }
      console.log(`Expired ${expiredCount} old instant chat requests`);
    }
  } catch (error) {
    console.error('Error expiring old instant chat requests:', error);
  }
}
