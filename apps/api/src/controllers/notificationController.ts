/**
 * Notification Controller - Handle notification requests
 * Controllers should be thin - only handle request validation, input handling, and responses
 * All business logic is delegated to services
 * Errors are handled by global error handler
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { notificationService } from '../services';
import { AppError } from '../middleware/error-handler';

/**
 * Get all notifications for a user
 * GET /api/v1/notifications
 */
export const getNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check authentication
  if (!req.user?.id) {
    throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }

  // Parse query parameters (already validated by middleware)
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  const unreadOnly = req.query.unreadOnly ? req.query.unreadOnly === 'true' : false;

  // Get notifications via service
  const result = await notificationService.getNotificationsByUserId(req.user.id, {
    limit,
    offset,
    unreadOnly,
  });

  return sendSuccess(res, {
    notifications: result.notifications,
    total: result.total,
    unreadCount: result.unreadCount,
    limit,
    offset,
    message: 'Notifications retrieved successfully',
  });
};

/**
 * Get unread notification count
 * GET /api/v1/notifications/unread-count
 */
export const getUnreadCount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check authentication
  if (!req.user?.id) {
    throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }

  // Get unread count via service
  const count = await notificationService.getUnreadCount(req.user.id);

  return sendSuccess(res, {
    unreadCount: count,
    message: 'Unread count retrieved successfully',
  });
};

/**
 * Mark notification as read
 * PATCH /api/v1/notifications/:id/read
 */
export const markNotificationAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Check authentication
  if (!req.user?.id) {
    throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }

  const { id } = req.params;

  // Mark as read via service
  const notification = await notificationService.markAsRead(id, req.user.id);

  return sendSuccess(res, {
    notification,
    message: 'Notification marked as read',
  });
};

/**
 * Mark all notifications as read
 * POST /api/v1/notifications/mark-all-read
 */
export const markAllNotificationsAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Check authentication
  if (!req.user?.id) {
    throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }

  // Mark all as read via service
  const count = await notificationService.markAllAsRead(req.user.id);

  return sendSuccess(res, {
    updatedCount: count,
    message: `${count} notification(s) marked as read`,
  });
};

/**
 * Delete a notification
 * DELETE /api/v1/notifications/:id
 */
export const deleteNotification = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check authentication
  if (!req.user?.id) {
    throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }

  const { id } = req.params;

  // Delete notification via service
  await notificationService.deleteNotification(id, req.user.id);

  return sendSuccess(res, {
    message: 'Notification deleted successfully',
  });
};

/**
 * Delete all notifications
 * DELETE /api/v1/notifications
 */
export const deleteAllNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Check authentication
  if (!req.user?.id) {
    throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }

  // Delete all notifications via service
  const count = await notificationService.deleteAllNotifications(req.user.id);

  return sendSuccess(res, {
    deletedCount: count,
    message: `${count} notification(s) deleted successfully`,
  });
};

/**
 * Delete read notifications
 * DELETE /api/v1/notifications/read
 */
export const deleteReadNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Check authentication
  if (!req.user?.id) {
    throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }

  // Delete read notifications via service
  const count = await notificationService.deleteReadNotifications(req.user.id);

  return sendSuccess(res, {
    deletedCount: count,
    message: `${count} read notification(s) deleted successfully`,
  });
};

/**
 * Create a notification (admin/system use)
 * POST /api/v1/notifications
 */
export const createNotification = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check authentication
  if (!req.user?.id) {
    throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }

  const { userId, title, message, type, metadata } = req.body;

  // Create notification via service
  const notification = await notificationService.createNotification({
    userId,
    title,
    message,
    type,
    metadata,
  });

  return sendSuccess(
    res,
    {
      notification,
      message: 'Notification created successfully',
    },
    HTTP_STATUS.CREATED
  );
};
