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

  // Check if client already has an active chat
  const activeChat = await prisma.chat.findFirst({
    where: {
      status: 'ACTIVE',
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
    throw new Error(
      `You already have an active chat with ${activeChat.astrologerParticipant.name || activeChat.astrologerParticipant.phone}. Please end that chat before starting a new one.`
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

  // Check if astrologer already has an active chat
  const activeChat = await prisma.chat.findFirst({
    where: {
      status: 'ACTIVE',
      participant2Id: astrologerId, // Astrologer is always participant2
    },
  });

  if (activeChat) {
    throw new Error(
      'You already have an active chat. End your current chat before accepting new requests.'
    );
  }

  // Check if client already has an active chat
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

  // Check if client has active chat
  const clientActiveChat = await prisma.chat.findFirst({
    where: {
      status: 'ACTIVE',
      participant1Id: message.clientId, // Client is always participant1
    },
  });

  if (clientActiveChat) {
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

  // If chat exists and is locked, unlock it
  if (chat && chat.isLocked) {
    chat = await prisma.chat.update({
      where: { id: chat.id },
      data: {
        isLocked: false,
        status: 'ACTIVE',
        endedBy: null,
        endedAt: null,
      },
    });
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

  // Notify admin
  notifyBroadcastMessageAccepted(messageId, message.clientId, astrologerId, chat.id);

  return {
    message: updatedMessage,
    chat,
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
