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
 * Public re-export of buildPerQuestionPrices (bundle tiers + per-line splits for refunds).
 * Used by broadcastMessage.service to store accurate per-message refund amounts.
 */
export async function getPerQuestionBreakdown(
  questionCount: number,
  clientId?: string
): Promise<PerQuestionPriceEntry[]> {
  return buildPerQuestionPrices(questionCount, clientId);
}

/**
 * Split a bundle total into N per-question lines (refunds/coin ledger). Sum always equals `total`.
 */
function splitTotalAcrossN(total: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(total / n);
  const remainder = total - base * n;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    out.push(base + (i < remainder ? 1 : 0));
  }
  return out;
}

type TierOption = { k: number; price: number; fromDb: boolean };

function buildTierOptions(tierMap: Map<number, number>, broadcastSend: number): TierOption[] {
  const opts: TierOption[] = [];
  for (const [k, price] of tierMap) {
    if (k >= 1 && k <= MAX_QUESTION_COUNT) {
      opts.push({ k, price, fromDb: true });
    }
  }
  if (!tierMap.has(1)) {
    opts.push({ k: 1, price: broadcastSend, fromDb: false });
  }
  return opts;
}

/**
 * Minimum-cost composition of admin bundle tiers (DP). E.g. tiers (1→100), (2→190) and N=3
 * gives 190+100=290 (2-Q bundle + 1-Q), not 100+150+150 from old per-slot logic.
 */
function computeComposedPricing(
  n: number,
  tierOptions: TierOption[]
): { basePerQuestion: number[]; tierApplied: boolean[] } | null {
  if (n < 1) return null;
  const INF = Number.POSITIVE_INFINITY;
  const dp: number[] = new Array(n + 1).fill(INF);
  const pickK: number[] = new Array(n + 1).fill(0);
  dp[0] = 0;

  for (let i = 1; i <= n; i++) {
    for (const opt of tierOptions) {
      const k = opt.k;
      if (k > i || dp[i - k] === INF) continue;
      const cand = dp[i - k] + opt.price;
      if (cand < dp[i] || (cand === dp[i] && k > pickK[i])) {
        dp[i] = cand;
        pickK[i] = k;
      }
    }
  }

  if (dp[n] === INF) return null;

  /** Segments in question order: each { k, fromDb } */
  const segments: { k: number; fromDb: boolean }[] = [];
  let cur = n;
  while (cur > 0) {
    const k = pickK[cur];
    if (k <= 0) return null;
    const opt = tierOptions.find((o) => o.k === k);
    if (!opt) return null;
    segments.unshift({ k, fromDb: opt.fromDb });
    cur -= k;
  }

  const basePerQuestion: number[] = [];
  const tierApplied: boolean[] = [];
  for (const seg of segments) {
    const part = splitTotalAcrossN(
      tierOptions.find((o) => o.k === seg.k)!.price,
      seg.k
    );
    for (let j = 0; j < seg.k; j++) {
      basePerQuestion.push(part[j]);
      tierApplied.push(seg.fromDb);
    }
  }

  return { basePerQuestion, tierApplied };
}

/**
 * Build the per-question price list for N questions.
 *
 * - Admin tiers are **bundle prices** for exactly K questions. Any order size N is priced by
 *   **composing** tiers with minimum total cost (DP), e.g. 3 questions → tier(2)+tier(1) when that is
 *   cheaper than a single tier(3) or three singles.
 * - First-broadcast discount % applies **only to question 1** (first slot in composed order), not the
 *   whole bundle total.
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

  const tierMap = new Map<number, number>(allTiers.map((t) => [t.questionCount, t.amountNr]));
  const tierOptions = buildTierOptions(tierMap, broadcastSend);

  const composed = computeComposedPricing(questionCount, tierOptions);
  if (!composed) {
    throw new AppError(
      'Unable to compute broadcast question pricing',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.SERVER_ERROR
    );
  }

  const { basePerQuestion, tierApplied } = composed;
  const q1Base = basePerQuestion[0] ?? 0;

  const applyDiscount =
    Boolean(clientId) && isFirstBroadcast && clampedDiscount > 0 && q1Base > 0;

  const finalPerQuestion = [...basePerQuestion];
  if (applyDiscount) {
    finalPerQuestion[0] =
      clampedDiscount >= 100 ? 0 : Math.round((q1Base * (100 - clampedDiscount)) / 100);
  }

  return finalPerQuestion.map((price, i) => ({
    position: i + 1,
    price,
    isDiscounted: i === 0 && applyDiscount,
    tierApplied: tierApplied[i] ?? false,
  }));
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

  const [breakdown, baseEntries, balanceNr, firstBroadcastDiscountRate] = await Promise.all([
    buildPerQuestionPrices(questionCount, clientId),
    buildPerQuestionPrices(questionCount),
    getCoinBalance(clientId),
    getRate('FIRST_BROADCAST_DISCOUNT' as PlatformCoinRateType),
  ]);

  const totalNr = breakdown.reduce((sum, e) => sum + e.price, 0);
  const originalTotalNr = baseEntries.reduce((sum, e) => sum + e.price, 0);
  const discountPercentApplied =
    originalTotalNr > 0 ? Math.round(((originalTotalNr - totalNr) / originalTotalNr) * 100) : 0;

  const hadFirstBroadcastPricing =
    breakdown.some((e) => e.isDiscounted) && originalTotalNr > totalNr;
  const firstBroadcastDiscountPct = hadFirstBroadcastPricing
    ? Math.max(0, Math.min(100, firstBroadcastDiscountRate))
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
