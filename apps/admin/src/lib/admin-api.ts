/**
 * Admin API - All admin-related API calls using apiClient
 */

import { apiClient } from './api-client';
import { API_ENDPOINTS } from '@/constants/api.constants';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  admin: {
    id: string;
    email: string;
    name: string;
  };
}

export const adminApi = {
  /**
   * Admin login
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.ADMIN.LOGIN,
      credentials
    );
    return response;
  },

  /**
   * Admin logout
   */
  logout: async (): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.ADMIN.LOGOUT);
  },

  /**
   * Get current admin profile
   */
  getProfile: async () => {
    const response = await apiClient.get<{ admin: any }>(API_ENDPOINTS.ADMIN.ME);
    return response;
  },

  /**
   * Astrologers
   */
  astrologers: {
    list: async (params?: { page?: number; limit?: number; search?: string }) => {
      const response = await apiClient.get(API_ENDPOINTS.ASTROLOGERS.LIST, { params });
      return response;
    },

    create: async (data: any) => {
      const response = await apiClient.post(API_ENDPOINTS.ASTROLOGERS.CREATE, data);
      return response;
    },

    get: async (id: string) => {
      const response = await apiClient.get(API_ENDPOINTS.ASTROLOGERS.GET(id));
      return response;
    },

    update: async (id: string, data: any) => {
      const response = await apiClient.patch(API_ENDPOINTS.ASTROLOGERS.UPDATE(id), data);
      return response;
    },

    delete: async (id: string) => {
      const response = await apiClient.delete(API_ENDPOINTS.ASTROLOGERS.DELETE(id));
      return response;
    },

    toggleStatus: async (id: string) => {
      const response = await apiClient.post(API_ENDPOINTS.ASTROLOGERS.TOGGLE_STATUS(id));
      return response;
    },
  },

  /**
   * Users
   */
  users: {
    list: async (params?: { page?: number; limit?: number; search?: string }) => {
      const response = await apiClient.get(API_ENDPOINTS.USERS.LIST, { params });
      return response;
    },

    get: async (id: string) => {
      const response = await apiClient.get(API_ENDPOINTS.USERS.GET(id));
      return response;
    },

    toggleStatus: async (id: string) => {
      const response = await apiClient.post(API_ENDPOINTS.USERS.TOGGLE_STATUS(id));
      return response;
    },
  },

  /**
   * Audit Logs
   */
  auditLogs: {
    list: async (params?: { page?: number; limit?: number }) => {
      const response = await apiClient.get(API_ENDPOINTS.AUDIT_LOGS.LIST, { params });
      return response;
    },
  },

  /**
   * Chats
   */
  chats: {
    list: async (params?: { page?: number; limit?: number }) => {
      const response = await apiClient.get(API_ENDPOINTS.CHATS.LIST, { params });
      return response;
    },

    get: async (id: string) => {
      const response = await apiClient.get(API_ENDPOINTS.CHATS.GET(id));
      return response;
    },

    getMessages: async (id: string) => {
      const response = await apiClient.get(API_ENDPOINTS.CHATS.MESSAGES(id));
      return response;
    },
  },

  /**
   * Earnings
   */
  earnings: {
    list: async (params?: { page?: number; limit?: number }) => {
      const response = await apiClient.get(API_ENDPOINTS.EARNINGS.LIST, { params });
      return response;
    },
  },

  /**
   * Dashboard
   */
  dashboard: {
    getStats: async () => {
      const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.STATS);
      return response;
    },
  },
};

