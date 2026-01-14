/**
 * Coin Controller
 * Handles coin-related HTTP requests
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils';
import * as coinService from '../services/coin.service';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { CoinTransactionReason } from '../types/coin.types';

/**
 * Get user's coin balance
 * GET /api/v1/coins/balance
 */
export const getCoinBalance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const balance = await coinService.getCoinBalance(userId);

    return sendSuccess(res, { balance });
  } catch (error) {
    next(error);
  }
};

/**
 * Add coins to user balance (for payment processing)
 * POST /api/v1/coins/add
 * Body is validated by addCoinsSchema middleware
 */
export const addCoins = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { amount, paymentId } = req.body;

    const result = await coinService.addCoins(
      userId,
      amount,
      CoinTransactionReason.PAYMENT_SUCCESS,
      undefined,
      paymentId
    );

    return sendSuccess(res, result, HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

/**
 * Get coin transaction history
 * GET /api/v1/coins/transactions
 * Query params are validated by transactionHistoryQuerySchema middleware
 */
export const getTransactionHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { limit, offset } = req.query as unknown as { limit: number; offset: number };

    const result = await coinService.getTransactionHistory(userId, limit, offset);

    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
