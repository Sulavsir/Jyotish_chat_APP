/**
 * Astrologer Service
 * Handles astrologer-related API calls
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api.constants';
import type {
  PublicAstrologerProfile,
  AstrologerListParams,
  AstrologerListResponse,
  AstrologerStats,
} from '@/types/astrologer';

// Astrologer profile type for authenticated astrologer
export interface AstrologerProfile {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  profilePhoto?: string | null;
  bio?: string | null;
  category: string;
  specialization?: string[];
  experience?: number | null;
  languages?: string[];
  appointmentFee?: number | null;
  isOnline: boolean;
  isActive: boolean;
  rating?: number | null;
  totalConsultations?: number;
  createdAt: Date | string;
}

class AstrologerService {
  /**
   * Get authenticated astrologer profile (for logged-in astrologers)
   */
  async getAstrologerProfile(): Promise<{ astrologer: AstrologerProfile }> {
    const response = await apiClient.get<{ astrologer: AstrologerProfile }>(
      API_ENDPOINTS.ASTROLOGER.AUTH_ME
    );
    return response;
  }

  /**
   * Toggle online/offline status
   */
  async toggleOnlineStatus(isOnline: boolean): Promise<{ isOnline: boolean }> {
    const response = await apiClient.post<{ isOnline: boolean }>(
      API_ENDPOINTS.ASTROLOGER.TOGGLE_ONLINE,
      { isOnline }
    );
    return response;
  }

  /**
   * Get public astrologer profile by ID
   */
  async getPublicProfile(id: string): Promise<{ astrologer: PublicAstrologerProfile }> {
    const response = await apiClient.get<{ astrologer: PublicAstrologerProfile }>(
      API_ENDPOINTS.ASTROLOGER.PROFILE(id)
    );
    return response;
  }

  /**
   * List all astrologers with filters
   */
  async listAstrologers(params?: AstrologerListParams): Promise<AstrologerListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.category) queryParams.append('category', params.category);
    if (params?.minRating) queryParams.append('minRating', params.minRating.toString());
    if (params?.maxAppointmentFee)
      queryParams.append('maxAppointmentFee', params.maxAppointmentFee.toString());
    if (params?.isOnline !== undefined) queryParams.append('isOnline', params.isOnline.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `${API_ENDPOINTS.ASTROLOGER.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await apiClient.get<AstrologerListResponse>(url);
    return response;
  }

  /**
   * Get astrologer statistics
   */
  async getStats(): Promise<AstrologerStats> {
    const response = await apiClient.get<AstrologerStats>(API_ENDPOINTS.ASTROLOGER.STATS);
    return response;
  }
}

// Create singleton instance
const astrologerServiceInstance = new AstrologerService();

// Export as both default and named export for compatibility
export default astrologerServiceInstance;
export const astrologerService = astrologerServiceInstance;

// Re-export types
export type {
  PublicAstrologerProfile,
  AstrologerListParams,
  AstrologerListResponse,
  AstrologerStats,
};
