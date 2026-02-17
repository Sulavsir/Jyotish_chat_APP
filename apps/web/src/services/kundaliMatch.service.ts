/**
 * Kundali Match Service (Frontend)
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';

export type KundaliMatchStatus = 'PENDING' | 'REVIEWED';

export interface KundaliMatchRequest {
  id: string;
  userId: string;
  boyDateOfBirth: string;
  boyTimeOfBirth: string;
  boyPlaceOfBirth: string;
  girlDateOfBirth: string;
  girlTimeOfBirth: string;
  girlPlaceOfBirth: string;
  status: KundaliMatchStatus;
  adminReviewMessage: string | null;
  coinsDeducted: number;
  coinTransactionId: string | null;
  reviewedAt: string | null;
  reviewedByAdminId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKundaliMatchRequestBody {
  boyDateOfBirth: string;
  boyTimeOfBirth: string;
  boyPlaceOfBirth: string;
  girlDateOfBirth: string;
  girlTimeOfBirth: string;
  girlPlaceOfBirth: string;
}

export interface ListMyKundaliMatchResponse {
  requests: KundaliMatchRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateKundaliMatchResponse {
  request: KundaliMatchRequest;
  message: string;
}

export const kundaliMatchService = {
  async create(body: CreateKundaliMatchRequestBody): Promise<CreateKundaliMatchResponse> {
    return apiClient.post<CreateKundaliMatchResponse>(
      API_ENDPOINTS.KUNDALI_MATCH.CREATE,
      body
    );
  },

  async listMine(params: {
    page: number;
    limit: number;
    status?: KundaliMatchStatus;
  }): Promise<ListMyKundaliMatchResponse> {
    const query = new URLSearchParams();
    query.set('page', String(params.page));
    query.set('limit', String(params.limit));
    if (params.status) query.set('status', params.status);
    return apiClient.get<ListMyKundaliMatchResponse>(
      `${API_ENDPOINTS.KUNDALI_MATCH.MY}?${query.toString()}`
    );
  },
} as const;

export default kundaliMatchService;
