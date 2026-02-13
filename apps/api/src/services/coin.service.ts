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
  requiresCoinsForChat,
  COIN_REASON_MAPPING,
} from '../constants/coin.constants';
import { getRate } from './platformCoinRate.service';

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

  // Free chat during appointment/kundali session (30 min from scheduledAt)
  if (!isBroadcastChat) {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { appointmentId: true },
    });
    if (chat?.appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: chat.appointmentId },
        select: { scheduledAt: true, duration: true },
      });
      if (appointment) {
        const start = new Date(appointment.scheduledAt).getTime();
        const end = start + appointment.duration * 60 * 1000;
        const now = Date.now();
        if (now >= start && now < end) {
          const balance = await getCoinBalance(userId);
          return { userId, balance };
        }
      }
    }
  }

  // Determine coin cost based on chat type
  let coinCost: number;
  let transactionReason: CoinTransactionReason;

  if (isBroadcastChat) {
    coinCost = await getRate('BROADCAST_PER_MESSAGE');
    transactionReason = CoinTransactionReason.CHAT_ORDINARY;
  } else {
    if (category === AstrologerCategory.PREMIUM) {
      const balance = await getCoinBalance(userId);
      return { userId, balance };
    }
    if (!requiresCoinsForChat(category)) {
      throw new AppError(
        'This astrologer category does not require coins for chat',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    coinCost = await getRate('CHAT_PER_MESSAGE');
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
  const source = isBroadcastChat ? 'BROADCAST_MESSAGE' : 'CHAT_MESSAGE';

  const updatedUser = await prisma.$transaction(async (tx) => {
    const coinTx = await tx.coinTransaction.create({
      data: {
        userId,
        amount: -coinCost,
        type: CoinTransactionType.DEDUCT,
        reason: transactionReason,
        balanceBefore,
        balanceAfter,
        chatId,
      },
    });
    const updated = await tx.user.update({
      where: { id: userId },
      data: { coins: { decrement: coinCost } },
      select: { id: true, coins: true },
    });
    const chat = await tx.chat.findUnique({
      where: { id: chatId },
      select: { participant2Id: true },
    });
    if (chat) {
      const astrologer = await tx.astrologer.findUnique({
        where: { id: chat.participant2Id },
        select: { commissionRate: true },
      });
      if (astrologer && astrologer.commissionRate > 0) {
        const astrologerCoins = Math.floor(
          (coinCost * astrologer.commissionRate) / 100
        );
        if (astrologerCoins > 0) {
          await (tx as any).astrologerCoinEarning.create({
            data: {
              astrologerId: chat.participant2Id,
              coinTransactionId: coinTx.id,
              chatId,
              source,
              clientCoinsDeducted: coinCost,
              commissionPercent: astrologer.commissionRate,
              astrologerCoinsEarned: astrologerCoins,
            },
          });
        }
      }
    }
    return updated;
  });

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

  const coinCost = await getRate('CHAT_PER_MESSAGE');
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
  const hasUnlimited = await hasActiveUnlimitedPlan(userId);
  if (hasUnlimited) {
    const balance = await getCoinBalance(userId);
    return { userId, balance };
  }

  const coinCost = await getRate('BROADCAST_SEND');

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
 * Deduct coins for booking an appointment (uses admin-configured APPOINTMENT rate)
 */
export const deductCoinsForAppointment = async (
  userId: string,
  astrologerId: string
): Promise<{ userId: string; balance: number; coinTransactionId: string; coinCost: number }> => {
  const coinCost = await getRate('APPOINTMENT');
  if (coinCost <= 0) {
    const balance = await getCoinBalance(userId);
    return { userId, balance, coinTransactionId: '', coinCost: 0 };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { coins: true, id: true },
  });

  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  if (user.coins < coinCost) {
    throw new AppError(
      `Insufficient coins. Required: ${coinCost}, Available: ${user.coins}`,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INSUFFICIENT_COINS
    );
  }

  const balanceBefore = user.coins;
  const balanceAfter = balanceBefore - coinCost;

  const result = await prisma.$transaction(async (tx) => {
    const coinTx = await tx.coinTransaction.create({
      data: {
        userId,
        amount: -coinCost,
        type: CoinTransactionType.DEDUCT,
        reason: CoinTransactionReason.PURCHASE,
        balanceBefore,
        balanceAfter,
      },
    });
    await tx.user.update({
      where: { id: userId },
      data: { coins: { decrement: coinCost } },
      select: { id: true, coins: true },
    });
    const astrologer = await tx.astrologer.findUnique({
      where: { id: astrologerId },
      select: { commissionRate: true },
    });
    if (astrologer && astrologer.commissionRate > 0) {
      const astrologerCoins = Math.floor(
        (coinCost * astrologer.commissionRate) / 100
      );
      if (astrologerCoins > 0) {
        await (tx as any).astrologerCoinEarning.create({
          data: {
            astrologerId,
            coinTransactionId: coinTx.id,
            source: 'APPOINTMENT',
            clientCoinsDeducted: coinCost,
            commissionPercent: astrologer.commissionRate,
            astrologerCoinsEarned: astrologerCoins,
          },
        });
      }
    }
    return { coinTx, balance: balanceAfter };
  });

  return {
    userId,
    balance: result.balance,
    coinTransactionId: result.coinTx.id,
    coinCost,
  };
};

/**
 * Deduct coins when client books a slot (direct confirm: APPOINTMENT or KUNDALI_REVIEW).
 * Used for appointment/kundali review creation with astrologer-defined slot.
 */
export const deductCoinsForBooking = async (
  userId: string,
  astrologerId: string,
  bookingType: 'APPOINTMENT' | 'KUNDALI_REVIEW'
): Promise<{ userId: string; balance: number; coinTransactionId: string; coinCost: number }> => {
  const rateType = bookingType === 'KUNDALI_REVIEW' ? 'KUNDALI_REVIEW' : 'APPOINTMENT';
  const coinCost = await getRate(rateType);
  if (coinCost <= 0) {
    const balance = await getCoinBalance(userId);
    return { userId, balance, coinTransactionId: '', coinCost: 0 };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { coins: true, id: true },
  });

  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  if (user.coins < coinCost) {
    throw new AppError(
      `Insufficient coins. Required: ${coinCost}, Available: ${user.coins}`,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INSUFFICIENT_COINS
    );
  }

  const balanceBefore = user.coins;
  const balanceAfter = balanceBefore - coinCost;
  const source = bookingType === 'KUNDALI_REVIEW' ? 'KUNDALI_REVIEW' : 'APPOINTMENT';

  const result = await prisma.$transaction(async (tx) => {
    const coinTx = await tx.coinTransaction.create({
      data: {
        userId,
        amount: -coinCost,
        type: CoinTransactionType.DEDUCT,
        reason: CoinTransactionReason.PURCHASE,
        balanceBefore,
        balanceAfter,
      },
    });
    await tx.user.update({
      where: { id: userId },
      data: { coins: { decrement: coinCost } },
      select: { id: true, coins: true },
    });
    const astrologer = await tx.astrologer.findUnique({
      where: { id: astrologerId },
      select: { commissionRate: true },
    });
    if (astrologer && astrologer.commissionRate > 0) {
      const astrologerCoins = Math.floor(
        (coinCost * astrologer.commissionRate) / 100
      );
      if (astrologerCoins > 0) {
        await tx.astrologerCoinEarning.create({
          data: {
            astrologerId,
            coinTransactionId: coinTx.id,
            source,
            clientCoinsDeducted: coinCost,
            commissionPercent: astrologer.commissionRate,
            astrologerCoinsEarned: astrologerCoins,
          },
        });
      }
    }
    return { coinTx, balance: balanceAfter };
  });

  return {
    userId,
    balance: result.balance,
    coinTransactionId: result.coinTx.id,
    coinCost,
  };
};

/**
 * Link an appointment to an existing coin earning (sets appointmentId on the earning for this transaction)
 */
export const linkAppointmentToCoinEarning = async (
  coinTransactionId: string,
  appointmentId: string
): Promise<void> => {
  await prisma.astrologerCoinEarning.updateMany({
    where: { coinTransactionId },
    data: { appointmentId },
  });
};

/**
 * Refund coins
 */
export const refundCoins = async (
  userId: string,
  amount: number,
  _chatId?: string
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
