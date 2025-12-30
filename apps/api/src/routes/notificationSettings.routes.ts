/**
 * Notification Settings Routes
 */

import { Router } from 'express';
import * as notificationSettingsController from '@/controllers/notificationSettingsController';
import { authenticate } from '@/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/notification-settings
 * @desc    Get user's notification settings
 * @access  Private
 */
router.get('/', notificationSettingsController.getSettings);

/**
 * @route   PUT /api/v1/notification-settings
 * @desc    Update notification settings
 * @access  Private
 */
router.put('/', notificationSettingsController.updateSettings);

/**
 * @route   POST /api/v1/notification-settings/toggle
 * @desc    Toggle all notifications on/off
 * @access  Private
 */
router.post('/toggle', notificationSettingsController.toggleNotifications);

export default router;
