/**
 * Coin Service
 * Handles coin-related business logic
 */

import { prisma } from '@jyotish/database';
import { ACTIVE_CLIENT_USER_WHERE } from '../constants/user.constants';
import {
  AppointmentStatus,
  AstrologerCoinEarningSource,
  InstantChatRequestStatus,
} from '@prisma/client';
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
  toSharedAstrologerCategory,
} from '../constants/coin.constants';
import { getRate } from './platformCoinRate.service';
import { astrologerCoinsFromClientDeduction } from '../utils/astrologer-coin-earning.util';

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
/**
 * True when per-message pricing should use BROADCAST_PER_MESSAGE (and broadcast commission).
 * False when the thread is direct/instant: reopened-after-ended, or an accepted InstantChatRequest
 * is linked to this chat (same client–astrologer pair as a prior broadcast acceptance).
 */
export async function isBroadcastPricedSession(
  chatId: string,
  reopenedAfterEndedKnown?: boolean | null
): Promise<boolean> {
  let reopened: boolean | null | undefined = reopenedAfterEndedKnown;
  if (reopened !== true && reopened !== false) {
    const row = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { reopenedAfterEnded: true },
    });
    if (!row) return false;
    reopened = row.reopenedAfterEnded;
  }
  if (reopened === true) return false;

  const broadcastMessage = await prisma.broadcastMessage.findFirst({
    where: { chatId },
    select: { id: true },
  });
  if (!broadcastMessage) return false;

  const acceptedInstant = await prisma.instantChatRequest.findFirst({
    where: { chatId, status: InstantChatRequestStatus.ACCEPTED },
    select: { id: true },
  });
  if (acceptedInstant) return false;

  return true;
}

