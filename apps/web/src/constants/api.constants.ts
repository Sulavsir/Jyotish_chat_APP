/**
 * API Configuration Constants
 */

// API Base URLs
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

// API Endpoints
export const API_ENDPOINTS = {
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
  },
  CHAT: {
    HISTORY: (userId: string) => `/api/v1/chat/history/${userId}`,
    CONVERSATIONS: '/api/v1/chat/conversations',
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
  NOTIFICATIONS: {
    LIST: '/api/v1/notifications',
    READ: (id: string) => `/api/v1/notifications/${id}/read`,
    READ_ALL: '/api/v1/notifications/read-all',
  },
} as const;
