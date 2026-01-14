/**
 * Route Constants
 * Centralized route definitions for the application
 */

export const ROUTES = {
  // Public Routes
  HOME: '/',
  ABOUT: '/about',

  // Client Auth Routes
  LOGIN: '/auth/login',
  VERIFY_OTP: '/auth/verify-otp',
  SET_PASSWORD: '/auth/set-password',
  FORGOT_PASSWORD: '/auth/forgot-password',

  // Jyotish (Astrologer) Auth Routes
  JYOTISH_LOGIN: '/jyotish/login',
  JYOTISH_VERIFY_OTP: '/jyotish/verify-otp',
  JYOTISH_SET_PASSWORD: '/jyotish/set-password',
  JYOTISH_PROFILE_SETUP: '/jyotish/profile-setup',

  // Client Routes
  DASHBOARD: '/dashboard',
  CHAT: '/chat',
  CONSULTATIONS: '/consultations',
  HOROSCOPE: '/horoscope',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  PRICING: '/pricing',
  PAYMENT: '/payment',
  COIN_TRANSACTIONS: '/coins/transactions',
  ASTROLOGERS: '/astrologers',
  ASTROLOGER_PROFILE: '/astrologers/[id]',

  // Jyotish (Astrologer) Routes
  JYOTISH_DASHBOARD: '/jyotish/dashboard',
  JYOTISH_CHAT: '/jyotish/chat',
  JYOTISH_CONSULTATIONS: '/jyotish/consultations',
  JYOTISH_APPOINTMENTS: '/jyotish/appointments',
  JYOTISH_PROFILE: '/jyotish/profile',
  JYOTISH_SETTINGS: '/jyotish/settings',
  JYOTISH_CLIENTS: '/jyotish/clients',

  // Admin Routes
  ADMIN_DASHBOARD: '/admin/dashboard',

  // Other
  TERMS: '/terms',
  PRIVACY: '/privacy',

  // Error Pages
  UNAUTHORIZED: '/unauthorized',
  NOT_FOUND: '/not-found',
} as const;

/**
 * Helper function to build routes with query parameters
 */
export const buildRoute = (path: string, params?: Record<string, string | number | boolean>) => {
  if (!params) return path;

  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');

  return queryString ? `${path}?${queryString}` : path;
};

/**
 * Route builders with parameters
 */
export const ROUTE_BUILDERS = {
  CHAT_WITH_ID: (chatId: string) => buildRoute(ROUTES.CHAT, { chatId }),
  JYOTISH_CHAT_WITH_ID: (chatId: string) => buildRoute(ROUTES.JYOTISH_CHAT, { chatId }),
  ASTROLOGER_PROFILE: (id: string) => `/astrologers/${id}`,
} as const;
