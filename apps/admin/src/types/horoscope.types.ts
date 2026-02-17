/**
 * Admin Horoscope types - align with API contracts
 */

export type HoroscopeCategory = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface AdminHoroscopeEntry {
  id: string;
  zodiacSign: string;
  date: string;
  content: string;
  category: HoroscopeCategory;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface ListHoroscopesParams {
  category?: HoroscopeCategory;
  zodiacSign?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface ListHoroscopesResponse {
  horoscopes: AdminHoroscopeEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateHoroscopeRequest {
  zodiacSign: string;
  category: HoroscopeCategory;
  date: string;
  content: string;
}

export interface UpdateHoroscopeRequest {
  zodiacSign?: string;
  category?: HoroscopeCategory;
  date?: string;
  content?: string;
}
