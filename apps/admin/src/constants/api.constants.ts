export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const API_ENDPOINTS = {
  ADMIN: {
    // Auth
    LOGIN: '/api/v1/admin/auth/login',
    LOGOUT: '/api/v1/admin/auth/logout',
    ME: '/api/v1/admin/auth/me',
  },

  ASTROLOGERS: {
    // Astrologers
    LIST: '/api/v1/admin/astrologers',
    CREATE: '/api/v1/admin/astrologers',
    GET: (id: string) => `/api/v1/admin/astrologers/${id}`,
    UPDATE: (id: string) => `/api/v1/admin/astrologers/${id}`,
    DELETE: (id: string) => `/api/v1/admin/astrologers/${id}`,
    TOGGLE_STATUS: (id: string) => `/api/v1/admin/astrologers/${id}/toggle-status`,
  },

  USERS: {
    // Users
    LIST: '/api/v1/admin/users',
    GET: (id: string) => `/api/v1/admin/users/${id}`,
    UPDATE: (id: string) => `/api/v1/admin/users/${id}`,
    TOGGLE_STATUS: (id: string) => `/api/v1/admin/users/${id}/toggle-status`,
  },

  AUDIT_LOGS: {
    // Audit Logs
    LIST: '/api/v1/admin/audit-logs',
    BY_USER: (userId: string) => `/api/v1/admin/audit-logs/user/${userId}`,
    BY_ASTROLOGER: (astrologerId: string) => `/api/v1/admin/audit-logs/astrologer/${astrologerId}`,
  },

  CHATS: {
    // Chats
    LIST: '/api/v1/admin/chats',
    GET: (chatId: string) => `/api/v1/admin/chats/${chatId}`,
    MESSAGES: (chatId: string) => `/api/v1/admin/chats/${chatId}/messages`,
  },

  EARNINGS: {
    // Earnings
    LIST: '/api/v1/admin/earnings',
    BY_ASTROLOGER: (astrologerId: string) => `/api/v1/admin/earnings/astrologer/${astrologerId}`,
    PAYOUT: (earningId: string) => `/api/v1/admin/earnings/${earningId}/payout`,
  },

  DASHBOARD: {
    // Dashboard Stats
    STATS: '/api/v1/admin/stats',
  },
};
