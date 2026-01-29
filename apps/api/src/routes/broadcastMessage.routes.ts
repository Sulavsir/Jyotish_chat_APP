/**
 * Broadcast Message Routes
 * Routes for "Everyone Jyotish" broadcast messaging system
 */

import express from 'express';
import { authenticate } from '@/middleware/auth';
import { asyncHandler } from '@/utils';
import { validateParams } from '../middleware/validate';
import { messageIdParamSchema } from '../validators/broadcastMessage.validators';
import * as broadcastMessageController from '../controllers/broadcastMessageController';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create new broadcast message (client only)
router.post('/', asyncHandler(broadcastMessageController.createBroadcastMessage));

// Get pending broadcast messages (astrologer only)
router.get('/pending', asyncHandler(broadcastMessageController.getPendingMessages));

// Get all broadcast messages including accepted (astrologer only)
router.get('/all', asyncHandler(broadcastMessageController.getAllMessages));

// Get my broadcast messages (client only)
router.get('/my-messages', asyncHandler(broadcastMessageController.getMyMessages));

// Accept a broadcast message (astrologer only)
router.post(
  '/:messageId/accept',
  validateParams(messageIdParamSchema),
  asyncHandler(broadcastMessageController.acceptMessage)
);

// Cancel a pending broadcast message (client only)
router.post(
  '/:messageId/cancel',
  validateParams(messageIdParamSchema),
  asyncHandler(broadcastMessageController.cancelBroadcastMessage)
);

// Dismiss/Reject a broadcast message (astrologer only)
router.post(
  '/:messageId/dismiss',
  validateParams(messageIdParamSchema),
  asyncHandler(broadcastMessageController.dismissBroadcastMessage)
);

// Get specific broadcast message
router.get(
  '/:messageId',
  validateParams(messageIdParamSchema),
  asyncHandler(broadcastMessageController.getBroadcastMessage)
);

export default router;
