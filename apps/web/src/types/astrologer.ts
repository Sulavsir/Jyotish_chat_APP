/**
 * Astrologer Types
 */

import { AstrologerCategory } from '@jyotish/shared';

// Re-export AstrologerCategory for convenience
export { AstrologerCategory };

export interface PublicAstrologerProfile {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  profilePhoto?: string | null;
  address?: string | null;
  country?: string | null;
  bio?: string | null;
  category: AstrologerCategory;
  specialization?: string[];
  experience?: number | null;
  languages?: string[];
  appointmentFee?: number | null;
  /** NRs per direct chat message for this Jyotish (dynamic pricing) */
  chatMessageFee?: number | null;
  isOnline: boolean;
  isActive: boolean;
  rating?: number | null;
  totalConsultations?: number;
  createdAt: Date | string;
}

export interface AstrologerListParams extends Record<string, unknown> {
  category?: AstrologerCategory;
  minRating?: number;
  maxAppointmentFee?: number;
  isOnline?: boolean;
  search?: string;
  sortBy?: 'rating' | 'experience' | 'appointmentFee' | 'totalConsultations';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface AstrologerListResponse {
  astrologers: PublicAstrologerProfile[];
  /** Count of active, non-deleted astrologers currently marked online (same basis as `/public/astrologers/stats` `online`). */
  onlineAstrologersCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface AstrologerStats {
  total: number;
  online: number;
  offline: number;
  byCategory: Record<string, number>;
}

export const ASTROLOGER_CATEGORY_LABELS: Record<AstrologerCategory, string> = {
  [AstrologerCategory.ORDINARY]: 'Ordinary',
  [AstrologerCategory.PROFESSIONAL]: 'Professional',
  [AstrologerCategory.PREMIUM]: 'Premium',
  [AstrologerCategory.KATHA_VACHAK]: 'Katha Vachak',
};
