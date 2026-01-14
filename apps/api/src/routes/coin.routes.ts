/**
 * Coin Routes
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils';
import { validateBody, validate } from '../middleware/validate';
import { addCoinsSchema, transactionHistoryQuerySchema } from '../validators/coin.validators';
import * as coinController from '../controllers/coinController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get coin balance
router.get('/balance', asyncHandler(coinController.getCoinBalance));

// Add coins (for payment processing)
router.post('/add', validateBody(addCoinsSchema), asyncHandler(coinController.addCoins));

// Get transaction history
router.get(
  '/transactions',
  validate(transactionHistoryQuerySchema, 'query'),
  asyncHandler(coinController.getTransactionHistory)
);

export default router;
