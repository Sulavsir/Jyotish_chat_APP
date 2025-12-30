import { Server, Socket } from 'socket.io';
import { prisma } from '@jyotish/database';
import { Prisma } from '@prisma/client';
import { MessageType } from '@jyotish/shared';
import { onlineUsers } from './index';

export function chatHandlers(io: Server, socket: Socket) {
  const user = socket.data.user;

  // Send message
  socket.on(
    'chat:send',
    async (data: { receiverId: string; content: string; type?: MessageType; metadata?: any }) => {
      try {
        const { receiverId, content, type, metadata } = data;

        // Find or create chat between users
        const [smallerId, largerId] = [user.id, receiverId].sort();
        let chat = await prisma.chat.findUnique({
          where: {
            participant1Id_participant2Id: {
              participant1Id: smallerId,
              participant2Id: largerId,
            },
          },
        });

        if (!chat) {
          chat = await prisma.chat.create({
            data: {
              participant1Id: smallerId,
              participant2Id: largerId,
            },
          });
        }

        // Save message to database
        const message = await prisma.message.create({
          data: {
            chatId: chat.id,
            senderId: user.id,
            receiverId,
            content,
            type: type || MessageType.TEXT,
            metadata: metadata ? metadata : Prisma.JsonNull,
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                profilePhoto: true,
              },
            },
          },
        });

        // Update chat with last message info
        const lastMessageText = content.trim() 
          ? content.substring(0, 100)
          : metadata 
            ? '📎 Sent an attachment'
            : content.substring(0, 100);
            
        await prisma.chat.update({
          where: { id: chat.id },
          data: {
            lastMessageAt: new Date(),
            lastMessageText,
            participant1Read: user.id === smallerId,
            participant2Read: user.id === largerId,
          },
        });

        // Send to receiver if online
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('chat:receive', message);
        }

        // Send confirmation to sender
        socket.emit('chat:sent', message);

        // Create or update grouped notification for receiver
        const groupKey = `chat_message_from_${user.id}`;
        const senderName = message.sender.name || message.sender.phone || 'someone';

        // Check for existing unread notification
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: receiverId,
            groupKey,
            isRead: false,
          },
        });

        let notification;
        if (existingNotification) {
          // Update existing notification
          notification = await prisma.notification.update({
            where: { id: existingNotification.id },
            data: {
              count: existingNotification.count + 1,
              message: `You have ${existingNotification.count + 1} new messages from ${senderName}`,
              lastUpdated: new Date(),
              metadata: {
                messageId: message.id,
                senderId: user.id,
                chatId: chat.id,
              },
            },
          });
        } else {
          // Create new notification
          notification = await prisma.notification.create({
            data: {
              userId: receiverId,
              title: 'New Message',
              message: `You have a new message from ${senderName}`,
              type: 'CHAT_MESSAGE',
              groupKey,
              count: 1,
              metadata: {
                messageId: message.id,
                senderId: user.id,
                chatId: chat.id,
              },
            },
          });
        }

        // Send real-time notification if receiver is online
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('notification:new', notification);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('chat:error', { message: 'Failed to send message' });
      }
    }
  );

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
