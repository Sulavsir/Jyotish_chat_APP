/**
 * Broadcast Message Service
 * Handles "Everyone Jyotish" broadcast messaging system
 */

import { prisma } from '@jyotish/database';
import { Prisma, MessageType } from '@prisma/client';
import { BROADCAST_MESSAGE_EXPIRY_MS } from '../constants';

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
      OR: [
        { participant1Id: data.clientId },
        { participant2Id: data.clientId },
      ],
    },
    include: {
      participant1: {
        select: {
          id: true,
          name: true,
          phone: true,
          role: true,
        },
      },
      participant2: {
        select: {
          id: true,
          name: true,
          phone: true,
          role: true,
        },
      },
    },
  });

  if (activeChat) {
    const otherParticipant = activeChat.participant1.id === data.clientId 
      ? activeChat.participant2 
      : activeChat.participant1;
    
    throw new Error(
      `You already have an active chat with ${otherParticipant.name || otherParticipant.phone}. Please end that chat before starting a new one.`
    );
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
      OR: [{ participant1Id: astrologerId }, { participant2Id: astrologerId }],
    },
  });

  if (activeChat) {
    throw new Error('You already have an active chat. End your current chat before accepting new requests.');
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
      OR: [{ participant1Id: message.clientId }, { participant2Id: message.clientId }],
    },
  });

  if (clientActiveChat) {
    throw new Error('This client is already in an active chat with another astrologer');
  }

  // Create or get existing chat between client and astrologer
  let chat = await prisma.chat.findFirst({
    where: {
      OR: [
        {
          participant1Id: message.clientId,
          participant2Id: astrologerId,
        },
        {
          participant1Id: astrologerId,
          participant2Id: message.clientId,
        },
      ],
    },
  });

  if (!chat) {
    // Create new chat
    chat = await prisma.chat.create({
      data: {
        participant1Id: message.clientId,
        participant2Id: astrologerId,
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
