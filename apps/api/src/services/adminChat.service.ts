/**
 * Admin Chat Service
 * Handles admin chat operations
 */

import { prisma } from '@jyotish/database';
import { AdminChatStatus, AdminChatSenderType, MessageType } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { UserRole } from '@jyotish/shared';
import type {
  CreateAdminChatRequest,
  SendAdminChatMessageRequest,
  AdminChatResponse,
  AdminChatMessageResponse,
  AdminChatListResponse,
  AdminChatMessagesResponse,
} from '../types/adminChat.types';

class AdminChatService {
  /**
   * Create a new admin chat
   */
  async createChat(
    initiatorId: string,
    initiatorRole: UserRole,
    data: CreateAdminChatRequest
  ): Promise<AdminChatResponse> {
    // Verify initiator exists
    if (initiatorRole === UserRole.ASTROLOGER) {
      const astrologer = await prisma.astrologer.findUnique({
        where: { id: initiatorId },
        select: { id: true },
      });
      if (!astrologer) {
        throw new AppError('Astrologer not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
      }
    } else {
      const user = await prisma.user.findUnique({
        where: { id: initiatorId },
        select: { id: true },
      });
      if (!user) {
        throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
      }
    }

    // Check if user has an active chat - if exists, return it instead of creating new
    // Admin chat has no restrictions - users can have multiple or reuse existing
    const existingChat = await prisma.adminChat.findFirst({
      where: {
        ...(initiatorRole === UserRole.ASTROLOGER
          ? ({ astrologerId: initiatorId } as any)
          : ({ userId: initiatorId } as any)),
        status: AdminChatStatus.ACTIVE,
      } as any,
      orderBy: {
        updatedAt: 'desc', // Get most recent active chat
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profilePhoto: true,
          },
        },
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // If active chat exists, return it instead of creating new one
    // This allows users to continue existing conversations
    if (existingChat) {
      return this.formatChatResponse(existingChat);
    }

    // Create new chat
    const chat = await prisma.adminChat.create({
      data: {
        ...(initiatorRole === UserRole.ASTROLOGER
          ? ({ astrologerId: initiatorId } as any)
          : ({ userId: initiatorId } as any)),
        status: AdminChatStatus.ACTIVE,
        lastMessageText: data.initialMessage,
        lastMessageAt: new Date(),
        userRead: true,
        adminRead: false,
      } as any,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profilePhoto: true,
          },
        },
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create initial message
    await prisma.adminChatMessage.create({
      data: {
        chatId: chat.id,
        senderId: initiatorId,
        senderType: AdminChatSenderType.USER,
        content: data.initialMessage,
        type: MessageType.TEXT,
        isRead: false,
      },
    });

    return this.formatChatResponse(chat);
  }

  /**
   * Get user's admin chats
   */
  async getUserChats(initiatorId: string, initiatorRole: UserRole): Promise<AdminChatResponse[]> {
    const chats = await prisma.adminChat.findMany({
      where: {
        ...(initiatorRole === UserRole.ASTROLOGER
          ? ({ astrologerId: initiatorId } as any)
          : ({ userId: initiatorId } as any)),
      } as any,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profilePhoto: true,
          },
        },
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    });

    return chats.map((chat) => this.formatChatResponse(chat));
  }

