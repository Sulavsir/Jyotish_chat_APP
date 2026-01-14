/**
 * Chat Service
 * Handles all chat-related business logic
 */

import { CreateChatParams, GetChatHistoryParams, SendMessageParams } from '@/types/chat.type';
import { prisma } from '@jyotish/database';
import { UserRole } from '@jyotish/shared';
import { ParticipantType, ChatStatus, MessageType, Prisma } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { deductCoinsForChat } from './coin.service';
import { requiresCoinsForChat } from '../constants/coin.constants';
import { AstrologerCategory, AppointmentStatus } from '../types/appointment.types';

/**
 * Find or create a chat between client and astrologer
 */
export const findOrCreateChat = async (
  params: CreateChatParams & { currentUserRole: UserRole }
) => {
  const { participant1Id, participant2Id, currentUserRole } = params;
  let { consultationId } = params;

  // Determine who is client and who is astrologer
  // We need to check both tables to determine the correct IDs
  let clientId: string;
  let astrologerId: string;

  if (currentUserRole === UserRole.CLIENT) {
    // Current user is client
    clientId = participant1Id;

    // Check if other user is in Astrologer table or User table
    const [otherAsAstrologer, otherAsUser] = await Promise.all([
      prisma.astrologer.findUnique({ where: { id: participant2Id }, select: { id: true } }),
      prisma.user.findUnique({ where: { id: participant2Id }, select: { id: true, role: true } }),
    ]);

    if (otherAsAstrologer) {
      astrologerId = participant2Id;
    } else if (otherAsUser) {
      throw new Error('Cannot chat with another client. Please select an astrologer.');
    } else {
      throw new Error('User not found');
    }

    // Verify client exists
    const client = await prisma.user.findUnique({ where: { id: clientId }, select: { id: true } });
    if (!client) {
      throw new Error('Client user not found');
    }
  } else if (currentUserRole === UserRole.ASTROLOGER) {
    // Current user is astrologer
    astrologerId = participant1Id;

    // Check if other user is in User table (client)
    const otherAsUser = await prisma.user.findUnique({
      where: { id: participant2Id },
      select: { id: true, role: true },
    });

    if (otherAsUser && otherAsUser.role === UserRole.CLIENT) {
      clientId = participant2Id;
    } else if (otherAsUser) {
      throw new Error('Cannot chat with another astrologer. Please select a client.');
    } else {
      throw new Error('Client not found');
    }

    // Verify astrologer exists
    const astrologer = await prisma.astrologer.findUnique({
      where: { id: astrologerId },
      select: { id: true },
    });
    if (!astrologer) {
      throw new Error('Astrologer not found');
    }
  } else {
    throw new AppError(
      `Invalid user role for chat. Only CLIENT and ASTROLOGER can chat. Current role: ${currentUserRole}`,
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.FORBIDDEN
    );
  }

  // participant1 is ALWAYS client, participant2 is ALWAYS astrologer
  // Find existing chat between these participants (locked or unlocked)
  let chat = await prisma.chat.findUnique({
    where: {
      participant1Id_participant2Id: {
        participant1Id: clientId,
        participant2Id: astrologerId,
      },
    },
    include: {
      clientParticipant: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profilePhoto: true,
          role: true,
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
    },
  });

  // If chat exists and is locked
  if (chat && chat.isLocked) {
    // Only CLIENTS can unlock (reopen) the chat
    if (currentUserRole === UserRole.ASTROLOGER) {
      throw new Error('This chat is locked. Only the client can reopen the conversation.');
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
      include: {
        clientParticipant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profilePhoto: true,
            role: true,
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
      },
    });
  }

  // Create if doesn't exist
  if (!chat) {
    // Only CLIENTS can create new chats
    if (currentUserRole === UserRole.ASTROLOGER) {
      throw new Error(
        'Astrologers cannot initiate chats. Please wait for the client to message you.'
      );
    }

    // Check if client profile is completed before creating chat
    const clientProfile = await prisma.user.findUnique({
      where: { id: clientId },
      select: {
        name: true,
        dateOfBirth: true,
        timeOfBirth: true,
        placeOfBirth: true,
        profileCompleted: true,
      },
    });

    if (!clientProfile) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND);
    }

    // Check if all required fields are present (same logic as frontend)
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
      throw new AppError(
        `Please complete your profile before starting a chat. Missing: ${missingFields.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Check astrologer category and apply appropriate rules
    const astrologer = await prisma.astrologer.findUnique({
      where: { id: astrologerId },
      select: { category: true, name: true },
    });

    if (!astrologer) {
      throw new AppError(
        'Astrologer not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.ASTROLOGER_NOT_FOUND
      );
    }

    // PREMIUM astrologers: allow chat only after an appointment has started or completed
    if (astrologer.category === AstrologerCategory.PREMIUM) {
      const now = new Date();
      const eligibleAppointment = await prisma.appointment.findFirst({
        where: {
          clientId,
          astrologerId,
          scheduledAt: {
            lte: now,
          },
          status: {
            in: [
              AppointmentStatus.CONFIRMED,
              AppointmentStatus.IN_PROGRESS,
              AppointmentStatus.COMPLETED,
            ],
          },
        },
      });

      if (!eligibleAppointment) {
        throw new AppError(
          `${astrologer.name} is a Premium astrologer. You can chat only after a confirmed appointment has started.`,
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
    }

    // ORDINARY, PROFESSIONAL and eligible PREMIUM astrologers require coins for chat
    if (requiresCoinsForChat(astrologer.category)) {
      // Deduct coins before creating chat
      await deductCoinsForChat({
        userId: clientId,
        astrologerCategory: astrologer.category,
      });
    }

    chat = await prisma.chat.create({
      data: {
        participant1Id: clientId,
        participant2Id: astrologerId,
        participant1Type: ParticipantType.CLIENT,
        participant2Type: ParticipantType.ASTROLOGER,
        consultationId,
        // ✅ Start as ACTIVE - chat is active when created
        status: ChatStatus.ACTIVE,
        isLocked: false,
      },
      include: {
        clientParticipant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profilePhoto: true,
            role: true,
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
      },
    });
  }

  return chat;
};

/**
 * Get chat by ID
 */
export const getChatById = async (chatId: string, userId: string) => {
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      OR: [{ participant1Id: userId }, { participant2Id: userId }],
    },
    include: {
      clientParticipant: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profilePhoto: true,
          role: true,
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
    },
  });

  return chat;
};

/**
 * Get all chats for a user (only chats with messages)
 */
export const getUserChats = async (userId: string) => {
  const chats = await prisma.chat.findMany({
    where: {
      AND: [
        {
          OR: [{ participant1Id: userId }, { participant2Id: userId }],
        },
        {
          // Only include chats that have at least one message
          lastMessageAt: {
            not: null,
          },
        },
      ],
    },
    include: {
      clientParticipant: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profilePhoto: true,
          role: true,
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
      messages: {
        take: 1,
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
    orderBy: [
      {
        updatedAt: 'desc',
      },
    ],
  });

  // Add unread count for each chat
  const chatsWithUnread = await Promise.all(
    chats.map(async (chat) => {
      const unreadCount = await prisma.message.count({
        where: {
          chatId: chat.id,
          receiverId: userId,
          isRead: false,
        },
      });

      return {
        ...chat,
        unreadCount,
      };
    })
  );

  return chatsWithUnread;
};

/**
 * Get chat history between client and astrologer
 */
export const getChatHistory = async (
  params: GetChatHistoryParams & { currentUserRole: UserRole }
) => {
  const { userId, otherUserId, limit = 50, offset = 0, currentUserRole } = params;

  // Determine who is client and who is astrologer
  let clientId: string;
  let astrologerId: string;

  if (currentUserRole === UserRole.CLIENT) {
    clientId = userId;
    astrologerId = otherUserId;
  } else if (currentUserRole === UserRole.ASTROLOGER) {
    clientId = otherUserId;
    astrologerId = userId;
  } else {
    throw new AppError(
      `Invalid user role for chat history. Only CLIENT and ASTROLOGER can chat. Current role: ${currentUserRole}`,
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.FORBIDDEN
    );
  }

  // Find the chat (participant1 is always client, participant2 is always astrologer)
  const chat = await prisma.chat.findUnique({
    where: {
      participant1Id_participant2Id: {
        participant1Id: clientId,
        participant2Id: astrologerId,
      },
    },
  });

  if (!chat) {
    return { messages: [], total: 0, chat: null };
  }

  // Get messages with sender information
  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: {
        chatId: chat.id,
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
      select: {
        id: true,
        chatId: true,
        senderId: true,
        receiverId: true,
        senderType: true,
        receiverType: true,
        content: true,
        type: true,
        metadata: true,
        isRead: true,
        isDeleted: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.message.count({
      where: {
        chatId: chat.id,
        isDeleted: false,
      },
    }),
  ]);

  // Fetch sender info for each message
  const messagesWithSender = await Promise.all(
    messages.map(async (message) => {
      let sender;

      // Fetch sender based on senderType
      if (message.senderType === ParticipantType.CLIENT) {
        sender = await prisma.user.findUnique({
          where: { id: message.senderId },
          select: {
            id: true,
            name: true,
            profilePhoto: true,
          },
        });
      } else if (message.senderType === ParticipantType.ASTROLOGER) {
        sender = await prisma.astrologer.findUnique({
          where: { id: message.senderId },
          select: {
            id: true,
            name: true,
            profilePhoto: true,
          },
        });
      }

      return {
        ...message,
        sender: sender || { id: message.senderId, name: 'Unknown User', profilePhoto: null },
      };
    })
  );

  return {
    messages: messagesWithSender.reverse(), // Reverse to show oldest first
    total,
    chat,
  };
};

/**
 * Send a message
 */
export const sendMessage = async (params: SendMessageParams & { senderRole: UserRole }) => {
  const { chatId, senderId, receiverId, content, type = 'TEXT', metadata, senderRole } = params;

  // Determine sender and receiver types
  const senderType =
    senderRole === UserRole.CLIENT ? ParticipantType.CLIENT : ParticipantType.ASTROLOGER;
  const receiverType =
    senderRole === UserRole.CLIENT ? ParticipantType.ASTROLOGER : ParticipantType.CLIENT;

  const messageData: {
    chatId: string;
    senderId: string;
    receiverId: string;
    senderType: ParticipantType;
    receiverType: ParticipantType;
    content: string;
    type: MessageType;
    metadata?: Prisma.InputJsonValue;
  } = {
    chatId,
    senderId,
    receiverId,
    senderType,
    receiverType,
    content,
    type: type as MessageType,
  };

  if (metadata !== undefined) {
    messageData.metadata = metadata as Prisma.InputJsonValue;
  }

  const message = await prisma.message.create({
    data: messageData,
  });

  // Get the chat to determine who is client and astrologer
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { participant1Id: true, participant2Id: true, status: true },
  });

  if (!chat) {
    throw new Error('Chat not found');
  }

  // Update chat's last message info
  // participant1 is client, participant2 is astrologer
  await prisma.chat.update({
    where: { id: chatId },
    data: {
      lastMessageAt: new Date(),
      lastMessageText: content.substring(0, 100),
      participant1Read: senderId === chat.participant1Id, // Client read if client sent
      participant2Read: senderId === chat.participant2Id, // Astrologer read if astrologer sent
    },
  });

  return message;
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (chatId: string, userId: string, messageIds?: string[]) => {
  const where: any = {
    chatId,
    receiverId: userId,
    isRead: false,
  };

  if (messageIds && messageIds.length > 0) {
    where.id = { in: messageIds };
  }

  await prisma.message.updateMany({
    where,
    data: {
      isRead: true,
    },
  });

  // Update chat read status
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
  });

  if (chat) {
    const [smallerId, largerId] = [chat.participant1Id, chat.participant2Id];
    await prisma.chat.update({
      where: { id: chatId },
      data: {
        participant1Read: userId === smallerId ? true : chat.participant1Read,
        participant2Read: userId === largerId ? true : chat.participant2Read,
      },
    });
  }
};

/**
 * Delete a message (soft delete)
 */
export const deleteMessage = async (messageId: string, userId: string) => {
  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      senderId: userId,
    },
  });

  if (!message) {
    throw new Error('Message not found or you are not the sender');
  }

  await prisma.message.update({
    where: { id: messageId },
    data: {
      isDeleted: true,
    },
  });
};

/**
 * Get unread message count
 */
export const getUnreadCount = async (userId: string) => {
  const count = await prisma.message.count({
    where: {
      receiverId: userId,
      isRead: false,
      isDeleted: false,
    },
  });

  return count;
};

/**
 * Search messages
 */
export const searchMessages = async (userId: string, searchTerm: string, limit = 20) => {
  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
      content: {
        contains: searchTerm,
        mode: 'insensitive',
      },
      isDeleted: false,
    },
    include: {
      chat: {
        include: {
          clientParticipant: {
            select: {
              id: true,
              name: true,
            },
          },
          astrologerParticipant: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });

  return messages;
};

/**
 * End an active chat
 */
export const endChat = async (chatId: string, userId: string) => {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
  });

  if (!chat) {
    throw new Error('Chat not found');
  }

  // Verify the user is a participant
  if (chat.participant1Id !== userId && chat.participant2Id !== userId) {
    throw new Error('You are not a participant of this chat');
  }

  // Update chat status and lock it
  const updatedChat = await prisma.chat.update({
    where: { id: chatId },
    data: {
      status: 'ENDED',
      isLocked: true, // Lock the chat - both sides can't message
      endedBy: userId,
      endedAt: new Date(),
    },
  });

  // Emit chat ended event to admin for real-time stats
  const { AdminStatsEmitter } = require('../utils/admin-stats-emitter');
  AdminStatsEmitter.emitChatEnded();

  // Update related broadcast message or instant chat request
  try {
    const [broadcastMessage, instantChatRequest] = await Promise.all([
      prisma.broadcastMessage.findFirst({ where: { chatId } }),
      prisma.instantChatRequest.findFirst({ where: { chatId } }),
    ]);

    const { notifyChatEnded } = require('../utils/admin-monitor');

    if (broadcastMessage) {
      const currentMetadata = (broadcastMessage.metadata as Record<string, unknown>) || {};
      await prisma.broadcastMessage.update({
        where: { id: broadcastMessage.id },
        data: {
          metadata: {
            ...currentMetadata,
            chatStatus: 'ENDED',
            chatEndedAt: new Date().toISOString(),
            chatEndedBy: userId,
          },
        },
      });

      // Notify admin about chat end
      notifyChatEnded(broadcastMessage.id, chatId, userId, 'BROADCAST_MESSAGE');
    }

    if (instantChatRequest) {
      // Store chat end info in a separate field or metadata
      // Since InstantChatRequest doesn't have metadata field, we'll just notify
      notifyChatEnded(instantChatRequest.id, chatId, userId, 'INSTANT_CHAT_REQUEST');
    }

    // If no request found, still notify admin about the chat ending
    if (!broadcastMessage && !instantChatRequest) {
      notifyChatEnded(chatId, chatId, userId, 'DIRECT_CHAT');
    }
  } catch (error) {
    console.error('Failed to update chat request on chat end:', error);
    // Don't fail the chat end if request update fails
  }

  return updatedChat;
};

/**
 * Get active chat for a user (for clients in broadcast chat context)
 * Only returns chats that have messages (actual conversations, not just created chats)
 */
export const getActiveChat = async (userId: string) => {
  const activeChat = await prisma.chat.findFirst({
    where: {
      status: 'ACTIVE',
      OR: [{ participant1Id: userId }, { participant2Id: userId }],
      // ✅ Only return chats that have at least one message (actual conversation started)
      lastMessageAt: {
        not: null,
      },
    },
    include: {
      clientParticipant: {
        select: {
          id: true,
          name: true,
          phone: true,
          profilePhoto: true,
          role: true,
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
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return activeChat;
};
