/**
 * Query utilities for React Query
 *
 * Balance + Stats consolidation:
 * - GET /users/dashboard/stats returns balance, rates, tip, horoscope, etc.
 * - ClientDashboardProvider syncs stats.balance → COINS.BALANCE cache
 * - CoinDisplay uses stats.balance when in client layout (no separate /balance call).
 * - Use refetchClientBalanceAndStats() — it refetches stats only (1 API call).
 */

import type { QueryClient } from '@tanstack/react-query';

/**
 * Refetch client dashboard stats (single API call).
 * Stats includes balance; ClientDashboardProvider syncs it to COINS.BALANCE.
 */
export function refetchClientBalanceAndStats(queryClient: QueryClient) {
  return queryClient.refetchQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) &&
      q.queryKey[0] === 'client-dashboard' &&
      q.queryKey[1] === 'stats',
  });
}
