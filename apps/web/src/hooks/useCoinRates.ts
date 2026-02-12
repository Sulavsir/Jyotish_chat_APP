/**
 * Fetches admin-configured platform coin rates (chat, broadcast, appointment).
 * Rates come only from the backend (no client-side fallback). Backend provides
 * defaults when admin has not set rates.
 */

import { useQuery } from '@tanstack/react-query';
import coinService from '@/services/coin.service';
import { QUERY_KEYS } from '@/constants';
import type { PlatformCoinRates } from '@/types/coin.types';

export function useCoinRates(enabled = true) {
  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.COINS.RATES,
    queryFn: async () => {
      const res = await coinService.getRates();
      return res.rates;
    },
    enabled,
  });

  return {
    rates: data,
    isLoading,
    isError,
  };
}
