/**
 * Tip Service - Daily dashboard tips
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';
import type { DailyTip, TipAudience, QuestionnaireLanguage } from '@/types';

export interface TodayTipsResponse {
  tips: DailyTip[];
}

/** Format local date as YYYY-MM-DD for API so tips match the user's "today". */
function getLocalDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const tipService = {
  async getTodayTips(
    audience: TipAudience,
    language: QuestionnaireLanguage,
    options?: { date?: string }
  ): Promise<TodayTipsResponse> {
    const date = options?.date ?? getLocalDateString();
    return apiClient.get<TodayTipsResponse>(API_ENDPOINTS.TIPS.TODAY, {
      params: { audience, language, date },
    });
  },
};

