// Use direct backend URL to avoid Next.js proxy issues with POST/credentials
// The backend has CORS properly configured to accept requests from localhost:5000
export const API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_API_URL || ''
    : typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:4000`
      : 'http://localhost:4000'; // Always match current host in dev

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
    VERIFY_EDIT_PASSWORD: '/api/v1/admin/astrologers/verify-edit-password',
    GET: (id: string) => `/api/v1/admin/astrologers/${id}`,
    UPDATE: (id: string) => `/api/v1/admin/astrologers/${id}`,
    PROOF_UPLOAD: (id: string) => `/api/v1/admin/astrologers/${id}/proof-upload`,
    PROFILE_PHOTO: (id: string) => `/api/v1/admin/astrologers/${id}/profile-photo`,
    DELETE: (id: string) => `/api/v1/admin/astrologers/${id}`,
    TOGGLE_STATUS: (id: string) => `/api/v1/admin/astrologers/${id}/toggle-status`,
    // Registration Requests
    REGISTRATION_REQUESTS: '/api/v1/admin/astrologers/registration-requests',
    APPROVE_REGISTRATION: (id: string) => `/api/v1/admin/astrologers/${id}/approve-registration`,
    REJECT_REGISTRATION: (id: string) => `/api/v1/admin/astrologers/${id}/reject-registration`,
  },

  USERS: {
    // Users
    LIST: '/api/v1/admin/users',
    GET: (id: string) => `/api/v1/admin/users/${id}`,
    UPDATE: (id: string) => `/api/v1/admin/users/${id}`,
    TOGGLE_STATUS: (id: string) => `/api/v1/admin/users/${id}/toggle-status`,
    ADD_COINS: (id: string) => `/api/v1/admin/users/${id}/add-coins`,
  },

  AUDIT_LOGS: {
    // Audit Logs
    LIST: '/api/v1/admin/audit-logs',
    BY_USER: (userId: string) => `/api/v1/admin/audit-logs/user/${userId}`,
    BY_ASTROLOGER: (astrologerId: string) => `/api/v1/admin/audit-logs/astrologer/${astrologerId}`,
  },

  CHAT_AUDIT: {
    // Chat Audit
    LIST: '/api/v1/admin/chat-audit',
    STATS: '/api/v1/admin/chat-audit/stats',
  },

  CHATS: {
    // Chats
    LIST: '/api/v1/admin/chats',
    GET: (chatId: string) => `/api/v1/admin/chats/${chatId}`,
    MESSAGES: (chatId: string) => `/api/v1/admin/chats/${chatId}/messages`,
    ABANDON: (chatId: string) => `/api/v1/admin/chats/${chatId}/abandon`,
    UNBLOCK: (chatId: string) => `/api/v1/admin/chats/${chatId}/unblock`,
  },

  EARNINGS: {
    // Earnings
    LIST: '/api/v1/admin/earnings',
    ASTROLOGERS_WITH_COINS: '/api/v1/admin/earnings/astrologers-with-coins',
    BY_ASTROLOGER: (astrologerId: string) => `/api/v1/admin/earnings/astrologer/${astrologerId}`,
    PAYOUT: (earningId: string) => `/api/v1/admin/earnings/${earningId}/payout`,
  },

  COIN_RATES: {
    LIST: '/api/v1/admin/coin-rates',
    UPDATE: '/api/v1/admin/coin-rates',
  },

  DASHBOARD: {
    // Dashboard Stats
    STATS: '/api/v1/admin/dashboard/stats',
    // Website content (dashboard rotating copy)
    ROTATING_COPY: '/api/v1/admin/dashboard/rotating-copy',
    ROTATING_COPY_BY_ID: (id: string) => `/api/v1/admin/dashboard/rotating-copy/${id}`,
    ROTATING_COPY_TOGGLE: (id: string) => `/api/v1/admin/dashboard/rotating-copy/${id}/toggle`,
  },

  WEBSITE: {
    QUESTIONNAIRES: '/api/v1/admin/questionnaires',
    QUESTIONNAIRE_BY_ID: (id: string) => `/api/v1/admin/questionnaires/${id}`,
  },

  JYOTISH_BOOKINGS: {
    LIST: '/api/v1/admin/jyotish-bookings',
    UPDATE_STATUS: (id: string) => `/api/v1/admin/jyotish-bookings/${id}/status`,
  },

  APPOINTMENTS: {
    // Appointments
    LIST: '/api/v1/admin/appointments',
    GET: (id: string) => `/api/v1/admin/appointments/${id}`,
    STATS: '/api/v1/admin/appointments/stats',
    CANCEL: (id: string) => `/api/v1/admin/appointments/${id}/cancel`,
  },

  KUNDALI_MATCH: {
    LIST: '/api/v1/admin/kundali-match',
    GET: (id: string) => `/api/v1/admin/kundali-match/${id}`,
    SUBMIT_REVIEW: (id: string) => `/api/v1/admin/kundali-match/${id}/review`,
  },

  PRICING: {
    // Pricing Plans
    LIST: '/api/v1/admin/pricing',
    GET: (id: string) => `/api/v1/admin/pricing/${id}`,
    CREATE: '/api/v1/admin/pricing',
    UPDATE: (id: string) => `/api/v1/admin/pricing/${id}`,
    DELETE: (id: string) => `/api/v1/admin/pricing/${id}`,
    TOGGLE: (id: string) => `/api/v1/admin/pricing/${id}/toggle`,
  },

  COMPLAINTS: {
    // User Complaints
    LIST: '/api/v1/admin/complaints',
    STATS: '/api/v1/admin/complaints/stats',
    DETAIL: (id: string) => `/api/v1/admin/complaints/${id}`,
    UPDATE_STATUS: (id: string) => `/api/v1/admin/complaints/${id}/status`,
    RESOLVE: (id: string) => `/api/v1/admin/complaints/${id}/resolve`,
    DISMISS: (id: string) => `/api/v1/admin/complaints/${id}/dismiss`,
  },

  ADMIN_CHAT: {
    // Admin Chat (Support Widget)
    LIST: '/api/v1/admin-chat/admin/all',
    UNREAD_COUNT: '/api/v1/admin-chat/admin/unread-count',
    UPLOAD_FILE: '/api/v1/admin-chat/upload-file',
    GET: (id: string) => `/api/v1/admin-chat/${id}`,
    MESSAGES: (id: string) => `/api/v1/admin-chat/${id}/messages`,
    SEND_MESSAGE: (id: string) => `/api/v1/admin-chat/${id}/messages`,
    MARK_READ: (id: string) => `/api/v1/admin-chat/${id}/read`,
    UPDATE_STATUS: (id: string) => `/api/v1/admin-chat/admin/${id}/status`,
    ASSIGN: (id: string) => `/api/v1/admin-chat/admin/${id}/assign`,
  },
};
