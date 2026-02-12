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
import { PurchaseMethod } from '../types/pricing.types';

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
 * Get platform coin rates (for client display: chat, broadcast, appointment)
 * GET /api/v1/coins/rates
 */
export const getCoinRates = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { getRatesForClient } = await import('../services/platformCoinRate.service');
    const rates = await getRatesForClient();
    return sendSuccess(res, { rates });
  } catch (error) {
    next(error);
  }
};

/**
 * Add coins to user balance (for payment processing)
 * POST /api/v1/coins/add
 * Body is validated by addCoinsSchema middleware
 * Also handles unlimited plan activation if planId is provided
 */
export const addCoins = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { amount, paymentId, planId } = req.body;

    // If planId is provided, activate the plan (handles both unlimited plans and coin packs)
    if (planId) {
      const { pricingService } = await import('../services/pricing.service');
      const plan = await pricingService.getPlanById(planId);

      // Determine purchase method: if amount is 0 or not provided, it's a coin purchase
      const purchasedWith = !amount || amount === 0 ? PurchaseMethod.COINS : PurchaseMethod.MONEY;

      // Activate the plan
      await pricingService.activatePlanForUser(userId, planId, purchasedWith);

      if (plan.isUnlimited) {
        // For unlimited plans, return success
        return sendSuccess(
          res,
          {
            userId,
            balance: await coinService.getCoinBalance(userId),
            planActivated: true,
            isUnlimited: true,
          },
          HTTP_STATUS.OK
        );
      }
      // For coin packs, coins are already added by activatePlanForUser (if purchased with money), just return balance
      return sendSuccess(
        res,
        {
          userId,
          balance: await coinService.getCoinBalance(userId),
          planActivated: true,
          isUnlimited: false,
        },
        HTTP_STATUS.OK
      );
    }

    // Legacy: Direct coin addition (no plan) - amount is required
    if (!amount) {
      return sendError(
        res,
        'Amount is required when planId is not provided',
        HTTP_STATUS.BAD_REQUEST
      );
    }

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
