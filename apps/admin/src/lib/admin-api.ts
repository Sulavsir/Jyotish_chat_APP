/**
 * Admin API - All admin-related API calls using apiClient
 */

import { apiClient } from './api-client';
import { API_ENDPOINTS } from '@/constants/api.constants';
import type { Complaint, ComplaintStats } from '@/types';
import type { Appointment } from '@/types/appointment.types';

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

export interface ComplaintsListResponse {
  complaints: Complaint[];
  total: number;
}

// Re-export for backward compatibility
export type AppointmentResponse = Appointment;

export const adminApi = {
  /**
   * Admin login
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(API_ENDPOINTS.ADMIN.LOGIN, credentials);
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
   * Generic GET request helper
   */
  get: async (path: string, config?: any) => {
    const response = await apiClient.get(`/admin${path}`, config);
    return response;
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
   * Chat Audit
   */
  chatAudit: {
    list: async (params?: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
      type?: string;
    }): Promise<import('@/types').ChatAuditListResponse> => {
      const response = await apiClient.get<import('@/types').ChatAuditListResponse>(
        API_ENDPOINTS.CHAT_AUDIT.LIST,
        { params }
      );
      return response;
    },
    stats: async (): Promise<import('@/types').ChatAuditStatsResponse> => {
      const response = await apiClient.get<import('@/types').ChatAuditStatsResponse>(
        API_ENDPOINTS.CHAT_AUDIT.STATS
      );
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

    getMessages: async (id: string, params?: { page?: number; limit?: number }) => {
      const response = await apiClient.get(API_ENDPOINTS.CHATS.MESSAGES(id), { params });
      return response;
    },

    abandon: async (chatId: string, reason?: string) => {
      const response = await apiClient.post(API_ENDPOINTS.CHATS.ABANDON(chatId), { reason });
      return response;
    },

    unblock: async (chatId: string) => {
      const response = await apiClient.post(API_ENDPOINTS.CHATS.UNBLOCK(chatId));
      return response;
    },
  },

  /**
   * Complaints
   */
  complaints: {
    getComplaints: async (params?: {
      limit?: number;
      offset?: number;
      status?: string;
    }): Promise<ComplaintsListResponse> => {
      const response = await apiClient.get<ComplaintsListResponse>(API_ENDPOINTS.COMPLAINTS.LIST, {
        params,
      });
      return response;
    },

    getComplaintStats: async (): Promise<ComplaintStats> => {
      const response = await apiClient.get<ComplaintStats>(API_ENDPOINTS.COMPLAINTS.STATS);
      return response;
    },

    getComplaintById: async (id: string) => {
      const response = await apiClient.get(API_ENDPOINTS.COMPLAINTS.DETAIL(id));
      return response;
    },

    updateComplaintStatus: async (
      id: string,
      data: { status: string; adminNotes?: string; priority?: string }
    ) => {
      const response = await apiClient.patch(API_ENDPOINTS.COMPLAINTS.UPDATE_STATUS(id), data);
      return response;
    },

    resolveComplaint: async (id: string, data: { resolution: string; adminNotes?: string }) => {
      const response = await apiClient.post(API_ENDPOINTS.COMPLAINTS.RESOLVE(id), data);
      return response;
    },

    dismissComplaint: async (id: string, adminNotes: string) => {
      const response = await apiClient.post(API_ENDPOINTS.COMPLAINTS.DISMISS(id), {
        reason: adminNotes,
      });
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
    stats: async () => {
      const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.STATS);
      return response;
    },
  },

  /**
   * Appointments
   */
  appointments: {
    list: async (): Promise<AppointmentResponse[]> => {
      const response = await apiClient.get<AppointmentResponse[]>(API_ENDPOINTS.APPOINTMENTS.LIST);
      // API client already extracts data, so return directly
      return Array.isArray(response) ? response : [];
    },
  },

  /**
   * Pricing Plans
   */
  pricing: {
    getAll: async (): Promise<import('@/types').GetAllPricingPlansResponse> => {
      const response = await apiClient.get<import('@/types').GetAllPricingPlansResponse>(
        API_ENDPOINTS.PRICING.LIST
      );
      return response;
    },

    getById: async (id: string): Promise<import('@/types').GetPricingPlanResponse> => {
      const response = await apiClient.get<import('@/types').GetPricingPlanResponse>(
        API_ENDPOINTS.PRICING.GET(id)
      );
      return response;
    },

    create: async (
      data: import('@/types').CreatePricingPlanRequest
    ): Promise<import('@/types').GetPricingPlanResponse> => {
      const response = await apiClient.post<import('@/types').GetPricingPlanResponse>(
        API_ENDPOINTS.PRICING.CREATE,
        data
      );
      return response;
    },

    update: async (
      id: string,
      data: import('@/types').UpdatePricingPlanRequest
    ): Promise<import('@/types').GetPricingPlanResponse> => {
      const response = await apiClient.put<import('@/types').GetPricingPlanResponse>(
        API_ENDPOINTS.PRICING.UPDATE(id),
        data
      );
      return response;
    },

    delete: async (id: string): Promise<import('@/types').DeletePricingPlanResponse> => {
      const response = await apiClient.delete<import('@/types').DeletePricingPlanResponse>(
        API_ENDPOINTS.PRICING.DELETE(id)
      );
      return response;
    },

    toggle: async (id: string): Promise<import('@/types').GetPricingPlanResponse> => {
      const response = await apiClient.patch<import('@/types').GetPricingPlanResponse>(
        API_ENDPOINTS.PRICING.TOGGLE(id)
      );
      return response;
    },
  },
};
