/**
 * Astrologer Earnings Service (Jyotish My Earnings)
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api.constants';
import type {
  GetAstrologerEarningsResult,
  GetAstrologerEarningsParams,
} from '@/types/earnings.types';

export async function getAstrologerEarnings(
  params?: GetAstrologerEarningsParams
): Promise<GetAstrologerEarningsResult> {
  const query = new URLSearchParams();
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  if (params?.limit != null) query.set('limit', String(params.limit));
  if (params?.offset != null) query.set('offset', String(params.offset));
  if (params?.source) query.set('source', params.source);
  const url =
    API_ENDPOINTS.ASTROLOGER.EARNINGS + (query.toString() ? `?${query.toString()}` : '');
  return apiClient.get<GetAstrologerEarningsResult>(url);
}
