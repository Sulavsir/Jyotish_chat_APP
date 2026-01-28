/**
 * Astrologer Routes - Authentication and profile management
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody } from '@/middleware/validate';
import { changePasswordSchema } from '@jyotish/shared';
import { asyncHandler } from '../utils';
import * as astrologerController from '../controllers/astrologerController';
import { astrologerRegistrationUpload } from '../middleware/astrologerRegistrationUpload';

const router = Router();

// ==================== Astrologer Authentication ====================
// Public routes (no authentication required)
router.post('/auth/login', asyncHandler(astrologerController.astrologerLogin));
// Registration route - validation handled in controller after FormData parsing
router.post(
  '/register',
  astrologerRegistrationUpload.array('proofOfAstrology', 10), // Allow up to 10 files
  asyncHandler(astrologerController.registerAstrologer)
);

// Protected routes (authentication required)
router.use(authenticate); // All routes below require authentication

router.post('/auth/logout', asyncHandler(astrologerController.astrologerLogout));
router.get('/auth/me', asyncHandler(astrologerController.getAstrologerProfile));
router.post(
  '/auth/change-password',
  validateBody(changePasswordSchema),
  asyncHandler(astrologerController.changeAstrologerPassword)
);
router.post('/toggle-online', asyncHandler(astrologerController.toggleOnlineStatus));

// ==================== Astrologer List ====================
router.get('/list', asyncHandler(astrologerController.listAstrologers));

export default router;


