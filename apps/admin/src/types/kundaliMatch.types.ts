/**
 * Kundali Match types for Admin Panel
 */

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
