/**
 * Client Dashboard Service
 * Fetches consolidated dashboard stats from a single API endpoint.
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';
import type { QuestionnaireLanguage } from '@jyotish/shared';

export interface ClientDashboardStats {
  balance: number;
  rates: Record<string, number>;
  todayTip: { text: string };
  myHoroscope: { zodiacSign: string; prediction: string; category: string } | null;
  rotatingCopy: Array<{ id: string; title: string; subtitle: string }>;
  hasPendingBroadcast: boolean;
  pendingBroadcastCount: number;
}

export async function getClientDashboardStats(
  language?: QuestionnaireLanguage
): Promise<ClientDashboardStats> {
  return apiClient.get<ClientDashboardStats>(API_ENDPOINTS.USER.DASHBOARD_STATS, {
    params: language ? { language } : undefined,
  });
}
