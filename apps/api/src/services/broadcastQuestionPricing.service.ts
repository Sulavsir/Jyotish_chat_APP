/**
 * Broadcast Question Pricing Service
 * Admin-managed pricing for broadcast by number of questions (NRs)
 */

import { PlatformCoinRateType, prisma } from '@jyotish/database';
import { AppError } from '../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { getCoinBalance } from './coin.service';
import { getRate } from './platformCoinRate.service';
import { hasUserUsedBroadcast } from './broadcastUsage.service';

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

export interface PerQuestionPriceEntry {
  /** 1-based question position */
  position: number;
  /** Price in NRs for this question */
  price: number;
  /** True when the first-broadcast discount was applied (only possible on position 1) */
  isDiscounted: boolean;
  /** True when a custom pricing tier exists for this position */
  tierApplied: boolean;
}

/**
 * Public re-export of buildPerQuestionPrices.
 * Used by broadcastMessage.service to store accurate per-message refund amounts.
 */
export async function getPerQuestionBreakdown(
  questionCount: number,
  clientId?: string
): Promise<PerQuestionPriceEntry[]> {
  return buildPerQuestionPrices(questionCount, clientId);
}

/**
 * Build the per-question price list for N questions.
 *
 * - Position 1: BROADCAST_SEND rate, with optional first-broadcast discount.
 * - Positions 2+: custom tier for that position if set, otherwise BROADCAST_SEND.
 * - Works correctly when no custom tiers exist (all positions fall back to BROADCAST_SEND).
 */
