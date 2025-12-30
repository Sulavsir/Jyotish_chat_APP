import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateParams, validateQuery } from '../middleware/validate';
import { asyncHandler } from '../utils';
import { notificationController } from '../controllers';
import { getNotificationsQuerySchema, notificationIdParamSchema } from '../validators';

const router = Router();

// Get user's notifications
router.get(
  '/',
  authenticate,
  validateQuery(getNotificationsQuerySchema),
  asyncHandler(notificationController.getNotifications)
);

// Get unread count
router.get('/unread-count', authenticate, asyncHandler(notificationController.getUnreadCount));

// Mark notification as read
router.patch(
  '/:id/read',
  authenticate,
  validateParams(notificationIdParamSchema),
  asyncHandler(notificationController.markNotificationAsRead)
);

// Mark all notifications as read
router.post('/mark-all-read', authenticate, asyncHandler(notificationController.markAllNotificationsAsRead));

// Delete read notifications (must be before /:id to avoid route conflict)
router.delete('/read', authenticate, asyncHandler(notificationController.deleteReadNotifications));

// Delete all notifications
router.delete('/', authenticate, asyncHandler(notificationController.deleteAllNotifications));

// Delete notification (must be last among delete routes)
router.delete(
  '/:id',
  authenticate,
  validateParams(notificationIdParamSchema),
  asyncHandler(notificationController.deleteNotification)
);

export default router;

