import { Router } from 'express';
import { asyncHandler } from '../utils';
import { subhaSahitController } from '../controllers';
import { validateQuery } from '../middleware/validate';
import { getAvailableDatesQuerySchema } from '../validators/subha-sahit.validators';

const router = Router();

// Public: get available dates for Pandit Ji booking
router.get(
  '/available',
  validateQuery(getAvailableDatesQuerySchema),
  asyncHandler(subhaSahitController.getAvailableDates)
);

// Public: get all unique occasions
router.get('/occasions', asyncHandler(subhaSahitController.getOccasions));

export default router;
