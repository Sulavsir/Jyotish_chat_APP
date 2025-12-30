/**
 * Astrologer Routes - Authentication and profile management
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils';
import * as astrologerController from '../controllers/astrologerController';

const router = Router();

// ==================== Astrologer Authentication ====================
// Public routes (no authentication required)
router.post('/auth/login', asyncHandler(astrologerController.astrologerLogin));

// Protected routes (authentication required)
router.use(authenticate); // All routes below require authentication

router.post('/auth/logout', asyncHandler(astrologerController.astrologerLogout));
router.get('/auth/me', asyncHandler(astrologerController.getAstrologerProfile));

export default router;


