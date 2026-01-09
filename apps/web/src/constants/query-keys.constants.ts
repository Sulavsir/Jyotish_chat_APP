/**
 * TanStack Query Keys Constants
 * Centralized query keys for React Query
 */

export const QUERY_KEYS = {
  // Auth
  AUTH: {
    ME: ['auth', 'me'] as const,
    ASTROLOGER_ME: ['auth', 'astrologer', 'me'] as const,
  },
  
  // Appointments
  APPOINTMENTS: {
    ALL: ['appointments'] as const,
    LIST: (filters?: { status?: string }) => 
      filters?.status 
        ? ['appointments', 'list', { status: filters.status }] as const
        : ['appointments', 'list'] as const,
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
    LIST: ['notifications', 'list'] as const,
  },
  
  // Horoscope
  HOROSCOPE: {
    MY_DAILY: ['horoscope', 'my-daily'] as const,
    GET: (sign: string, date: string) => ['horoscope', sign, date] as const,
  },
  
  // Astrologers
  ASTROLOGERS: {
    LIST: (filters?: Record<string, unknown>) => 
      filters 
        ? ['astrologers', 'list', filters] as const
        : ['astrologers', 'list'] as const,
    DETAIL: (id: string) => ['astrologers', 'detail', id] as const,
    PROFILE: ['astrologers', 'profile'] as const,
    ONLINE_STATUS: ['astrologers', 'online-status'] as const,
    STATS: ['astrologers', 'stats'] as const,
  },
  
  // Users
  USERS: {
    CHATABLE: ['users', 'chatable'] as const,
  },
  
  // Complaints
  COMPLAINTS: {
    ALL: ['complaints'] as const,
    LIST: (filters?: { status?: string }) => 
      filters?.status 
        ? ['complaints', 'list', { status: filters.status }] as const
        : ['complaints', 'list'] as const,
    DETAIL: (id: string) => ['complaints', 'detail', id] as const,
  },
} as const;

