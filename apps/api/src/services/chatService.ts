/**
 * Chat Service
 * Handles all chat-related business logic
 */

import { CreateChatParams, GetChatHistoryParams, SendMessageParams } from '@/types/chat.type';
import { prisma } from '@jyotish/database';
import {
  UserRole,
  AstrologerCategory,
  CHAT_MESSAGE_MAX_LENGTH_CLIENT,
  CHAT_MESSAGE_MAX_LENGTH_ASTROLOGER,
} from '@jyotish/shared';
import {
  ParticipantType,
  ChatStatus,
  MessageType,
  Prisma,
  AppointmentStatus,
  BroadcastMessageStatus,
  InstantChatRequestStatus,
} from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { deductCoinsForChat } from './coin.service';
import { requiresCoinsForChat } from '../constants/coin.constants';
import { getSocketInstance } from '../utils/socket-instance';
import { buildDmChatNotificationCopy } from '../utils/dm-notification-copy';
import { notificationService } from './notification.service';
import { ACTIVE_CLIENT_USER_WHERE } from '../constants/user.constants';
import { hasChatFileMetadata } from '../utils/chat-attachment.utils';

const chatInclude = {
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
} as const;

/**
 * Resolve client and astrologer IDs from request params (participant1Id, participant2Id, currentUserRole).
 * participant1 is ALWAYS client, participant2 is ALWAYS astrologer.
 */
async function resolveClientAndAstrologerIds(
  participant1Id: string,
  participant2Id: string,
  currentUserRole: UserRole
): Promise<{ clientId: string; astrologerId: string }> {
  let clientId: string;
  let astrologerId: string;

  if (currentUserRole === UserRole.CLIENT) {
    clientId = participant1Id;
    const [otherAsAstrologer, otherAsUser] = await Promise.all([
      prisma.astrologer.findUnique({ where: { id: participant2Id }, select: { id: true } }),
      prisma.user.findFirst({
        where: { id: participant2Id, ...ACTIVE_CLIENT_USER_WHERE },
        select: { id: true, role: true },
      }),
    ]);
    if (otherAsAstrologer) {
      astrologerId = participant2Id;
    } else if (otherAsUser) {
      throw new Error('Cannot chat with another client. Please select an astrologer.');
    } else {
      throw new Error('User not found');
    }
    const client = await prisma.user.findFirst({
      where: { id: clientId, ...ACTIVE_CLIENT_USER_WHERE },
      select: { id: true },
    });
    if (!client) throw new Error('Client user not found');
  } else if (currentUserRole === UserRole.ASTROLOGER) {
    astrologerId = participant1Id;
    const otherAsUser = await prisma.user.findFirst({
      where: { id: participant2Id, ...ACTIVE_CLIENT_USER_WHERE },
      select: { id: true, role: true },
    });
    if (otherAsUser && otherAsUser.role === UserRole.CLIENT) {
      clientId = participant2Id;
    } else if (otherAsUser) {
      throw new Error('Cannot chat with another astrologer. Please select a client.');
    } else {
      throw new Error('Client not found');
    }
    const astrologer = await prisma.astrologer.findUnique({
      where: { id: astrologerId },
      select: { id: true },
    });
    if (!astrologer) throw new Error('Astrologer not found');
  } else {
    throw new AppError(
      `Invalid user role for chat. Only CLIENT and ASTROLOGER can chat. Current role: ${currentUserRole}`,
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.FORBIDDEN
    );
  }
  return { clientId, astrologerId };
}

/**
 * Find chat between client and astrologer only. Optionally unlock if locked (client).
 * Does NOT create a chat. Use this so chat is only created when the first message is sent (socket).
 */
