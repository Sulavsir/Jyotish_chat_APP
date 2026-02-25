/**
 * Broadcast Question Pricing Service
 * Admin-managed pricing for broadcast by number of questions (NRs)
 */

import { prisma } from '@jyotish/database';
import { AppError } from '../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { getCoinBalance } from './coin.service';

export interface BroadcastQuestionPricingTier {
  id: string;
  questionCount: number;
  amountNr: number;
  createdAt: Date;
  updatedAt: Date;
}

const MAX_QUESTION_COUNT = 50;

/**
 * Get all pricing tiers (for admin and client)
 */
export async function getPricingTiers(): Promise<BroadcastQuestionPricingTier[]> {
  const rows = await prisma.broadcastQuestionPricing.findMany({
    orderBy: { questionCount: 'asc' },
  });
  return rows.map((r) => ({
    id: r.id,
    questionCount: r.questionCount,
    amountNr: r.amountNr,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

/**
 * Get total amount in NRs for a given question count.
 * Uses exact tier if present, otherwise interpolates from nearest lower tier or throws.
 */
export async function getTotalNrForQuestionCount(questionCount: number): Promise<number> {
  if (questionCount < 1 || questionCount > MAX_QUESTION_COUNT) {
    throw new AppError(
      `Question count must be between 1 and ${MAX_QUESTION_COUNT}`,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const tier = await prisma.broadcastQuestionPricing.findUnique({
    where: { questionCount },
  });

  if (tier) {
    return tier.amountNr;
  }

  // No exact tier: use highest tier with questionCount <= count, or lowest tier
  const allTiers = await prisma.broadcastQuestionPricing.findMany({
    orderBy: { questionCount: 'desc' },
  });

  const lowerOrEqual = allTiers.find((t) => t.questionCount <= questionCount);
  if (lowerOrEqual) {
    // Linear interpolation: (amount per question) * questionCount
    const amountPerQuestion = lowerOrEqual.amountNr / lowerOrEqual.questionCount;
    return Math.round(amountPerQuestion * questionCount);
  }

  const smallest = allTiers[allTiers.length - 1];
  if (smallest) {
    const amountPerQuestion = smallest.amountNr / smallest.questionCount;
    return Math.round(amountPerQuestion * questionCount);
  }

  throw new AppError(
    'Broadcast question pricing is not configured. Please contact support.',
    HTTP_STATUS.BAD_REQUEST,
    ERROR_CODES.VALIDATION_ERROR
  );
}

/**
 * Upsert a single tier (admin only)
 */
export async function upsertTier(
  questionCount: number,
  amountNr: number
): Promise<BroadcastQuestionPricingTier> {
  if (questionCount < 1 || questionCount > MAX_QUESTION_COUNT) {
    throw new AppError(
      `Question count must be between 1 and ${MAX_QUESTION_COUNT}`,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }
  if (amountNr < 0) {
    throw new AppError(
      'Amount must be non-negative',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const row = await prisma.broadcastQuestionPricing.upsert({
    where: { questionCount },
    create: { questionCount, amountNr },
    update: { amountNr },
  });

  return {
    id: row.id,
    questionCount: row.questionCount,
    amountNr: row.amountNr,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Upsert multiple tiers (admin only)
 */
export async function upsertTiers(
  tiers: { questionCount: number; amountNr: number }[]
): Promise<BroadcastQuestionPricingTier[]> {
  const result: BroadcastQuestionPricingTier[] = [];
  for (const t of tiers) {
    const tier = await upsertTier(t.questionCount, t.amountNr);
    result.push(tier);
  }
  return result;
}

export interface PrepareBroadcastQuestionsResult {
  totalNr: number;
  balanceNr: number;
  coveredByBalance: number;
  remainingNr: number;
  questionCount: number;
  questions: { id: string; text: string }[];
}

/**
 * Prepare multi-question broadcast: validate question IDs, compute total and balance breakdown.
 */
export async function prepareBroadcastQuestions(
  clientId: string,
  questionIds: string[]
): Promise<PrepareBroadcastQuestionsResult> {
  if (questionIds.length === 0) {
    throw new AppError(
      'Select at least one question',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const questions = await prisma.questionItem.findMany({
    where: {
      id: { in: questionIds },
      isActive: true,
      category: { isActive: true },
    },
    select: { id: true, text: true },
  });

  if (questions.length !== questionIds.length) {
    const foundIds = new Set(questions.map((q) => q.id));
    const missing = questionIds.filter((id) => !foundIds.has(id));
    throw new AppError(
      `Invalid or inactive question(s): ${missing.join(', ')}`,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const questionCount = questions.length;
  const totalNr = await getTotalNrForQuestionCount(questionCount);
  const balanceNr = await getCoinBalance(clientId);
  const coveredByBalance = Math.min(balanceNr, totalNr);
  const remainingNr = Math.max(0, totalNr - coveredByBalance);

  return {
    totalNr,
    balanceNr,
    coveredByBalance,
    remainingNr,
    questionCount,
    questions: questions.map((q) => ({ id: q.id, text: q.text })),
  };
}
