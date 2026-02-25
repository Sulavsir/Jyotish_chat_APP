/**
 * TanStack Query Keys Constants for Admin Panel
 * Centralized query keys for React Query
 */

export const ADMIN_QUERY_KEYS = {
  // Astrologers
  ASTROLOGERS: {
    ALL: ['admin', 'astrologers'] as const,
    LIST: () => ['admin', 'astrologers', 'list'] as const,
    DETAIL: (id: string) => ['admin', 'astrologers', 'detail', id] as const,
    REGISTRATION_REQUESTS: () => ['admin', 'astrologers', 'registration-requests'] as const,
  },

  // Users
  USERS: {
    ALL: ['admin', 'users'] as const,
    LIST: () => ['admin', 'users', 'list'] as const,
    DETAIL: (id: string) => ['admin', 'users', 'detail', id] as const,
  },

  // Appointments
  APPOINTMENTS: {
    ALL: ['admin', 'appointments'] as const,
    LIST: () => ['admin', 'appointments', 'list'] as const,
    DETAIL: (id: string) => ['admin', 'appointments', 'detail', id] as const,
  },

  // Chats
  CHATS: {
    ALL: ['admin', 'chats'] as const,
    LIST: () => ['admin', 'chats', 'list'] as const,
    DETAIL: (id: string) => ['admin', 'chats', 'detail', id] as const,
  },

  // Chat Audit
  CHAT_AUDIT: {
    ALL: ['admin', 'chat-audit'] as const,
    LIST: () => ['admin', 'chat-audit', 'list'] as const,
  },

  // Audit Logs
  AUDIT_LOGS: {
    ALL: ['admin', 'audit-logs'] as const,
    LIST: () => ['admin', 'audit-logs', 'list'] as const,
  },

  // Earnings
  EARNINGS: {
    ALL: ['admin', 'earnings'] as const,
    LIST: () => ['admin', 'earnings', 'list'] as const,
    ASTROLOGERS_WITH_COINS: (params?: { page?: number; limit?: number; search?: string }) =>
      params
        ? (['admin', 'earnings', 'astrologers-with-coins', params] as const)
        : (['admin', 'earnings', 'astrologers-with-coins'] as const),
  },

  // Coin Rates (Coin Settings)
  COIN_RATES: {
    ALL: ['admin', 'coin-rates'] as const,
  },

  // Pricing
  PRICING: {
    ALL: ['admin', 'pricing'] as const,
    LIST: () => ['admin', 'pricing', 'list'] as const,
    DETAIL: (id: string) => ['admin', 'pricing', 'detail', id] as const,
  },

  // Horoscopes
  HOROSCOPES: {
    ALL: ['admin', 'horoscopes'] as const,
    LIST: (params?: { category?: string; zodiacSign?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }) =>
      params ? (['admin', 'horoscopes', 'list', params] as const) : (['admin', 'horoscopes', 'list'] as const),
    DETAIL: (id: string) => ['admin', 'horoscopes', 'detail', id] as const,
  },

  // Tips (Daily Predictions)
  TIPS: {
    ALL: ['admin', 'tips'] as const,
    LIST: (params?: { language?: string; audience?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }) =>
      params ? (['admin', 'tips', 'list', params] as const) : (['admin', 'tips', 'list'] as const),
    DETAIL: (id: string) => ['admin', 'tips', 'detail', id] as const,
  },

  // Subha Sahit (Auspicious Dates)
  SUBHA_SAHIT: {
    ALL: ['admin', 'subha-sahit'] as const,
    LIST: (params?: { occasion?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }) =>
      params ? (['admin', 'subha-sahit', 'list', params] as const) : (['admin', 'subha-sahit', 'list'] as const),
    OCCASIONS: (language?: string) =>
      language
        ? (['admin', 'subha-sahit', 'occasions', language] as const)
        : (['admin', 'subha-sahit', 'occasions'] as const),
    DETAIL: (id: string) => ['admin', 'subha-sahit', 'detail', id] as const,
  },

  // Dashboard Stats
  DASHBOARD: {
    STATS: () => ['admin', 'dashboard', 'stats'] as const,
  },

  // Website
  WEBSITE: {
    DASHBOARD_ROTATING_COPY: () => ['admin', 'website', 'dashboard', 'rotating-copy'] as const,
    QUESTIONNAIRES: () => ['admin', 'website', 'questionnaires'] as const,
    BROADCAST_QUESTION_PRICING: () => ['admin', 'website', 'broadcast-question-pricing'] as const,
  },

  // Jyotish Bookings
  JYOTISH_BOOKINGS: {
    LIST: (filters?: { type?: string; status?: string }) =>
      filters ? (['admin', 'jyotish-bookings', 'list', filters] as const) : (['admin', 'jyotish-bookings', 'list'] as const),
  },

  // Kundali Match
  KUNDALI_MATCH: {
    ALL: ['admin', 'kundali-match'] as const,
    LIST: (page?: number) => (page ? ['admin', 'kundali-match', 'list', page] as const : ['admin', 'kundali-match', 'list'] as const),
    DETAIL: (id: string) => ['admin', 'kundali-match', 'detail', id] as const,
  },

  // Complaints
  COMPLAINTS: {
    ALL: ['admin', 'complaints'] as const,
    LIST: (filters?: { status?: string; category?: string; priority?: string }) => 
      filters 
        ? ['admin', 'complaints', 'list', filters] as const
        : ['admin', 'complaints', 'list'] as const,
    STATS: () => ['admin', 'complaints', 'stats'] as const,
  },

  // Admin Chat
  ADMIN_CHAT: {
    ALL: ['admin', 'admin-chat'] as const,
    LIST: () => ['admin', 'admin-chat', 'list'] as const,
    DETAIL: (id: string) => ['admin', 'admin-chat', 'detail', id] as const,
    UNREAD_COUNT: () => ['admin', 'admin-chat', 'unread-count'] as const,
    MESSAGES: (id: string, params?: { page?: number; limit?: number }) =>
      params
        ? ['admin', 'admin-chat', 'messages', id, params] as const
        : ['admin', 'admin-chat', 'messages', id] as const,
  },
} as const;

