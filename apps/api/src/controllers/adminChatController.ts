/**
 * Admin Chat Controller
 */

import { Response } from 'express';
import { adminChatService } from '../services/adminChat.service';
import { sendSuccess, sendError } from '../utils';
import { HTTP_STATUS } from '../constants';
import { UserRole } from '@jyotish/shared';
import { AuthRequest } from '../types';
import { getSocketInstance } from '../utils/socket-instance';
import type { ListAdminSupportChatsQuery } from '../validators/adminChat.validators';

// AdminChatSenderType enum - will be available from @prisma/client after migration
const AdminChatSenderType = {
  USER: 'USER' as const,
  ADMIN: 'ADMIN' as const,
};

/**
 * Create a new admin chat
 */
export const createChat = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const chat = await adminChatService.createChat(userId, userRole, req.body);
    return sendSuccess(res, { chat }, HTTP_STATUS.CREATED);
  } catch (error) {
    return sendError(res, (error as Error).message, HTTP_STATUS.BAD_REQUEST);
  }
};

/**
 * Get user's admin chats
 */
export const getUserChats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const chats = await adminChatService.getUserChats(userId, userRole);
    return sendSuccess(res, { chats }, HTTP_STATUS.OK);
  } catch (error) {
    return sendError(res, (error as Error).message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Get all admin chats (admin only)
 */
export const getAllChats = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== UserRole.ADMIN) {
      return sendError(res, 'Forbidden', HTTP_STATUS.FORBIDDEN);
    }

    const { page, limit, status, search } = req.query as unknown as ListAdminSupportChatsQuery;

    const result = await adminChatService.getAllChats({
      page,
      limit,
      status,
      search,
    });

    return sendSuccess(res, result, HTTP_STATUS.OK);
  } catch (error) {
    return sendError(res, (error as Error).message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Get unread admin chat count (admin only)
 */
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== UserRole.ADMIN) {
      return sendError(res, 'Forbidden', HTTP_STATUS.FORBIDDEN);
    }

    const count = await adminChatService.getUnreadCount();
    return sendSuccess(res, { count }, HTTP_STATUS.OK);
  } catch (error) {
    return sendError(res, (error as Error).message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Upload file for admin chat (support widget)
 * POST /api/v1/admin-chat/upload-file
 */
export const uploadAdminChatFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, 'No file uploaded', HTTP_STATUS.BAD_REQUEST);
    }

    // Determine file type category
    let fileType: 'IMAGE' | 'FILE' | 'AUDIO' = 'FILE';
    if (req.file.mimetype.startsWith('image/')) {
      fileType = 'IMAGE';
    } else if (req.file.mimetype.startsWith('audio/')) {
      fileType = 'AUDIO';
    }

    // Construct file URL (reuse chat uploads folders)
    const fileUrl = `/uploads/chat/${fileType === 'IMAGE' ? 'images' : 'files'}/${req.file.filename}`;

    return sendSuccess(
      res,
      {
        file: {
          url: fileUrl,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          type: fileType,
        },
      },
      HTTP_STATUS.OK
    );
  } catch (error) {
    return sendError(res, (error as Error).message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Get chat by ID
 */
export const getChatById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let chat;
    if (userRole === UserRole.ADMIN) {
      chat = await adminChatService.getChatById(id);
    } else {
      chat = await adminChatService.getChatById(id, userId);
    }

    return sendSuccess(res, { chat }, HTTP_STATUS.OK);
  } catch (error) {
    return sendError(res, (error as Error).message, HTTP_STATUS.NOT_FOUND);
  }
};

/**
 * Get chat messages
 */
export const getChatMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await adminChatService.getChatMessages(id, { page, limit });
    return sendSuccess(res, result, HTTP_STATUS.OK);
  } catch (error) {
    return sendError(res, (error as Error).message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Send message in admin chat
 */
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const senderType =
      userRole === UserRole.ADMIN ? AdminChatSenderType.ADMIN : AdminChatSenderType.USER;

    const message = await adminChatService.sendMessage(
      id,
      userId,
      senderType,
      { chatId: id, ...req.body }
    );

    // Broadcast for real-time delivery even when message was sent via REST (fallback path)
    try {
      const io = getSocketInstance();
      const chat = await adminChatService.getChatById(id);
      io.to(`admin-chat:${id}`).emit('admin-chat:message', { message, chat });
      if (senderType === AdminChatSenderType.USER) {
        io.to('admin:room').emit('admin-chat:new-message', { chatId: id, message, chat });
      }
    } catch {
      // If socket isn't initialized, still return the REST response successfully.
    }

    return sendSuccess(res, { message }, HTTP_STATUS.CREATED);
  } catch (error) {
    return sendError(res, (error as Error).message, HTTP_STATUS.BAD_REQUEST);
  }
};

/**
 * Mark messages as read
 */
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    if (userRole === UserRole.ADMIN) {
      await adminChatService.markAsRead(id, undefined, userId);
    } else {
      await adminChatService.markAsRead(id, userId);
    }

    return sendSuccess(res, { message: 'Messages marked as read' }, HTTP_STATUS.OK);
  } catch (error) {
    return sendError(res, (error as Error).message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Update chat status
 */
export const updateChatStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;

    if (req.user?.role !== UserRole.ADMIN) {
      return sendError(res, 'Forbidden', HTTP_STATUS.FORBIDDEN);
    }

    const chat = await adminChatService.updateChatStatus(id, req.body.status, adminId);

    // Broadcast chat updates so clients/admin UIs stay in sync in real-time
    try {
      const io = getSocketInstance();
      io.to(`admin-chat:${id}`).emit('admin-chat:message', { message: null, chat });
      io.to('admin:room').emit('admin-chat:new-message', { chatId: id, message: null, chat });
    } catch {
      // noop
    }

    return sendSuccess(res, { chat }, HTTP_STATUS.OK);
  } catch (error) {
    return sendError(res, (error as Error).message, HTTP_STATUS.BAD_REQUEST);
  }
};

/**
 * Assign admin to chat
 */
export const assignAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (req.user?.role !== UserRole.ADMIN) {
      return sendError(res, 'Forbidden', HTTP_STATUS.FORBIDDEN);
    }

    const chat = await adminChatService.assignAdmin(id, req.body.adminId);
    return sendSuccess(res, { chat }, HTTP_STATUS.OK);
  } catch (error) {
    return sendError(res, (error as Error).message, HTTP_STATUS.BAD_REQUEST);
  }
};

export default {
  createChat,
  getUserChats,
  getAllChats,
  getUnreadCount,
  uploadAdminChatFile,
  getChatById,
  getChatMessages,
  sendMessage,
  markAsRead,
  updateChatStatus,
  assignAdmin,
};
