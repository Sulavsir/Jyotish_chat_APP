/**
 * Chat Controller
 * Handles real-time chat functionality
 * Errors are handled by global error handler
 */

import { Response, NextFunction } from 'express';
import { UserRole } from '@jyotish/shared';
import { AuthRequest } from '@/types/common.types';
import { sendSuccess, sendError } from '../utils';
import * as chatService from '../services/chatService';
import { getSocketInstance } from '../utils/socket-instance';
import type { PostChatChatsBody } from '../validators/chat.validators';
import { resolvedOtherUserIdFromPostChatBody } from '../validators/chat.validators';

const POST_CHAT_CHATS_LOG = '[POST /chat/chats]';

/**
 * Get all conversations/chats for the authenticated user
 */
export const getConversations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const chats = await chatService.getUserChats(userId);

    // Return chats directly without nested data
    return sendSuccess(res, chats);
  } catch (error) {
    next(error);
  }
};

/**
 * Open or create a direct chat (client ↔ astrologer). Returns a non-null `chat` when successful.
 * Body is validated by route: `otherUserId` / `participantId` / `astrologerId` (same UUID); optional `consultationId`.
 */
export const getOrCreateChat = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const validated = req.body as PostChatChatsBody;

  try {
    const otherUserId = resolvedOtherUserIdFromPostChatBody(validated);
    const consultationId = validated.consultationId;

    console.info(POST_CHAT_CHATS_LOG, 'request', {
      userId,
      role: userRole,
      otherUserId,
      consultationId: consultationId ?? null,
      bodyKeys: Object.keys((req.body as object) ?? {}),
    });

    const { chat, created } = await chatService.findOrCreateChat({
      participant1Id: userId,
      participant2Id: otherUserId,
      consultationId,
      currentUserRole: userRole,
    });

    if (!chat?.id) {
      console.error(POST_CHAT_CHATS_LOG, 'BUG: missing chat id after findOrCreateChat', {
        userId,
        otherUserId,
        created,
      });
      return sendError(res, 'Could not open or create chat', 500, 'SERVER_ERROR');
    }

    console.info(POST_CHAT_CHATS_LOG, 'result', {
      chatId: chat.id,
      created,
      status: chat.status,
      isLocked: chat.isLocked,
    });

    if (!created && chat.status === 'ACTIVE' && !chat.isLocked) {
      try {
        const io = getSocketInstance();
        if (io) {
          const payload = {
            chatId: chat.id,
            status: chat.status,
            isLocked: chat.isLocked,
            chat: chat,
          };
          io.to(`user:${chat.participant1Id}`).emit('chat:reopened', payload);
          io.to(`user:${chat.participant2Id}`).emit('chat:reopened', payload);
          io.to('admin').emit('chat:reopened', payload);
        }
      } catch (socketError) {
        console.error('Error broadcasting chat reopen:', socketError);
      }
    }

    return sendSuccess(res, { chat, created }, created ? 201 : 200);
  } catch (error) {
    console.error(POST_CHAT_CHATS_LOG, 'error', {
      userId,
      role: userRole,
      message: (error as Error).message,
    });
    next(error);
  }
};

/**
 * Get chat by ID
 */
export const getChatById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { chatId } = req.params;

    const chat = await chatService.getChatById(chatId, userId);

    if (!chat) {
      return sendError(res, 'Chat not found', 404);
    }

    // Return chat directly without nested data
    return sendSuccess(res, chat);
  } catch (error) {
    next(error);
  }
};

/**
 * Get chat history between two users
 */
export const getChatHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { otherUserId } = req.params;
    const { limit, offset } = req.query;

    const result = await chatService.getChatHistory({
      userId,
      otherUserId,
      limit: limit ? parseInt(limit as string) : 30,
      offset: offset ? parseInt(offset as string) : 0,
      currentUserRole: userRole,
    });

    return sendSuccess(res, result.messages);
  } catch (error) {
    next(error);
  }
};

/**
 * Send a message (HTTP endpoint for fallback)
 */
