import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validate';
import { asyncHandler } from '../utils';
import { userController, clientProfileController, clientDashboardController } from '../controllers';
import { authController } from '../controllers';
import { getDashboardStatsQuerySchema } from '../validators/astrologer.validators';
import {
  profileSetupSchema,
  createClientProfileSchema,
  updateClientProfileSchema,
} from '../validators';
import { uuidParamSchema } from '../validators/query.validators';
import { uploadProfilePhoto } from '../middleware/upload';

const router = Router();

// Get current user profile
router.get('/me', authenticate, asyncHandler(userController.getCurrentUser));

// Client dashboard stats (balance, rates, tip, horoscope, rotating copy, pending broadcast)
router.get(
  '/dashboard/stats',
  authenticate,
  validateQuery(getDashboardStatsQuerySchema),
  asyncHandler(clientDashboardController.getDashboardStats)
);

// Complete profile setup (for new users after account creation)
router.post(
  '/profile-setup',
  authenticate,
  validateBody(profileSetupSchema),
  asyncHandler(authController.profileSetup)
);

// Update user profile
router.patch('/me', authenticate, asyncHandler(userController.updateProfile));

// Update birth details
router.patch('/me/birth-details', authenticate, asyncHandler(userController.updateBirthDetails));

// Upload profile photo
router.post(
  '/upload-photo',
  authenticate,
  uploadProfilePhoto(),
  asyncHandler(userController.uploadPhoto)
);

// Remove profile photo
router.delete('/remove-photo', authenticate, asyncHandler(userController.removePhoto));

// Get chatable users (astrologers for clients, clients for astrologers)
router.get('/chatable', authenticate, asyncHandler(userController.getChatableUsers));

// Client profiles (family/friends) for asking questions on behalf of someone (must be before /:id)
router.get('/profiles', authenticate, asyncHandler(clientProfileController.list));
router.post(
  '/profiles',
  authenticate,
  validateBody(createClientProfileSchema),
  asyncHandler(clientProfileController.create)
);
router.patch(
  '/profiles/:id',
  authenticate,
  validateParams(uuidParamSchema),
  validateBody(updateClientProfileSchema),
  asyncHandler(clientProfileController.update)
);
router.delete(
  '/profiles/:id',
  authenticate,
  validateParams(uuidParamSchema),
  asyncHandler(clientProfileController.remove)
);

// Get client details by ID (for astrologers to view client profile)
router.get('/:id/details', authenticate, asyncHandler(userController.getClientDetails));

export default router;
