/**
 * Broadcast Message Service
 * Handles "Everyone Jyotish" broadcast messaging system
 */

import { prisma } from '@jyotish/database';
import {
  Prisma,
  MessageType,
  AuditAction,
  BroadcastMessageStatus,
  ChatStatus,
} from '@prisma/client';
import { AstrologerCategory } from '@jyotish/shared';
import { BROADCAST_MESSAGE_EXPIRY_MS, BROADCAST_ACCEPTANCE_LIMITS } from '../constants';
import { notifyBroadcastMessageSent, notifyBroadcastMessageAccepted } from '../utils';
import { auditService } from './audit.service';
import { AppError } from '../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import {
  deductCoinsForChat,
  deductCoinsForBroadcastMessage,
  deductCoinsForBroadcastQuestions,
  refundCoins,
} from './coin.service';
import { requiresCoinsForChat } from '../constants/coin.constants';
import { getRate } from './platformCoinRate.service';
import { getTotalNrForQuestionCount } from './broadcastQuestionPricing.service';
import { randomUUID } from 'node:crypto';

export interface CreateBroadcastMessageData {
  clientId: string;
  content: string;
  type?: MessageType;
  metadata?: Prisma.InputJsonValue;
}

export interface BroadcastQuestionItem {
  id: string;
  text: string;
}

export interface AcceptBroadcastMessageData {
  messageId: string;
  astrologerId: string;
}

/**
 * Check if a client has ever used broadcast before.
 *
 * Behaviour detail:
 * If a broadcast message is free-trial and expires, it should not be counted as used.
 */
export async function hasUserUsedBroadcast(clientId: string): Promise<boolean> {
  if (!('broadcastMessage' in prisma)) {
    return false;
  }

  const existing = await prisma.broadcastMessage.findFirst({
    where: {
      clientId,
      NOT: {
        AND: [
          {
            metadata: {
              path: ['freeTrial'],
              equals: true,
            },
          },
          { status: BroadcastMessageStatus.EXPIRED },
        ],
      },
    },
    select: { id: true },
  });

  return !!existing;
}

/**
 * Create a new broadcast message from client to all astrologers
 */
