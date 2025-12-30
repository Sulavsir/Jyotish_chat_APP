import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { asyncHandler } from '../utils';
import { consultationController } from '../controllers';
import { createConsultationSchema, updateConsultationSchema } from '@jyotish/shared';

const router = Router();

// Create consultation
router.post('/', authenticate, validateBody(createConsultationSchema), asyncHandler(consultationController.bookConsultation));

// Get user's consultations
router.get('/my', authenticate, asyncHandler(consultationController.getConsultations));

// Get upcoming consultations
router.get('/upcoming', authenticate, asyncHandler(consultationController.getUpcomingConsultations));

// Get consultation history
router.get('/history', authenticate, asyncHandler(consultationController.getConsultationHistory));

// Get consultation by ID
router.get('/:id', authenticate, asyncHandler(consultationController.getConsultationById));

// Update consultation
router.patch('/:id', authenticate, validateBody(updateConsultationSchema), asyncHandler(consultationController.updateConsultation));

// Cancel consultation
router.post('/:id/cancel', authenticate, asyncHandler(consultationController.cancelConsultation));

// Rate consultation
router.post('/:id/rate', authenticate, asyncHandler(consultationController.rateConsultation));

export default router;

