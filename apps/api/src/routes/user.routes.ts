import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { asyncHandler } from '../utils';
import { userController } from '../controllers';
import { authController } from '../controllers';
import { profileSetupSchema } from '../validators';
import { uploadSingle } from '../middleware/upload';

const router = Router();

// Get current user profile
router.get('/me', authenticate, asyncHandler(userController.getCurrentUser));

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
  uploadSingle('photo'),
  asyncHandler(userController.uploadPhoto)
);

// Remove profile photo
router.delete('/remove-photo', authenticate, asyncHandler(userController.removePhoto));

// Get chatable users (astrologers for clients, clients for astrologers)
router.get('/chatable', authenticate, asyncHandler(userController.getChatableUsers));

export default router;
