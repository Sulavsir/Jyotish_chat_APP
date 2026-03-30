/**
 * Client-side mirror of API broadcast tier composition (minimum-cost DP).
 * Keeps Ask Questions totals aligned with prepare/send APIs.
 */

const MAX_QUESTION_COUNT = 50;

type TierOption = { k: number; price: number };

function buildTierOptions(
  tierMap: Map<number, number>,
  broadcastSend: number
): TierOption[] {
  const opts: TierOption[] = [];
  for (const [k, price] of tierMap) {
    if (k >= 1 && k <= MAX_QUESTION_COUNT) {
      opts.push({ k, price });
    }
  }
  if (!tierMap.has(1)) {
    opts.push({ k: 1, price: broadcastSend });
  }
  return opts;
}

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

/**
 * Per-question base NRs from composed bundle tiers (same reconstruction as API `computeComposedPricing`).
 */
function computeComposedBasePerQuestionNr(
  n: number,
  tierOptions: TierOption[]
): number[] | null {
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

  const segments: { k: number }[] = [];
  let cur = n;
  while (cur > 0) {
    const k = pickK[cur];
    if (k <= 0) return null;
    const opt = tierOptions.find((o) => o.k === k);
    if (!opt) return null;
    segments.unshift({ k });
    cur -= k;
  }

  const basePerQuestion: number[] = [];
  for (const seg of segments) {
    const price = tierOptions.find((o) => o.k === seg.k)!.price;
    const part = splitTotalAcrossN(price, seg.k);
    for (let j = 0; j < seg.k; j++) {
      basePerQuestion.push(part[j]);
    }
  }

  return basePerQuestion;
}

/**
 * Per-question base prices for `n` questions (before first-broadcast discount).
 */
export function computeBroadcastBasePerQuestionNr(
  n: number,
  pricingTiers: { questionCount: number; amountNr: number }[],
  broadcastSend: number
): number[] {
  if (n < 1 || n > MAX_QUESTION_COUNT) return [];
  const tierMap = new Map(pricingTiers.map((t) => [t.questionCount, t.amountNr]));
  const tierOptions = buildTierOptions(tierMap, broadcastSend);
  const composed = computeComposedBasePerQuestionNr(n, tierOptions);
  if (!composed || composed.length !== n) {
    return Array.from({ length: n }, () => broadcastSend);
  }
  return composed;
}

/**
 * Minimum total NRs for `n` questions using admin bundle tiers (same DP as API).
 */
export function computeBroadcastBaseTotalNr(
  n: number,
  pricingTiers: { questionCount: number; amountNr: number }[],
  broadcastSend: number
): number {
  const perQ = computeBroadcastBasePerQuestionNr(n, pricingTiers, broadcastSend);
  return perQ.reduce((a, b) => a + b, 0);
}

/**
 * Total NRs after first-broadcast discount applied **only to question 1** (matches API `buildPerQuestionPrices`).
 */
export function computeBroadcastTotalNrWithQ1Discount(
  n: number,
  pricingTiers: { questionCount: number; amountNr: number }[],
  broadcastSend: number,
  discountPct: number
): number {
  if (n < 1) return 0;
  const clamped = Math.max(0, Math.min(100, discountPct));
  const basePer = computeBroadcastBasePerQuestionNr(n, pricingTiers, broadcastSend);
  if (!basePer.length) return 0;
  const q1Base = basePer[0] ?? 0;
  if (clamped <= 0 || q1Base <= 0) {
    return basePer.reduce((a, b) => a + b, 0);
  }
  const q1Final = clamped >= 100 ? 0 : Math.round((q1Base * (100 - clamped)) / 100);
  return q1Final + basePer.slice(1).reduce((a, b) => a + b, 0);
}