async function buildPerQuestionPrices(
  questionCount: number,
  clientId?: string
): Promise<PerQuestionPriceEntry[]> {
  if (questionCount < 1 || questionCount > MAX_QUESTION_COUNT) {
    throw new AppError(
      `Question count must be between 1 and ${MAX_QUESTION_COUNT}`,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const [broadcastSend, allTiers] = await Promise.all([
    getRate('BROADCAST_SEND'),
    prisma.broadcastQuestionPricing.findMany({ orderBy: { questionCount: 'asc' } }),
  ]);

  // Determine first-broadcast discount for Q1
  let discountPercent = 0;
  let isFirstBroadcast = false;
  if (clientId) {
    const hasUsed = await hasUserUsedBroadcast(clientId);
    if (!hasUsed) {
      discountPercent = await getRate('FIRST_BROADCAST_DISCOUNT' as PlatformCoinRateType);
      isFirstBroadcast = true;
    }
  }
  const clampedDiscount = Math.max(0, Math.min(100, discountPercent));

  // Build lookup: position → tier price
  const tierMap = new Map<number, number>(allTiers.map((t) => [t.questionCount, t.amountNr]));

  const result: PerQuestionPriceEntry[] = [];
  for (let pos = 1; pos <= questionCount; pos++) {
    if (pos === 1) {
      const applyDiscount = isFirstBroadcast && clampedDiscount > 0 && broadcastSend > 0;
      const price = applyDiscount
        ? clampedDiscount >= 100
          ? 0
          : Math.round((broadcastSend * (100 - clampedDiscount)) / 100)
        : broadcastSend;
      result.push({ position: pos, price, isDiscounted: applyDiscount, tierApplied: false });
    } else {
      const tierPrice = tierMap.get(pos);
      const price = tierPrice !== undefined ? tierPrice : broadcastSend;
      result.push({
        position: pos,
        price,
        isDiscounted: false,
        tierApplied: tierPrice !== undefined,
      });
    }
  }
  return result;
}

/**
 * Get base total (no first-broadcast discount) for N questions.
 * Used to calculate the original price for discount display purposes.
 */
async function getBaseTotalNrForQuestionCount(questionCount: number): Promise<number> {
  const entries = await buildPerQuestionPrices(questionCount); // no clientId → no discount
  return entries.reduce((sum, e) => sum + e.price, 0);
}

/**
 * Get total amount in NRs for N questions, including optional first-broadcast
 * discount on question 1 when the client hasn't used broadcast before.
 */
export async function getTotalNrForQuestionCount(
  questionCount: number,
  clientId?: string
): Promise<number> {
  const entries = await buildPerQuestionPrices(questionCount, clientId);
  return entries.reduce((sum, e) => sum + e.price, 0);
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

/**
 * Replace all tiers atomically (admin only).
 * Deletes every existing tier then upserts the provided list so that
 * rows removed in the admin UI are actually removed from the database.
 */
export async function replaceTiers(
  tiers: { questionCount: number; amountNr: number }[]
): Promise<BroadcastQuestionPricingTier[]> {
  // Allow empty array — clearing all custom tiers means every question falls
  // back to the BROADCAST_SEND rate; this is a valid admin configuration.
  if (tiers.length === 0) {
    await prisma.broadcastQuestionPricing.deleteMany();
    return [];
  }

  const counts = tiers.map((t) => t.questionCount);
  const duplicate = counts.find((c, i) => counts.indexOf(c) !== i);
  if (duplicate != null) {
    throw new AppError(
      `Duplicate question count: ${duplicate}. Each tier must be unique.`,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  return prisma.$transaction(async (tx) => {
    // Delete all existing tiers
    await tx.broadcastQuestionPricing.deleteMany();

    // Recreate with the new set
    const rows: BroadcastQuestionPricingTier[] = [];
    for (const t of tiers) {
      if (t.questionCount < 1 || t.questionCount > MAX_QUESTION_COUNT) {
        throw new AppError(
          `Question count must be between 1 and ${MAX_QUESTION_COUNT}`,
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
      if (t.amountNr < 0) {
        throw new AppError(
          'Amount must be non-negative',
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
      const row = await tx.broadcastQuestionPricing.create({
        data: { questionCount: t.questionCount, amountNr: t.amountNr },
      });
      rows.push({
        id: row.id,
        questionCount: row.questionCount,
        amountNr: row.amountNr,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
    }
    return rows;
  });
}

export interface PrepareBroadcastQuestionsResult {
  totalNr: number;
  /** Full price without first-broadcast discount (for strikethrough display) */
  originalTotalNr: number;
  /** Overall discount as % of the original total (e.g. 17% when 50 NRs saved on a 300 NRs order) */
  discountPercentApplied: number;
  /** Actual admin-set first-broadcast discount rate applied to Q1 (e.g. 50 for "50% off Q1") */
  firstBroadcastDiscountPct: number;
  /** Per-question price breakdown — one entry per selected question */
  breakdown: PerQuestionPriceEntry[];
  balanceNr: number;
  coveredByBalance: number;
  remainingNr: number;
  questionCount: number;
  questions: { id: string; text: string; isCustom: boolean }[];
}

/**
 * Prepare multi-question broadcast.
 * Accepts predefined question IDs (validated against DB) and/or free-typed custom texts.
 * Total item count drives all pricing (tiers, Q1 first-broadcast discount, etc.).
 */
export async function prepareBroadcastQuestions(
  clientId: string,
  questionIds: string[],
  customTexts: string[] = []
): Promise<PrepareBroadcastQuestionsResult> {
  const totalCount = questionIds.length + customTexts.length;

  if (totalCount === 0) {
    throw new AppError(
      'Select at least one question or type a custom question',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // Validate predefined question IDs against the DB (custom texts skip this)
  let dbQuestions: { id: string; text: string }[] = [];
  if (questionIds.length > 0) {
    dbQuestions = await prisma.questionItem.findMany({
      where: {
        id: { in: questionIds },
        isActive: true,
        category: { isActive: true },
      },
      select: { id: true, text: true },
    });

    if (dbQuestions.length !== questionIds.length) {
      const foundIds = new Set(dbQuestions.map((q) => q.id));
      const missing = questionIds.filter((id) => !foundIds.has(id));
      throw new AppError(
        `Invalid or inactive question(s): ${missing.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
  }

  // Merge: DB questions first (preserving selection order), then custom typed texts
  const allItems: { id: string; text: string; isCustom: boolean }[] = [
    ...dbQuestions.map((q) => ({ id: q.id, text: q.text, isCustom: false })),
    ...customTexts.map((t, i) => ({ id: `custom:${i}`, text: t, isCustom: true })),
  ];

  const questionCount = allItems.length;

  const [breakdown, baseEntries, balanceNr] = await Promise.all([
    buildPerQuestionPrices(questionCount, clientId),
    buildPerQuestionPrices(questionCount),
    getCoinBalance(clientId),
  ]);

  const totalNr = breakdown.reduce((sum, e) => sum + e.price, 0);
  const originalTotalNr = baseEntries.reduce((sum, e) => sum + e.price, 0);
  const discountPercentApplied =
    originalTotalNr > 0 ? Math.round(((originalTotalNr - totalNr) / originalTotalNr) * 100) : 0;

  // Actual admin-configured Q1 discount rate (e.g. 50 for "50% off Q1")
  const discountedQ1 = breakdown.find((e) => e.isDiscounted && e.position === 1);
  const baseQ1 = baseEntries.find((e) => e.position === 1);
  const firstBroadcastDiscountPct =
    discountedQ1 && baseQ1 && baseQ1.price > 0
      ? Math.round((1 - discountedQ1.price / baseQ1.price) * 100)
      : 0;

  const coveredByBalance = Math.min(balanceNr, totalNr);
  const remainingNr = Math.max(0, totalNr - coveredByBalance);

  return {
    totalNr,
    originalTotalNr,
    discountPercentApplied,
    firstBroadcastDiscountPct,
    breakdown,
    balanceNr,
    coveredByBalance,
    remainingNr,
    questionCount,
    questions: allItems,
  };
}