export const findChatOnly = async (
  params: CreateChatParams & { currentUserRole: UserRole }
): Promise<Awaited<ReturnType<typeof prisma.chat.findUnique>> | null> => {
  const { participant1Id, participant2Id, currentUserRole } = params;
  const { clientId, astrologerId } = await resolveClientAndAstrologerIds(
    participant1Id,
    participant2Id,
    currentUserRole
  );

  let chat = await prisma.chat.findUnique({
    where: {
      participant1Id_participant2Id: {
        participant1Id: clientId,
        participant2Id: astrologerId,
      },
    },
    include: chatInclude,
  });

  if (!chat) return null;

  if (chat.isLocked) {
    if (currentUserRole === UserRole.ASTROLOGER) {
      throw new Error('This chat is locked. Only the client can reopen the conversation.');
    }
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
      include: chatInclude,
    });
  } else if (chat.status === ChatStatus.ENDED && currentUserRole === UserRole.CLIENT) {
    chat = await prisma.chat.update({
      where: { id: chat.id },
      data: {
        status: ChatStatus.ACTIVE,
        reopenedAfterEnded: true,
        endedBy: null,
        endedAt: null,
        waitingForReply: false,
      },
      include: chatInclude,
    });
  }

  return chat;
};

/**
 * Find or create a chat between client and astrologer.
 * @deprecated Prefer findChatOnly + creating chat on first message (socket). Chats should only be created when actual text is sent.
 */
