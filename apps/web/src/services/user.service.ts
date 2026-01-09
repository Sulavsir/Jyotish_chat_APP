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
}

export const userService = new UserService();
export default userService;

