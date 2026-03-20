/**
 * Admin API - All admin-related API calls using apiClient
 */

import { apiClient } from './api-client';
import { API_ENDPOINTS } from '@/constants/api.constants';
import type { Complaint, ComplaintStats } from '@/types';
import type {
  Appointment,
  ListAppointmentsResponse,
  ListAppointmentsParams,
  CancelAppointmentPayload,
} from '@/types/appointment.types';
import type { DashboardRotatingCopy } from '@jyotish/shared';
import {
  AstrologerCategory,
  JyotishBookingStatus,
  JyotishBookingType,
  type JyotishBookingRequest,
  type QuestionnaireCategory,
} from '@jyotish/shared';
import type {
  Admin,
  AdminPaymentHistoryResponse,
  Astrologer,
  PlatformCoinRateRow,
  UpdatePlatformCoinRatesBody,
  AstrologerWithCoinEarning,
  ListAstrologersWithCoinEarningsResponse,
  BroadcastQuestionPricingTier,
} from '@/types';
import type {
  ListAstrologersParams,
  RegistrationRequest,
  CreateAstrologerRequest,
  UpdateAstrologerRequest,
} from '@/types/astrologer.types';

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

export interface AdminSidebarCountsResponse {
  counts: {
    activeChats: number;
    pendingComplaints: number;
    pendingAppointments: number;
    pendingKundaliMatch: number;
    totalUsers: number;
    newUsersToday: number;
    totalAstrologers: number;
    pendingAstrologerRegistrations: number;
    platformTransactions: number;
  };
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
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type UpdateJyotishBookingStatusRequest = {
  status: JyotishBookingStatus;
  adminNotes?: string;
};

export interface ComplaintsListResponse {
  complaints: Complaint[];
  total: number;
}

type ListTipsResponse = import('@/types').ListTipsResponse;
type ListTipsParams = import('@/types').ListTipsParams;
type CreateTipRequest = import('@/types').CreateTipRequest;
type CreateTipsRequest = import('@/types').CreateTipsRequest;

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
   * Sidebar counts (badges for navigation)
   */
  getSidebarCounts: async (): Promise<AdminSidebarCountsResponse> => {
    return apiClient.get<AdminSidebarCountsResponse>(API_ENDPOINTS.ADMIN.SIDEBAR_COUNTS);
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
  getProfile: async (): Promise<{ admin: Admin }> => {
    const response = await apiClient.get<{ admin: Admin }>(API_ENDPOINTS.ADMIN.ME);
    return response;
  },

  /**
   * Astrologers
   */
  astrologers: {
    list: async (params?: ListAstrologersParams) => {
      const response = await apiClient.get(API_ENDPOINTS.ASTROLOGERS.LIST, { params });
      return response;
    },

    create: async (data: CreateAstrologerRequest): Promise<{ astrologer: Astrologer }> => {
      const response = await apiClient.post<{ astrologer: Astrologer }>(
        API_ENDPOINTS.ASTROLOGERS.CREATE,
        data
      );
      return response;
    },

    createWithFile: async (formData: FormData): Promise<{ astrologer: Astrologer }> => {
      const response = await apiClient.uploadFile<{ astrologer: Astrologer }>(
        API_ENDPOINTS.ASTROLOGERS.CREATE,
        formData
      );
      return response;
    },

    verifyEditPassword: async (password: string): Promise<{ valid: true }> => {
      const response = await apiClient.post<{ valid: true }>(
        API_ENDPOINTS.ASTROLOGERS.VERIFY_EDIT_PASSWORD,
        { password }
      );
      return response;
    },

    get: async (id: string) => {
      const response = await apiClient.get(API_ENDPOINTS.ASTROLOGERS.GET(id));
      return response;
    },

    update: async (
      id: string,
      data: UpdateAstrologerRequest
    ): Promise<{ astrologer: Astrologer }> => {
      const response = await apiClient.patch<{ astrologer: Astrologer }>(
        API_ENDPOINTS.ASTROLOGERS.UPDATE(id),
        data
      );
      return response;
    },

    uploadProof: async (id: string, formData: FormData): Promise<{ astrologer: Astrologer }> => {
      const response = await apiClient.uploadFile<{ astrologer: Astrologer }>(
        API_ENDPOINTS.ASTROLOGERS.PROOF_UPLOAD(id),
        formData
      );
      return response;
    },

    uploadProfilePhoto: async (
      id: string,
      formData: FormData
    ): Promise<{ astrologer: Astrologer }> => {
      const response = await apiClient.uploadFile<{ astrologer: Astrologer }>(
        API_ENDPOINTS.ASTROLOGERS.PROFILE_PHOTO(id),
        formData
      );
      return response;
    },

    delete: async (id: string, editPassword: string) => {
      const response = await apiClient.delete(API_ENDPOINTS.ASTROLOGERS.DELETE(id), {
        data: { editPassword },
      });
      return response;
    },

    toggleStatus: async (id: string) => {
      const response = await apiClient.post(API_ENDPOINTS.ASTROLOGERS.TOGGLE_STATUS(id));
      return response;
    },

    getRegistrationRequests: async (params?: {
      page?: number;
      limit?: number;
      search?: string;
    }): Promise<{
      requests: RegistrationRequest[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }> => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);

      const url = queryParams.toString()
        ? `${API_ENDPOINTS.ASTROLOGERS.REGISTRATION_REQUESTS}?${queryParams.toString()}`
        : API_ENDPOINTS.ASTROLOGERS.REGISTRATION_REQUESTS;

      const response = await apiClient.get<{
        requests: RegistrationRequest[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(url);
      return response;
    },

    approveRegistration: async (
      id: string,
      data: {
        category: string;
        appointmentFee?: number;
        chatMessageFee?: number;
        commissionRate?: number;
        inhouseAstrologer?: boolean;
      }
    ) => {
      const response = await apiClient.post(
        API_ENDPOINTS.ASTROLOGERS.APPROVE_REGISTRATION(id),
        data
      );
      return response;
    },

    rejectRegistration: async (id: string, data: { rejectionReason: string }) => {
      const response = await apiClient.post(
        API_ENDPOINTS.ASTROLOGERS.REJECT_REGISTRATION(id),
        data
      );
      return response;
    },
  },

  /**
   * Daily Predictions (Tips)
   */
  tips: {
    list: async (params?: ListTipsParams): Promise<ListTipsResponse> => {
      const response = await apiClient.get<ListTipsResponse>(API_ENDPOINTS.TIPS.LIST, {
        params,
      });
      return response;
    },

    /** Create one or more tips. Send { tips: [...] } with one or many items. */
    create: async (
      data: CreateTipsRequest
    ): Promise<{ tips: import('@/types').AdminDailyTip[] }> => {
      const response = await apiClient.post<{ tips: import('@/types').AdminDailyTip[] }>(
        API_ENDPOINTS.TIPS.CREATE,
        data
      );
      return response;
    },

    get: async (id: string): Promise<{ tip: import('@/types').AdminDailyTip }> => {
      const response = await apiClient.get<{ tip: import('@/types').AdminDailyTip }>(
        API_ENDPOINTS.TIPS.GET(id)
      );
      return response;
    },

    update: async (
      id: string,
      data: {
        date: string;
        text: string;
        language: import('@jyotish/shared').QuestionnaireLanguage;
        audience: import('@jyotish/shared').TipAudience;
      }
    ): Promise<{ tip: import('@/types').AdminDailyTip }> => {
      const response = await apiClient.patch<{ tip: import('@/types').AdminDailyTip }>(
        API_ENDPOINTS.TIPS.UPDATE(id),
        data
      );
      return response;
    },

    delete: async (id: string): Promise<{ message: string }> => {
      const response = await apiClient.delete<{ message: string }>(API_ENDPOINTS.TIPS.DELETE(id));
      return response;
    },
  },

  /**
   * Subha Sahit (Auspicious Dates)
   */
  subhaSahit: {
    get: async (id: string): Promise<{ date: import('@/types').SubhaSahitDate }> => {
      const response = await apiClient.get<{ date: import('@/types').SubhaSahitDate }>(
        API_ENDPOINTS.SUBHA_SAHIT.GET(id)
      );
      return response;
    },

    list: async (
      params?: import('@/types').ListSubhaSahitDatesParams
    ): Promise<import('@/types').ListSubhaSahitDatesResponse> => {
      const response = await apiClient.get<import('@/types').ListSubhaSahitDatesResponse>(
        API_ENDPOINTS.SUBHA_SAHIT.LIST,
        { params }
      );
      return response;
    },

    create: async (
      data: import('@/types').CreateSubhaSahitDatesRequest
    ): Promise<import('@/types').CreateSubhaSahitDatesResponse> => {
      const response = await apiClient.post<import('@/types').CreateSubhaSahitDatesResponse>(
        API_ENDPOINTS.SUBHA_SAHIT.CREATE,
        data
      );
      return response;
    },

    update: async (
      id: string,
      data: import('@/types').UpdateSubhaSahitDateRequest
    ): Promise<import('@/types').UpdateSubhaSahitDateResponse> => {
      const response = await apiClient.put<import('@/types').UpdateSubhaSahitDateResponse>(
        API_ENDPOINTS.SUBHA_SAHIT.UPDATE(id),
        data
      );
      return response;
    },

    delete: async (id: string): Promise<{ message: string }> => {
      const response = await apiClient.delete<{ message: string }>(
        API_ENDPOINTS.SUBHA_SAHIT.DELETE(id)
      );
      return response;
    },

    getOccasions: async (language?: 'en' | 'ne' | 'hi'): Promise<{ occasions: string[] }> => {
      const response = await apiClient.get<{ occasions: string[] }>(
        API_ENDPOINTS.SUBHA_SAHIT.OCCASIONS,
        {
          params: language ? { language } : undefined,
        }
      );
      return response;
    },

    createOccasion: async (
      name: string,
      language?: 'en' | 'ne' | 'hi'
    ): Promise<{ occasion: { id: string; name: string; isActive: boolean; language: string } }> => {
      const response = await apiClient.post<{
        occasion: { id: string; name: string; isActive: boolean; language: string };
      }>(API_ENDPOINTS.SUBHA_SAHIT.CREATE_OCCASION, language ? { name, language } : { name });
      return response;
    },
  },

  /**
   * Users
   */
  users: {
    list: async (params?: {
      page?: number;
      limit?: number;
      search?: string;
      isActive?: boolean;
    }) => {
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
  get: async (
    path: string,
    config?: { params?: Record<string, unknown>; headers?: Record<string, string> }
  ) => {
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
    list: async (params?: { page?: number; limit?: number; status?: string }) => {
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

    reopen: async (chatId: string) => {
      const response = await apiClient.post(API_ENDPOINTS.CHATS.REOPEN(chatId));
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

    listAstrologersWithCoins: async (params?: {
      page?: number;
      limit?: number;
      search?: string;
    }): Promise<ListAstrologersWithCoinEarningsResponse> => {
      const response = await apiClient.get<ListAstrologersWithCoinEarningsResponse>(
        API_ENDPOINTS.EARNINGS.ASTROLOGERS_WITH_COINS,
        { params }
      );
      return response;
    },
  },

  /**
   * Coin Rates (Coin Settings)
   */
  coinRates: {
    get: async (): Promise<{ rates: PlatformCoinRateRow[] }> => {
      const response = await apiClient.get<{ rates: PlatformCoinRateRow[] }>(
        API_ENDPOINTS.COIN_RATES.LIST
      );
      return response;
    },

    update: async (
      body: UpdatePlatformCoinRatesBody
    ): Promise<{ rates: PlatformCoinRateRow[]; message?: string }> => {
      const response = await apiClient.put<{
        rates: PlatformCoinRateRow[];
        message?: string;
      }>(API_ENDPOINTS.COIN_RATES.UPDATE, body);
      return response;
    },
  },

  /**
   * Dashboard
   */
  dashboard: {
    stats: async (): Promise<{ stats: import('@/types').DashboardStats }> => {
      const response = await apiClient.get<{ stats: import('@/types').DashboardStats }>(
        API_ENDPOINTS.DASHBOARD.STATS
      );
      return response;
    },

    rotatingCopy: {
      list: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
      }): Promise<ListDashboardRotatingCopyResponse> => {
        const response = await apiClient.get<ListDashboardRotatingCopyResponse>(
          API_ENDPOINTS.DASHBOARD.ROTATING_COPY,
          { params }
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

  website: {
    questionnaires: {
      list: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
        language?: string;
      }): Promise<{
        categories: QuestionnaireCategory[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }> => {
        const response = await apiClient.get<{
          categories: QuestionnaireCategory[];
          pagination: { page: number; limit: number; total: number; totalPages: number };
        }>(API_ENDPOINTS.WEBSITE.QUESTIONNAIRES, { params });
        return response;
      },

      create: async (data: {
        name: string;
        emoji?: string;
        language?: string;
        isActive?: boolean;
        sortOrder?: number;
        questions: string[];
      }): Promise<{ category: QuestionnaireCategory }> => {
        const response = await apiClient.post<{ category: QuestionnaireCategory }>(
          API_ENDPOINTS.WEBSITE.QUESTIONNAIRES,
          data
        );
        return response;
      },

      update: async (
        id: string,
        data: {
          name?: string;
          emoji?: string;
          language?: string;
          isActive?: boolean;
          sortOrder?: number;
          questions?: string[];
        }
      ): Promise<{ category: QuestionnaireCategory }> => {
        const response = await apiClient.patch<{ category: QuestionnaireCategory }>(
          API_ENDPOINTS.WEBSITE.QUESTIONNAIRE_BY_ID(id),
          data
        );
        return response;
      },

      remove: async (id: string): Promise<{ message: string }> => {
        const response = await apiClient.delete<{ message: string }>(
          API_ENDPOINTS.WEBSITE.QUESTIONNAIRE_BY_ID(id)
        );
        return response;
      },
    },

    broadcastQuestionPricing: {
      get: async (): Promise<{
        tiers: {
          id: string;
          questionCount: number;
          amountNr: number;
          createdAt: string;
          updatedAt: string;
        }[];
      }> => {
        const response = await apiClient.get<{ tiers: BroadcastQuestionPricingTier[] }>(
          API_ENDPOINTS.WEBSITE.BROADCAST_QUESTION_PRICING
        );
        return response;
      },
      update: async (
        tiers: { questionCount: number; amountNr: number }[]
      ): Promise<{
        tiers: BroadcastQuestionPricingTier[];
        message?: string;
      }> => {
        const response = await apiClient.put<{
          tiers: BroadcastQuestionPricingTier[];
          message?: string;
        }>(API_ENDPOINTS.WEBSITE.BROADCAST_QUESTION_PRICING, { tiers });
        return response;
      },
    },
  },

  jyotishBookings: {
    list: async (params?: {
      type?: JyotishBookingType;
      status?: JyotishBookingStatus;
      page?: number;
      limit?: number;
      search?: string;
    }): Promise<ListJyotishBookingsResponse> => {
      const response = await apiClient.get<ListJyotishBookingsResponse>(
        API_ENDPOINTS.JYOTISH_BOOKINGS.LIST,
        {
          params,
        }
      );
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
    list: async (params?: ListAppointmentsParams): Promise<ListAppointmentsResponse> => {
      return apiClient.get<ListAppointmentsResponse>(API_ENDPOINTS.APPOINTMENTS.LIST, {
        params,
      });
    },
    cancel: async (id: string, data?: CancelAppointmentPayload): Promise<Appointment> => {
      return apiClient.post<Appointment>(API_ENDPOINTS.APPOINTMENTS.CANCEL(id), data ?? {});
    },
  },

  paymentHistory: {
    list: async (params?: { page?: number; limit?: number }) => {
      return apiClient.get<AdminPaymentHistoryResponse>(
        API_ENDPOINTS.PAYMENT_HISTORY.LIST,
        { params }
      );
    },
  },

  /**
   * Kundali Match
   */
  kundaliMatch: {
    list: async (params?: {
      page?: number;
      limit?: number;
      status?: string;
    }): Promise<{
      requests: import('@/types/kundaliMatch.types').KundaliMatchRequest[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }> => {
      return apiClient.get(API_ENDPOINTS.KUNDALI_MATCH.LIST, { params });
    },
    get: async (
      id: string
    ): Promise<{ request: import('@/types/kundaliMatch.types').KundaliMatchRequest }> => {
      return apiClient.get(API_ENDPOINTS.KUNDALI_MATCH.GET(id));
    },
    submitReview: async (
      id: string,
      body: { adminReviewMessage: string }
    ): Promise<{ request: import('@/types/kundaliMatch.types').KundaliMatchRequest }> => {
      return apiClient.post(API_ENDPOINTS.KUNDALI_MATCH.SUBMIT_REVIEW(id), body);
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
   * Horoscopes (admin CRUD)
   */
  horoscopes: {
    list: async (
      params?: import('@/types').ListHoroscopesParams
    ): Promise<import('@/types').ListHoroscopesResponse> => {
      const response = await apiClient.get<import('@/types').ListHoroscopesResponse>(
        API_ENDPOINTS.HOROSCOPES.LIST,
        { params }
      );
      return response;
    },

    get: async (id: string): Promise<{ horoscope: import('@/types').AdminHoroscopeEntry }> => {
      const response = await apiClient.get<{ horoscope: import('@/types').AdminHoroscopeEntry }>(
        API_ENDPOINTS.HOROSCOPES.GET(id)
      );
      return response;
    },

    createBulk: async (
      data: import('@/types').CreateHoroscopesBulkRequest
    ): Promise<{ horoscopes: import('@/types').AdminHoroscopeEntry[] }> => {
      const response = await apiClient.post<{
        horoscopes: import('@/types').AdminHoroscopeEntry[];
      }>(API_ENDPOINTS.HOROSCOPES.BULK_CREATE, data);
      return response;
    },

    update: async (
      id: string,
      data: import('@/types').UpdateHoroscopeRequest
    ): Promise<{ horoscope: import('@/types').AdminHoroscopeEntry }> => {
      const response = await apiClient.patch<{ horoscope: import('@/types').AdminHoroscopeEntry }>(
        API_ENDPOINTS.HOROSCOPES.UPDATE(id),
        data
      );
      return response;
    },

    delete: async (id: string): Promise<{ message: string }> => {
      const response = await apiClient.delete<{ message: string }>(
        API_ENDPOINTS.HOROSCOPES.DELETE(id)
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
      const response = await apiClient.get<AdminChatListResponse>(API_ENDPOINTS.ADMIN_CHAT.LIST, {
        params,
      });
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

    sendMessage: async (
      id: string,
      data: {
        content?: string;
        type?: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO';
        metadata?: {
          fileUrl?: string;
          fileName?: string;
          mimeType?: string;
          fileSize?: number;
        };
      }
    ): Promise<{ message: AdminChatMessage }> => {
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

    updateStatus: async (
      id: string,
      status: 'ACTIVE' | 'RESOLVED' | 'CLOSED'
    ): Promise<{ chat: AdminChat }> => {
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
