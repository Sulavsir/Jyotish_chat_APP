/**
 * Admin Chat Socket Handlers
 * Handles real-time admin chat messaging
 */

import { Server, Socket } from 'socket.io';
import { prisma } from '@jyotish/database';
import { AdminChatSenderType, MessageType } from '@prisma/client';
import { UserRole } from '@jyotish/shared';
import { adminChatService } from '../services/adminChat.service';

export function adminChatHandlers(io: Server, socket: Socket) {
  const user = socket.data.user;

  // Join admin chat room
  socket.on('admin-chat:join', async (data: { chatId: string }) => {
    try {
      const { chatId } = data;

      // Verify user has access to this chat
      if (user.role === UserRole.ADMIN) {
        const chat = await prisma.adminChat.findUnique({
          where: { id: chatId },
        });
        if (!chat) {
          socket.emit('admin-chat:error', { message: 'Chat not found' });
          return;
        }
      } else {
        const chat = await prisma.adminChat.findUnique({
          where: { id: chatId },
        });
        const hasAccess =
          !!chat &&
          (chat.userId === user.id || (chat as any).astrologerId === user.id);
        if (!chat) {
          socket.emit('admin-chat:error', { message: 'Chat not found' });
          return;
        }
        if (!hasAccess) {
          socket.emit('admin-chat:error', { message: 'Chat not found' });
          return;
        }
      }

      // Join chat room
      socket.join(`admin-chat:${chatId}`);

      // Mark messages as read
      if (user.role === UserRole.ADMIN) {
        await adminChatService.markAsRead(chatId, undefined, user.id);
      } else {
        await adminChatService.markAsRead(chatId, user.id);
      }

      socket.emit('admin-chat:joined', { chatId });
    } catch (error) {
      socket.emit('admin-chat:error', {
        message: error instanceof Error ? error.message : 'Failed to join chat',
      });
    }
  });

  // Send message in admin chat
  socket.on(
    'admin-chat:send',
    async (data: { chatId: string; content: string; type?: MessageType; metadata?: Record<string, unknown> | null }) => {
      try {
        const { chatId, content, type, metadata } = data;

        const hasText = !!content && content.trim().length > 0;
        const hasAttachment = !!metadata && typeof metadata === 'object' && 'fileUrl' in metadata;

        if (!hasText && !hasAttachment) {
          socket.emit('admin-chat:error', { message: 'Message content or attachment is required' });
          return;
        }

        const senderType =
          user.role === UserRole.ADMIN ? AdminChatSenderType.ADMIN : AdminChatSenderType.USER;

        // Send message
        const message = await adminChatService.sendMessage(
          chatId,
          user.id,
          senderType,
          {
            chatId,
            content: hasText ? content.trim() : '',
            type: type || MessageType.TEXT,
            metadata: metadata ?? null,
          }
        );

        // Get updated chat
        const chat = await adminChatService.getChatById(chatId);

        // Emit to all users in the chat room
        io.to(`admin-chat:${chatId}`).emit('admin-chat:message', {
          message,
          chat,
        });

        // Notify admins of new user message
        if (senderType === AdminChatSenderType.USER) {
          io.to('admin:room').emit('admin-chat:new-message', {
            chatId,
            message,
            chat,
          });
        }
      } catch (error) {
        socket.emit('admin-chat:error', {
          message: error instanceof Error ? error.message : 'Failed to send message',
        });
      }
    }
  );

  // Typing indicator
  socket.on('admin-chat:typing', (data: { chatId: string; isTyping: boolean }) => {
    const { chatId, isTyping } = data;
    socket.to(`admin-chat:${chatId}`).emit('admin-chat:typing', {
      userId: user.id,
      userName: user.name || user.phone,
      isTyping,
    });
  });

  // Admin joins admin room to receive notifications
  if (user.role === UserRole.ADMIN) {
    socket.join('admin:room');
  }
}
