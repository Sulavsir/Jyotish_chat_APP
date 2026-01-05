/**
 * Authentication Constants
 * Note: JWT_SECRET uses a getter to access process.env at runtime
 * This ensures it's loaded AFTER dotenv.config() runs
 */

/**
 * Token Type Constants
 */
export const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  TEMP: 'temp',
} as const;

export type TokenType = (typeof TOKEN_TYPES)[keyof typeof TOKEN_TYPES];

export const AUTH_CONFIG = {
  SALT_ROUNDS: 10,

  // Use getter to access JWT_SECRET at runtime (after dotenv loads)
  get JWT_SECRET() {
    return process.env.JWT_SECRET;
  },

  // Access Token Configuration (short-lived)
  ACCESS_TOKEN_EXPIRES_IN_MINUTES: 1440, // 5 minutes
  ACCESS_TOKEN_EXPIRES_IN_MS: 1440 * 60 * 1000, // 5 minutes

  // Refresh Token Configuration (long-lived)
  REFRESH_TOKEN_EXPIRES_IN_DAYS: 1, // 1 day
  REFRESH_TOKEN_EXPIRES_IN_MS: 24 * 60 * 60 * 1000, // 1 day

  JWT_ALGORITHM: 'HS256' as const,

  // Temporary Token (for registration flows)
  TEMP_TOKEN_EXPIRES_IN_MINUTES: 15, // 15 minutes
};
