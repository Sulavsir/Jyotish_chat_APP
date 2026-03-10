/**
 * Astrologer Routes - Authentication and profile management
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { changePasswordSchema } from '@jyotish/shared';
import { getAstrologerEarningsQuerySchema } from '../validators/coin.validators';
import {
  createSlotsBulkSchema,
  listSlotsQuerySchema,
  updateSlotSchema,
} from '../validators/slot.validators';
import {
  forgotPasswordSchema,
  resetPasswordWithTokenSchema,
  resetPasswordWithOtpSchema,
  verifyPasswordResetOtpSchema,
} from '../validators/auth.validators';
import { asyncHandler } from '../utils';
import * as astrologerController from '../controllers/astrologerController';
import * as slotController from '../controllers/slotController';
import { astrologerRegistrationUpload } from '../middleware/astrologerRegistrationUpload';

const router = Router();

// ==================== Astrologer Authentication ====================
// Public routes (no authentication required)
router.post('/auth/login', asyncHandler(astrologerController.astrologerLogin));

router.post(
  '/auth/forgot-password',
  validateBody(forgotPasswordSchema),
  asyncHandler(astrologerController.requestAstrologerPasswordReset)
);
router.post(
  '/auth/reset-password-token',
  validateBody(resetPasswordWithTokenSchema),
  asyncHandler(astrologerController.resetAstrologerPasswordWithToken)
);
router.post(
  '/auth/reset-password-otp',
  validateBody(resetPasswordWithOtpSchema),
  asyncHandler(astrologerController.resetAstrologerPasswordWithOTP)
);
router.post(
  '/auth/verify-password-reset-otp',
  validateBody(verifyPasswordResetOtpSchema),
  asyncHandler(astrologerController.verifyAstrologerPasswordResetOtp)
);
// Registration route - validation handled in controller after FormData parsing
router.post(
  '/register',
  astrologerRegistrationUpload.fields([
    { name: 'proofOfAstrology', maxCount: 10 },
    { name: 'profilePhoto', maxCount: 1 },
  ]),
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

// ==================== My Earnings (coin earnings from client deductions) ====================
router.get(
  '/earnings',
  validateQuery(getAstrologerEarningsQuerySchema),
  asyncHandler(astrologerController.getMyEarnings)
);

// ==================== Astrologer List ====================
router.get('/list', asyncHandler(astrologerController.listAstrologers));

// ==================== My Slots (appointment / kundali review) ====================
router.get(
  '/slots',
  validateQuery(listSlotsQuerySchema),
  asyncHandler(slotController.listMySlots)
);
router.post(
  '/slots/bulk',
  validateBody(createSlotsBulkSchema),
  asyncHandler(slotController.createSlotsBulk)
);
router.patch(
  '/slots/:id',
  validateBody(updateSlotSchema),
  asyncHandler(slotController.updateSlot)
);
router.delete('/slots/:id', asyncHandler(slotController.deleteSlot));

export default router;


