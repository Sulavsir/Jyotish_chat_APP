import { Server, Socket } from 'socket.io';
import { prisma } from '@jyotish/database';
import {
  ParticipantType,
  ChatStatus,
  MessageType as PrismaMessageType,
  Prisma,
  AppointmentStatus,
} from '@prisma/client';
import {
  MessageType,
  UserRole,
  AstrologerCategory,
  CHAT_MESSAGE_MAX_LENGTH_CLIENT,
  CHAT_MESSAGE_MAX_LENGTH_ASTROLOGER,
} from '@jyotish/shared';
import { AdminStatsEmitter } from '../utils/admin-stats-emitter';
import { ERROR_CODES } from '@/constants/http.constants';
import { notificationService } from '../services/notification.service';
import {
  mergeClientSenderWithBirthMetadata,
  sendDirectQuestionBundle as sendDirectQuestionBundleService,
} from '../services/chatService';
import {
  sendDirectQuestionBundleBodySchema,
  type SendDirectQuestionBundleBody,
} from '../validators/broadcastQuestion.validators';
import { buildDmChatNotificationCopy } from '../utils/dm-notification-copy';
import { ACTIVE_CLIENT_USER_WHERE } from '../constants/user.constants';
import { hasChatFileMetadata } from '../utils/chat-attachment.utils';
import { isAstrologerAutoWelcomeMetadata } from '../utils/chat-turn.utils';

