/**
 * User Service
 * Handles all user-related API calls
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';
import type { UserRole } from '@/types/user.types';

export interface ChatableUser {
  id: string;
  name: string | null;
  email?: string | null;
  profilePhoto?: string | null;
  role: string;
  zodiacSign?: string;
  isOnline?: boolean;
  category?: string; // For astrologers: ORDINARY, PROFESSIONAL, PREMIUM
}

interface ClientDetails {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  profilePhoto: string | null;
  dateOfBirth: Date | string | null;
  timeOfBirth: string | null;
  placeOfBirth: string | null;
  currentAddress: string | null;
  permanentAddress: string | null;
  zodiacSign: string | null;
  profileCompleted: boolean;
  createdAt: Date | string;
}

class UserService {
  /**
   * Get users that can be chatted with
   * - Clients see astrologers
   * - Astrologers see clients
   */
  async getChatableUsers(): Promise<ChatableUser[]> {
    return apiClient.get<ChatableUser[]>(API_ENDPOINTS.USER.CHATABLE);
  }

  /**
   * Get client details by ID (for astrologers)
   */
  async getClientDetails(clientId: string): Promise<{ client: ClientDetails }> {
    return apiClient.get<{ client: ClientDetails }>(
      `/api/v1/users/${clientId}/details`
    );
  }
}

export const userService = new UserService();
export default userService;
export type { ClientDetails };