export const findOrCreateChat = async (
  params: CreateChatParams & { currentUserRole: UserRole }
) => {
  const { participant1Id, participant2Id, currentUserRole } = params;
  let { consultationId } = params;

  const { clientId, astrologerId } = await resolveClientAndAstrologerIds(
    participant1Id,
    participant2Id,
    currentUserRole
  );

  // participant1 is ALWAYS client, participant2 is ALWAYS astrologer
  let chat = await prisma.chat.findUnique({
    where: {
      participant1Id_participant2Id: {
        participant1Id: clientId,
        participant2Id: astrologerId,
      },
    },
    include: chatInclude,
  });

  // If chat exists and is locked or ended, reactivate and reset turn-based state
  if (chat && chat.isLocked) {
    if (currentUserRole === UserRole.ASTROLOGER) {
      throw new Error('This chat is locked. Only the client can reopen the conversation.');
    }
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
      include: chatInclude,
    });
  } else if (chat && chat.status === ChatStatus.ENDED && currentUserRole === UserRole.CLIENT) {
    chat = await prisma.chat.update({
      where: { id: chat.id },
      data: {
        status: ChatStatus.ACTIVE,
        reopenedAfterEnded: true,
        endedBy: null,
        endedAt: null,
        waitingForReply: false,
      },
      include: chatInclude,
    });
  }

  // Create if doesn't exist - only when explicitly using findOrCreateChat (e.g. internal flows)
  if (!chat) {
    // Only CLIENTS can create new chats
    if (currentUserRole === UserRole.ASTROLOGER) {
      throw new Error(
        'Astrologers cannot initiate chats. Please wait for the client to message you.'
      );
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

    // PREMIUM astrologers: allow chat ONLY within 30-minute window after appointment time
    if (astrologer.category === AstrologerCategory.PREMIUM) {
      const now = new Date();

      // Find an appointment that:
      // 1. Is confirmed/in_progress/completed
      // 2. Has started (scheduledAt <= now)
      // 3. Is still within the 30-minute window (scheduledAt + duration >= now)
      const eligibleAppointment = await prisma.appointment.findFirst({
        where: {
          clientId,
          astrologerId,
          scheduledAt: {
            lte: now, // Appointment has started
          },
          status: {
            in: [
              AppointmentStatus.CONFIRMED,
              AppointmentStatus.IN_PROGRESS,
              AppointmentStatus.COMPLETED,
            ],
          },
        },
        orderBy: {
          scheduledAt: 'desc', // Get the most recent appointment
        },
      });

      if (!eligibleAppointment) {
        throw new AppError(
          `${astrologer.name} is a Premium astrologer. You can only chat during your scheduled appointment time (30 minutes after the appointment starts). Please book an appointment first.`,
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR
        );
      }

      // Check if we're within the 30-minute window
      const appointmentStart = new Date(eligibleAppointment.scheduledAt);
      const appointmentEnd = new Date(
        appointmentStart.getTime() + eligibleAppointment.duration * 60 * 1000
      );

      if (now < appointmentStart || now > appointmentEnd) {
        throw new AppError(
          `You can only chat with ${astrologer.name} during your appointment window (30 minutes starting from ${appointmentStart.toLocaleString()}).`,
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
    }

    // Note: Coins are now deducted per message, not when creating chat
    // This allows users to start chats and only pay when they send messages

    chat = await prisma.chat.create({
      data: {
        participant1Id: clientId,
        participant2Id: astrologerId,
        participant1Type: ParticipantType.CLIENT,
        participant2Type: ParticipantType.ASTROLOGER,
        consultationId,
        status: ChatStatus.ACTIVE,
        isLocked: false,
      },
      include: chatInclude,
    });
  }

  return chat;
};

/**
 * Get or create a chat for an appointment/kundali session. Only valid when current time is within
 * [scheduledAt, scheduledAt + duration]. Used when a session starts so client and astrologer
 * can open the same chat from notifications (free for the 30-min session).
 */
export async function getOrCreateChatForAppointment(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { clientId: true, astrologerId: true, scheduledAt: true, duration: true, status: true },
  });
  if (!appointment || appointment.status !== AppointmentStatus.CONFIRMED) return null;

  const now = new Date();
  const start = new Date(appointment.scheduledAt);
  const endMs = start.getTime() + appointment.duration * 60 * 1000;
  if (now.getTime() < start.getTime() || now.getTime() >= endMs) return null;

  const { clientId, astrologerId } = appointment;

  let chat = await prisma.chat.findUnique({
    where: {
      participant1Id_participant2Id: {
        participant1Id: clientId,
        participant2Id: astrologerId,
      },
    },
    include: chatInclude,
  });

  if (chat) {
    if (chat.appointmentId === appointmentId) return chat;
    chat = await prisma.chat.update({
      where: { id: chat.id },
      data: { appointmentId },
      include: chatInclude,
    });
    return chat;
  }

  chat = await prisma.chat.create({
    data: {
      participant1Id: clientId,
      participant2Id: astrologerId,
      participant1Type: ParticipantType.CLIENT,
      participant2Type: ParticipantType.ASTROLOGER,
      appointmentId,
      status: ChatStatus.ACTIVE,
      isLocked: false,
    },
    include: chatInclude,
  });
  return chat;
}

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
    select: {
      id: true,
      participant1Id: true,
      participant2Id: true,
      participant1Type: true,
      participant2Type: true,
      consultationId: true,
      appointmentId: true,
      status: true,
      isLocked: true,
      reopenedAfterEnded: true,
      endedBy: true,
      endedAt: true,
      lastMessageAt: true,
      lastMessageText: true,
      participant1Read: true,
      participant2Read: true,
      isMonitoredByAdmin: true,
      isAbandonedByAdmin: true,
      waitingForReply: true,
      turnBasedEnabled: true,
      createdAt: true,
      updatedAt: true,
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
    orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
  });

  const chatIds = chats.map((c) => c.id);

  const broadcastLinkedChatIds =
    chatIds.length > 0
      ? await prisma.broadcastMessage
          .findMany({
            where: {
              chatId: { in: chatIds },
              status: BroadcastMessageStatus.ACCEPTED,
            },
            select: { chatId: true },
          })
          .then((rows) => new Set(rows.map((r) => r.chatId)))
      : new Set<string>();

  // Fetch instant-chat-linked chat IDs in one query (accepted only)
  const instantLinkedChatIds =
    chatIds.length > 0
      ? await prisma.instantChatRequest
          .findMany({
            where: {
              chatId: { in: chatIds },
              status: InstantChatRequestStatus.ACCEPTED,
            },
            select: { chatId: true },
          })
          .then((rows) => new Set(rows.map((r) => r.chatId).filter((id): id is string => !!id)))
      : new Set<string>();

  // Fetch all unread counts in a single groupBy query instead of N individual counts
  const unreadGroups =
    chatIds.length > 0
      ? await prisma.message.groupBy({
          by: ['chatId'],
          where: {
            chatId: { in: chatIds },
            receiverId: userId,
            isRead: false,
          },
          _count: { id: true },
        })
      : [];
  const unreadMap = new Map(unreadGroups.map((g) => [g.chatId, g._count.id]));

  // Unified source classification with reopen override:
  // - Once a chat is reopened after ending, it is a direct continuation.
  // - Otherwise, any accepted broadcast/instant-origin chat is BROADCAST.
  const chatsWithUnread = chats.map((chat) => {
    const unreadCount = unreadMap.get(chat.id) ?? 0;
    const chatSource = chat.reopenedAfterEnded
      ? 'DIRECT'
      : broadcastLinkedChatIds.has(chat.id) || instantLinkedChatIds.has(chat.id)
        ? 'BROADCAST'
        : 'DIRECT';
    const isBroadcastChat = chatSource === 'BROADCAST';
    const isInstantChat = instantLinkedChatIds.has(chat.id);

    return {
      ...chat,
      unreadCount,
      chatSource,
      isBroadcastChat,
      isInstantChat,
    };
  });

  return chatsWithUnread;
};

