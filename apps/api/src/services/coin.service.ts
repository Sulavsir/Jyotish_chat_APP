/**
 * Coin Service
 * Handles coin-related business logic
 */

import { prisma } from '@jyotish/database';
import { AstrologerCategory } from '@jyotish/shared';
import { AppError } from '../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import {
  CoinTransactionType,
  CoinTransactionReason,
  CoinDeductionParams,
  CoinBalance,
  CoinTransaction,
} from '../types/coin.types';
import {
  getDirectChatCoinCost,
  requiresCoinsForChat,
  COIN_REASON_MAPPING,
} from '../constants/coin.constants';

/**
 * Check if user has an active unlimited chat plan
 */
export const hasActiveUnlimitedPlan = async (userId: string): Promise<boolean> => {
  const now = new Date();
  const activePlan = await prisma.userPlan.findFirst({
    where: {
      userId,
      isActive: true,
      plan: {
        isUnlimited: true,
      },
      OR: [
        { expiresAt: null }, // Permanent plan
        { expiresAt: { gt: now } }, // Not expired yet
      ],
    },
  });

  return !!activePlan;
};

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
 * Deduct coins for sending a message (per-message deduction)
 * Only deducts if user doesn't have active unlimited plan
 * Broadcast chats: Always 1 coin per message (regardless of category)
 * Direct DMs: ORDINARY = 2 coin, PROFESSIONAL = 2 coins, PREMIUM = 0 (appointment only)
 */
export const deductCoinsForMessage = async (
  userId: string,
  astrologerCategory: AstrologerCategory | string,
  chatId: string,
  isBroadcastChat: boolean = false
): Promise<CoinBalance> => {
  // Convert to shared enum if needed
  const category = astrologerCategory as AstrologerCategory;

  // Check if user has active unlimited plan - if yes, no deduction needed
  const hasUnlimited = await hasActiveUnlimitedPlan(userId);
  if (hasUnlimited) {
    // Return current balance without deduction
    const balance = await getCoinBalance(userId);
    return { userId, balance };
  }

  // Determine coin cost based on chat type
  let coinCost: number;
  let transactionReason: CoinTransactionReason;

  if (isBroadcastChat) {
    // Broadcast chats: Always 1 coin per message (regardless of astrologer category)
    const { getBroadcastChatCoinCost } = await import('../constants/coin.constants');
    coinCost = getBroadcastChatCoinCost();
    transactionReason = CoinTransactionReason.CHAT_ORDINARY; // Use ORDINARY reason for broadcast
  } else {
    // Direct DMs: Category-based coin cost
    // PREMIUM astrologers don't require coins - they can only chat during appointment window
    if (category === AstrologerCategory.PREMIUM) {
      // Return current balance without deduction (chat is only allowed during appointment window)
      const balance = await getCoinBalance(userId);
      return { userId, balance };
    }

    // Check if category requires coins
    if (!requiresCoinsForChat(category)) {
      throw new AppError(
        'This astrologer category does not require coins for chat',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const { getDirectChatCoinCost, COIN_REASON_MAPPING } =
      await import('../constants/coin.constants');
    coinCost = getDirectChatCoinCost(category);
    transactionReason = COIN_REASON_MAPPING[category];
  }

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
        type: CoinTransactionType.DEDUCT,
        reason: COIN_REASON_MAPPING[category],
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
 * Deduct coins for chat (legacy - kept for backward compatibility)
 * @deprecated Use deductCoinsForMessage instead for per-message deduction
 */
export const deductCoinsForChat = async (params: CoinDeductionParams): Promise<CoinBalance> => {
  const { userId, astrologerCategory, chatId } = params;

  // Check if user has active unlimited plan - if yes, no deduction needed
  const hasUnlimited = await hasActiveUnlimitedPlan(userId);
  if (hasUnlimited) {
    // Return current balance without deduction
    const balance = await getCoinBalance(userId);
    return { userId, balance };
  }

  // Convert to shared enum if needed
  const category = astrologerCategory as AstrologerCategory;

  // Check if category requires coins
  if (!requiresCoinsForChat(category)) {
    throw new AppError(
      'This astrologer category does not require coins for chat',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const { getDirectChatCoinCost, COIN_REASON_MAPPING } =
    await import('../constants/coin.constants');
  const coinCost = getDirectChatCoinCost(category);
  const transactionReason = COIN_REASON_MAPPING[category as AstrologerCategory];

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
        type: CoinTransactionType.DEDUCT,
        reason: transactionReason,
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
 * Deduct coins for creating a broadcast message (1 coin upfront)
 */
export const deductCoinsForBroadcastMessage = async (userId: string): Promise<CoinBalance> => {
  // Check if user has active unlimited plan - if yes, no deduction needed
  const hasUnlimited = await hasActiveUnlimitedPlan(userId);
  if (hasUnlimited) {
    // Return current balance without deduction
    const balance = await getCoinBalance(userId);
    return { userId, balance };
  }

  const { getBroadcastChatCoinCost } = await import('../constants/coin.constants');
  const coinCost = getBroadcastChatCoinCost(); // Always 1 coin for broadcast

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
        type: CoinTransactionType.DEDUCT,
        reason: CoinTransactionReason.CHAT_ORDINARY, // Use ORDINARY reason for broadcast
        balanceBefore,
        balanceAfter,
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

  // Use reason directly (already matches Prisma enum)
  const prismaReason = reason;

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
        type: CoinTransactionType.ADD,
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
