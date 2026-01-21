/**
 * Jyotish Booking Routes (Client)
 */

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { asyncHandler } from '../utils';
import { UserRole } from '@jyotish/shared';
import { createJyotishBookingRequestSchema, listMyJyotishBookingsQuerySchema } from '../validators';
import * as jyotishBookingController from '../controllers/jyotishBookingController';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize(UserRole.CLIENT),
  validateBody(createJyotishBookingRequestSchema),
  asyncHandler(jyotishBookingController.create)
);

router.get(
  '/my',
  authenticate,
  authorize(UserRole.CLIENT),
  validateQuery(listMyJyotishBookingsQuerySchema),
  asyncHandler(jyotishBookingController.listMine)
);

export default router;

