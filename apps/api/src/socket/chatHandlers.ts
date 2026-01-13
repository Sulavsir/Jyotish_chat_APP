import { Server, Socket } from 'socket.io';
import { prisma } from '@jyotish/database';
import {
  ParticipantType,
  ChatStatus,
  MessageType as PrismaMessageType,
  Prisma,
} from '@prisma/client';
import { MessageType, UserRole } from '@jyotish/shared';
import { onlineUsers } from './index';
import { AdminStatsEmitter } from '../utils/admin-stats-emitter';

export function chatHandlers(io: Server, socket: Socket) {
  const user = socket.data.user;

  // Send message
  socket.on(
    'chat:send',
    async (data: { receiverId: string; content: string; type?: MessageType; metadata?: any }) => {
      try {
        const { receiverId, content, type, metadata } = data;

        // Determine client and astrologer IDs
        // participant1 is ALWAYS client (User), participant2 is ALWAYS astrologer
        let clientId: string;
        let astrologerId: string;

        if (user.role === UserRole.CLIENT) {
          clientId = user.id;

          // Check if receiver is in Astrologer table or User table
          const [receiverAsAstrologer, receiverAsUser] = await Promise.all([
            prisma.astrologer.findUnique({ where: { id: receiverId }, select: { id: true } }),
            prisma.user.findUnique({ where: { id: receiverId }, select: { id: true, role: true } }),
          ]);

          if (receiverAsAstrologer) {
            astrologerId = receiverId;
          } else if (receiverAsUser) {
            socket.emit('chat:error', {
              message: 'Cannot chat with another client. Please select an astrologer.',
            });
            return;
          } else {
            socket.emit('chat:error', { message: 'User not found' });
            return;
          }

          // Verify client exists
          const client = await prisma.user.findUnique({
            where: { id: clientId },
            select: { id: true },
          });
          if (!client) {
            socket.emit('chat:error', { message: 'Client user not found' });
            return;
          }
        } else if (user.role === UserRole.ASTROLOGER) {
          astrologerId = user.id;

          // Check if receiver is in User table (client)
          const receiverAsUser = await prisma.user.findUnique({
            where: { id: receiverId },
            select: { id: true, role: true },
          });

          if (receiverAsUser && receiverAsUser.role === UserRole.CLIENT) {
            clientId = receiverId;
          } else if (receiverAsUser) {
            socket.emit('chat:error', {
              message: 'Cannot chat with another astrologer. Please select a client.',
            });
            return;
          } else {
            socket.emit('chat:error', { message: 'Client not found' });
            return;
          }

          // Verify astrologer exists
          const astrologer = await prisma.astrologer.findUnique({
            where: { id: astrologerId },
            select: { id: true },
          });
          if (!astrologer) {
            socket.emit('chat:error', { message: 'Astrologer not found' });
            return;
          }
        } else {
          socket.emit('chat:error', { message: 'Invalid user role for chat' });
          return;
        }

        // Find existing chat between client and astrologer
        let chat = await prisma.chat.findUnique({
          where: {
            participant1Id_participant2Id: {
              participant1Id: clientId,
              participant2Id: astrologerId,
            },
          },
        });

        // Check if chat is locked
        if (chat && chat.isLocked) {
          // Only CLIENTS can unlock (reopen) the chat
          if (user.role === UserRole.ASTROLOGER) {
            socket.emit('chat:error', {
              message: 'This chat is locked. Only the client can reopen the conversation.',
            });
            return;
          }

          // Client is trying to chat again - unlock the chat
          chat = await prisma.chat.update({
            where: { id: chat.id },
            data: {
              isLocked: false,
              status: ChatStatus.ACTIVE,
              endedBy: null,
              endedAt: null,
            },
          });
        }

        // Check if chat is abandoned by admin
        if (chat && chat.isAbandonedByAdmin) {
          socket.emit('chat:error', {
            message:
              'This conversation has been ended by administration. Please contact support for assistance.',
          });
          return;
        }

        // Turn-based messaging: Check if client is waiting for astrologer reply
        if (
          chat &&
          chat.turnBasedEnabled &&
          chat.waitingForReply &&
          user.role === UserRole.CLIENT
        ) {
          // Send system message to inform client to wait
          const systemMessage = {
            id: `system-${Date.now()}`,
            chatId: chat.id,
            content: 'Please wait for the astrologer to reply before sending another message.',
            type: 'SYSTEM',
            isSystemMessage: true,
            createdAt: new Date().toISOString(),
          };

          socket.emit('chat:system_message', systemMessage);
          return;
        }

        // Create new chat if doesn't exist
        if (!chat) {
          // Only CLIENTS can create new chats
          if (user.role === UserRole.ASTROLOGER) {
            socket.emit('chat:error', {
              message:
                'Astrologers cannot initiate chats. Please wait for the client to message you.',
            });
            return;
          }

          chat = await prisma.chat.create({
            data: {
              participant1Id: clientId,
              participant2Id: astrologerId,
              participant1Type: ParticipantType.CLIENT,
              participant2Type: ParticipantType.ASTROLOGER,
              // ✅ Start as ACTIVE - chat is active when created
              status: ChatStatus.ACTIVE,
              isLocked: false,
            },
          });

          // Emit new chat event to admin for real-time stats
          AdminStatsEmitter.emitNewChat();
        }

        // Determine sender and receiver types
        const senderType =
          user.role === UserRole.CLIENT ? ParticipantType.CLIENT : ParticipantType.ASTROLOGER;
        const receiverType =
          user.role === UserRole.CLIENT ? ParticipantType.ASTROLOGER : ParticipantType.CLIENT;

        // Save message to database
        const messageData: {
          chatId: string;
          senderId: string;
          receiverId: string;
          senderType: ParticipantType;
          receiverType: ParticipantType;
          content: string;
          type: PrismaMessageType;
          metadata?: Prisma.InputJsonValue;
        } = {
          chatId: chat.id,
          senderId: user.id,
          receiverId,
          senderType,
          receiverType,
          content,
          type: (type || MessageType.TEXT) as PrismaMessageType,
        };

        if (metadata !== undefined) {
          messageData.metadata = metadata as Prisma.InputJsonValue;
        }

        const message = await prisma.message.create({
          data: messageData,
        });

        // Fetch sender information based on role
        let sender;
        if (user.role === UserRole.CLIENT) {
          sender = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
              id: true,
              name: true,
              profilePhoto: true,
            },
          });
        } else if (user.role === UserRole.ASTROLOGER) {
          sender = await prisma.astrologer.findUnique({
            where: { id: user.id },
            select: {
              id: true,
              name: true,
              profilePhoto: true,
            },
          });
        }

        // Add sender info to message - Prisma already returns metadata as plain object
        const messageWithSender = {
          id: message.id,
          chatId: message.chatId,
          senderId: message.senderId,
          receiverId: message.receiverId,
          senderType: message.senderType,
          receiverType: message.receiverType,
          content: message.content,
          type: message.type,
          metadata: message.metadata, // Prisma JsonValue is already a plain object
          isRead: message.isRead,
          isDeleted: message.isDeleted,
          createdAt: message.createdAt.toISOString(), // Convert Date to string for socket
          updatedAt: message.updatedAt.toISOString(), // Convert Date to string for socket
          sender: sender || { id: user.id, name: 'Unknown User', profilePhoto: null },
        };

        // Update chat with last message info
        const lastMessageText = content.trim()
          ? content.substring(0, 100)
          : metadata
            ? '📎 Sent an attachment'
            : content.substring(0, 100);

        // Prepare turn-based messaging updates
        const turnBasedUpdates: any = {};
        if (chat.turnBasedEnabled) {
          if (user.role === UserRole.CLIENT) {
            // Client sent message - now waiting for astrologer reply
            turnBasedUpdates.waitingForReply = true;
            turnBasedUpdates.lastClientMessageAt = new Date();
          } else if (user.role === UserRole.ASTROLOGER) {
            // Astrologer replied - client can send again
            turnBasedUpdates.waitingForReply = false;
            turnBasedUpdates.lastAstrologerReplyAt = new Date();
          }
        }

        const updatedChat = await prisma.chat.update({
          where: { id: chat.id },
          data: {
            lastMessageAt: new Date(),
            lastMessageText,
            participant1Read: user.id === clientId, // Client read if client is sender
            participant2Read: user.id === astrologerId, // Astrologer read if astrologer is sender
            ...turnBasedUpdates, // Apply turn-based updates
          },
          include: {
            clientParticipant: {
              select: {
                id: true,
                name: true,
                phone: true,
                profilePhoto: true,
              },
            },
            astrologerParticipant: {
              select: {
                id: true,
                name: true,
                phone: true,
                profilePhoto: true,
              },
            },
            _count: {
              select: {
                messages: true,
              },
            },
          },
        });

        // Prepare turn state info to send with messages
        const turnStateInfo = chat.turnBasedEnabled
          ? {
              waitingForReply: updatedChat.waitingForReply,
              lastClientMessageAt: updatedChat.lastClientMessageAt,
              lastAstrologerReplyAt: updatedChat.lastAstrologerReplyAt,
            }
          : null;

        // Send to receiver if online
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('chat:receive', {
            ...messageWithSender,
            turnState: turnStateInfo,
          });
        }

        // Send confirmation to sender
        socket.emit('chat:sent', {
          ...messageWithSender,
          turnState: turnStateInfo,
        });

        // Emit chat update to admin panel for real-time monitoring
        io.to('admin').emit('chat:update', updatedChat);

        // Get sender name (fetch from appropriate table based on role)
        let senderName = 'someone';
        if (user.role === UserRole.CLIENT) {
          const sender = await prisma.user.findUnique({
            where: { id: user.id },
            select: { name: true, phone: true },
          });
          senderName = sender?.name || sender?.phone || 'someone';
        } else if (user.role === UserRole.ASTROLOGER) {
          const sender = await prisma.astrologer.findUnique({
            where: { id: user.id },
            select: { name: true, phone: true },
          });
          senderName = sender?.name || sender?.phone || 'someone';
        }

        // Create or update grouped notification for receiver
        const groupKey = `chat_message_from_${user.id}`;

        // Determine notification fields based on receiver type
        const notificationWhere =
          receiverType === ParticipantType.CLIENT
            ? { userId: receiverId, groupKey, isRead: false }
            : { astrologerId: receiverId, groupKey, isRead: false };

        const notificationData =
          receiverType === ParticipantType.CLIENT
            ? { userId: receiverId, recipientType: ParticipantType.CLIENT }
            : { astrologerId: receiverId, recipientType: ParticipantType.ASTROLOGER };

        // Check for existing unread notification
        const existingNotification = await prisma.notification.findFirst({
          where: notificationWhere,
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
              ...notificationData,
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
