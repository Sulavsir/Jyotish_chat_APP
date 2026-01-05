/**
 * Notification Settings Controller
 * Handles HTTP requests for notification settings
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types/common.types';
import * as notificationSettingsService from '@/services/notificationSettingsService';
import { sendSuccess } from '@/utils';

/**
 * Get user's notification settings
 * GET /api/v1/notification-settings
 */
export const getSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const settings = await notificationSettingsService.getNotificationSettings(userId, userRole);
    return sendSuccess(res, settings);
  } catch (error) {
    next(error);
  }
};

/**
 * Update notification settings
 * PUT /api/v1/notification-settings
 */
export const updateSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const {
      notificationsEnabled,
      chatNotifications,
      consultationNotifications,
      paymentNotifications,
      marketingNotifications,
      emailNotifications,
      pushNotifications,
      soundEnabled,
    } = req.body;

    const settings = await notificationSettingsService.updateNotificationSettings(userId, {
      notificationsEnabled,
      chatNotifications,
      consultationNotifications,
      paymentNotifications,
      marketingNotifications,
      emailNotifications,
      pushNotifications,
      soundEnabled,
    });

    return sendSuccess(res, settings);
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle all notifications
 * POST /api/v1/notification-settings/toggle
 */
export const toggleNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { enabled } = req.body;

    const settings = await notificationSettingsService.toggleNotifications(userId, enabled);

    return sendSuccess(res, settings);
  } catch (error) {
    next(error);
  }
};
