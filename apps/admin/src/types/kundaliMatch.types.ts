/**
 * Kundali Match types for Admin Panel
 */

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
  selectedConsultationQuestionIds: string[];
  status: KundaliMatchStatus;
  adminReviewMessage: string | null;
  coinsDeducted: number;
  coinTransactionId: string | null;
  reviewedAt: string | null;
  reviewedByAdminId: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string | null;
    phone: string;
    email: string | null;
  };
  reviewedByAdmin?: { id: string; name: string } | null;
}

export interface ListKundaliMatchResponse {
  requests: KundaliMatchRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
