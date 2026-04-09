/**
 * TanStack Query Keys Constants
 * Centralized query keys for React Query
 */

import type { AstrologerListParams } from '@/types/astrologer';

export const QUERY_KEYS = {
  /** App version + maintenance flag from GET /api/version */
  APP_VERSION: ['app', 'version'] as const,

  // Auth
  AUTH: {
    ME: ['auth', 'me'] as const,
    ASTROLOGER_ME: ['auth', 'astrologer', 'me'] as const,
    /** One-shot profile fetch after OAuth redirect (cookies set by API) */
    OAUTH_COMPLETE: (provider: 'google' | 'facebook') =>
      ['auth', 'oauth-complete', provider] as const,
  },

  // Dashboard
  DASHBOARD: {
    ROTATING_COPY: ['dashboard', 'rotating-copy'] as const,
  },

  // Client Dashboard (consolidated stats)
  CLIENT_DASHBOARD: {
    STATS: (language?: string) =>
      language ? (['client-dashboard', 'stats', language] as const) : (['client-dashboard', 'stats'] as const),
  },

  // Jyotish Bookings
  JYOTISH_BOOKINGS: {
    ALL: ['jyotish-bookings'] as const,
    MY_LIST: (filters: {
      page: number;
      limit: number;
      search?: string;
      type?: string;
      status?: string;
    }) => ['jyotish-bookings', 'my', filters] as const,
  },

  // Kundali Match
  KUNDALI_MATCH: {
    ALL: ['kundali-match'] as const,
    MY_LIST: (filters: { page: number; limit: number; status?: string }) =>
      ['kundali-match', 'my', filters] as const,
  },

  // Appointments
  APPOINTMENTS: {
    ALL: ['appointments'] as const,
    LIST: (filters?: { status?: string }) =>
      filters?.status
        ? (['appointments', 'list', { status: filters.status }] as const)
        : (['appointments', 'list'] as const),
    MY_LIST: (filters: {
      page: number;
      limit: number;
      search?: string;
      status?: string;
      statuses?: string;
    }) => ['appointments', 'my', filters] as const,
    DETAIL: (id: string) => ['appointments', 'detail', id] as const,
    AVAILABILITY: (astrologerId: string, date: string) =>
      ['appointments', 'availability', astrologerId, date] as const,
    SLOTS: (astrologerId: string, slotType: string, fromDate?: string, toDate?: string) =>
      ['appointments', 'slots', astrologerId, slotType, fromDate, toDate] as const,
    BOOKING_QUOTE: (p: { astrologerId: string; slotId: string; bookingType: string }) =>
      ['appointments', 'booking-quote', p] as const,
    ASTROLOGERS_FOR_APPOINTMENT: ['appointments', 'astrologers'] as const,
  },

  // Consultations
  CONSULTATIONS: {
    ALL: ['consultations'] as const,
    MY: ['consultations', 'my'] as const,
    DETAIL: (id: string) => ['consultations', 'detail', id] as const,
  },

  // Chat
  CHAT: {
    CONVERSATIONS: ['chat', 'conversations'] as const,
    /** GET /api/v1/chat/active-chat — client active conversation guard */
    ACTIVE_CHAT: ['chat', 'active'] as const,
    HISTORY: (userId: string) => ['chat', 'history', userId] as const,
    /** GET /api/v1/chat/unread-count — total unread messages for current user (jyotish nav badge) */
    UNREAD_COUNT: ['chat', 'unread-count'] as const,
  },

  // Client Chat History (astrologer-only, anonymous aggregated)
  CLIENT_CHAT_HISTORY: {
    HAS_HISTORY: (clientId: string) => ['client-chat-history', 'has', clientId] as const,
    LIST: (clientId: string, cursor?: string | null) =>
      cursor
        ? (['client-chat-history', 'list', clientId, cursor] as const)
        : (['client-chat-history', 'list', clientId] as const),
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
      params ? (['notifications', 'list', params] as const) : (['notifications', 'list'] as const),
    UNREAD_COUNT: ['notifications', 'unread-count'] as const,
  },

  // Horoscope
  HOROSCOPE: {
    MY_HOROSCOPE: (language?: string) =>
      language ? (['horoscope', 'my-horoscope', language] as const) : (['horoscope', 'my-horoscope'] as const),
    BATCH: (category: string, date?: string, language?: string) =>
      ['horoscope', 'batch', category, date ?? '', language ?? ''] as const,
    GET: (sign: string, category: string, date?: string, language?: string) =>
      ['horoscope', sign, category, date ?? '', language ?? ''] as const,
  },

  // Tips (daily dashboard tips)
  TIPS: {
    TODAY: (audience: string, language: string) =>
      ['tips', 'today', audience, language] as const,
  },

  // Questionnaires (question categories and questions)
  PUBLIC_QUESTIONNAIRES: (language?: string) =>
    language
      ? (['public', 'questionnaires', language] as const)
      : (['public', 'questionnaires'] as const),

  // Astrologers
  ASTROLOGERS: {
    LIST: (filters?: AstrologerListParams) =>
      filters ? (['astrologers', 'list', filters] as const) : (['astrologers', 'list'] as const),
    DETAIL: (id: string) => ['astrologers', 'detail', id] as const,
    PROFILE: ['astrologers', 'profile'] as const,
    ONLINE_STATUS: ['astrologers', 'online-status'] as const,
    STATS: ['astrologers', 'stats'] as const,
  },

  // Users
  USERS: {
    CHATABLE: ['users', 'chatable'] as const,
    CLIENT_DETAILS: (clientId: string) => ['users', 'client-details', clientId] as const,
    PROFILES: ['users', 'profiles'] as const,
  },

  // Complaints
  COMPLAINTS: {
    ALL: ['complaints'] as const,
    LIST: (filters?: { status?: string }) =>
      filters?.status
        ? (['complaints', 'list', { status: filters.status }] as const)
        : (['complaints', 'list'] as const),
    DETAIL: (id: string) => ['complaints', 'detail', id] as const,
  },

  // Ratings
  RATINGS: {
    ALL: ['ratings'] as const,
    MY_RATINGS: ['ratings', 'my-ratings'] as const,
    ASTROLOGER: (astrologerId: string, params?: { limit?: number; page?: number }) =>
      params
        ? (['ratings', 'astrologer', astrologerId, params] as const)
        : (['ratings', 'astrologer', astrologerId] as const),
    CHAT: (chatId: string) => ['ratings', 'chat', chatId] as const,
    CAN_RATE: (chatId: string) => ['ratings', 'can-rate', chatId] as const,
    ASTROLOGER_STATS: (astrologerId: string) =>
      ['ratings', 'astrologer-stats', astrologerId] as const,
  },

  // Broadcast messages (Channel Jyotish)
  BROADCAST: {
    MY_MESSAGES: ['broadcast', 'my-messages'] as const,
    PENDING: ['broadcast', 'pending'] as const,
    ALL: ['broadcast', 'all'] as const,
    QUESTION_PRICING: ['broadcast', 'question-pricing'] as const,
  },

  // Coins
  COINS: {
    BALANCE: ['coins', 'balance'] as const,
    RATES: ['coins', 'rates'] as const,
    TRANSACTIONS: (params?: { page?: number; limit?: number; filter?: string }) =>
      params ? (['coins', 'transactions', params] as const) : (['coins', 'transactions'] as const),
    TRANSACTION_HISTORY: ['coins', 'transactions', 'history'] as const,
  },

  // Pricing
  PRICING: {
    PLANS: ['pricing', 'plans'] as const,
  },

  // Admin Chat
  ADMIN_CHAT: {
    MY: ['admin-chat', 'my'] as const,
    DETAIL: (chatId: string) => ['admin-chat', 'detail', chatId] as const,
    MESSAGES: (chatId: string, params?: { page?: number; limit?: number }) =>
      params
        ? (['admin-chat', 'messages', chatId, params] as const)
        : (['admin-chat', 'messages', chatId] as const),
  },

  // Jyotish Dashboard
  JYOTISH_DASHBOARD: {
    STATS: ['jyotish-dashboard', 'stats'] as const,
    ONLINE_ASTROLOGERS: ['jyotish-dashboard', 'online-astrologers'] as const,
    RECENT_ACTIVITY: (limit?: number) =>
      limit
        ? (['jyotish-dashboard', 'recent-activity', limit] as const)
        : (['jyotish-dashboard', 'recent-activity'] as const),
  },
  // Jyotish My Earnings
  JYOTISH_EARNINGS: {
    LIST: (params?: Record<string, unknown>) =>
      params ? (['jyotish-earnings', params] as const) : (['jyotish-earnings'] as const),
  },
  // Admin coin rates
  ADMIN_COIN_RATES: ['admin', 'coin-rates'] as const,

  // Fonepay QR payments
  FONEPAY: {
    STATUS: (prn: string) => ['fonepay', 'status', prn] as const,
  },

  // Client payments (SUCCESS only)
  PAYMENTS: {
    MY_SUCCESSFUL: (params?: { page?: number; limit?: number }) =>
      params
        ? (['payments', 'my-successful', params] as const)
        : (['payments', 'my-successful'] as const),
  },

  // Subha Sahit (auspicious dates)
  SUBHA_SAHIT: {
    AVAILABLE: (params?: { occasion?: string; dateFrom?: string; dateTo?: string; language?: string }) =>
      params ? (['subha-sahit', 'available', params] as const) : (['subha-sahit', 'available'] as const),
    OCCASIONS: (language?: string) =>
      language ? (['subha-sahit', 'occasions', language] as const) : (['subha-sahit', 'occasions'] as const),
  },

  // Nepali date (English ↔ Bikram Sambat)
  NEPALI_DATE: {
    BY_DATE: (date: string) => ['nepali-date', date] as const,
    CONVERT: (dates: string[]) => ['nepali-date', 'convert', dates] as const,
    AD_MONTH: (year: number, month: number) => ['nepali-date', 'ad-month', year, month] as const,
    BS_MONTH: (year: number, month: number) => ['nepali-date', 'bs-month', year, month] as const,
  },

  // Location (Nepal provinces & districts)
  LOCATION: {
    PROVINCES: ['location', 'provinces'] as const,
    DISTRICTS: (provinceId: string) => ['location', 'districts', provinceId] as const,
  },
} as const;
