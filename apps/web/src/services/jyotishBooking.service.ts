/**
 * Jyotish Booking Service (Frontend)
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';
import type { AstrologerCategory, JyotishBookingRequest } from '@jyotish/shared';
import type { z } from 'zod';
import { createJyotishBookingRequestSchema } from '@jyotish/shared';

type CreateJyotishBookingRequestInput = z.infer<typeof createJyotishBookingRequestSchema>;

type CreateJyotishBookingResponse = {
  booking: JyotishBookingRequest;
};

type ListMyJyotishBookingsResponse = {
  bookings: Array<
    JyotishBookingRequest & {
      preferredAstrologer?: {
        id: string;
        name: string;
        category: AstrologerCategory;
        specialization: string[];
        profilePhoto: string | null;
      } | null;
    }
  >;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const jyotishBookingService = {
  async create(input: CreateJyotishBookingRequestInput): Promise<JyotishBookingRequest> {
    const data = await apiClient.post<CreateJyotishBookingResponse>(
      API_ENDPOINTS.JYOTISH_BOOKINGS.CREATE,
      input
    );
    return data.booking;
  },

  async listMine(params: {
    page: number;
    limit: number;
    search?: string;
    type?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ListMyJyotishBookingsResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', String(params.page));
    queryParams.append('limit', String(params.limit));
    if (params.search) queryParams.append('search', params.search);
    if (params.type) queryParams.append('type', params.type);
    if (params.status) queryParams.append('status', params.status);
    if (params.dateFrom?.trim()) queryParams.append('dateFrom', params.dateFrom.trim());
    if (params.dateTo?.trim()) queryParams.append('dateTo', params.dateTo.trim());
    const url = `${API_ENDPOINTS.JYOTISH_BOOKINGS.MY}?${queryParams.toString()}`;
    return await apiClient.get<ListMyJyotishBookingsResponse>(url);
  },
} as const;

export default jyotishBookingService;

