/**
 * Kundali Match Service (Frontend)
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';

export type KundaliMatchStatus = 'PENDING' | 'REVIEWED';

export interface KundaliMatchGeographyRef {
  id: string;
  nameEn: string;
}

export interface KundaliMatchRequest {
  id: string;
  userId: string;
  boyDateOfBirth: string;
  boyTimeOfBirth: string;
  boyPlaceOfBirth: string;
  boyPlaceOfBirthType?: string | null;
  boyPlaceOfBirthPradeshId?: string | null;
  boyPlaceOfBirthDistrictId?: string | null;
  boyPlaceOfBirthLocation?: string | null;
  boyPlaceOfBirthPradesh?: KundaliMatchGeographyRef | null;
  boyPlaceOfBirthDistrict?: KundaliMatchGeographyRef | null;
  girlDateOfBirth: string;
  girlTimeOfBirth: string;
  girlPlaceOfBirth: string;
  girlPlaceOfBirthType?: string | null;
  girlPlaceOfBirthPradeshId?: string | null;
  girlPlaceOfBirthDistrictId?: string | null;
  girlPlaceOfBirthLocation?: string | null;
  girlPlaceOfBirthPradesh?: KundaliMatchGeographyRef | null;
  girlPlaceOfBirthDistrict?: KundaliMatchGeographyRef | null;
  /** Stable question IDs from premium consultation catalogue. */
  selectedConsultationQuestionIds: string[];
  status: KundaliMatchStatus;
  adminReviewMessage: string | null;
  coinsDeducted: number;
  coinTransactionId: string | null;
  reviewedAt: string | null;
  reviewedByAdminId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Structured place of birth (Nepal: province, district, place; Outside: single string). */
export interface CreateKundaliMatchRequestBody {
  boyDateOfBirth: string;
  boyTimeOfBirth: string;
  boyPlaceOfBirthType: 'NEPAL' | 'OUTSIDE_NEPAL';
  boyPlaceOfBirthPradeshId: string | null;
  boyPlaceOfBirthDistrictId: string | null;
  boyPlaceOfBirthLocation: string | null;
  boyPlaceOfBirth: string | null;
  girlDateOfBirth: string;
  girlTimeOfBirth: string;
  girlPlaceOfBirthType: 'NEPAL' | 'OUTSIDE_NEPAL';
  girlPlaceOfBirthPradeshId: string | null;
  girlPlaceOfBirthDistrictId: string | null;
  girlPlaceOfBirthLocation: string | null;
  girlPlaceOfBirth: string | null;
  consultationQuestionIds: string[];
}

/** Public catalogue (same payload as GET /api/v1/public/kundali-match/premium-consultation-questions). */
export interface KundaliMatchPremiumConsultationCatalogue {
  titleNe: string;
  questions: { id: string; textNe: string }[];
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
  async getPremiumConsultationCatalogue(): Promise<KundaliMatchPremiumConsultationCatalogue> {
    return apiClient.get<KundaliMatchPremiumConsultationCatalogue>(
      API_ENDPOINTS.PUBLIC.KUNDALI_MATCH_PREMIUM_CONSULTATION_QUESTIONS
    );
  },

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
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ListMyKundaliMatchResponse> {
    const query = new URLSearchParams();
    query.set('page', String(params.page));
    query.set('limit', String(params.limit));
    if (params.status) query.set('status', params.status);
    if (params.dateFrom?.trim()) query.set('dateFrom', params.dateFrom.trim());
    if (params.dateTo?.trim()) query.set('dateTo', params.dateTo.trim());
    return apiClient.get<ListMyKundaliMatchResponse>(
      `${API_ENDPOINTS.KUNDALI_MATCH.MY}?${query.toString()}`
    );
  },
} as const;

export default kundaliMatchService;
