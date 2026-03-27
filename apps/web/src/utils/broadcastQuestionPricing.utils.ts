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

/**
 * Minimum total NRs for `n` questions using admin bundle tiers (same DP as API).
 */
export function computeBroadcastBaseTotalNr(
  n: number,
  pricingTiers: { questionCount: number; amountNr: number }[],
  broadcastSend: number
): number {
  if (n < 1 || n > MAX_QUESTION_COUNT) return 0;
  const tierMap = new Map(pricingTiers.map((t) => [t.questionCount, t.amountNr]));
  const tierOptions = buildTierOptions(tierMap, broadcastSend);

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

  if (dp[n] === INF) return n * broadcastSend;
  return dp[n];
}
