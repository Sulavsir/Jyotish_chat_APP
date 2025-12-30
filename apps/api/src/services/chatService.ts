/**
 * Chat Service
 * Handles all chat-related business logic
 */

import { CreateChatParams, GetChatHistoryParams, SendMessageParams } from '@/types/chat.type';
import { prisma } from '@jyotish/database';

/**
 * Find or create a chat between two users
 */
export const findOrCreateChat = async (params: CreateChatParams) => {
  const { participant1Id, participant2Id, consultationId } = params;

  // Ensure consistent ordering of participant IDs
  const [smallerId, largerId] = [participant1Id, participant2Id].sort();

  let chat = await prisma.chat.findUnique({
    where: {
      participant1Id_participant2Id: {
        participant1Id: smallerId,
        participant2Id: largerId,
      },
    },
    include: {
      participant1: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profilePhoto: true,
          role: true,
        },
      },
      participant2: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profilePhoto: true,
          role: true,
        },
      },
    },
  });

  // Create if doesn't exist
  if (!chat) {
    chat = await prisma.chat.create({
      data: {
        participant1Id: smallerId,
        participant2Id: largerId,
        consultationId,
      },
      include: {
        participant1: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profilePhoto: true,
            role: true,
          },
        },
        participant2: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profilePhoto: true,
            role: true,
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
      participant1: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profilePhoto: true,
          role: true,
        },
      },
      participant2: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profilePhoto: true,
          role: true,
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
      participant1: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profilePhoto: true,
          role: true,
        },
      },
      participant2: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profilePhoto: true,
          role: true,
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
 * Get chat history between two users
 */
export const getChatHistory = async (params: GetChatHistoryParams) => {
  const { userId, otherUserId, limit = 50, offset = 0 } = params;

  // Find the chat
  const [smallerId, largerId] = [userId, otherUserId].sort();
  const chat = await prisma.chat.findUnique({
    where: {
      participant1Id_participant2Id: {
        participant1Id: smallerId,
        participant2Id: largerId,
      },
    },
  });

  if (!chat) {
    return { messages: [], total: 0, chat: null };
  }

  // Get messages
  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: {
        chatId: chat.id,
        isDeleted: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePhoto: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    }),
    prisma.message.count({
      where: {
        chatId: chat.id,
        isDeleted: false,
      },
    }),
  ]);

  return {
    messages: messages.reverse(), // Reverse to show oldest first
    total,
    chat,
  };
};

/**
 * Send a message
 */
export const sendMessage = async (params: SendMessageParams) => {
  const { chatId, senderId, receiverId, content, type = 'TEXT', metadata } = params;

  const message = await prisma.message.create({
    data: {
      chatId,
      senderId,
      receiverId,
      content,
      type,
      metadata,
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePhoto: true,
          role: true,
        },
      },
    },
  });

  // Update chat's last message info
  const [smallerId, largerId] = [senderId, receiverId].sort();
  await prisma.chat.update({
    where: { id: chatId },
    data: {
      lastMessageAt: new Date(),
      lastMessageText: content.substring(0, 100),
      participant1Read: senderId === smallerId,
      participant2Read: senderId === largerId,
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
      sender: {
        select: {
          id: true,
          name: true,
          profilePhoto: true,
        },
      },
      receiver: {
        select: {
          id: true,
          name: true,
          profilePhoto: true,
        },
      },
      chat: {
        include: {
          participant1: {
            select: {
              id: true,
              name: true,
            },
          },
          participant2: {
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

  // Update chat status
  const updatedChat = await prisma.chat.update({
    where: { id: chatId },
    data: {
      status: 'ENDED',
      endedBy: userId,
      endedAt: new Date(),
    },
  });

  return updatedChat;
};

/**
 * Get active chat for a user (for clients in broadcast chat context)
 */
export const getActiveChat = async (userId: string) => {
  const activeChat = await prisma.chat.findFirst({
    where: {
      status: 'ACTIVE',
      OR: [{ participant1Id: userId }, { participant2Id: userId }],
    },
    include: {
      participant1: {
        select: {
          id: true,
          name: true,
          phone: true,
          profilePhoto: true,
          role: true,
        },
      },
      participant2: {
        select: {
          id: true,
          name: true,
          phone: true,
          profilePhoto: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return activeChat;
};
