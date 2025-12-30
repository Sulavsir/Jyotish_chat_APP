/**
 * Instant Chat Request Routes
 */

import express from 'express';
import { authenticate } from '@/middleware/auth';
import { asyncHandler } from '@/utils';
import * as instantChatController from '../controllers/instantChatController';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create instant chat request (CLIENT only)
router.post('/request', asyncHandler(instantChatController.createRequest));

// Get pending requests (ASTROLOGER only)
router.get('/pending', asyncHandler(instantChatController.getPendingRequests));

// Accept request (ASTROLOGER only)
router.post('/accept/:requestId', asyncHandler(instantChatController.acceptRequest));

// Cancel request (CLIENT only)
router.delete('/cancel/:requestId', asyncHandler(instantChatController.cancelRequest));

// Get my active request (CLIENT only)
router.get('/my-request', asyncHandler(instantChatController.getMyActiveRequest));

// Check astrologer status (ASTROLOGER only)
router.get('/status', asyncHandler(instantChatController.checkAstrologerStatus));

export default router;

