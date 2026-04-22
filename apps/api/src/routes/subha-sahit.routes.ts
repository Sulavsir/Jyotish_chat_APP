import { Router } from 'express';
import { asyncHandler } from '../utils';
import { subhaSahitController } from '../controllers';
import { validateQuery } from '../middleware/validate';
import {
  getAvailableDatesQuerySchema,
  getSubhaSahitOccasionsQuerySchema,
} from '../validators/subha-sahit.validators';

const router = Router();

// Public: get available dates for Book Pujari Ji (Subha Sahit)
router.get(
  '/available',
  validateQuery(getAvailableDatesQuerySchema),
  asyncHandler(subhaSahitController.getAvailableDates)
);

// Public: occasions with optional puja items & estimated time
router.get(
  '/occasions',
  validateQuery(getSubhaSahitOccasionsQuerySchema),
  asyncHandler(subhaSahitController.getOccasions)
);

export default router;
