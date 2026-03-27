import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { ensureActiveUser } from '../middleware/ensureActiveUser';
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
import { deleteMyAccountBodySchema } from '../validators/userAccount.validators';
import { uuidParamSchema } from '../validators/query.validators';
import { uploadProfilePhoto } from '../middleware/upload';

const router = Router();

router.use(authenticate);
router.use(ensureActiveUser);

// Get current user profile
router.get('/me', asyncHandler(userController.getCurrentUser));

// Client dashboard stats (balance, rates, tip, horoscope, rotating copy, pending broadcast)
router.get(
  '/dashboard/stats',
  validateQuery(getDashboardStatsQuerySchema),
  asyncHandler(clientDashboardController.getDashboardStats)
);

// Complete profile setup (for new users after account creation)
router.post(
  '/profile-setup',
  validateBody(profileSetupSchema),
  asyncHandler(authController.profileSetup)
);

// Update user profile
router.patch('/me', asyncHandler(userController.updateProfile));

// Update birth details
router.patch('/me/birth-details', asyncHandler(userController.updateBirthDetails));

// Soft-delete own account (client only)
router.post(
  '/me/delete-account',
  validateBody(deleteMyAccountBodySchema),
  asyncHandler(userController.deleteMyAccount)
);

// Upload profile photo
router.post('/upload-photo', uploadProfilePhoto(), asyncHandler(userController.uploadPhoto));

// Remove profile photo
router.delete('/remove-photo', asyncHandler(userController.removePhoto));

// Get chatable users (astrologers for clients, clients for astrologers)
router.get('/chatable', asyncHandler(userController.getChatableUsers));

// Client profiles (family/friends) for asking questions on behalf of someone (must be before /:id)
router.get('/profiles', asyncHandler(clientProfileController.list));
router.post(
  '/profiles',
  validateBody(createClientProfileSchema),
  asyncHandler(clientProfileController.create)
);
router.patch(
  '/profiles/:id',
  validateParams(uuidParamSchema),
  validateBody(updateClientProfileSchema),
  asyncHandler(clientProfileController.update)
);
router.delete(
  '/profiles/:id',
  validateParams(uuidParamSchema),
  asyncHandler(clientProfileController.remove)
);

// Get client details by ID (for astrologers to view client profile)
router.get('/:id/details', asyncHandler(userController.getClientDetails));

export default router;
