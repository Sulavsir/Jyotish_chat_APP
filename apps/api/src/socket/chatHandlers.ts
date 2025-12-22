import { Server, Socket } from 'socket.io';
import { prisma } from '@jyotish/database';
import { MessageType } from '@jyotish/shared';
import { onlineUsers } from './index';

export function chatHandlers(io: Server, socket: Socket) {
  const user = socket.data.user;

  // Send message
  socket.on('chat:send', async (data: { receiverId: string; content: string; type: MessageType }) => {
    try {
      const { receiverId, content, type } = data;

      // Save message to database
      const message = await prisma.message.create({
        data: {
          senderId: user.id,
          receiverId,
          content,
          type: type || MessageType.TEXT,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      // Send to receiver if online
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('chat:receive', message);
      }

      // Send confirmation to sender
      socket.emit('chat:sent', message);

      // Create notification for receiver
      await prisma.notification.create({
        data: {
          userId: receiverId,
          title: 'New Message',
          message: `You have a new message from ${message.sender.name}`,
          type: 'CHAT_MESSAGE',
          metadata: {
            messageId: message.id,
            senderId: user.id,
          },
        },
      });

      // Send notification if receiver is online
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('notification:new', {
          title: 'New Message',
          message: `You have a new message from ${message.sender.name}`,
          type: 'CHAT_MESSAGE',
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('chat:error', { message: 'Failed to send message' });
    }
  });

  // Typing indicator
  socket.on('chat:typing', (data: { receiverId: string; isTyping: boolean }) => {
    const receiverSocketId = onlineUsers.get(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('chat:typing-indicator', {
        senderId: user.id,
        isTyping: data.isTyping,
      });
    }
  });

  // Mark messages as read
  socket.on('chat:mark-read', async (data: { messageIds: string[] }) => {
    try {
      await prisma.message.updateMany({
        where: {
          id: { in: data.messageIds },
          receiverId: user.id,
        },
        data: {
          isRead: true,
        },
      });

      socket.emit('chat:marked-read', { messageIds: data.messageIds });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });
}

