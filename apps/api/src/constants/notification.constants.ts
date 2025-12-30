/**
 * Notification Configuration Constants
 */

export const NOTIFICATION_CONFIG = {
  // Pagination
  DEFAULT_LIMIT: 50,
  DEFAULT_OFFSET: 0,
  
  // Cleanup
  CLEANUP_DAYS: 90,
  
  // Valid notification types
  VALID_TYPES: [
    'CHAT_MESSAGE',
    'CONSULTATION_BOOKING',
    'CONSULTATION_REMINDER',
    'HOROSCOPE',
    'PAYMENT',
    'SYSTEM',
  ] as const,
} as const;

