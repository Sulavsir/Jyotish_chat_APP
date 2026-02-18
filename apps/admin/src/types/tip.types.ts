import type { QuestionnaireLanguage, TipAudience } from '@jyotish/shared';

export interface AdminDailyTip {
  id: string;
  date: string;
  language: QuestionnaireLanguage;
  audience: TipAudience;
  text: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListTipsParams {
  language?: QuestionnaireLanguage;
  audience?: TipAudience;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface ListTipsResponse {
  tips: AdminDailyTip[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateTipRequest {
  date: string;
  text: string;
  language: QuestionnaireLanguage;
  audience: TipAudience;
}

/** Request body for POST /admin/tips. One or many tips in array. */
export interface CreateTipsRequest {
  tips: CreateTipRequest[];
}