export const getCoinBalance = async (userId: string): Promise<number> => {
  const user = await prisma.user.findFirst({
    where: { id: userId, ...ACTIVE_CLIENT_USER_WHERE },
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
 * Broadcast chats: platform BROADCAST_PER_MESSAGE rate; astrologer share uses broadcastMessageCommissionPercent.
 * Direct / instant chat: per-Jyotish or CHAT_PER_MESSAGE; astrologer share uses chatMessageCommissionPercent.
 * PREMIUM: no per-message coins outside appointment window (appointment window skips deduction); PREMIUM cannot accept broadcast or instant chat.
 */
export const deductCoinsForMessage = async (
  userId: string,
  astrologerCategory: AstrologerCategory | string,
  chatId: string,
  _isBroadcastChat: boolean = false
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

  // Always load the chat and its broadcast linkage so we can reliably
  // decide whether this message belongs to a broadcast-originated session
  // or a pure/direct chat session.
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: {
      appointmentId: true,
      participant1Id: true,
      participant2Id: true,
      reopenedAfterEnded: true,
    },
  });

  const isBroadcastSession = await isBroadcastPricedSession(chatId, chat?.reopenedAfterEnded);

  if (!isBroadcastSession && chat) {
    const now = new Date();

    let appointment: {
      scheduledAt: Date;
      duration: number;
    } | null = null;

    if (chat.appointmentId) {
      appointment = await prisma.appointment.findUnique({
        where: { id: chat.appointmentId },
        select: { scheduledAt: true, duration: true },
      });
    } else {
      appointment = await prisma.appointment.findFirst({
        where: {
          clientId: chat.participant1Id,
          astrologerId: chat.participant2Id,
          scheduledAt: { lte: now },
          status: {
            in: [
              AppointmentStatus.CONFIRMED,
              AppointmentStatus.IN_PROGRESS,
              AppointmentStatus.COMPLETED,
            ],
          },
        },
        orderBy: { scheduledAt: 'desc' },
        select: { scheduledAt: true, duration: true },
      });
    }

    if (appointment) {
      const startMs = new Date(appointment.scheduledAt).getTime();
      const endMs = startMs + appointment.duration * 60 * 1000;
      const nowMs = now.getTime();
      if (nowMs >= startMs && nowMs < endMs) {
        const balance = await getCoinBalance(userId);
        return { userId, balance };
      }
    }
  }

  // Determine coin cost based on chat type
  let coinCost: number;
  let transactionReason: CoinTransactionReason;

  if (isBroadcastSession) {
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

    // Determine dynamic per-Jyotish chat fee
    let perMessageFee = 0;
    if (chat?.participant2Id) {
      const astrologer = await prisma.astrologer.findUnique({
        where: { id: chat.participant2Id },
        select: { chatMessageFee: true },
      });
      if (astrologer?.chatMessageFee && astrologer.chatMessageFee > 0) {
        perMessageFee = astrologer.chatMessageFee;
      }
    }
    if (perMessageFee <= 0) {
      // Fallback to platform default if astrologer-specific fee not set
      perMessageFee = await getRate('CHAT_PER_MESSAGE');
    }

    coinCost = perMessageFee;
    transactionReason = COIN_REASON_MAPPING[category];
  }

  // Get current balance
  const user = await prisma.user.findFirst({
    where: { id: userId, ...ACTIVE_CLIENT_USER_WHERE },
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
  const source = isBroadcastSession ? 'BROADCAST_MESSAGE' : 'CHAT_MESSAGE';

  const astrologerIdForEarning = chat?.participant2Id;

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
    if (astrologerIdForEarning) {
      const astrologer = await tx.astrologer.findUnique({
        where: { id: astrologerIdForEarning },
        select: {
          chatMessageCommissionPercent: true,
          broadcastMessageCommissionPercent: true,
        },
      });
      const pct = isBroadcastSession
        ? (astrologer?.broadcastMessageCommissionPercent ?? 0)
        : (astrologer?.chatMessageCommissionPercent ?? 0);
      if (pct > 0) {
        const astrologerCoins = astrologerCoinsFromClientDeduction(coinCost, pct);
        if (astrologerCoins > 0) {
          await tx.astrologerCoinEarning.create({
            data: {
              astrologerId: astrologerIdForEarning,
              coinTransactionId: coinTx.id,
              chatId,
              source,
              clientCoinsDeducted: coinCost,
              commissionPercent: pct,
              astrologerCoinsEarned: astrologerCoins,
              questionCount: 1,
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
    coinsDeducted: coinCost,
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
  const user = await prisma.user.findFirst({
    where: { id: userId, ...ACTIVE_CLIENT_USER_WHERE },
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
 * Deduct coins for creating a broadcast message.
 * Optionally accepts an explicit coinCost (used for first-broadcast discounts).
 */
export const deductCoinsForBroadcastMessage = async (
  userId: string,
  overrideCoinCost?: number
): Promise<CoinBalance> => {
  const hasUnlimited = await hasActiveUnlimitedPlan(userId);
  if (hasUnlimited) {
    const balance = await getCoinBalance(userId);
    return { userId, balance };
  }

  const baseCost = await getRate('BROADCAST_SEND');
  const coinCost = overrideCoinCost !== undefined ? overrideCoinCost : baseCost;

  // Get current balance
  const user = await prisma.user.findFirst({
    where: { id: userId, ...ACTIVE_CLIENT_USER_WHERE },
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

  const user = await prisma.user.findFirst({
    where: { id: userId, ...ACTIVE_CLIENT_USER_WHERE },
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

  if (reason === CoinTransactionReason.PAYMENT_SUCCESS) {
    try {
      const { AdminStatsEmitter } = require('../utils/admin-stats-emitter');
      AdminStatsEmitter.emitSidebarInvalidate();
    } catch (e) {
      console.error('Failed to emit sidebar invalidate:', e);
    }
  }

  return {
    userId: updatedUser.id,
    balance: updatedUser.coins,
  };
};

/** Which admin commission applies when deducting the astrologer's appointment fee */
export type AppointmentDeductionEarningKind = 'KUNDALI_REVIEW' | 'APPOINTMENT';

/**
 * Deduct coins for a confirmed appointment (legacy confirm flow).
 * Full Kundali Review bookings use kundaliReviewCommissionPercent; other appointment services use appointmentCommissionPercent.
 */
export const deductCoinsForAppointment = async (
  userId: string,
  astrologerId: string,
  coinCost: number,
  earningKind: AppointmentDeductionEarningKind = 'APPOINTMENT'
): Promise<{ userId: string; balance: number; coinTransactionId: string; coinCost: number }> => {
  if (coinCost <= 0) {
    const balance = await getCoinBalance(userId);
    return { userId, balance, coinTransactionId: '', coinCost: 0 };
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, ...ACTIVE_CLIENT_USER_WHERE },
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
      select: {
        appointmentCommissionPercent: true,
        kundaliReviewCommissionPercent: true,
      },
    });
    const useKundali = earningKind === 'KUNDALI_REVIEW';
    const pct = useKundali
      ? (astrologer?.kundaliReviewCommissionPercent ?? 0)
      : (astrologer?.appointmentCommissionPercent ?? 0);
    const source = useKundali ? ('KUNDALI_REVIEW' as const) : ('APPOINTMENT' as const);
    if (pct > 0) {
      const astrologerCoins = astrologerCoinsFromClientDeduction(coinCost, pct);
      if (astrologerCoins > 0) {
        await tx.astrologerCoinEarning.create({
          data: {
            astrologerId,
            coinTransactionId: coinTx.id,
            source,
            clientCoinsDeducted: coinCost,
            commissionPercent: pct,
            astrologerCoinsEarned: astrologerCoins,
            questionCount: 1,
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
 * Deduct coins when client books a slot (Appointment for Full Kundali Review).
 * Used for appointment creation with astrologer-defined slot.
 */
export const deductCoinsForBooking = async (
  userId: string,
  astrologerId: string,
  bookingType: 'KUNDALI_REVIEW'
): Promise<{ userId: string; balance: number; coinTransactionId: string; coinCost: number }> => {
  // Use astrologer-specific appointment fee for Full Kundali Review bookings.
  const astrologer = await prisma.astrologer.findUnique({
    where: { id: astrologerId },
    select: { appointmentFee: true },
  });
  const coinCost = astrologer?.appointmentFee ?? 0;
  if (coinCost <= 0) {
    const balance = await getCoinBalance(userId);
    return { userId, balance, coinTransactionId: '', coinCost: 0 };
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, ...ACTIVE_CLIENT_USER_WHERE },
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
  const source = 'KUNDALI_REVIEW';

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
      select: { kundaliReviewCommissionPercent: true },
    });
    const pct = astrologer?.kundaliReviewCommissionPercent ?? 0;
    if (pct > 0) {
      const astrologerCoins = astrologerCoinsFromClientDeduction(coinCost, pct);
      if (astrologerCoins > 0) {
        await tx.astrologerCoinEarning.create({
          data: {
            astrologerId,
            coinTransactionId: coinTx.id,
            source,
            clientCoinsDeducted: coinCost,
            commissionPercent: pct,
            astrologerCoinsEarned: astrologerCoins,
            questionCount: 1,
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
 * Deduct coins for Kundali Match request (admin-reviewed service; no astrologer earning).
 */
export const deductCoinsForKundaliMatch = async (
  userId: string
): Promise<{ userId: string; balance: number; coinTransactionId: string; coinCost: number }> => {
  const coinCost = await getRate('KUNDALI_MATCH');
  if (coinCost <= 0) {
    const balance = await getCoinBalance(userId);
    return { userId, balance, coinTransactionId: '', coinCost: 0 };
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, ...ACTIVE_CLIENT_USER_WHERE },
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
 * Deduct coins for multiple broadcast questions (batch).
 * Used when client sends N questions at once; totalNr is the admin-configured total for that count.
 */
export const deductCoinsForBroadcastQuestions = async (
  userId: string,
  totalNr: number
): Promise<CoinBalance> => {
  if (totalNr <= 0) {
    const balance = await getCoinBalance(userId);
    return { userId, balance };
  }

  const hasUnlimited = await hasActiveUnlimitedPlan(userId);
  if (hasUnlimited) {
    const balance = await getCoinBalance(userId);
    return { userId, balance };
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, ...ACTIVE_CLIENT_USER_WHERE },
    select: { coins: true, id: true },
  });

  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  if (user.coins < totalNr) {
    throw new AppError(
      `Insufficient balance. Required: ${totalNr} NRs, Available: ${user.coins} NRs.`,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INSUFFICIENT_COINS
    );
  }

  const balanceBefore = user.coins;
  const balanceAfter = balanceBefore - totalNr;

  const [updatedUser] = await Promise.all([
    prisma.user.update({
      where: { id: userId },
      data: { coins: { decrement: totalNr } },
      select: { id: true, coins: true },
    }),
    prisma.coinTransaction.create({
      data: {
        userId,
        amount: -totalNr,
        type: CoinTransactionType.DEDUCT,
        reason: CoinTransactionReason.CHAT_ORDINARY,
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
 * Deduct coins for direct chat multi-question bundle (one deduction for the whole batch).
 * - **Direct chat**: astrologer share uses `chatMessageCommissionPercent`, source CHAT_MESSAGE.
 * - **Broadcast-originated chat**: same per-message rate as `deductCoinsForMessage` (BROADCAST_PER_MESSAGE × N);
 *   astrologer share uses `broadcastMessageCommissionPercent`, source BROADCAST_MESSAGE.
 */
export const deductCoinsForDirectQuestionBundle = async (
  userId: string,
  totalNr: number,
  chatId: string,
  astrologerId: string,
  questionCount: number
): Promise<{ userId: string; balance: number; coinsDeducted: number }> => {
  if (totalNr <= 0) {
    const balance = await getCoinBalance(userId);
    return { userId, balance, coinsDeducted: 0 };
  }

  const hasUnlimited = await hasActiveUnlimitedPlan(userId);
  if (hasUnlimited) {
    const balance = await getCoinBalance(userId);
    return { userId, balance, coinsDeducted: 0 };
  }

  const astrologer = await prisma.astrologer.findUnique({
    where: { id: astrologerId },
    select: {
      chatMessageCommissionPercent: true,
      broadcastMessageCommissionPercent: true,
      category: true,
    },
  });

  if (!astrologer) {
    throw new AppError('Astrologer not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  const sharedCategory = toSharedAstrologerCategory(astrologer.category);
  if (!requiresCoinsForChat(sharedCategory)) {
    const balance = await getCoinBalance(userId);
    return { userId, balance, coinsDeducted: 0 };
  }

  const transactionReason = COIN_REASON_MAPPING[sharedCategory];

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { reopenedAfterEnded: true },
  });
  const isBroadcastSession = await isBroadcastPricedSession(chatId, chat?.reopenedAfterEnded);

  const pct = isBroadcastSession
    ? (astrologer.broadcastMessageCommissionPercent ?? 0)
    : (astrologer.chatMessageCommissionPercent ?? 0);
  const earningSource = isBroadcastSession
    ? AstrologerCoinEarningSource.BROADCAST_MESSAGE
    : AstrologerCoinEarningSource.CHAT_MESSAGE;

  const user = await prisma.user.findFirst({
    where: { id: userId, ...ACTIVE_CLIENT_USER_WHERE },
    select: { coins: true, id: true },
  });

  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  if (user.coins < totalNr) {
    throw new AppError(
      `Insufficient balance. Required: ${totalNr} NRs, Available: ${user.coins} NRs.`,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INSUFFICIENT_COINS
    );
  }

  const balanceBefore = user.coins;
  const balanceAfter = balanceBefore - totalNr;
  const astrologerCoins = astrologerCoinsFromClientDeduction(totalNr, pct);

  const updatedUser = await prisma.$transaction(async (tx) => {
    const coinTx = await tx.coinTransaction.create({
      data: {
        userId,
        amount: -totalNr,
        type: CoinTransactionType.DEDUCT,
        reason: transactionReason,
        balanceBefore,
        balanceAfter,
        chatId,
      },
    });
    const updated = await tx.user.update({
      where: { id: userId },
      data: { coins: { decrement: totalNr } },
      select: { id: true, coins: true },
    });
    if (astrologerCoins > 0) {
      await tx.astrologerCoinEarning.create({
        data: {
          astrologerId,
          coinTransactionId: coinTx.id,
          chatId,
          source: earningSource,
          clientCoinsDeducted: totalNr,
          commissionPercent: pct,
          astrologerCoinsEarned: astrologerCoins,
          questionCount: Math.max(1, questionCount),
        },
      });
    }
    return updated;
  });

  return {
    userId: updatedUser.id,
    balance: updatedUser.coins,
    coinsDeducted: totalNr,
  };
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
    const balance = await getCoinBalance(userId);
    return { userId, balance };
  }

  return addCoins(userId, amount, CoinTransactionReason.REFUND, undefined, undefined);
};

/**
 * Build where clause for transaction filter
 * - payment_success: type=ADD, reason=PAYMENT_SUCCESS
 * - admin_added: type=ADD, reason=ADMIN_ADJUSTMENT
 * - app_used: type=DEDUCT
 */
function buildTransactionFilter(filter?: 'payment_success' | 'admin_added' | 'app_used') {
  if (!filter) return {};
  switch (filter) {
    case 'payment_success':
      return { type: CoinTransactionType.ADD, reason: CoinTransactionReason.PAYMENT_SUCCESS };
    case 'admin_added':
      return { type: CoinTransactionType.ADD, reason: CoinTransactionReason.ADMIN_ADJUSTMENT };
    case 'app_used':
      return { type: CoinTransactionType.DEDUCT };
    default:
      return {};
  }
}

/**
 * Get coin transaction history for a user
 * Supports filter: payment_success | admin_added | app_used
 */
export const getTransactionHistory = async (
  userId: string,
  limit = 50,
  offset = 0,
  filter?: 'payment_success' | 'admin_added' | 'app_used'
): Promise<{
  transactions: CoinTransaction[];
  total: number;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> => {
  const where = { userId, ...buildTransactionFilter(filter) };

  const [transactions, total] = await Promise.all([
    prisma.coinTransaction.findMany({
      where,
      select: {
        id: true,
        userId: true,
        amount: true,
        type: true,
        reason: true,
        balanceBefore: true,
        balanceAfter: true,
        chatId: true,
        paymentId: true,
        adminId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.coinTransaction.count({ where }),
  ]);

  const paymentIds = [...new Set(transactions.map((t) => t.paymentId).filter(Boolean))] as string[];
  const payments =
    paymentIds.length > 0
      ? await prisma.payment.findMany({
          where: { id: { in: paymentIds } },
          select: { id: true, paymentMethod: true, transactionId: true },
        })
      : [];
  const paymentById = new Map(payments.map((p) => [p.id, p]));

  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    transactions: transactions.map(
      (t): CoinTransaction & { paymentMethod?: string; transactionId?: string | null } => {
        const payment = t.paymentId ? paymentById.get(t.paymentId) : undefined;
        return {
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
          paymentMethod: payment?.paymentMethod,
          transactionId: payment?.transactionId ?? null,
        };
      }
    ),
    total,
    pagination: { page, limit, total, totalPages },
  };
};
