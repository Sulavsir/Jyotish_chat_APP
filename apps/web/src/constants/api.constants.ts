/**
 * API Configuration Constants
 */

// API Base URLs
// Use direct backend URL to avoid Next.js proxy issues with POST/credentials
// The backend has CORS properly configured to accept requests from localhost:3000
export const API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_API_URL || ''
    : typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:4000`
      : 'http://localhost:4000'; // Always match current host in dev

// WebSocket URL - Dynamically use current hostname to support both localhost and network IP
// This ensures sockets work on any device accessing the app
export const WS_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_WS_URL ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000')
    : typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:4000` // Use current hostname (localhost or network IP)
      : 'http://localhost:4000'; // SSR fallback

// API Endpoints
export const API_ENDPOINTS = {
  PUBLIC: {
    DASHBOARD_ROTATING_COPY: '/api/v1/public/dashboard-rotating-copy',
  },
  JYOTISH_BOOKINGS: {
    CREATE: '/api/v1/jyotish-bookings',
    MY: '/api/v1/jyotish-bookings/my',
  },
  AUTH: {
    CHECK_PHONE: '/api/v1/auth/check-phone',
    SEND_OTP: '/api/v1/auth/send-otp',
    VERIFY_OTP: '/api/v1/auth/verify-otp',
    SET_PASSWORD: '/api/v1/auth/set-password',
    LOGIN: '/api/v1/auth/login',
    LOGIN_WITH_OTP: '/api/v1/auth/login-with-otp',
    VERIFY_LOGIN_OTP: '/api/v1/auth/verify-login-otp',
    LOGOUT: '/api/v1/auth/logout',
    LOGOUT_ALL: '/api/v1/auth/logout-all',
    REFRESH: '/api/v1/auth/refresh',
    CHANGE_PASSWORD: '/api/v1/auth/change-password',
    SET_PASSWORD_EXISTING: '/api/v1/auth/set-password-existing',
  },
  USER: {
    ME: '/api/v1/users/me',
    UPDATE: '/api/v1/users/me',
    PROFILE_SETUP: '/api/v1/users/profile-setup',
    UPLOAD_PHOTO: '/api/v1/users/upload-photo',
    REMOVE_PHOTO: '/api/v1/users/remove-photo',
    BIRTH_DETAILS: '/api/v1/users/me/birth-details',
    CHATABLE: '/api/v1/users/chatable',
    PROFILES: '/api/v1/users/profiles',
    PROFILE_BY_ID: (id: string) => `/api/v1/users/profiles/${id}`,
  },
  CHAT: {
    HISTORY: (userId: string) => `/api/v1/chat/history/${userId}`,
    CONVERSATIONS: '/api/v1/chat/conversations',
    CHATS: '/api/v1/chat/chats',
    CHAT_BY_ID: (chatId: string) => `/api/v1/chat/chats/${chatId}`,
    END_CHAT: (chatId: string) => `/api/v1/chat/chats/${chatId}/end`,
    MARK_READ: (chatId: string) => `/api/v1/chat/chats/${chatId}/read`,
    MESSAGES: '/api/v1/chat/messages',
    MESSAGE_BY_ID: (messageId: string) => `/api/v1/chat/messages/${messageId}`,
    UNREAD_COUNT: '/api/v1/chat/unread-count',
    SEARCH: '/api/v1/chat/search',
    UPLOAD_FILE: '/api/v1/chat/upload-file',
    ACTIVE_CHAT: '/api/v1/chat/active-chat',
  },
  BROADCAST: {
    MESSAGES: '/api/v1/broadcast-messages',
    PENDING: '/api/v1/broadcast-messages/pending',
    ALL: '/api/v1/broadcast-messages/all',
    MY_MESSAGES: '/api/v1/broadcast-messages/my-messages',
    ACCEPT: (messageId: string) => `/api/v1/broadcast-messages/${messageId}/accept`,
    CANCEL: (messageId: string) => `/api/v1/broadcast-messages/${messageId}/cancel`,
    DISMISS: (messageId: string) => `/api/v1/broadcast-messages/${messageId}/dismiss`,
    MESSAGE_BY_ID: (messageId: string) => `/api/v1/broadcast-messages/${messageId}`,
  },
  CONSULTATIONS: {
    CREATE: '/api/v1/consultations',
    MY: '/api/v1/consultations/my',
    UPDATE: (id: string) => `/api/v1/consultations/${id}`,
  },
  HOROSCOPE: {
    GET: '/api/v1/horoscopes',
    MY_DAILY: '/api/v1/horoscopes/my-daily',
    SUBSCRIBE: '/api/v1/horoscopes/subscribe',
    UNSUBSCRIBE: '/api/v1/horoscopes/unsubscribe',
  },
  QUESTIONNAIRES: {
    PUBLIC_LIST: '/api/v1/public/questionnaires',
  },
  NOTIFICATIONS: {
    LIST: '/api/v1/notifications',
    READ: (id: string) => `/api/v1/notifications/${id}/read`,
    READ_ALL: '/api/v1/notifications/read-all',
  },
  ASTROLOGER: {
    LOGIN: '/api/v1/astrologer/auth/login',
    REGISTER: '/api/v1/astrologer/register',
    LOGOUT: '/api/v1/astrologer/auth/logout',
    ME: '/api/v1/astrologer/auth/me',
    CHANGE_PASSWORD: '/api/v1/astrologer/auth/change-password',
    LIST: '/api/v1/public/astrologers',
    TOGGLE_ONLINE: '/api/v1/astrologer/toggle-online',
    AUTH_ME: '/api/v1/astrologer/auth/me',
    PROFILE: (id: string) => `/api/v1/public/astrologers/${id}`,
    STATS: '/api/v1/public/astrologers/stats',
  },
  NOTIFICATION_SETTINGS: {
    GET: '/api/v1/notification-settings',
    UPDATE: '/api/v1/notification-settings',
    TOGGLE: '/api/v1/notification-settings/toggle',
  },
  APPOINTMENTS: {
    CREATE: '/api/v1/appointments',
    MY: '/api/v1/appointments/my',
    DETAIL: (id: string) => `/api/v1/appointments/${id}`,
    UPDATE: (id: string) => `/api/v1/appointments/${id}`,
    CANCEL: (id: string) => `/api/v1/appointments/${id}/cancel`,
    CONFIRM: (id: string) => `/api/v1/appointments/${id}/confirm`,
    AVAILABILITY: (astrologerId: string) => `/api/v1/appointments/availability/${astrologerId}`,
  },
  COMPLAINTS: {
    CREATE: '/api/v1/complaints',
    LIST: '/api/v1/complaints',
    DETAIL: (id: string) => `/api/v1/complaints/${id}`,
  },
  RATINGS: {
    CREATE: '/api/v1/ratings',
    MY_RATINGS: '/api/v1/ratings/my-ratings',
    CAN_RATE: (chatId: string) => `/api/v1/ratings/can-rate/${chatId}`,
    CHAT: (chatId: string) => `/api/v1/ratings/chat/${chatId}`,
    ASTROLOGER: (astrologerId: string) => `/api/v1/ratings/astrologer/${astrologerId}`,
    ASTROLOGER_STATS: (astrologerId: string) => `/api/v1/ratings/astrologer/${astrologerId}/stats`,
  },
  COINS: {
    BALANCE: '/api/v1/coins/balance',
    ADD: '/api/v1/coins/add',
    TRANSACTIONS: '/api/v1/coins/transactions',
  },
  PRICING: '/api/v1/pricing',
  ADMIN_CHAT: {
    BASE: '/api/v1/admin-chat',
    CREATE: '/api/v1/admin-chat',
    MY: '/api/v1/admin-chat/my',
    BY_ID: (id: string) => `/api/v1/admin-chat/${id}`,
    MESSAGES: (id: string) => `/api/v1/admin-chat/${id}/messages`,
    SEND_MESSAGE: (id: string) => `/api/v1/admin-chat/${id}/messages`,
    UPLOAD_FILE: '/api/v1/admin-chat/upload-file',
    MARK_READ: (id: string) => `/api/v1/admin-chat/${id}/read`,
  },
} as const;
