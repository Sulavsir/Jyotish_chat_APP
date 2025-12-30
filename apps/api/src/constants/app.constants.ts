/**
 * Application-wide Constants
 */

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

// Job Queue Names
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

// JWT Configuration (kept for backward compatibility)
export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || 'your-secret-key',
  EXPIRES_IN: '7d',
  ALGORITHM: 'HS256' as const,
} as const;
