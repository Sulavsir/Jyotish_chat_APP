/**
 * Broadcast Message Service
 * Handles "Everyone Jyotish" broadcast messaging system
 */

import { prisma } from '@jyotish/database';
import { Prisma, MessageType, AuditAction } from '@prisma/client';
import { BROADCAST_MESSAGE_EXPIRY_MS } from '../constants';
import { notifyBroadcastMessageSent, notifyBroadcastMessageAccepted } from '../utils';
import { auditService } from './audit.service';

export interface CreateBroadcastMessageData {
  clientId: string;
  content: string;
  type?: MessageType;
  metadata?: Prisma.InputJsonValue;
}

export interface AcceptBroadcastMessageData {
  messageId: string;
  astrologerId: string;
}

/**
 * Create a new broadcast message from client to all astrologers
 */
export async function createBroadcastMessage(data: CreateBroadcastMessageData) {
  // Graceful handling if table doesn't exist yet
  if (!(prisma as any).broadcastMessage) {
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
  const pendingBroadcast = await prisma.instantChatRequest.findFirst({
    where: {
      clientId: data.clientId,
      status: 'PENDING',
      expiresAt: {
        gt: new Date(), // Not expired yet
      },
    },
  });

  if (pendingBroadcast) {
    const timeLeft = Math.ceil((pendingBroadcast.expiresAt.getTime() - Date.now()) / 1000);
    throw new Error(
      `You already have a pending broadcast message. Please wait ${timeLeft} seconds for it to be accepted or expire before sending another one.`
    );
  }

  // Check if there are any online astrologers available
  const onlineAstrologers = await prisma.astrologer.count({
    where: {
      isActive: true,
      isOnline: true,
    },
  });

  if (onlineAstrologers === 0) {
    throw new Error('No astrologers are available at the moment. Please try again later.');
  }

  const message = await prisma.broadcastMessage.create({
    data: {
      clientId: data.clientId,
      content: data.content,
      type: data.type || 'TEXT',
      metadata: data.metadata,
      status: 'PENDING',
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

/**
 * Expire old broadcast messages
 * Automatically expires messages older than BROADCAST_MESSAGE_EXPIRY_MS
 */
export async function expireOldMessages() {
  // Graceful handling if table doesn't exist yet
  if (!(prisma as any).broadcastMessage) {
    return { count: 0 };
  }

  try {
    const expiryTime = new Date(Date.now() - BROADCAST_MESSAGE_EXPIRY_MS);

    const result = await prisma.broadcastMessage.updateMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: expiryTime,
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    return result;
  } catch (error: any) {
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      return { count: 0 };
    }
    throw error;
  }
}

/**
 * Get all pending broadcast messages (for astrologers)
 * Automatically expires old messages before returning
 */
export async function getPendingBroadcastMessages() {
  // Graceful handling if table doesn't exist yet
  if (!(prisma as any).broadcastMessage) {
    return [];
  }

  // First, expire old messages
  await expireOldMessages();

  const messages = await prisma.broadcastMessage.findMany({
    where: {
      status: 'PENDING',
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
 */
export async function getAllBroadcastMessages() {
  // Graceful handling if table doesn't exist yet
  if (!(prisma as any).broadcastMessage) {
    return [];
  }

  const messages = await prisma.broadcastMessage.findMany({
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
  if (!(prisma as any).broadcastMessage) {
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

  if (message.status !== 'PENDING') {
    throw new Error('This message has already been accepted or expired');
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
    // Create new chat (client=participant1, astrologer=participant2)
    chat = await prisma.chat.create({
      data: {
        participant1Id: message.clientId,
        participant2Id: astrologerId,
        participant1Type: 'CLIENT',
        participant2Type: 'ASTROLOGER',
        status: 'ACTIVE',
        isLocked: false,
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
      status: 'ACCEPTED',
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
  // 1. User's original broadcast message
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
      },
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
      status: 'PENDING',
      createdAt: {
        lt: expiryTime,
      },
    },
    data: {
      status: 'EXPIRED',
    },
  });

  return result;
}
