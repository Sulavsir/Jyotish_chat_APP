/**
 * Auth Service - Authentication API calls
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';
import { TokenManager } from '@/lib/auth/token-manager';
import type { ApiResponse, LoginFormData, RegisterFormData, User } from '@/types';

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  // Legacy support
  token?: string;
}

export const authService = {
  /**
   * Login user
   */
  async login(data: LoginFormData): Promise<AuthResponse> {
    const authData = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, data, false);

    // Store tokens using TokenManager
    TokenManager.setTokens(authData.accessToken, authData.refreshToken);

    return authData;
  },

  /**
   * Logout user
   * Revokes refresh token on server and clears local tokens
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint to revoke session and clear httpOnly cookies
      // Refresh token is automatically sent via httpOnly cookie
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {});
    } catch (error) {
      // Continue with logout even if server call fails
      console.error('Logout error:', error);
    } finally {
      // Clear local storage (user data, etc.)
      TokenManager.clearTokens();
      localStorage.clear();
    }
  },

  /**
   * Logout from all devices
   * Requires authentication
   */
  async logoutAll(): Promise<{ message: string; devicesLoggedOut: number }> {
    const result = await apiClient.post<{ message: string; devicesLoggedOut: number }>(
      API_ENDPOINTS.AUTH.LOGOUT_ALL
    );

    // Clear local tokens after logging out from all devices
    TokenManager.clearTokens();
    localStorage.clear();

    return result;
  },

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User> {
    return await apiClient.get<User>(API_ENDPOINTS.USER.ME);
  },

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    return await apiClient.patch<User>(API_ENDPOINTS.USER.UPDATE, data);
  },

  /**
   * Update birth details
   */
  async updateBirthDetails(data: any): Promise<User> {
    return await apiClient.patch<User>(API_ENDPOINTS.USER.BIRTH_DETAILS, data);
  },
};
