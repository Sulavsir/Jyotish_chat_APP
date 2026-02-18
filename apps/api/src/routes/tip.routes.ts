import { Router } from 'express';
import { asyncHandler } from '../utils';
import { tipController } from '../controllers';
import { validateQuery } from '../middleware/validate';
import { getTodayTipsQuerySchema } from '../validators/tip.validators';

const router = Router();

// Public: get today's tips
router.get(
  '/today',
  validateQuery(getTodayTipsQuerySchema),
  asyncHandler(tipController.getTodayTips)
);

export default router;