  /**
   * Get all admin chats (for admin dashboard)
   */
  async getAllChats(params: {
    page?: number;
    limit?: number;
    status?: AdminChatStatus;
    search?: string;
  }): Promise<AdminChatListResponse> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: {
      status?: AdminChatStatus;
      OR?: Array<{
        user?: {
          name?: { contains: string; mode: 'insensitive' };
          email?: { contains: string; mode: 'insensitive' };
          phone?: { contains: string; mode: 'insensitive' };
        };
      }>;
    } = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.search) {
      where.OR = [
        { user: { name: { contains: params.search, mode: 'insensitive' } } },
        { user: { email: { contains: params.search, mode: 'insensitive' } } },
        { user: { phone: { contains: params.search, mode: 'insensitive' } } },
        // Also search astrologer participants (support chats initiated by jyotish)
        ({ astrologer: { name: { contains: params.search, mode: 'insensitive' } } } as any),
        ({ astrologer: { email: { contains: params.search, mode: 'insensitive' } } } as any),
        ({ astrologer: { phone: { contains: params.search, mode: 'insensitive' } } } as any),
      ];
    }

    const [chats, total] = await Promise.all([
      prisma.adminChat.findMany({
        where: where as any,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              profilePhoto: true,
            },
          },
          // Cast until Prisma types are regenerated after migration
          astrologer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              profilePhoto: true,
            },
          } as any,
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        } as any,
        orderBy: {
          lastMessageAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.adminChat.count({ where }),
    ]);

    return {
      chats: chats.map((chat) => this.formatChatResponse(chat)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get unread admin chat count (for admin sidebar badge)
   *
   * Counts chats that have unread messages for admin.
   */
  async getUnreadCount(): Promise<number> {
    return prisma.adminChat.count({
      where: {
        adminRead: false,
        NOT: {
          status: AdminChatStatus.CLOSED,
        },
      },
    });
  }

  /**
   * Get chat by ID
   */
  async getChatById(chatId: string, userId?: string, adminId?: string): Promise<AdminChatResponse> {
    // Admins can view any chat; assignment (adminId) is optional.
    // For non-admin participants, allow either `userId` OR `astrologerId` ownership.
    const chat = await prisma.adminChat.findFirst({
      where: userId
        ? ({
            id: chatId,
            OR: [{ userId }, { astrologerId: userId }],
          } as any)
        : ({ id: chatId } as any),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profilePhoto: true,
          },
        },
        astrologer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profilePhoto: true,
          },
        } as any,
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      } as any,
    });

    if (!chat) {
      throw new AppError('Chat not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    return this.formatChatResponse(chat);
  }

  /**
   * Get chat messages
   */
  async getChatMessages(
    chatId: string,
    params: { page?: number; limit?: number }
  ): Promise<AdminChatMessagesResponse> {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.adminChatMessage.findMany({
        where: {
          chatId,
        },
        orderBy: {
          createdAt: 'asc',
        },
        skip,
        take: limit,
      }),
      prisma.adminChatMessage.count({
        where: {
          chatId,
        },
      }),
    ]);

    return {
      messages: messages.map((msg) => ({
        id: msg.id,
        chatId: msg.chatId,
        senderId: msg.senderId,
        senderType: msg.senderType,
        content: msg.content,
        type: msg.type,
        metadata: msg.metadata as Record<string, unknown> | null,
        isRead: msg.isRead,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Send a message in admin chat
   */
  async sendMessage(
    chatId: string,
    senderId: string,
    senderType: AdminChatSenderType,
    data: SendAdminChatMessageRequest
  ): Promise<AdminChatMessageResponse> {
    // Verify chat exists
    const chat = await prisma.adminChat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      throw new AppError('Chat not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    // Verify sender has access
    if (senderType === AdminChatSenderType.USER) {
      const isClientOwner = chat.userId === senderId;
      const isAstrologerOwner = (chat as any).astrologerId === senderId;
      if (!isClientOwner && !isAstrologerOwner) {
        throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN, ERROR_CODES.UNAUTHORIZED);
      }
    }

    // Admins can reply without being "assigned" (assignment is optional and may be handled separately)

    // Create message
    const message = await prisma.adminChatMessage.create({
      data: {
        chatId,
        senderId,
        senderType,
        content: data.content,
        type: data.type || MessageType.TEXT,
        metadata: (data.metadata as any) ?? undefined,
        isRead: senderType === AdminChatSenderType.USER, // User messages are unread for admin, admin messages are read for user
      },
    });

    // Update chat last message
    await prisma.adminChat.update({
      where: { id: chatId },
      data: {
        lastMessageAt: new Date(),
        lastMessageText: data.content,
        userRead: senderType === AdminChatSenderType.ADMIN ? false : true,
        adminRead: senderType === AdminChatSenderType.USER ? false : true,
      },
    });

    return {
      id: message.id,
      chatId: message.chatId,
      senderId: message.senderId,
      senderType: message.senderType,
      content: message.content,
      type: message.type,
      metadata: message.metadata as Record<string, unknown> | null,
      isRead: message.isRead,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }

  /**
   * Mark messages as read
   */
  async markAsRead(chatId: string, userId?: string, adminId?: string): Promise<void> {
    const chat = await prisma.adminChat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      throw new AppError('Chat not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    const updateData: { userRead?: boolean; adminRead?: boolean } = {};

    const isUserOwner =
      !!userId && (chat.userId === userId || (chat as any).astrologerId === userId);

    if (isUserOwner) {
      updateData.userRead = true;
      // Mark user messages as read
      await prisma.adminChatMessage.updateMany({
        where: {
          chatId,
          senderType: AdminChatSenderType.ADMIN,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
    }

    // Any admin can mark chat as read (do not require assignment)
    if (adminId) {
      updateData.adminRead = true;
      // Mark admin messages as read
      await prisma.adminChatMessage.updateMany({
        where: {
          chatId,
          senderType: AdminChatSenderType.USER,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.adminChat.update({
        where: { id: chatId },
        data: updateData,
      });
    }
  }

  /**
   * Update chat status
   */
  async updateChatStatus(
    chatId: string,
    status: AdminChatStatus,
    adminId?: string
  ): Promise<AdminChatResponse> {
    const chat = await prisma.adminChat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      throw new AppError('Chat not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    const updatedChat = await prisma.adminChat.update({
      where: { id: chatId },
      data: {
        status,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profilePhoto: true,
          },
        },
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return this.formatChatResponse(updatedChat);
  }

  /**
   * Assign admin to chat
   */
  async assignAdmin(chatId: string, adminId: string): Promise<AdminChatResponse> {
    const chat = await prisma.adminChat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      throw new AppError('Chat not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    // Verify admin exists (Admin model)
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { id: true, isActive: true },
    });

    if (!admin || !admin.isActive) {
      throw new AppError('Invalid admin', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    const updatedChat = await prisma.adminChat.update({
      where: { id: chatId },
      data: { adminId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profilePhoto: true,
          },
        },
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return this.formatChatResponse(updatedChat);
  }

  /**
   * Format chat response
   */
  private formatChatResponse(chat: {
    id: string;
    userId: string | null;
    adminId: string | null;
    status: AdminChatStatus;
    lastMessageAt: Date | null;
    lastMessageText: string | null;
    userRead: boolean;
    adminRead: boolean;
    createdAt: Date;
    updatedAt: Date;
    user?: {
      id: string;
      name: string | null;
      email: string | null;
      phone: string;
      profilePhoto: string | null;
    } | null;
    astrologer?: {
      id: string;
      name: string | null;
      email: string | null;
      phone: string;
      profilePhoto: string | null;
    } | null;
    admin?: {
      id: string;
      name: string | null;
      email: string | null;
    } | null;
  }): AdminChatResponse {
    const participantRole: 'CLIENT' | 'ASTROLOGER' =
      (chat as any).astrologerId ? 'ASTROLOGER' : 'CLIENT';
    return {
      id: chat.id,
      userId: chat.userId ?? null,
      astrologerId: (chat as any).astrologerId ?? null,
      adminId: chat.adminId,
      status: chat.status,
      lastMessageAt: chat.lastMessageAt,
      lastMessageText: chat.lastMessageText,
      userRead: chat.userRead,
      adminRead: chat.adminRead,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      user: chat.user || undefined,
      astrologer: (chat as any).astrologer || undefined,
      admin: chat.admin || undefined,
      participantRole,
    };
  }
}

export const adminChatService = new AdminChatService();
export default adminChatService;
