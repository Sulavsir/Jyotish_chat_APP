/**
 * Coin Service
 * Handles coin-related business logic
 */

import { prisma } from '@jyotish/database';
import { AppError } from '../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import {
  CoinTransactionType,
  CoinTransactionReason,
  CoinDeductionParams,
  CoinBalance,
  CoinTransaction,
} from '../types/coin.types';
import { getChatCoinCost, requiresCoinsForChat } from '../constants/coin.constants';

/**
 * Get user's coin balance
 */
export const getCoinBalance = async (userId: string): Promise<number> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { coins: true },
  });

  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  return user.coins;
};

/**
 * Deduct coins for chat
 */
export const deductCoinsForChat = async (params: CoinDeductionParams): Promise<CoinBalance> => {
  const { userId, astrologerCategory, chatId } = params;

  // Check if category requires coins
  if (!requiresCoinsForChat(astrologerCategory)) {
    throw new AppError(
      'This astrologer category does not require coins for chat',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const coinCost = getChatCoinCost(astrologerCategory);

  // Get current balance
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { coins: true, id: true },
  });

  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  // Check if user has enough coins
  if (user.coins < coinCost) {
    throw new AppError(
      `Insufficient coins. Required: ${coinCost}, Available: ${user.coins}`,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INSUFFICIENT_COINS
    );
  }

  const balanceBefore = user.coins;
  const balanceAfter = balanceBefore - coinCost;

  // Deduct coins and create transaction record
  const [updatedUser] = await Promise.all([
    prisma.user.update({
      where: { id: userId },
      data: {
        coins: {
          decrement: coinCost,
        },
      },
      select: {
        id: true,
        coins: true,
      },
    }),
    prisma.coinTransaction.create({
      data: {
        userId,
        amount: -coinCost, // Negative for deduction
        type: 'DEDUCT',
        reason: astrologerCategory === 'ORDINARY' ? 'CHAT_ORDINARY' : 'CHAT_PREMIUM',
        balanceBefore,
        balanceAfter,
        chatId,
      },
    }),
  ]);

  return {
    userId: updatedUser.id,
    balance: updatedUser.coins,
  };
};

/**
 * Add coins to user balance
 */
export const addCoins = async (
  userId: string,
  amount: number,
  reason: CoinTransactionReason = CoinTransactionReason.PURCHASE,
  adminId?: string,
  paymentId?: string
): Promise<CoinBalance> => {
  if (amount <= 0) {
    throw new AppError(
      'Amount must be greater than 0',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, coins: true },
  });

  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  const balanceBefore = user.coins;
  const balanceAfter = balanceBefore + amount;

  // Map reason to Prisma enum
  const prismaReason =
    reason === CoinTransactionReason.PURCHASE
      ? 'PURCHASE'
      : reason === CoinTransactionReason.REFUND
        ? 'REFUND'
        : reason === CoinTransactionReason.ADMIN_ADJUSTMENT
          ? 'ADMIN_ADJUSTMENT'
          : 'PAYMENT_SUCCESS';

  // Update balance and create transaction record
  const [updatedUser] = await Promise.all([
    prisma.user.update({
      where: { id: userId },
      data: {
        coins: {
          increment: amount,
        },
      },
      select: {
        id: true,
        coins: true,
      },
    }),
    prisma.coinTransaction.create({
      data: {
        userId,
        amount,
        type: 'ADD',
        reason: prismaReason,
        balanceBefore,
        balanceAfter,
        adminId,
        paymentId,
      },
    }),
  ]);

  return {
    userId: updatedUser.id,
    balance: updatedUser.coins,
  };
};

/**
 * Refund coins
 */
export const refundCoins = async (
  userId: string,
  amount: number,
  chatId?: string
): Promise<CoinBalance> => {
  if (amount <= 0) {
    throw new AppError(
      'Amount must be greater than 0',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  return addCoins(userId, amount, CoinTransactionReason.REFUND, undefined, undefined);
};

/**
 * Get coin transaction history for a user
 */
export const getTransactionHistory = async (
  userId: string,
  limit = 50,
  offset = 0
): Promise<{ transactions: CoinTransaction[]; total: number }> => {
  const [transactions, total] = await Promise.all([
    prisma.coinTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.coinTransaction.count({ where: { userId } }),
  ]);

  return {
    transactions: transactions.map(
      (t): CoinTransaction => ({
        id: t.id,
        userId: t.userId,
        amount: t.amount,
        type: t.type as CoinTransactionType,
        reason: t.reason as CoinTransactionReason,
        balanceBefore: t.balanceBefore,
        balanceAfter: t.balanceAfter,
        chatId: t.chatId || undefined,
        paymentId: t.paymentId || undefined,
        adminId: t.adminId || undefined,
        createdAt: t.createdAt,
      })
    ),
    total,
  };
};