export function chatHandlers(io: Server, socket: Socket) {
  const user = socket.data.user;

  // Send message
  socket.on(
    'chat:send',
    async (data: { receiverId: string; content: string; type?: MessageType; metadata?: any }) => {
      try {
        const { receiverId, content, type, metadata } = data;
        let coinsDeductedForSender: number | undefined;

        if (!content?.trim()) {
          if (hasChatFileMetadata(metadata)) {
            socket.emit('chat:error', {
              message: 'Please add a message along with your attachment.',
              code: ERROR_CODES.ATTACHMENT_REQUIRES_TEXT,
            });
            return;
          }
          socket.emit('chat:error', { message: 'Message cannot be empty' });
          return;
        }
        const maxChatLen =
          user.role === UserRole.ASTROLOGER
            ? CHAT_MESSAGE_MAX_LENGTH_ASTROLOGER
            : CHAT_MESSAGE_MAX_LENGTH_CLIENT;
        if (content.trim().length > maxChatLen) {
          socket.emit('chat:error', {
            message: `Message cannot exceed ${maxChatLen} characters`,
          });
          return;
        }

        // Determine client and astrologer IDs
        // participant1 is ALWAYS client (User), participant2 is ALWAYS astrologer
        let clientId: string;
        let astrologerId: string;

        if (user.role === UserRole.CLIENT) {
          clientId = user.id;

          // Check if receiver is in Astrologer table or User table
          const [receiverAsAstrologer, receiverAsUser] = await Promise.all([
            prisma.astrologer.findUnique({ where: { id: receiverId }, select: { id: true } }),
            prisma.user.findFirst({
              where: { id: receiverId, ...ACTIVE_CLIENT_USER_WHERE },
              select: { id: true, role: true },
            }),
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
          const client = await prisma.user.findFirst({
            where: { id: clientId, ...ACTIVE_CLIENT_USER_WHERE },
            select: { id: true },
          });
          if (!client) {
            socket.emit('chat:error', { message: 'Client user not found' });
            return;
          }
        } else if (user.role === UserRole.ASTROLOGER) {
          astrologerId = user.id;

          // Check if receiver is in User table (client)
          const receiverAsUser = await prisma.user.findFirst({
            where: { id: receiverId, ...ACTIVE_CLIENT_USER_WHERE },
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

          // Client is trying to chat again - unlock and reset turn-based state
          chat = await prisma.chat.update({
            where: { id: chat.id },
            data: {
              isLocked: false,
              status: ChatStatus.ACTIVE,
              reopenedAfterEnded: true,
              endedBy: null,
              endedAt: null,
              waitingForReply: false,
            },
          });
          // Notify admin panel for real-time list update
          try {
            const { getSocketInstance } = require('../utils/socket-instance');
            const socketIo = getSocketInstance();
            if (socketIo) {
              socketIo.to('admin').emit('chat:reopened', {
                chatId: chat.id,
                status: 'ACTIVE',
                isLocked: false,
                chat,
              });
            }
          } catch (_) {}
        }

        // Handle ENDED (non-locked) chat: reactivate and reset stale turn-based state
        if (chat && chat.status === ChatStatus.ENDED && !chat.isLocked) {
          if (user.role === UserRole.ASTROLOGER) {
            socket.emit('chat:error', {
              message: 'This conversation has ended. Only the client can restart it.',
            });
            return;
          }
          chat = await prisma.chat.update({
            where: { id: chat.id },
            data: {
              status: ChatStatus.ACTIVE,
              reopenedAfterEnded: true,
              endedBy: null,
              endedAt: null,
              waitingForReply: false,
            },
          });
          // Notify admin panel for real-time list update
          try {
            const { getSocketInstance } = require('../utils/socket-instance');
            const socketIo = getSocketInstance();
            if (socketIo) {
              socketIo.to('admin').emit('chat:reopened', {
                chatId: chat.id,
                status: 'ACTIVE',
                isLocked: false,
                chat,
              });
            }
          } catch (_) {}
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

        // Get astrologer once (needed for premium check and coin deduction)
        const astrologer = await prisma.astrologer.findUnique({
          where: { id: astrologerId },
          select: { category: true, id: true },
        });

        // Create new chat only when first message is sent (after validations and coin deduction)
        if (!chat) {
          // Only CLIENTS can create new chats
          if (user.role === UserRole.ASTROLOGER) {
            socket.emit('chat:error', {
              message:
                'Astrologers cannot initiate chats. Please wait for the client to message you.',
            });
            return;
          }

          // Check if client profile is completed before creating chat
          const clientProfile = await prisma.user.findFirst({
            where: { id: clientId, ...ACTIVE_CLIENT_USER_WHERE },
            select: {
              name: true,
              dateOfBirth: true,
              timeOfBirth: true,
              placeOfBirth: true,
              profileCompleted: true,
            },
          });

          if (!clientProfile) {
            socket.emit('chat:error', { message: 'User not found' });
            return;
          }

          const missingFields: string[] = [];
          if (!clientProfile.name || clientProfile.name.trim() === '') {
            missingFields.push('Name');
          }
          if (!clientProfile.dateOfBirth) {
            missingFields.push('Date of Birth');
          }
          if (!clientProfile.timeOfBirth || clientProfile.timeOfBirth.trim() === '') {
            missingFields.push('Time of Birth');
          }
          if (!clientProfile.placeOfBirth || clientProfile.placeOfBirth.trim() === '') {
            missingFields.push('Place of Birth');
          }

          if (missingFields.length > 0) {
            socket.emit('chat:error', {
              message: `Please complete your profile before sending messages. Missing: ${missingFields.join(', ')}`,
            });
            return;
          }

          // PREMIUM: verify appointment window before creating chat
          if (astrologer?.category === AstrologerCategory.PREMIUM) {
            const now = new Date();
            const appointment = await prisma.appointment.findFirst({
              where: {
                clientId,
                astrologerId,
                scheduledAt: { lte: now },
                status: {
                  in: [
                    AppointmentStatus.CONFIRMED,
                    AppointmentStatus.IN_PROGRESS,
                    AppointmentStatus.COMPLETED,
                  ],
                },
              },
              orderBy: { scheduledAt: 'desc' },
            });

            if (!appointment) {
              socket.emit('chat:error', {
                message:
                  'You can only chat with Premium astrologers during your scheduled appointment time. Please book an appointment first.',
                code: 'APPOINTMENT_REQUIRED',
              });
              return;
            }

            const appointmentStart = new Date(appointment.scheduledAt);
            const appointmentEnd = new Date(
              appointmentStart.getTime() + appointment.duration * 60 * 1000
            );
            if (now < appointmentStart || now > appointmentEnd) {
              socket.emit('chat:error', {
                message: `You can only chat during your appointment window (${appointment.duration} minutes starting from ${appointmentStart.toLocaleString()}).`,
                code: 'APPOINTMENT_WINDOW_EXPIRED',
              });
              return;
            }
          }

          // If we're in an active appointment/kundali session, use the session chat (free for 30 min)
          const now = new Date();
          const activeAppointment = await prisma.appointment.findFirst({
            where: {
              clientId,
              astrologerId,
              status: AppointmentStatus.CONFIRMED,
              scheduledAt: { lte: now },
            },
            orderBy: { scheduledAt: 'desc' },
          });
          if (activeAppointment) {
            const endMs =
              new Date(activeAppointment.scheduledAt).getTime() +
              activeAppointment.duration * 60 * 1000;
            if (now.getTime() < endMs) {
              const { getOrCreateChatForAppointment } = await import('../services/chatService');
              const sessionChat = await getOrCreateChatForAppointment(activeAppointment.id);
              if (sessionChat) chat = sessionChat;
            }
          }

          // Deduct coins BEFORE creating chat so we never leave an ACTIVE chat with no message (skip if session chat)
          if (!chat && astrologer?.category && user.role === UserRole.CLIENT) {
            const { requiresCoinsForChat, toSharedAstrologerCategory } =
              await import('../constants/coin.constants');
            if (requiresCoinsForChat(astrologer.category)) {
              const { deductCoinsForMessage } = await import('../services/coin.service');
              // Use a temporary placeholder chatId for first message; coin service only needs it for transaction record.
              // We'll create the chat after deduction succeeds. So we need to either pass a temp id or create chat after deduct.
              // deductCoinsForMessage requires chatId - create chat first, deduct, on failure delete chat.
              const newChat = await prisma.chat.create({
                data: {
                  participant1Id: clientId,
                  participant2Id: astrologerId,
                  participant1Type: ParticipantType.CLIENT,
                  participant2Type: ParticipantType.ASTROLOGER,
                  status: ChatStatus.ACTIVE,
                  isLocked: false,
                },
              });
              try {
                const dedResult = await deductCoinsForMessage(
                  user.id,
                  toSharedAstrologerCategory(astrologer.category),
                  newChat.id,
                  false
                );
                coinsDeductedForSender = dedResult.coinsDeducted;
                chat = newChat;
              } catch (error: any) {
                await prisma.chat.delete({ where: { id: newChat.id } });
                socket.emit('chat:error', {
                  message: error.message || 'insufficient balance to send message',
                  code: ERROR_CODES.INSUFFICIENT_COINS,
                  requiredCoins: error.requiredCoins,
                });
                return;
              }
              AdminStatsEmitter.emitNewChat();
            } else {
              chat = await prisma.chat.create({
                data: {
                  participant1Id: clientId,
                  participant2Id: astrologerId,
                  participant1Type: ParticipantType.CLIENT,
                  participant2Type: ParticipantType.ASTROLOGER,
                  status: ChatStatus.ACTIVE,
                  isLocked: false,
                },
              });
              AdminStatsEmitter.emitNewChat();
            }
          } else if (!chat) {
            chat = await prisma.chat.create({
              data: {
                participant1Id: clientId,
                participant2Id: astrologerId,
                participant1Type: ParticipantType.CLIENT,
                participant2Type: ParticipantType.ASTROLOGER,
                status: ChatStatus.ACTIVE,
                isLocked: false,
              },
            });
            AdminStatsEmitter.emitNewChat();
          }
        } else {
          // Existing chat: PREMIUM window check and coin deduction
          if (
            user.role === UserRole.CLIENT &&
            astrologer?.category === AstrologerCategory.PREMIUM
          ) {
            const now = new Date();
            const appointment = await prisma.appointment.findFirst({
              where: {
                clientId,
                astrologerId,
                scheduledAt: { lte: now },
                status: {
                  in: [
                    AppointmentStatus.CONFIRMED,
                    AppointmentStatus.IN_PROGRESS,
                    AppointmentStatus.COMPLETED,
                  ],
                },
              },
              orderBy: { scheduledAt: 'desc' },
            });

            if (!appointment) {
              socket.emit('chat:error', {
                message:
                  'You can only chat with Premium astrologers during your scheduled appointment time. Please book an appointment first.',
                code: 'APPOINTMENT_REQUIRED',
              });
              return;
            }

            const appointmentStart = new Date(appointment.scheduledAt);
            const appointmentEnd = new Date(
              appointmentStart.getTime() + appointment.duration * 60 * 1000
            );
            if (now < appointmentStart || now > appointmentEnd) {
              socket.emit('chat:error', {
                message: `You can only chat during your appointment window.`,
                code: 'APPOINTMENT_WINDOW_EXPIRED',
              });
              return;
            }
          }

          if (user.role === UserRole.CLIENT && astrologer?.category) {
            const { requiresCoinsForChat, toSharedAstrologerCategory } =
              await import('../constants/coin.constants');
            if (requiresCoinsForChat(astrologer.category)) {
              const { deductCoinsForMessage } = await import('../services/coin.service');
              try {
                const dedResult = await deductCoinsForMessage(
                  user.id,
                  toSharedAstrologerCategory(astrologer.category),
                  chat!.id,
                  false
                );
                coinsDeductedForSender = dedResult.coinsDeducted;
              } catch (error: any) {
                socket.emit('chat:error', {
                  message: error.message || 'insufficient balance to send message',
                  code: ERROR_CODES.INSUFFICIENT_COINS,
                  requiredCoins: error.requiredCoins,
                });
                return;
              }
            }
          }
        }

        // Determine sender and receiver types
        const senderType =
          user.role === UserRole.CLIENT ? ParticipantType.CLIENT : ParticipantType.ASTROLOGER;
        const receiverType =
          user.role === UserRole.CLIENT ? ParticipantType.ASTROLOGER : ParticipantType.CLIENT;

        const actualReceiverId = user.role === UserRole.CLIENT ? astrologerId : clientId;

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
          receiverId: actualReceiverId,
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
          sender = await prisma.user.findFirst({
            where: { id: user.id, ...ACTIVE_CLIENT_USER_WHERE },
            select: {
              id: true,
              name: true,
              profilePhoto: true,
              dateOfBirth: true,
              timeOfBirth: true,
              placeOfBirth: true,
              role: true,
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

        // Match getChatHistory: merge metadata.birthDetails into client sender so jyotish sees
        // family-profile DOB/TOB/POB in real time (not only after REST reload).
        const senderForSocket = mergeClientSenderWithBirthMetadata(sender, message);

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
          sender: senderForSocket,
          ...(coinsDeductedForSender != null && user.role === UserRole.CLIENT
            ? { coinsDeducted: coinsDeductedForSender }
            : {}),
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
            if (!isAstrologerAutoWelcomeMetadata(metadata)) {
              turnBasedUpdates.waitingForReply = false;
              turnBasedUpdates.lastAstrologerReplyAt = new Date();
            } else {
              turnBasedUpdates.waitingForReply = true;
            }
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

        // Send to receiver by room (works across API instances when using Redis adapter)
        io.to(`user:${actualReceiverId}`).emit('chat:receive', {
          ...messageWithSender,
          turnState: turnStateInfo,
        });

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
          const sender = await prisma.user.findFirst({
            where: { id: user.id, ...ACTIVE_CLIENT_USER_WHERE },
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
        const groupKey = `chat:${chat.id}`;

        // Determine notification fields based on receiver type
        const notificationWhere =
          receiverType === ParticipantType.CLIENT
            ? { userId: actualReceiverId, groupKey }
            : { astrologerId: actualReceiverId, groupKey };

        const notificationData =
          receiverType === ParticipantType.CLIENT
            ? { userId: actualReceiverId, recipientType: ParticipantType.CLIENT }
            : { astrologerId: actualReceiverId, recipientType: ParticipantType.ASTROLOGER };

        // Check for existing unread notification
        const existingNotification = await prisma.notification.findFirst({
          where: notificationWhere,
        });

        const nextCount = existingNotification ? existingNotification.count + 1 : 1;
        const dmCopy = buildDmChatNotificationCopy({
          senderName,
          senderRole: user.role,
          receiverType,
          messageCountInGroup: nextCount,
        });
        const chatNotifMetadata = {
          messageId: message.id,
          senderId: user.id,
          chatId: chat.id,
          ...(user.role === UserRole.CLIENT && receiverType === ParticipantType.ASTROLOGER
            ? { channel: 'direct' as const }
            : {}),
        };

        let notification;
        if (existingNotification) {
          // Update existing notification
          notification = await prisma.notification.update({
            where: { id: existingNotification.id },
            data: {
              count: nextCount,
              title: dmCopy.title,
              message: dmCopy.message,
              lastUpdated: new Date(),
              isRead: false,
              metadata: chatNotifMetadata,
            },
          });
        } else {
          // Create new notification
          notification = await prisma.notification.create({
            data: {
              ...notificationData,
              title: dmCopy.title,
              message: dmCopy.message,
              type: 'CHAT_MESSAGE',
              groupKey,
              count: 1,
              metadata: chatNotifMetadata,
            },
          });
        }

        notificationService.invalidateUserCache(actualReceiverId);

        io.to(`user:${actualReceiverId}`).emit('notification:new', notification);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('chat:error', { message: 'Failed to send message' });
      }
    }
  );

  /**
   * Same as POST /api/v1/chat/send-direct-question-bundle: multiple list questions in one
   * atomic send, one balance deduction, turn-based waits only after the last question in the batch.
   * Use this instead of several chat:send events (which are blocked by turn-based after the first).
   */
  socket.on('chat:sendDirectQuestionBundle', async (raw: unknown) => {
    try {
      if (user.role !== UserRole.CLIENT) {
        socket.emit('chat:error', { message: 'Only clients can send direct question bundles' });
        return;
      }

      const parsed = sendDirectQuestionBundleBodySchema.safeParse(raw);
      if (!parsed.success) {
        const first = parsed.error.flatten().fieldErrors;
        const msg = Object.values(first).flat()[0] || 'Invalid bundle payload';
        socket.emit('chat:error', { message: msg, code: ERROR_CODES.VALIDATION_ERROR });
        return;
      }

      const {
        astrologerId,
        questionItems,
        totalNr,
        birthDetails,
        questionCategory,
        fromDashboard,
      } = parsed.data as SendDirectQuestionBundleBody;

      const result = await sendDirectQuestionBundleService({
        clientId: user.id,
        astrologerId,
        questionItems,
        totalNr,
        birthDetails,
        questionCategory,
        fromDashboard: fromDashboard === true,
      });

      socket.emit('chat:direct_bundle_sent', {
        success: true,
        data: result,
      });
    } catch (error: any) {
      const code = error?.code ?? ERROR_CODES.VALIDATION_ERROR;
      socket.emit('chat:error', {
        message: error?.message || 'Failed to send question bundle',
        code,
        requiredCoins: error?.requiredCoins,
      });
    }
  });

  // Typing indicator (room-based for multi-instance)
  socket.on('chat:typing', (data: { receiverId: string; isTyping: boolean }) => {
    io.to(`user:${data.receiverId}`).emit('chat:typing-indicator', {
      senderId: user.id,
      isTyping: data.isTyping,
    });
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
