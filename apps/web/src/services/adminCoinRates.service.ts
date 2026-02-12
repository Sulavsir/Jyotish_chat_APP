/**
 * Admin Platform Coin Rates Service
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api.constants';
import type { PlatformCoinRateRow, UpdatePlatformCoinRatesBody } from '@/types/platformCoinRate.types';

export interface GetCoinRatesResponse {
  rates: PlatformCoinRateRow[];
}

export async function getCoinRates(): Promise<PlatformCoinRateRow[]> {
  const res = await apiClient.get<GetCoinRatesResponse>(API_ENDPOINTS.ADMIN.COIN_RATES);
  return res.rates ?? [];
}

export async function updateCoinRates(
  body: UpdatePlatformCoinRatesBody
): Promise<PlatformCoinRateRow[]> {
  const res = await apiClient.put<{ rates: PlatformCoinRateRow[] }>(
    API_ENDPOINTS.ADMIN.COIN_RATES,
    body
  );
  return res.rates ?? [];
}
