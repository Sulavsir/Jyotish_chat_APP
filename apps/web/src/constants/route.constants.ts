/**
 * Route Constants
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

  // Jyotish (Astrologer) Routes
  JYOTISH_DASHBOARD: '/jyotish/dashboard',
  JYOTISH_CHAT: '/jyotish/chat',
  JYOTISH_CONSULTATIONS: '/jyotish/consultations',
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
