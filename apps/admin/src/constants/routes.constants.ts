/**
 * Admin Routes Constants
 */

export const ADMIN_ROUTES = {
  // Auth
  LOGIN: '/admin/login',
  
  // Main Pages
  DASHBOARD: '/admin/dashboard',

  // Website
  WEBSITE: '/admin/website',
  WEBSITE_DASHBOARD_COPY: '/admin/website/dashboard-copy',
  WEBSITE_QUESTIONNAIRES: '/admin/website/questionnaires',

  // Jyotish Bookings
  JYOTISH_BOOKINGS: '/admin/jyotish-bookings',
  JYOTISH_BOOKINGS_PANDIT: '/admin/jyotish-bookings/pandit',
  JYOTISH_BOOKINGS_VAASTU: '/admin/jyotish-bookings/vaastu',
  JYOTISH_BOOKINGS_KATHA_VACHAK: '/admin/jyotish-bookings/katha-vachak',
  
  // Astrologers
  ASTROLOGERS: '/admin/astrologers',
  ASTROLOGERS_CREATE: '/admin/astrologers/create',
  ASTROLOGERS_EDIT: (id: string) => `/admin/astrologers/${id}/edit`,
  ASTROLOGERS_VIEW: (id: string) => `/admin/astrologers/${id}`,
  ASTROLOGERS_REGISTRATION_REQUESTS: '/admin/astrologers/registration-requests',
  
  // Users
  USERS: '/admin/users',
  USERS_VIEW: (id: string) => `/admin/users/${id}`,
  
  // Chats
  CHATS: '/admin/chats',
  CHATS_VIEW: (id: string) => `/admin/chats/${id}`,
  
  // Audit Logs
  AUDIT_LOGS: '/admin/audit-logs',
  
  // Chat Audit
  CHAT_AUDIT: '/admin/chat-audit',

  /** Broadcast acceptances per astrologer (date range) */
  ASTROLOGER_REPORTS: '/admin/astrologer-reports',
  
  // Admin Chats (Support Widget)
  ADMIN_CHATS: '/admin/admin-chats',
  
  // Complaints
  COMPLAINTS: '/admin/complaints',
  COMPLAINTS_VIEW: (id: string) => `/admin/complaints/${id}`,
  
  // Appointments
  APPOINTMENTS: '/admin/appointments',

  // Kundali Match
  KUNDALI_MATCH: '/admin/kundali-match',
  /** Premium match consultation topics (admin catalogue UI) */
  KUNDALI_MATCH_QUESTIONS: '/admin/kundali-match/questions',

  // Earnings
  EARNINGS: '/admin/earnings',
  TRANSACTIONS: '/admin/transactions',

  // Balance Settings (set NRs for chat, broadcast, appointment)
  SET_COINS: '/admin/set-balance',
  BROADCAST_SETTINGS: '/admin/broadcast-settings',
  PENDING_BROADCASTS: '/admin/pending-broadcasts',

  // Pricing
  PRICING: '/admin/pricing',
  PRICING_CREATE: '/admin/pricing/create',
  PRICING_EDIT: (id: string) => `/admin/pricing/${id}/edit`,

  // Horoscopes
  HOROSCOPES: '/admin/horoscopes',
  HOROSCOPES_CREATE: '/admin/horoscopes/create',
  HOROSCOPES_EDIT: (id: string) => `/admin/horoscopes/${id}/edit`,

  // Daily Predictions (Tips)
  DAILY_PREDICTIONS: '/admin/daily-predictions',
  DAILY_PREDICTIONS_CREATE: '/admin/daily-predictions/create',
  DAILY_PREDICTIONS_EDIT: (id: string) => `/admin/daily-predictions/${id}/edit`,

  // Book Pujari Ji — occasion catalog (names, puja items, estimated time)
  OCCASIONS: '/admin/occasions',
  SUBHA_SAHIT: '/admin/subha-sahit',
  SUBHA_SAHIT_CREATE: '/admin/subha-sahit/create',
  SUBHA_SAHIT_EDIT: (id: string) => `/admin/subha-sahit/${id}/edit`,
} as const;

export type AdminRoute = typeof ADMIN_ROUTES[keyof typeof ADMIN_ROUTES];