/**
 * Merge metadata.birthDetails onto client sender so REST + socket match.
 * Selected family/friend profile is stored in message metadata; the User row alone is not enough.
 */
export function mergeClientSenderWithBirthMetadata(
  sender:
    | {
        id: string;
        name: string | null;
        profilePhoto: string | null;
        dateOfBirth?: Date | null;
        timeOfBirth?: string | null;
        placeOfBirth?: string | null;
        role?: string | null;
        gender?: string | null;
      }
    | null
    | undefined,
  message: { senderType: ParticipantType; metadata: unknown; senderId: string }
) {
  if (message.senderType !== ParticipantType.CLIENT) {
    return sender || { id: message.senderId, name: 'Unknown User', profilePhoto: null };
  }
  const meta = message.metadata as Record<string, unknown> | null | undefined;
  const birthDetails = meta?.birthDetails as Record<string, unknown> | undefined;
  const baseSender =
    sender || ({ id: message.senderId, name: 'Unknown User', profilePhoto: null } as const);
  if (!birthDetails || typeof birthDetails !== 'object') {
    return baseSender;
  }
  const baseBirth = baseSender as Record<string, unknown>;
  return {
    ...baseSender,
    dateOfBirth: birthDetails.dateOfBirth ?? baseBirth.dateOfBirth,
    timeOfBirth: birthDetails.timeOfBirth ?? baseBirth.timeOfBirth,
    placeOfBirth: birthDetails.placeOfBirth ?? baseBirth.placeOfBirth,
    gender: birthDetails.gender ?? baseBirth.gender,
  };
}

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

  // Batch-fetch all senders in 2 queries instead of N (one per message)
  const clientSenderIds = [
    ...new Set(
      messages.filter((m) => m.senderType === ParticipantType.CLIENT).map((m) => m.senderId)
    ),
  ];
  const astrologerSenderIds = [
    ...new Set(
      messages.filter((m) => m.senderType === ParticipantType.ASTROLOGER).map((m) => m.senderId)
    ),
  ];

  const [clientSenders, astrologerSenders] = await Promise.all([
    clientSenderIds.length > 0
      ? prisma.user.findMany({
          where: { id: { in: clientSenderIds } },
          select: {
            id: true,
            name: true,
            profilePhoto: true,
            dateOfBirth: true,
            timeOfBirth: true,
            placeOfBirth: true,
            role: true,
          },
        })
      : [],
    astrologerSenderIds.length > 0
      ? prisma.astrologer.findMany({
          where: { id: { in: astrologerSenderIds } },
          select: { id: true, name: true, profilePhoto: true },
        })
      : [],
  ]);

  const clientMap = new Map(clientSenders.map((u) => [u.id, u]));
  const astrologerMap = new Map(astrologerSenders.map((a) => [a.id, a]));

  const messagesWithSender = messages.map((message) => {
    const sender =
      message.senderType === ParticipantType.CLIENT
        ? clientMap.get(message.senderId)
        : astrologerMap.get(message.senderId);

    const mergedSender = mergeClientSenderWithBirthMetadata(sender, message);

    return { ...message, sender: mergedSender };
  });

  return {
    messages: messagesWithSender.reverse(), // Reverse to show oldest first
    total,
    chat,
  };
};

/**
 * Send a message
 * Deducts coins per message for clients (not for astrologers)
 */
