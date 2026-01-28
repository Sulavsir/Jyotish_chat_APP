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
  
  // Admin Chats (Support Widget)
  ADMIN_CHATS: '/admin/admin-chats',
  
  // Complaints
  COMPLAINTS: '/admin/complaints',
  COMPLAINTS_VIEW: (id: string) => `/admin/complaints/${id}`,
  
  // Appointments
  APPOINTMENTS: '/admin/appointments',
  
  // Earnings
  EARNINGS: '/admin/earnings',
  
  // Pricing
  PRICING: '/admin/pricing',
  PRICING_CREATE: '/admin/pricing/create',
  PRICING_EDIT: (id: string) => `/admin/pricing/${id}/edit`,
} as const;

export type AdminRoute = typeof ADMIN_ROUTES[keyof typeof ADMIN_ROUTES];

