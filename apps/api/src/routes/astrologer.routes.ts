/**
 * Astrologer Routes - Authentication and profile management
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validate';
import { changePasswordSchema } from '@jyotish/shared';
import { getAstrologerEarningsQuerySchema } from '../validators/coin.validators';
import {
  astrologerSelfPatchSchema,
  getDashboardStatsQuerySchema,
} from '../validators/astrologer.validators';
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
import * as clientChatHistoryController from '../controllers/clientChatHistory.controller';
import { astrologerRegistrationUpload } from '../middleware/astrologerRegistrationUpload';
import { uploadProfilePhoto } from '../middleware/upload';
import {
  clientChatHistoryQuerySchema,
  clientHasChatHistoryParamSchema,
} from '../validators/clientChatHistory.validators';

const router = Router();

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
router.patch(
  '/auth/me',
  validateBody(astrologerSelfPatchSchema),
  asyncHandler(astrologerController.patchAstrologerMe)
);
router.post(
  '/auth/me/photo',
  uploadProfilePhoto(),
  asyncHandler(astrologerController.uploadAstrologerProfilePhoto)
);
router.delete('/auth/me/photo', asyncHandler(astrologerController.removeAstrologerProfilePhoto));
router.post(
  '/auth/change-password',
  validateBody(changePasswordSchema),
  asyncHandler(astrologerController.changeAstrologerPassword)
);
router.post('/toggle-online', asyncHandler(astrologerController.toggleOnlineStatus));

// ==================== Dashboard Stats ====================
router.get(
  '/dashboard/stats',
  validateQuery(getDashboardStatsQuerySchema),
  asyncHandler(astrologerController.getDashboardStats)
);

router.get(
  '/earnings',
  validateQuery(getAstrologerEarningsQuerySchema),
  asyncHandler(astrologerController.getMyEarnings)
);

router.get('/list', asyncHandler(astrologerController.listAstrologers));

router.get('/slots', validateQuery(listSlotsQuerySchema), asyncHandler(slotController.listMySlots));
router.post(
  '/slots/bulk',
  validateBody(createSlotsBulkSchema),
  asyncHandler(slotController.createSlotsBulk)
);
router.patch('/slots/:id', validateBody(updateSlotSchema), asyncHandler(slotController.updateSlot));
router.delete('/slots/:id', asyncHandler(slotController.deleteSlot));

router.get(
  '/client/chat-history',
  validateQuery(clientChatHistoryQuerySchema),
  asyncHandler(clientChatHistoryController.getClientChatHistory)
);
router.get(
  '/client/:clientId/has-chat-history',
  validateParams(clientHasChatHistoryParamSchema),
  asyncHandler(clientChatHistoryController.getClientHasChatHistory)
);

export default router;
