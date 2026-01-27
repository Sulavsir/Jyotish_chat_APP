/**
 * TanStack Query Keys Constants
 * Centralized query keys for React Query
 */

import type { AstrologerListParams } from '@/types/astrologer';

export const QUERY_KEYS = {
  // Auth
  AUTH: {
    ME: ['auth', 'me'] as const,
    ASTROLOGER_ME: ['auth', 'astrologer', 'me'] as const,
  },

  // Dashboard
  DASHBOARD: {
    ROTATING_COPY: ['dashboard', 'rotating-copy'] as const,
  },

  // Jyotish Bookings
  JYOTISH_BOOKINGS: {
    ALL: ['jyotish-bookings'] as const,
    MY_LIST: (filters: { page: number; limit: number; search?: string; type?: string; status?: string }) =>
      ['jyotish-bookings', 'my', filters] as const,
  },

  // Appointments
  APPOINTMENTS: {
    ALL: ['appointments'] as const,
    LIST: (filters?: { status?: string }) =>
      filters?.status
        ? (['appointments', 'list', { status: filters.status }] as const)
        : (['appointments', 'list'] as const),
    MY_LIST: (filters: { page: number; limit: number; search?: string; status?: string }) =>
      ['appointments', 'my', filters] as const,
    DETAIL: (id: string) => ['appointments', 'detail', id] as const,
    AVAILABILITY: (astrologerId: string, date: string) =>
      ['appointments', 'availability', astrologerId, date] as const,
    ASTROLOGERS_FOR_APPOINTMENT: ['appointments', 'astrologers'] as const,
  },

  // Consultations
  CONSULTATIONS: {
    ALL: ['consultations'] as const,
    MY: ['consultations', 'my'] as const,
    DETAIL: (id: string) => ['consultations', 'detail', id] as const,
  },

  // Chat
  CHAT: {
    CONVERSATIONS: ['chat', 'conversations'] as const,
    HISTORY: (userId: string) => ['chat', 'history', userId] as const,
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
      params
        ? (['notifications', 'list', params] as const)
        : (['notifications', 'list'] as const),
    UNREAD_COUNT: ['notifications', 'unread-count'] as const,
  },

  // Horoscope
  HOROSCOPE: {
    MY_DAILY: ['horoscope', 'my-daily'] as const,
    GET: (sign: string, date: string) => ['horoscope', sign, date] as const,
  },

  // Astrologers
  ASTROLOGERS: {
    LIST: (filters?: AstrologerListParams) =>
      filters ? (['astrologers', 'list', filters] as const) : (['astrologers', 'list'] as const),
    DETAIL: (id: string) => ['astrologers', 'detail', id] as const,
    PROFILE: ['astrologers', 'profile'] as const,
    ONLINE_STATUS: ['astrologers', 'online-status'] as const,
    STATS: ['astrologers', 'stats'] as const,
  },

  // Users
  USERS: {
    CHATABLE: ['users', 'chatable'] as const,
    CLIENT_DETAILS: (clientId: string) => ['users', 'client-details', clientId] as const,
  },

  // Complaints
  COMPLAINTS: {
    ALL: ['complaints'] as const,
    LIST: (filters?: { status?: string }) =>
      filters?.status
        ? (['complaints', 'list', { status: filters.status }] as const)
        : (['complaints', 'list'] as const),
    DETAIL: (id: string) => ['complaints', 'detail', id] as const,
  },

  // Ratings
  RATINGS: {
    ALL: ['ratings'] as const,
    MY_RATINGS: ['ratings', 'my-ratings'] as const,
    ASTROLOGER: (astrologerId: string, params?: { limit?: number; page?: number }) =>
      params
        ? (['ratings', 'astrologer', astrologerId, params] as const)
        : (['ratings', 'astrologer', astrologerId] as const),
    CHAT: (chatId: string) => ['ratings', 'chat', chatId] as const,
    CAN_RATE: (chatId: string) => ['ratings', 'can-rate', chatId] as const,
    ASTROLOGER_STATS: (astrologerId: string) =>
      ['ratings', 'astrologer-stats', astrologerId] as const,
  },

  // Coins
  COINS: {
    BALANCE: ['coins', 'balance'] as const,
    TRANSACTIONS: (params?: { limit?: number; offset?: number }) =>
      params ? (['coins', 'transactions', params] as const) : (['coins', 'transactions'] as const),
    TRANSACTION_HISTORY: ['coins', 'transactions', 'history'] as const,
  },

  // Pricing
  PRICING: {
    PLANS: ['pricing', 'plans'] as const,
  },

  // Admin Chat
  ADMIN_CHAT: {
    MY: ['admin-chat', 'my'] as const,
    DETAIL: (chatId: string) => ['admin-chat', 'detail', chatId] as const,
    MESSAGES: (chatId: string, params?: { page?: number; limit?: number }) =>
      params
        ? (['admin-chat', 'messages', chatId, params] as const)
        : (['admin-chat', 'messages', chatId] as const),
  },

  // Jyotish Dashboard
  JYOTISH_DASHBOARD: {
    STATS: ['jyotish-dashboard', 'stats'] as const,
    RECENT_ACTIVITY: (limit?: number) =>
      limit ? (['jyotish-dashboard', 'recent-activity', limit] as const) : (['jyotish-dashboard', 'recent-activity'] as const),
  },
} as const;
