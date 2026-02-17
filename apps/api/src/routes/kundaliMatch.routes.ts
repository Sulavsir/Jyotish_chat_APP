/**
 * Kundali Match Routes (Client)
 */

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { UserRole } from '@jyotish/shared';
import { asyncHandler } from '../utils';
import {
  createKundaliMatchRequestSchema,
  listMyKundaliMatchQuerySchema,
} from '../validators/kundaliMatch.validators';
import * as kundaliMatchController from '../controllers/kundaliMatch.controller';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize(UserRole.CLIENT),
  validateBody(createKundaliMatchRequestSchema),
  asyncHandler(kundaliMatchController.create)
);

router.get(
  '/my',
  authenticate,
  authorize(UserRole.CLIENT),
  validateQuery(listMyKundaliMatchQuerySchema),
  asyncHandler(kundaliMatchController.listMine)
);

export default router;
