/**
 * Admin API - All admin-related API calls using apiClient
 */

import { apiClient } from './api-client';
import { API_ENDPOINTS } from '@/constants/api.constants';
import type { Complaint, ComplaintStats } from '@/types';
import type { Appointment } from '@/types/appointment.types';
import type { DashboardRotatingCopy } from '@jyotish/shared';
import {
  AstrologerCategory,
  JyotishBookingStatus,
  JyotishBookingType,
  type JyotishBookingRequest,
} from '@jyotish/shared';

export interface AdminChat {
  id: string;
  userId: string | null;
  astrologerId?: string | null;
  adminId: string | null;
  status: 'ACTIVE' | 'RESOLVED' | 'CLOSED';
  lastMessageAt: Date | string | null;
  lastMessageText: string | null;
  userRead: boolean;
  adminRead: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string;
    profilePhoto: string | null;
  };
  astrologer?: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string;
    profilePhoto: string | null;
  };
  admin?: {
    id: string;
    name: string | null;
    email: string | null;
  };
  participantRole?: 'CLIENT' | 'ASTROLOGER';
}

export interface AdminChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderType: 'USER' | 'ADMIN';
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE';
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface AdminChatListResponse {
  chats: AdminChat[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminChatMessagesResponse {
  messages: AdminChatMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminChatUnreadCountResponse {
  count: number;
}

export interface AdminChatUploadedFile {
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: 'IMAGE' | 'FILE' | 'AUDIO';
}

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

type ListDashboardRotatingCopyResponse = {
  items: DashboardRotatingCopy[];
};

type CreateDashboardRotatingCopyRequest = {
  title: string;
  subtitle: string;
  isActive?: boolean;
  sortOrder?: number;
};

type UpdateDashboardRotatingCopyRequest = Partial<CreateDashboardRotatingCopyRequest>;

type ListJyotishBookingsResponse = {
  bookings: Array<
    JyotishBookingRequest & {
      client: {
        id: string;
        phone: string;
        name: string | null;
        email: string | null;
        profilePhoto: string | null;
      };
      preferredAstrologer?: {
        id: string;
        name: string;
        category: AstrologerCategory;
        specialization: string[];
        profilePhoto: string | null;
      } | null;
    }
  >;
};

type UpdateJyotishBookingStatusRequest = {
  status: JyotishBookingStatus;
  adminNotes?: string;
};

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

    addCoins: async (id: string, data: { amount: number; reason?: string }) => {
      const response = await apiClient.post(API_ENDPOINTS.USERS.ADD_COINS(id), data);
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

    rotatingCopy: {
      list: async (): Promise<ListDashboardRotatingCopyResponse> => {
        const response = await apiClient.get<ListDashboardRotatingCopyResponse>(
          API_ENDPOINTS.DASHBOARD.ROTATING_COPY
        );
        return response;
      },

      create: async (
        data: CreateDashboardRotatingCopyRequest
      ): Promise<{ item: DashboardRotatingCopy }> => {
        const response = await apiClient.post<{ item: DashboardRotatingCopy }>(
          API_ENDPOINTS.DASHBOARD.ROTATING_COPY,
          data
        );
        return response;
      },

      update: async (
        id: string,
        data: UpdateDashboardRotatingCopyRequest
      ): Promise<{ item: DashboardRotatingCopy }> => {
        const response = await apiClient.patch<{ item: DashboardRotatingCopy }>(
          API_ENDPOINTS.DASHBOARD.ROTATING_COPY_BY_ID(id),
          data
        );
        return response;
      },

      toggle: async (id: string): Promise<{ item: DashboardRotatingCopy }> => {
        const response = await apiClient.patch<{ item: DashboardRotatingCopy }>(
          API_ENDPOINTS.DASHBOARD.ROTATING_COPY_TOGGLE(id)
        );
        return response;
      },

      remove: async (id: string): Promise<{ message: string }> => {
        const response = await apiClient.delete<{ message: string }>(
          API_ENDPOINTS.DASHBOARD.ROTATING_COPY_BY_ID(id)
        );
        return response;
      },
    },
  },

  jyotishBookings: {
    list: async (params?: { type?: JyotishBookingType; status?: JyotishBookingStatus }) => {
      const response = await apiClient.get<ListJyotishBookingsResponse>(API_ENDPOINTS.JYOTISH_BOOKINGS.LIST, {
        params,
      });
      return response;
    },

    updateStatus: async (id: string, data: UpdateJyotishBookingStatusRequest) => {
      const response = await apiClient.patch<{ booking: JyotishBookingRequest }>(
        API_ENDPOINTS.JYOTISH_BOOKINGS.UPDATE_STATUS(id),
        data
      );
      return response;
    },
  },

  /**
   * Appointments
   */
  appointments: {
    list: async (params?: { page?: number; limit?: number }): Promise<any> => {
      const response = await apiClient.get(API_ENDPOINTS.APPOINTMENTS.LIST, { params });
      return response;
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

  /**
   * Admin Chat (Support Widget)
   */
  adminChat: {
    list: async (params?: {
      page?: number;
      limit?: number;
      status?: 'ACTIVE' | 'RESOLVED' | 'CLOSED';
      search?: string;
    }): Promise<AdminChatListResponse> => {
      const response = await apiClient.get<AdminChatListResponse>(
        API_ENDPOINTS.ADMIN_CHAT.LIST,
        { params }
      );
      return response;
    },

    get: async (id: string): Promise<{ chat: AdminChat }> => {
      const response = await apiClient.get<{ chat: AdminChat }>(API_ENDPOINTS.ADMIN_CHAT.GET(id));
      return response;
    },

    getMessages: async (
      id: string,
      params?: { page?: number; limit?: number }
    ): Promise<AdminChatMessagesResponse> => {
      const response = await apiClient.get<AdminChatMessagesResponse>(
        API_ENDPOINTS.ADMIN_CHAT.MESSAGES(id),
        { params }
      );
      return response;
    },

    sendMessage: async (id: string, data: { content: string; type?: 'TEXT' | 'IMAGE' | 'FILE' }): Promise<{ message: AdminChatMessage }> => {
      const response = await apiClient.post<{ message: AdminChatMessage }>(
        API_ENDPOINTS.ADMIN_CHAT.SEND_MESSAGE(id),
        data
      );
      return response;
    },

    markAsRead: async (id: string): Promise<{ message: string }> => {
      const response = await apiClient.patch<{ message: string }>(
        API_ENDPOINTS.ADMIN_CHAT.MARK_READ(id)
      );
      return response;
    },

    unreadCount: async (): Promise<AdminChatUnreadCountResponse> => {
      const response = await apiClient.get<AdminChatUnreadCountResponse>(
        API_ENDPOINTS.ADMIN_CHAT.UNREAD_COUNT
      );
      return response;
    },

    uploadFile: async (file: File): Promise<AdminChatUploadedFile> => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.uploadFile<{ file: AdminChatUploadedFile }>(
        API_ENDPOINTS.ADMIN_CHAT.UPLOAD_FILE,
        formData
      );
      return response.file;
    },

    updateStatus: async (id: string, status: 'ACTIVE' | 'RESOLVED' | 'CLOSED'): Promise<{ chat: AdminChat }> => {
      const response = await apiClient.patch<{ chat: AdminChat }>(
        API_ENDPOINTS.ADMIN_CHAT.UPDATE_STATUS(id),
        { status }
      );
      return response;
    },

    assign: async (id: string, adminId: string): Promise<{ chat: AdminChat }> => {
      const response = await apiClient.patch<{ chat: AdminChat }>(
        API_ENDPOINTS.ADMIN_CHAT.ASSIGN(id),
        { adminId }
      );
      return response;
    },
  },
};