export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { chatId, receiverId, content, type, metadata } = req.body;

    if (!chatId || !receiverId) {
      return sendError(res, 'Chat ID and receiver ID are required', 400);
    }
    if (typeof content !== 'string') {
      return sendError(res, 'Content must be a string', 400);
    }

    const result = await chatService.sendMessage({
      chatId,
      senderId: userId,
      receiverId,
      content,
      type,
      metadata,
      senderRole: userRole,
    });

    return sendSuccess(
      res,
      {
        message: 'Message sent successfully',
        data: result.message,
        coinsDeducted: result.coinsDeducted,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /chat/send-direct-question-bundle — tiered multi-question direct chat (same pricing as broadcast prepare)
 */
export const sendDirectQuestionBundle = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user!.role !== UserRole.CLIENT) {
      return sendError(res, 'Only clients can send direct question bundles', 403);
    }
    const { astrologerId, questionItems, totalNr, birthDetails, questionCategory, fromDashboard } =
      req.body as {
        astrologerId: string;
        questionItems: { id: string; text: string }[];
        totalNr: number;
        birthDetails?: Record<string, string>;
        questionCategory?: string;
        fromDashboard?: boolean;
      };

    const result = await chatService.sendDirectQuestionBundle({
      clientId: req.user!.id,
      astrologerId,
      questionItems,
      totalNr,
      birthDetails,
      questionCategory,
      fromDashboard: fromDashboard === true,
    });

    return sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Mark messages as read
 */
export const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { chatId } = req.params;
    const { messageIds } = req.body;

    await chatService.markMessagesAsRead(chatId, userId, messageIds);

    return sendSuccess(res, {
      message: 'Messages marked as read',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a message
 */
export const deleteMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { messageId } = req.params;

    await chatService.deleteMessage(messageId, userId);

    return sendSuccess(res, {
      message: 'Message deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread message count
 */
export const getUnreadCount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const count = await chatService.getUnreadCount(userId);

    return sendSuccess(res, { count });
  } catch (error) {
    next(error);
  }
};

/**
 * Search messages
 */
export const searchMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { q, limit } = req.query;

    if (!q) {
      return sendError(res, 'Search term is required', 400);
    }

    const messages = await chatService.searchMessages(
      userId,
      q as string,
      limit ? parseInt(limit as string) : 20
    );

    return sendSuccess(res, {
      message: 'Messages searched successfully',
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload file for chat
 */
export const uploadChatFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    if (!req.file) {
      return sendError(res, 'No file uploaded', 400);
    }

    // Determine file type category
    let fileType: 'IMAGE' | 'FILE' | 'AUDIO' = 'FILE';
    if (req.file.mimetype.startsWith('image/')) {
      fileType = 'IMAGE';
    } else if (req.file.mimetype.startsWith('audio/')) {
      fileType = 'AUDIO';
    }

    // Construct file URL
    const fileUrl = `/uploads/chat/${fileType === 'IMAGE' ? 'images' : 'files'}/${req.file.filename}`;

    // Return file info
    return sendSuccess(res, {
      file: {
        url: fileUrl,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        type: fileType,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * End an active chat
 */
export const endChat = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { chatId } = req.params;

    if (!chatId) {
      return sendError(res, 'Chat ID is required', 400);
    }

    const updatedChat = await chatService.endChat(chatId, userId);

    // Create notification for the OTHER participant (who did not end the chat)
    try {
      const { createChatEndedNotification } = await import('../services/chatNotification.service');
      await createChatEndedNotification(updatedChat);
    } catch (notifErr) {
      console.error('Error creating chat-ended notification:', notifErr);
    }

    // Emit real-time event to both participants
    try {
      const io = getSocketInstance();
      if (io) {
        io.to(`user:${updatedChat.participant1Id}`).emit('chat:ended', {
          chatId: updatedChat.id,
          status: updatedChat.status,
          isLocked: updatedChat.isLocked,
          endedBy: updatedChat.endedBy,
          endedAt: updatedChat.endedAt,
        });
        io.to(`user:${updatedChat.participant2Id}`).emit('chat:ended', {
          chatId: updatedChat.id,
          status: updatedChat.status,
          isLocked: updatedChat.isLocked,
          endedBy: updatedChat.endedBy,
          endedAt: updatedChat.endedAt,
        });
      }
    } catch (socketError) {
      console.error('Error broadcasting chat end:', socketError);
    }

    return sendSuccess(res, updatedChat);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (err.message === 'Chat not found') {
      return sendError(res, err.message, 404);
    }
    if (err.message === 'You are not a participant of this chat') {
      return sendError(res, err.message, 403);
    }
    next(error);
  }
};

/**
 * Get active chat for current user
 */
export const getActiveChat = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const activeChat = await chatService.getActiveChat(userId);

    return sendSuccess(res, activeChat);
  } catch (error) {
    next(error);
  }
};
