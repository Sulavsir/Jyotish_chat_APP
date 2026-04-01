/**
 * API Configuration Constants
 */

import { AUTH_OAUTH_API_PATHS } from '@jyotish/shared';

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

/** GET /api/version – not under /api/v1; includes `maintenance` flag when API has MAINTENANCE_MODE. */
export const API_VERSION_PATH = '/api/version';

// API Endpoints
export const API_ENDPOINTS = {
  PUBLIC: {
    DASHBOARD_ROTATING_COPY: '/api/v1/public/dashboard-rotating-copy',
    NEPALI_DATE: '/api/v1/public/nepali-date',
    NEPALI_DATE_CONVERT: '/api/v1/public/nepali-date/convert',
    NEPALI_DATE_AD_MONTH: '/api/v1/public/nepali-date/ad-month',
    NEPALI_DATE_BS_MONTH: '/api/v1/public/nepali-date/bs-month',
    LOCATION_PROVINCES: '/api/v1/public/location/provinces',
    LOCATION_DISTRICTS: (provinceId: string) =>
      `/api/v1/public/location/provinces/${provinceId}/districts`,
  },
  JYOTISH_BOOKINGS: {
    CREATE: '/api/v1/jyotish-bookings',
    MY: '/api/v1/jyotish-bookings/my',
  },
  KUNDALI_MATCH: {
    CREATE: '/api/v1/kundali-match',
    MY: '/api/v1/kundali-match/my',
  },
  AUTH: {
    ...AUTH_OAUTH_API_PATHS,
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
    FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
    RESET_PASSWORD_TOKEN: '/api/v1/auth/reset-password-token',
    RESET_PASSWORD_OTP: '/api/v1/auth/reset-password-otp',
    VERIFY_PASSWORD_RESET_OTP: '/api/v1/auth/verify-password-reset-otp',
  },
  USER: {
    ME: '/api/v1/users/me',
    DASHBOARD_STATS: '/api/v1/users/dashboard/stats',
    UPDATE: '/api/v1/users/me',
    PROFILE_SETUP: '/api/v1/users/profile-setup',
    UPLOAD_PHOTO: '/api/v1/users/upload-photo',
    REMOVE_PHOTO: '/api/v1/users/remove-photo',
    DELETE_ACCOUNT: '/api/v1/users/me/delete-account',
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
    SEND_DIRECT_QUESTION_BUNDLE: '/api/v1/chat/send-direct-question-bundle',
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
    QUESTION_PRICING: '/api/v1/broadcast-messages/question-pricing',
    PREPARE_QUESTIONS: '/api/v1/broadcast-messages/prepare-questions',
    SEND_QUESTIONS: '/api/v1/broadcast-messages/send-questions',
  },
  CONSULTATIONS: {
    CREATE: '/api/v1/consultations',
    MY: '/api/v1/consultations/my',
    UPDATE: (id: string) => `/api/v1/consultations/${id}`,
  },
  TIPS: {
    TODAY: '/api/v1/tips/today',
  },
  SUBHA_SAHIT: {
    AVAILABLE: '/api/v1/subha-sahit/available',
    OCCASIONS: '/api/v1/subha-sahit/occasions',
  },
  HOROSCOPE: {
    DAILY: (zodiacSign: string) => `/api/v1/horoscopes/daily/${encodeURIComponent(zodiacSign)}`,
    WEEKLY: (zodiacSign: string) => `/api/v1/horoscopes/weekly/${encodeURIComponent(zodiacSign)}`,
    MONTHLY: (zodiacSign: string) => `/api/v1/horoscopes/monthly/${encodeURIComponent(zodiacSign)}`,
    YEARLY: (zodiacSign: string) => `/api/v1/horoscopes/yearly/${encodeURIComponent(zodiacSign)}`,
    BATCH: '/api/v1/horoscopes',
    MY_HOROSCOPE: '/api/v1/horoscopes/my-horoscope',
    SUBSCRIBE: '/api/v1/horoscopes/subscribe',
    UNSUBSCRIBE: '/api/v1/horoscopes/unsubscribe',
    SUBSCRIPTION: '/api/v1/horoscopes/subscription',
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
    /** PATCH — self-service profile (jyotish app); returns same shape as GET ME */
    PATCH_ME: '/api/v1/astrologer/auth/me',
    /** POST upload / DELETE remove profile photo (astrologer row) */
    ME_PHOTO: '/api/v1/astrologer/auth/me/photo',
    CHANGE_PASSWORD: '/api/v1/astrologer/auth/change-password',
    FORGOT_PASSWORD: '/api/v1/astrologer/auth/forgot-password',
    RESET_PASSWORD_TOKEN: '/api/v1/astrologer/auth/reset-password-token',
    RESET_PASSWORD_OTP: '/api/v1/astrologer/auth/reset-password-otp',
    VERIFY_PASSWORD_RESET_OTP: '/api/v1/astrologer/auth/verify-password-reset-otp',
    LIST: '/api/v1/public/astrologers',
    TOGGLE_ONLINE: '/api/v1/astrologer/toggle-online',
    AUTH_ME: '/api/v1/astrologer/auth/me',
    PROFILE: (id: string) => `/api/v1/public/astrologers/${id}`,
    STATS: '/api/v1/public/astrologers/stats',
    EARNINGS: '/api/v1/astrologer/earnings',
    DASHBOARD_STATS: '/api/v1/astrologer/dashboard/stats',
    SLOTS: '/api/v1/astrologer/slots',
    SLOTS_BULK: '/api/v1/astrologer/slots/bulk',
    SLOT_BY_ID: (id: string) => `/api/v1/astrologer/slots/${id}`,
    CLIENT_CHAT_HISTORY: '/api/v1/astrologer/client/chat-history',
    CLIENT_HAS_CHAT_HISTORY: (clientId: string) =>
      `/api/v1/astrologer/client/${clientId}/has-chat-history`,
  },
  ADMIN: {
    COIN_RATES: '/api/v1/admin/coin-rates',
  },
  NOTIFICATION_SETTINGS: {
    GET: '/api/v1/notification-settings',
    UPDATE: '/api/v1/notification-settings',
    TOGGLE: '/api/v1/notification-settings/toggle',
  },
  APPOINTMENTS: {
    BOOKING_QUOTE: '/api/v1/appointments/booking-quote',
    CREATE: '/api/v1/appointments',
    MY: '/api/v1/appointments/my',
    DETAIL: (id: string) => `/api/v1/appointments/${id}`,
    UPDATE: (id: string) => `/api/v1/appointments/${id}`,
    CANCEL: (id: string) => `/api/v1/appointments/${id}/cancel`,
    CONFIRM: (id: string) => `/api/v1/appointments/${id}/confirm`,
    AVAILABILITY: (astrologerId: string) => `/api/v1/appointments/availability/${astrologerId}`,
    SLOTS: (astrologerId: string) => `/api/v1/appointments/slots/${astrologerId}`,
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
    RATES: '/api/v1/coins/rates',
    ADD: '/api/v1/coins/add',
    TRANSACTIONS: '/api/v1/coins/transactions',
  },
  PAYMENTS: {
    CREATE_ORDER: '/api/v1/payments/create-order',
    VERIFY: '/api/v1/payments/verify',
    CREATE_FONEPAY_QR_ORDER: '/api/v1/payments/create-fonepay-qr-order',
    VERIFY_FONEPAY_QR: '/api/v1/payments/verify-fonepay-qr',
    CREATE_FONEPAY_CARD_ORDER: '/api/v1/payments/create-fonepay-card-order',
    MY_PAYMENTS: '/api/v1/payments/my-payments',
  },
  FONEPAY: {
    GENERATE_QR: '/api/v1/fonepay/generate-qr',
    CHECK_STATUS: '/api/v1/fonepay/check-status',
    TAX_REFUND: '/api/v1/fonepay/tax-refund',
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
