/**
 * Storage & Session Constants
 */

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'jyotish_access_token',
  REFRESH_TOKEN: 'jyotish_refresh_token',
  USER: 'jyotish_user',
  THEME: 'jyotish_theme',
  // Legacy support
  TOKEN: 'jyotish_access_token',
} as const;

export const SESSION_CONFIG = {
  EXPIRATION_DAYS: 5,
  EXPIRATION_MS: 5 * 24 * 60 * 60 * 1000,
  // Token expiration times
  ACCESS_TOKEN_EXPIRES_MS: 1 * 60 * 1000, // 1 minute
  REFRESH_TOKEN_EXPIRES_MS: 24 * 60 * 60 * 1000, // 1 day
} as const;

