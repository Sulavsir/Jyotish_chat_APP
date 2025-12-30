/**
 * Chat Controller
 * Handles real-time chat functionality
 * Errors are handled by global error handler
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types/common.types';
import { sendSuccess, sendError } from '../utils';
import * as chatService from '../services/chatService';

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
 * Get or create a chat with another user
 */
export const getOrCreateChat = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { otherUserId, consultationId } = req.body;

    if (!otherUserId) {
      return sendError(res, 'Other user ID is required', 400);
    }

    const chat = await chatService.findOrCreateChat({
      participant1Id: userId,
      participant2Id: otherUserId,
      consultationId,
    });

    return sendSuccess(res, chat);
  } catch (error) {
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
    const { otherUserId } = req.params;
    const { limit, offset } = req.query;

    const result = await chatService.getChatHistory({
      userId,
      otherUserId,
      limit: limit ? parseInt(limit as string) : 30,
      offset: offset ? parseInt(offset as string) : 0,
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
    const { chatId, receiverId, content, type, metadata } = req.body;

    if (!chatId || !receiverId || !content) {
      return sendError(res, 'Chat ID, receiver ID, and content are required', 400);
    }

    const message = await chatService.sendMessage({
      chatId,
      senderId: userId,
      receiverId,
      content,
      type,
      metadata,
    });

    return sendSuccess(
      res,
      {
        message: 'Message sent successfully',
        data: message,
      },
      201
    );
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

    return sendSuccess(res, {
      message: 'Unread count retrieved',
      data: { count },
    });
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

    return sendSuccess(res, updatedChat);
  } catch (error: any) {
    if (error.message === 'Chat not found') {
      return sendError(res, error.message, 404);
    }
    if (error.message === 'You are not a participant of this chat') {
      return sendError(res, error.message, 403);
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
