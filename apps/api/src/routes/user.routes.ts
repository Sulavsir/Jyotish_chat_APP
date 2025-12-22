import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { userController } from '../controllers';

const router = Router();

// Get current user profile
router.get('/me', authenticate, userController.getCurrentUser);

// Update user profile
router.patch('/me', authenticate, userController.updateProfile);

// Update birth details
router.patch('/me/birth-details', authenticate, userController.updateBirthDetails);

export default router;