export async function createBroadcastMessage(data: CreateBroadcastMessageData) {
  // Graceful handling if table doesn't exist yet
  if (!('broadcastMessage' in prisma)) {
    throw new Error('BroadcastMessage table not found. Please run: prisma db push');
  }

  // Check if client already has an active chat (not locked)
  const activeChat = await prisma.chat.findFirst({
    where: {
      status: 'ACTIVE',
      isLocked: false, // Only check unlocked chats
      participant1Id: data.clientId, // Client is always participant1
    },
    include: {
      astrologerParticipant: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });

  if (activeChat) {
    console.log('❌ Client has active chat:', {
      chatId: activeChat.id,
      astrologer: activeChat.astrologerParticipant.name,
      status: activeChat.status,
      isLocked: activeChat.isLocked,
    });
    throw new Error(`You have an active chat. End your current chat before starting a new one.`);
  }

  // Check if client has a pending broadcast message
  const pendingBroadcast = await prisma.broadcastMessage.findFirst({
    where: {
      clientId: data.clientId,
      status: BroadcastMessageStatus.PENDING,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (pendingBroadcast) {
    // Calculate time since last broadcast was sent
    const timeSinceLastBroadcast = Date.now() - pendingBroadcast.createdAt.getTime();
    const timeLeftSeconds = Math.max(
      0,
      Math.ceil((BROADCAST_MESSAGE_EXPIRY_MS - timeSinceLastBroadcast) / 1000)
    );

    throw new Error(
      `You already have a pending broadcast message. Please wait ${timeLeftSeconds} seconds for it to be accepted or expire before sending another one.`
    );
  }

  // Check if client has an accepted broadcast message without an active chat
  // This means the astrologer accepted but the chat was ended
  const acceptedBroadcast = await prisma.broadcastMessage.findFirst({
    where: {
      clientId: data.clientId,
      status: BroadcastMessageStatus.ACCEPTED,
      chatId: {
        not: null,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (acceptedBroadcast && acceptedBroadcast.chatId) {
    // Check if the chat from the accepted broadcast is still active
    const acceptedChat = await prisma.chat.findUnique({
      where: { id: acceptedBroadcast.chatId },
    });

    if (acceptedChat && acceptedChat.status === ChatStatus.ACTIVE && !acceptedChat.isLocked) {
      throw new Error(
        'Your previous broadcast message was accepted. Please complete or end your current chat before sending a new broadcast message.'
      );
    }
  }

  // Check if there are any online astrologers available (exclude PREMIUM only)
  // Only in-house astrologers can accept broadcasts
  const onlineAstrologers = await prisma.astrologer.count({
    where: {
      isActive: true,
      isOnline: true,
      inhouseAstrologer: true,
    },
  });

  if (onlineAstrologers === 0) {
    throw new Error('No astrologers are available at the moment. Please try again later.');
  }

  // When birthDetails are provided in metadata (selected profile), skip client profile completeness
  const hasSelectedProfileBirthDetails =
    data.metadata &&
    typeof data.metadata === 'object' &&
    'birthDetails' in data.metadata &&
    data.metadata.birthDetails &&
    typeof (data.metadata.birthDetails as Record<string, unknown>) === 'object';

  const clientProfile = await prisma.user.findUnique({
    where: { id: data.clientId },
    select: {
      name: true,
      dateOfBirth: true,
      timeOfBirth: true,
      placeOfBirth: true,
      profileCompleted: true,
      coins: true,
    },
  });

  if (!clientProfile) {
    throw new Error('User not found');
  }

  if (!hasSelectedProfileBirthDetails) {
    // Check if all required fields are present (same logic as instant chat)
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
      throw new Error(
        `Please complete your profile before sending a broadcast message. Missing: ${missingFields.join(', ')}`
      );
    }
  }

  // First broadcast is free: if client has never used broadcast before, skip deduction once.
  const alreadyUsedBroadcast = await hasUserUsedBroadcast(data.clientId);
  const isFirstFreeBroadcast = !alreadyUsedBroadcast;

  if (!isFirstFreeBroadcast) {
    // Check coin balance and deduct 1 coin upfront for broadcast message
    try {
      await deductCoinsForBroadcastMessage(data.clientId);
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err.code === ERROR_CODES.INSUFFICIENT_COINS) {
        throw new Error(
          `Insufficient coins. Required: 1 coin to send a broadcast message. Available: ${clientProfile.coins} coins. Please top up your coins.`
        );
      }
      throw error;
    }
  }

  const baseMetadata: Record<string, unknown> =
    data.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata)
      ? (data.metadata as Record<string, unknown>)
      : {};

  const message = await prisma.broadcastMessage.create({
    data: {
      clientId: data.clientId,
      content: data.content,
      type: data.type || MessageType.TEXT,
      metadata: {
        ...baseMetadata,
        ...(isFirstFreeBroadcast ? { freeTrial: true } : {}),
      } as Prisma.InputJsonValue,
      status: BroadcastMessageStatus.PENDING,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          phone: true,
          profilePhoto: true,
        },
      },
    },
  });

  // Log audit action
  await auditService.logAction({
    action: AuditAction.BROADCAST_MESSAGE_CREATE,
    resource: 'BroadcastMessage',
    resourceId: message.id,
    userId: data.clientId,
    details: {
      messageId: message.id,
      type: data.type || 'TEXT',
      onlineAstrologers,
    },
  });

  // Notify admin
  notifyBroadcastMessageSent(message);

  return message;
}

export interface CreateMultipleBroadcastMessagesInput {
  clientId: string;
  questionItems: BroadcastQuestionItem[];
  totalNr: number;
  birthDetails?: {
    dateOfBirth?: string;
    timeOfBirth?: string;
    placeOfBirth?: string;
    gender?: string;
  };
}

/**
 * Create multiple broadcast messages at once (multi-question flow).
 * Deducts totalNr once, creates one BroadcastMessage per question, each with amountRefundNr for cancel refund.
 */
export async function createMultipleBroadcastMessages(
  input: CreateMultipleBroadcastMessagesInput
): Promise<{ messages: Awaited<ReturnType<typeof prisma.broadcastMessage.create>>[] }> {
  const { clientId, questionItems, totalNr, birthDetails } = input;
  const count = questionItems.length;

  if (count === 0) {
    throw new AppError(
      'At least one question is required',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // Validate totalNr matches server-side pricing
  const expectedTotal = await getTotalNrForQuestionCount(count);
  if (totalNr !== expectedTotal) {
    throw new AppError(
      `Pricing mismatch. Expected ${expectedTotal} NRs for ${count} question(s).`,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // Check active chat
  const activeChat = await prisma.chat.findFirst({
    where: {
      status: 'ACTIVE',
      isLocked: false,
      participant1Id: clientId,
    },
  });
  if (activeChat) {
    throw new Error('You have an active chat. End your current chat before starting a new one.');
  }

  // Online astrologers
  const onlineAstrologers = await prisma.astrologer.count({
    where: {
      isActive: true,
      isOnline: true,
      inhouseAstrologer: true,
    },
  });
  if (onlineAstrologers === 0) {
    throw new Error('No astrologers are available at the moment. Please try again later.');
  }

  const hasBirthDetails =
    birthDetails &&
    (birthDetails.dateOfBirth || birthDetails.timeOfBirth || birthDetails.placeOfBirth);
  const clientProfile = await prisma.user.findUnique({
    where: { id: clientId },
    select: {
      name: true,
      dateOfBirth: true,
      timeOfBirth: true,
      placeOfBirth: true,
    },
  });
  if (!clientProfile) {
    throw new Error('User not found');
  }
  if (!hasBirthDetails) {
    const missingFields: string[] = [];
    if (!clientProfile.name || clientProfile.name.trim() === '') missingFields.push('Name');
    if (!clientProfile.dateOfBirth) missingFields.push('Date of Birth');
    if (!clientProfile.timeOfBirth || clientProfile.timeOfBirth.trim() === '')
      missingFields.push('Time of Birth');
    if (!clientProfile.placeOfBirth || clientProfile.placeOfBirth.trim() === '')
      missingFields.push('Place of Birth');
    if (missingFields.length > 0) {
      throw new Error(
        `Please complete your profile before sending. Missing: ${missingFields.join(', ')}`
      );
    }
  }

  await deductCoinsForBroadcastQuestions(clientId, totalNr);

  const batchId = randomUUID();
  const rawAmountPerMessage = Math.round(totalNr / count);
  const amountPerMessage = Math.max(1, rawAmountPerMessage);
  const metadataBase =
    hasBirthDetails && Object.keys(birthDetails!).length > 0 ? { birthDetails } : undefined;

  const messages: Awaited<ReturnType<typeof prisma.broadcastMessage.create>>[] = [];

  for (let i = 0; i < questionItems.length; i++) {
    const item = questionItems[i];
    const metadata = {
      ...metadataBase,
      batchId,
      batchIndex: i,
      totalInBatch: count,
      amountRefundNr: amountPerMessage,
    };
    const message = await prisma.broadcastMessage.create({
      data: {
        clientId,
        content: item.text,
        type: MessageType.TEXT,
        status: BroadcastMessageStatus.PENDING,
        metadata: metadata as Prisma.InputJsonValue,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            profilePhoto: true,
          },
        },
      },
    });
    messages.push(message);
  }

  for (const message of messages) {
    await auditService.logAction({
      action: AuditAction.BROADCAST_MESSAGE_CREATE,
      resource: 'BroadcastMessage',
      resourceId: message.id,
      userId: clientId,
      details: { messageId: message.id, batchId, totalInBatch: count },
    });
    notifyBroadcastMessageSent(message);
  }

  return { messages };
}

/**
 * Expire old broadcast messages and refund the client for each (no one accepted).
 * Automatically expires messages older than BROADCAST_MESSAGE_EXPIRY_MS and refunds
 * using amountRefundNr (batch) or BROADCAST_SEND rate (single).
 */
export async function expireOldMessages() {
  if (!('broadcastMessage' in prisma)) {
    return { count: 0 };
  }

  try {
    const expiryTime = new Date(Date.now() - BROADCAST_MESSAGE_EXPIRY_MS);

    const toExpire = await prisma.broadcastMessage.findMany({
      where: {
        status: BroadcastMessageStatus.PENDING,
        createdAt: { lt: expiryTime },
      },
    });

    for (const message of toExpire) {
      const meta = (message.metadata as Record<string, unknown> | null) || {};
      const refundAmount =
        typeof meta.amountRefundNr === 'number' && meta.amountRefundNr >= 0
          ? Math.max(1, meta.amountRefundNr)
          : await getRate('BROADCAST_SEND').then((r) => Math.max(1, r));

      try {
        await refundCoins(message.clientId, refundAmount);
      } catch (refundErr) {
        console.error(
          `[expireOldMessages] Refund failed for message ${message.id}, client ${message.clientId}:`,
          refundErr
        );
        // Still expire the message so it does not stay pending
      }

      await prisma.broadcastMessage.update({
        where: { id: message.id },
        data: { status: BroadcastMessageStatus.EXPIRED },
      });
    }

    return { count: toExpire.length };
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err?.code === 'P2021' || err?.message?.includes('does not exist')) {
      return { count: 0 };
    }
    throw error;
  }
}

/**
 * Cancel a pending broadcast message (client only).
 * Sets status to CANCELLED, refunds the coin, and notifies astrologers so they remove it from their list.
 */
export async function cancelBroadcastMessage(messageId: string, clientId: string) {
  if (!('broadcastMessage' in prisma)) {
    throw new Error('BroadcastMessage table not found. Please run: prisma db push');
  }

  const message = await prisma.broadcastMessage.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new AppError('Broadcast message not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  if (message.clientId !== clientId) {
    throw new AppError(
      'You can only cancel your own broadcast message',
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.FORBIDDEN
    );
  }

  if (message.status !== BroadcastMessageStatus.PENDING) {
    throw new AppError(
      'Only pending broadcast messages can be cancelled',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // Refund: for batch messages use stored amountRefundNr; otherwise BROADCAST_SEND rate
  const meta = (message.metadata as Record<string, unknown> | null) || {};
  const refundAmount =
    typeof meta.amountRefundNr === 'number' && meta.amountRefundNr >= 0
      ? meta.amountRefundNr
      : await getRate('BROADCAST_SEND');
  await refundCoins(clientId, refundAmount);

  const updatedMessage = await prisma.broadcastMessage.update({
    where: { id: messageId },
    data: { status: 'CANCELLED' as BroadcastMessageStatus },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          phone: true,
          profilePhoto: true,
        },
      },
    },
  });

  await auditService.logAction({
    action: AuditAction.BROADCAST_MESSAGE_CREATE, // Reuse or add BROADCAST_MESSAGE_CANCEL if needed
    resource: 'BroadcastMessage',
    resourceId: messageId,
    userId: clientId,
    details: {
      messageId,
      action: 'CANCELLED',
      refundAmount,
    },
  });

  return updatedMessage;
}

/**
 * Get all pending broadcast messages (for astrologers)
 * Automatically expires old messages before returning
 * Filters out messages dismissed by the requesting astrologer
 * PREMIUM astrologers should not see broadcast messages
 */
export async function getPendingBroadcastMessages(astrologerId?: string) {
  // Graceful handling if table doesn't exist yet
  if (!('broadcastMessage' in prisma)) {
    return [];
  }

  // If astrologer ID is provided, check if they are in-house and eligible
  if (astrologerId) {
    const astrologer = await prisma.astrologer.findUnique({
      where: { id: astrologerId },
      select: { category: true, inhouseAstrologer: true },
    });

    // Only in-house astrologers may see broadcast messages
    if (!astrologer?.inhouseAstrologer) {
      return [];
    }
  }

  // First, expire old messages
  await expireOldMessages();

  // If astrologer ID is provided, get their dismissed message IDs
  let dismissedMessageIds: string[] = [];
  if (astrologerId) {
    const dismissals = await prisma.broadcastMessageDismissal.findMany({
      where: {
        astrologerId,
      },
      select: {
        broadcastMessageId: true,
      },
    });
    dismissedMessageIds = dismissals.map((d) => d.broadcastMessageId);
  }

  const messages = await prisma.broadcastMessage.findMany({
    where: {
      status: BroadcastMessageStatus.PENDING,
      ...(dismissedMessageIds.length > 0 && {
        id: {
          notIn: dismissedMessageIds,
        },
      }),
    },
    include: {
      client: {
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

  return messages;
}

/**
 * Get all broadcast messages for astrologers (including accepted ones)
 * Used for the "Everyone" view
 * PREMIUM astrologers should not see broadcast messages
 */
export async function getAllBroadcastMessages(astrologerId?: string) {
  // Graceful handling if table doesn't exist yet
  if (!('broadcastMessage' in prisma)) {
    return [];
  }

  // If astrologer ID is provided, check if they are in-house and eligible
  if (astrologerId) {
    const astrologer = await prisma.astrologer.findUnique({
      where: { id: astrologerId },
      select: { category: true, inhouseAstrologer: true },
    });

    // Only in-house astrologers may see broadcast messages
    if (!astrologer?.inhouseAstrologer) {
      return [];
    }
  }

  const messages = await prisma.broadcastMessage.findMany({
    where: {
      status: { not: 'CANCELLED' as BroadcastMessageStatus },
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          phone: true,
          profilePhoto: true,
        },
      },
      acceptedAstrologer: {
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
    take: 50, // Limit to last 50 messages
  });

  return messages;
}

/**
 * Get broadcast messages for a specific client
 */
export async function getClientBroadcastMessages(clientId: string) {
  // Graceful handling if table doesn't exist yet
  if (!('broadcastMessage' in prisma)) {
    return [];
  }

  const messages = await prisma.broadcastMessage.findMany({
    where: {
      clientId,
    },
    include: {
      acceptedAstrologer: {
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

  return messages;
}

/**
 * Accept a broadcast message and create a private chat
 */
export async function acceptBroadcastMessage(data: AcceptBroadcastMessageData) {
  const { messageId, astrologerId } = data;

  // Get the broadcast message
  const message = await prisma.broadcastMessage.findUnique({
    where: { id: messageId },
    include: {
      client: true,
    },
  });

  if (!message) {
    throw new Error('Broadcast message not found');
  }

  if (message.status !== BroadcastMessageStatus.PENDING) {
    throw new Error('This message has already been accepted or expired');
  }

  // Check if astrologer is PROFESSIONAL or PREMIUM - they cannot accept broadcast messages
  const astrologer = await prisma.astrologer.findUnique({
    where: { id: astrologerId },
    select: { category: true, name: true, inhouseAstrologer: true },
  });

  if (!astrologer) {
    throw new AppError(
      'Astrologer not found',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.ASTROLOGER_NOT_FOUND
    );
  }

  // Only in-house astrologers can accept broadcast messages
  if (!astrologer.inhouseAstrologer) {
    throw new AppError(
      'Only in-house astrologers can accept broadcast messages.',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // PREMIUM astrologers cannot accept broadcast messages (appointments only)
  if (astrologer.category === AstrologerCategory.PREMIUM) {
    throw new AppError(
      `${astrologer.name} is a Premium astrologer and only available through scheduled appointments. Please book an appointment to chat.`,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // Check if astrologer has reached their concurrent broadcast acceptance limit
  const acceptanceLimit =
    BROADCAST_ACCEPTANCE_LIMITS[astrologer.category as keyof typeof BROADCAST_ACCEPTANCE_LIMITS] ??
    0;

  if (acceptanceLimit === 0) {
    throw new AppError(
      `${astrologer.name} cannot accept broadcast messages based on their category.`,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // Count how many active broadcast chats this astrologer currently has
  // (chats that were created from broadcast messages and are still active)
  const acceptedBroadcastMessages = await prisma.broadcastMessage.findMany({
    where: {
      acceptedBy: astrologerId,
      status: BroadcastMessageStatus.ACCEPTED,
      chatId: { not: null },
    },
    select: { chatId: true },
  });

  const chatIds = acceptedBroadcastMessages
    .map((msg) => msg.chatId)
    .filter((id): id is string => id !== null);

  const activeBroadcastChats =
    chatIds.length > 0
      ? await prisma.chat.count({
          where: {
            id: { in: chatIds },
            status: 'ACTIVE',
            isLocked: false,
          },
        })
      : 0;

  if (activeBroadcastChats >= acceptanceLimit) {
    const categoryLabel =
      astrologer.category === AstrologerCategory.ORDINARY ? 'Ordinary' : 'Professional';
    throw new AppError(
      `You have reached the maximum limit of ${acceptanceLimit} concurrent broadcast chats for ${categoryLabel} astrologers. Please complete or end some of your current chats before accepting new broadcast requests.`,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // Check if client has active chat (not locked)
  const clientActiveChat = await prisma.chat.findFirst({
    where: {
      status: 'ACTIVE',
      isLocked: false, // Only check unlocked chats
      participant1Id: message.clientId, // Client is always participant1
    },
  });

  if (clientActiveChat) {
    console.log('❌ Client already in active chat:', {
      chatId: clientActiveChat.id,
      status: clientActiveChat.status,
      isLocked: clientActiveChat.isLocked,
    });
    throw new Error('This client is already in an active chat with another astrologer');
  }

  // Create or get existing chat between client and astrologer
  // participant1 is always client, participant2 is always astrologer
  let chat = await prisma.chat.findUnique({
    where: {
      participant1Id_participant2Id: {
        participant1Id: message.clientId,
        participant2Id: astrologerId,
      },
    },
  });

  // If chat exists (locked OR ended), reactivate it
  if (chat && (chat.isLocked || chat.status === 'ENDED')) {
    console.log(
      `🔄 Reactivating chat ${chat.id} - Status: ${chat.status}, Locked: ${chat.isLocked}`
    );

    chat = await prisma.chat.update({
      where: { id: chat.id },
      data: {
        isLocked: false,
        status: 'ACTIVE',
        reopenedAfterEnded: true, // Reopened chat uses instant chat fee, not broadcast
        endedBy: null,
        endedAt: null,
      },
    });
    console.log(`✅ Chat ${chat.id} reactivated successfully`);

    // Emit socket event to notify both participants that chat was reopened
    try {
      const { getSocketInstance } = require('../utils/socket-instance');
      const io = getSocketInstance();
      if (io) {
        console.log(`📡 Emitting chat:reopened for chat ${chat.id}`);

        // Notify both participants
        io.to(`user:${message.clientId}`).emit('chat:reopened', {
          chatId: chat.id,
          status: 'ACTIVE',
          isLocked: false,
          chat: chat,
        });

        io.to(`user:${astrologerId}`).emit('chat:reopened', {
          chatId: chat.id,
          status: 'ACTIVE',
          isLocked: false,
          chat: chat,
        });

        console.log(`✅ Notified both participants about chat reopen`);
      }
    } catch (socketError) {
      console.error('Error broadcasting chat reopen:', socketError);
      // Don't fail the request if socket fails
    }
  }

  if (!chat) {
    // Check if client profile is completed before creating chat
    // Check actual required fields instead of just profileCompleted flag
    const clientProfile = await prisma.user.findUnique({
      where: { id: message.clientId },
      select: {
        name: true,
        dateOfBirth: true,
        timeOfBirth: true,
        placeOfBirth: true,
        profileCompleted: true,
      },
    });

    if (!clientProfile) {
      throw new Error('User not found');
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
      throw new Error(
        `Please complete your profile before starting a chat. Missing: ${missingFields.join(', ')}`
      );
    }

    // Create new chat (client=participant1, astrologer=participant2).
    chat = await prisma.chat.create({
      data: {
        participant1Id: message.clientId,
        participant2Id: astrologerId,
        participant1Type: 'CLIENT',
        participant2Type: 'ASTROLOGER',
        status: 'ACTIVE',
        isLocked: false,
        turnBasedEnabled: true,
        waitingForReply: true,
        lastClientMessageAt: new Date(),
      },
    });

    // Emit new chat event to admin for real-time stats
    const { AdminStatsEmitter } = require('../utils/admin-stats-emitter');
    AdminStatsEmitter.emitNewChat();
  }

  // Update broadcast message status
  const updatedMessage = await prisma.broadcastMessage.update({
    where: { id: messageId },
    data: {
      status: BroadcastMessageStatus.ACCEPTED,
      acceptedBy: astrologerId,
      chatId: chat.id,
      acceptedAt: new Date(),
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          phone: true,
          profilePhoto: true,
        },
      },
      acceptedAstrologer: {
        select: {
          id: true,
          name: true,
          phone: true,
          profilePhoto: true,
        },
      },
    },
  });

  // Log audit action
  await auditService.logAction({
    action: AuditAction.BROADCAST_MESSAGE_ACCEPT,
    resource: 'BroadcastMessage',
    resourceId: messageId,
    userId: message.clientId,
    astrologerId,
    details: {
      messageId,
      clientId: message.clientId,
      chatId: chat.id,
    },
  });

  // Create automatic messages in the chat
  // 1. User's original broadcast message (include birthDetails from selected profile for Jyotish view)
  const broadcastMeta = (message.metadata as Record<string, unknown>) || {};
  const birthDetails = broadcastMeta.birthDetails as Record<string, unknown> | undefined;
  const originalMessage = await prisma.message.create({
    data: {
      chatId: chat.id,
      senderId: message.clientId,
      senderType: 'CLIENT',
      receiverId: astrologerId,
      receiverType: 'ASTROLOGER',
      content: message.content,
      type: 'TEXT',
      metadata: {
        originalBroadcast: true,
        broadcastMessageId: messageId,
        ...(birthDetails && Object.keys(birthDetails).length > 0 && { birthDetails }),
      } as Prisma.InputJsonValue,
    },
  });

  // 2. Astrologer's welcome message
  const astrologerName = updatedMessage.acceptedAstrologer?.name || 'The astrologer';
  const welcomeMessageContent = `Thank you for sending request. I (${astrologerName}) have accepted your request. I am currently analysing your profile and will get back to you soon...`;

  const welcomeMessage = await prisma.message.create({
    data: {
      chatId: chat.id,
      senderId: astrologerId,
      senderType: 'ASTROLOGER',
      receiverId: message.clientId,
      receiverType: 'CLIENT',
      content: welcomeMessageContent,
      type: 'TEXT',
      metadata: {
        autoReply: true,
        broadcastAcceptance: true,
      },
    },
  });

  // Update chat with last message info so it shows in conversation list
  await prisma.chat.update({
    where: { id: chat.id },
    data: {
      lastMessageText: welcomeMessageContent,
      lastMessageAt: new Date(),
    },
  });

  // Notify admin
  notifyBroadcastMessageAccepted(messageId, message.clientId, astrologerId, chat.id);

  return {
    message: updatedMessage,
    chat,
    initialMessages: [originalMessage, welcomeMessage],
  };
}

/**
 * Get broadcast message by ID
 */
export async function getBroadcastMessageById(messageId: string) {
  const message = await prisma.broadcastMessage.findUnique({
    where: { id: messageId },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          phone: true,
          profilePhoto: true,
        },
      },
      acceptedAstrologer: {
        select: {
          id: true,
          name: true,
          phone: true,
          profilePhoto: true,
        },
      },
    },
  });

  return message;
}

/**
 * Expire old pending broadcast messages (called by worker/cron)
 */
export async function expireOldBroadcastMessages(olderThanMinutes: number = 30) {
  const expiryTime = new Date();
  expiryTime.setMinutes(expiryTime.getMinutes() - olderThanMinutes);

  const result = await prisma.broadcastMessage.updateMany({
    where: {
      status: BroadcastMessageStatus.PENDING,
      createdAt: {
        lt: expiryTime,
      },
    },
    data: {
      status: BroadcastMessageStatus.EXPIRED,
    },
  });

  return result;
}

/**
 * Dismiss/Reject a broadcast message for a specific astrologer
 * The message won't be shown to this astrologer again
 */
export async function dismissBroadcastMessage(messageId: string, astrologerId: string) {
  // Check if message exists and is still pending
  const message = await prisma.broadcastMessage.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new Error('Broadcast message not found');
  }

  if (message.status !== BroadcastMessageStatus.PENDING) {
    throw new Error('This message has already been accepted or expired');
  }

  // Create or update dismissal record (upsert to handle duplicates gracefully)
  const dismissal = await prisma.broadcastMessageDismissal.upsert({
    where: {
      broadcastMessageId_astrologerId: {
        broadcastMessageId: messageId,
        astrologerId,
      },
    },
    create: {
      broadcastMessageId: messageId,
      astrologerId,
    },
    update: {
      dismissedAt: new Date(),
    },
  });

  // Log audit action
  await auditService.logAction({
    action: AuditAction.BROADCAST_MESSAGE_DISMISS,
    resource: 'BroadcastMessage',
    resourceId: messageId,
    userId: message.clientId,
    astrologerId,
    details: {
      messageId,
      clientId: message.clientId,
    },
  });

  return dismissal;
}
