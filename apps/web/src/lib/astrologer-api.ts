/**
 * Astrologer API Client
 * API calls specific to astrologer authentication and profile management
 */

import { apiClient } from './api-client';
import { API_ENDPOINTS } from '@/constants';

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ChangePasswordResponse {
  message: string;
  astrologer?: {
    id: string;
    phone: string;
    email?: string | null;
    name: string;
    profilePhoto?: string | null;
    bio?: string | null;
    specialization: string[];
    experience?: number | null;
    category: string;
    appointmentFee?: number | null;
    rating?: number | null;
    totalConsultations: number;
    isActive: boolean;
    isOnline: boolean;
    isVerified: boolean;
    commissionRate: number;
    languages: string[];
    createdAt: Date | string;
    updatedAt: Date | string;
  };
}

export const astrologerApi = {
  /**
   * Change astrologer password
   * POST /api/v1/astrologer/auth/change-password
   */
  changePassword: async (data: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
    return apiClient.post(API_ENDPOINTS.ASTROLOGER.CHANGE_PASSWORD, data);
  },
};
