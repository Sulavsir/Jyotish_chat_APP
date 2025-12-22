/**
 * Backend Constants
 */

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Error Codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ASTROLOGER_NOT_FOUND: 'ASTROLOGER_NOT_FOUND',
  CONSULTATION_NOT_FOUND: 'CONSULTATION_NOT_FOUND',
  HOROSCOPE_NOT_FOUND: 'HOROSCOPE_NOT_FOUND',
  HOROSCOPE_EXISTS: 'HOROSCOPE_EXISTS',
  BIRTH_DETAILS_REQUIRED: 'BIRTH_DETAILS_REQUIRED',
} as const;

// JWT Configuration
export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || 'your-secret-key',
  EXPIRES_IN: '7d',
  ALGORITHM: 'HS256' as const,
} as const;

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  CHAT_LIMIT: 50,
} as const;

// Consultation Pricing (per 15 minutes)
export const CONSULTATION_PRICING = {
  CHAT: 20,
  VOICE: 30,
  VIDEO: 50,
} as const;

// Job Queue Names (from shared package)
export const QUEUE_NAMES = {
  HOROSCOPE_DELIVERY: 'horoscope-delivery',
  NOTIFICATION: 'notification',
  EMAIL: 'email',
  SMS: 'sms',
  CONSULTATION_REMINDER: 'consultation-reminder',
} as const;

// Cron Schedules
export const CRON_SCHEDULES = {
  DAILY_HOROSCOPE: '0 9 * * *', // 9 AM daily
  CONSULTATION_REMINDER: '*/15 * * * *', // Every 15 minutes
} as const;

// Time Constants (in milliseconds)
export const TIME = {
  ONE_MINUTE: 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

// Redis Key Prefixes
export const REDIS_KEYS = {
  SESSION: (userId: string) => `session:${userId}`,
  USER: (userId: string) => `user:${userId}`,
  HOROSCOPE: (sign: string, date: string) => `horoscope:${sign}:${date}`,
  ONLINE_USERS: 'online:users',
} as const;