export const sendMessage = async (params: SendMessageParams & { senderRole: UserRole }) => {
  const { chatId, senderId, receiverId, content, type = 'TEXT', metadata, senderRole } = params;

  if (!content?.trim()) {
    if (hasChatFileMetadata(metadata)) {
      throw new AppError(
        'Please add a message along with your attachment.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.ATTACHMENT_REQUIRES_TEXT
      );
    }
    throw new AppError('Message cannot be empty', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const effectiveType = type ?? MessageType.TEXT;
  if (effectiveType === MessageType.TEXT) {
    const maxLen =
      senderRole === UserRole.ASTROLOGER
        ? CHAT_MESSAGE_MAX_LENGTH_ASTROLOGER
        : CHAT_MESSAGE_MAX_LENGTH_CLIENT;
    if (content.trim().length > maxLen) {
      throw new AppError(
        `Message cannot exceed ${maxLen} characters`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
  }

  // Determine sender and receiver types
  const senderType =
    senderRole === UserRole.CLIENT ? ParticipantType.CLIENT : ParticipantType.ASTROLOGER;
  const receiverType =
    senderRole === UserRole.CLIENT ? ParticipantType.ASTROLOGER : ParticipantType.CLIENT;

  // Get the chat to determine who is client and astrologer and current turn-based state
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: {
      participant1Id: true,
      participant2Id: true,
      status: true,
      reopenedAfterEnded: true,
      turnBasedEnabled: true,
      waitingForReply: true,
      astrologerParticipant: {
        select: {
          category: true,
          id: true,
        },
      },
    },
  });

  if (!chat) {
    throw new Error('Chat not found');
  }

  // Turn-based messaging: prevent multiple client messages while waiting for reply
  if (chat.turnBasedEnabled && chat.waitingForReply && senderRole === UserRole.CLIENT) {
    throw new AppError(
      'Please wait for the astrologer to reply before sending another message.',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // For PREMIUM astrologers, verify we're within appointment window
  const astrologerCategory = chat.astrologerParticipant?.category;
  if (astrologerCategory === AstrologerCategory.PREMIUM && senderRole === UserRole.CLIENT) {
    const now = new Date();
    const clientId = chat.participant1Id; // participant1 is always client
    const astrologerId = chat.astrologerParticipant.id;

    // Find the most recent appointment for this client-astrologer pair
    const appointment = await prisma.appointment.findFirst({
      where: {
        clientId,
        astrologerId,
        scheduledAt: {
          lte: now, // Appointment has started
        },
        status: {
          in: [
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.IN_PROGRESS,
            AppointmentStatus.COMPLETED,
          ],
        },
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    });

    if (!appointment) {
      throw new AppError(
        'You can only chat with Premium astrologers during your scheduled appointment time. Please book an appointment first.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Check if we're within the appointment window (30 minutes from scheduledAt)
    const appointmentStart = new Date(appointment.scheduledAt);
    const appointmentEnd = new Date(appointmentStart.getTime() + appointment.duration * 60 * 1000);

    if (now < appointmentStart || now > appointmentEnd) {
      throw new AppError(
        `You can only chat during your appointment window (${appointment.duration} minutes starting from ${appointmentStart.toLocaleString()}).`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
  }

  // Deduct coins per message (only for clients, not astrologers)
  // PREMIUM astrologers don't require coins (already checked above)
  if (senderRole === UserRole.CLIENT) {
    if (astrologerCategory && requiresCoinsForChat(astrologerCategory)) {
      // Check if this chat is from a broadcast message; reopened chats use instant fee
      const broadcastMessage = await prisma.broadcastMessage.findFirst({
        where: { chatId },
        select: { id: true },
      });
      const isBroadcastChat = !!broadcastMessage && !chat.reopenedAfterEnded;

      // Import here to avoid circular dependency
      const { deductCoinsForMessage } = await import('./coin.service');
      const { toSharedAstrologerCategory } = await import('../constants/coin.constants');
      try {
        const dedResult = await deductCoinsForMessage(
          senderId,
          toSharedAstrologerCategory(astrologerCategory),
          chatId,
          isBroadcastChat
        );
        (chat as any)._coinsDeducted = dedResult.coinsDeducted;
      } catch (error: any) {
        // Re-throw with proper error format
        if (error.code === 'INSUFFICIENT_COINS') {
          throw error; // Already formatted
        }
        throw error;
      }
    }
  }

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

  // Update chat's last message info and turn-based state
  // participant1 is client, participant2 is astrologer
  const chatUpdateData: Prisma.ChatUpdateInput = {
    lastMessageAt: new Date(),
    lastMessageText: content.substring(0, 100),
    participant1Read: senderId === chat.participant1Id, // Client read if client sent
    participant2Read: senderId === chat.participant2Id, // Astrologer read if astrologer sent
  };

  // Apply turn-based updates if enabled
  if (chat.turnBasedEnabled) {
    if (senderRole === UserRole.CLIENT) {
      // Client sent message - now waiting for astrologer reply
      (chatUpdateData as any).waitingForReply = true;
      (chatUpdateData as any).lastClientMessageAt = new Date();
    } else if (senderRole === UserRole.ASTROLOGER) {
      // Astrologer replied - client can send again
      (chatUpdateData as any).waitingForReply = false;
      (chatUpdateData as any).lastAstrologerReplyAt = new Date();
    }
  }

  const updatedChat = await prisma.chat.update({
    where: { id: chatId },
    data: chatUpdateData,
    select: {
      waitingForReply: true,
      lastClientMessageAt: true,
      lastAstrologerReplyAt: true,
      turnBasedEnabled: true,
    },
  });

  const coinsDeducted = (chat as any)._coinsDeducted;

  // Emit real-time message + CHAT_MESSAGE notification to receiver (same as socket path)
  // This ensures astrologers get notifications when clients send via HTTP (e.g. initial message from startChat)
  try {
    let sender: {
      id: string;
      name: string | null;
      profilePhoto: string | null;
      phone?: string | null;
    } | null = null;
    if (senderRole === UserRole.CLIENT) {
      sender = await prisma.user.findFirst({
        where: { id: senderId, ...ACTIVE_CLIENT_USER_WHERE },
        select: { id: true, name: true, profilePhoto: true, phone: true },
      });
    } else {
      sender = await prisma.astrologer.findUnique({
        where: { id: senderId },
        select: { id: true, name: true, profilePhoto: true, phone: true },
      });
    }
    const senderName = sender?.name || sender?.phone || 'someone';

    const messageWithSender = {
      id: message.id,
      chatId: message.chatId,
      senderId: message.senderId,
      receiverId: message.receiverId,
      senderType: message.senderType,
      receiverType: message.receiverType,
      content: message.content,
      type: message.type,
      metadata: message.metadata,
      isRead: message.isRead,
      isDeleted: message.isDeleted,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
      sender: sender
        ? { id: sender.id, name: sender.name ?? 'Unknown User', profilePhoto: sender.profilePhoto }
        : { id: senderId, name: 'Unknown User', profilePhoto: null },
      ...(coinsDeducted != null && senderRole === UserRole.CLIENT ? { coinsDeducted } : {}),
    };

    const turnStateInfo =
      chat.turnBasedEnabled && updatedChat.turnBasedEnabled
        ? {
            waitingForReply: updatedChat.waitingForReply,
            lastClientMessageAt: updatedChat.lastClientMessageAt,
            lastAstrologerReplyAt: updatedChat.lastAstrologerReplyAt,
          }
        : null;

    const io = getSocketInstance();
    if (io) {
      io.to(`user:${receiverId}`).emit('chat:receive', {
        ...messageWithSender,
        turnState: turnStateInfo,
      });

      // Create or update grouped CHAT_MESSAGE notification per chat (one per chat, not per message)
      const groupKey = `chat:${chatId}`;
      const notificationWhere =
        receiverType === ParticipantType.CLIENT
          ? { userId: receiverId, groupKey }
          : { astrologerId: receiverId, groupKey };

      const existingNotification = await prisma.notification.findFirst({
        where: notificationWhere,
      });

      const nextCount = existingNotification ? existingNotification.count + 1 : 1;
      const dmCopy = buildDmChatNotificationCopy({
        senderName,
        senderRole,
        receiverType,
        messageCountInGroup: nextCount,
      });
      const chatNotifMetadata = {
        messageId: message.id,
        senderId,
        chatId,
        ...(senderRole === UserRole.CLIENT && receiverType === ParticipantType.ASTROLOGER
          ? { channel: 'direct' as const }
          : {}),
      };

      let notification;
      if (existingNotification) {
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
        notification = await prisma.notification.create({
          data: {
            ...(receiverType === ParticipantType.CLIENT
              ? { userId: receiverId, recipientType: ParticipantType.CLIENT }
              : { astrologerId: receiverId, recipientType: ParticipantType.ASTROLOGER }),
            title: dmCopy.title,
            message: dmCopy.message,
            type: 'CHAT_MESSAGE',
            groupKey,
            count: 1,
            metadata: chatNotifMetadata,
          },
        });
      }

      notificationService.invalidateUserCache(receiverId);
      io.to(`user:${receiverId}`).emit('notification:new', notification);
    }
  } catch (emitErr) {
    console.error('[chatService.sendMessage] Failed to emit to receiver:', emitErr);
    // Don't throw - message was saved; notification is best-effort
  }

  return { message, coinsDeducted };
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

/** Anonymous astrologer display name for Client Chat History */
const ANONYMOUS_ASTROLOGER_NAME = 'Anonymous Astrologer';

/**
 * Check if a client has previous chat history with any astrologer.
 * Returns true if the client has messages in more than one chat (i.e. chatted with more than one astrologer).
 * Used to conditionally show "Client Chat History" button to astrologers.
 * When the client is in their first-ever conversation (only 1 chat with messages), returns false.
 */
export async function clientHasChatHistory(clientId: string): Promise<boolean> {
  const chatsWithMessages = await prisma.message.findMany({
    where: {
      isDeleted: false,
      chat: {
        participant1Id: clientId,
      },
    },
    select: { chatId: true },
    distinct: ['chatId'],
  });
  return chatsWithMessages.length >= 2;
}

export interface GetClientChatHistoryParams {
  clientId: string;
  cursor?: string;
  limit?: number;
}

export interface ClientChatHistoryMessage {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  senderType: ParticipantType;
  receiverType: ParticipantType;
  content: string;
  type: MessageType;
  metadata: unknown;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  senderDisplayName: string;
  senderAvatarLetter: string;
}

export interface GetClientChatHistoryResult {
  messages: ClientChatHistoryMessage[];
  nextCursor: string | null;
}

/**
 * Get aggregated chat history of a client across ALL astrologers.
 * Astrologer identities are anonymized ("Anonymous Astrologer", black avatar with "A").
 * Only astrologers can call this. Cursor-based pagination, newest first.
 */
export async function getClientChatHistory(
  params: GetClientChatHistoryParams,
  _requestingAstrologerId: string
): Promise<GetClientChatHistoryResult> {
  const { clientId, cursor, limit = 12 } = params;

  const cursorDate = cursor ? new Date(cursor) : undefined;

  const messages = await prisma.message.findMany({
    where: {
      isDeleted: false,
      chat: {
        participant1Id: clientId,
      },
      ...(cursorDate && { createdAt: { lt: cursorDate } }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
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
      createdAt: true,
      updatedAt: true,
    },
  });

  const hasMore = messages.length > limit;
  const resultMessages = hasMore ? messages.slice(0, limit) : messages;
  const nextCursor =
    hasMore && resultMessages.length > 0
      ? resultMessages[resultMessages.length - 1].createdAt.toISOString()
      : null;

  const anonymized: ClientChatHistoryMessage[] = resultMessages.map((m) => {
    const isFromAstrologer = m.senderType === ParticipantType.ASTROLOGER;
    let content = m.content ?? '';
    if (isFromAstrologer && content) {
      content = content.replace(
        /I\s*\([^)]+\)\s*have\s*accepted\s*your\s*request/gi,
        'I (Anonymous Astrologer) have accepted your request'
      );
    }
    return {
      ...m,
      content,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      senderDisplayName: isFromAstrologer ? ANONYMOUS_ASTROLOGER_NAME : 'Client',
      senderAvatarLetter: isFromAstrologer ? 'A' : (m.senderId.charAt(0) || 'C').toUpperCase(),
    };
  });

  return { messages: anonymized, nextCursor };
}
