/**
 * OTP Configuration Constants
 */

export const OTP_CONFIG = {
  // OTP generation
  OTP_LENGTH: 6,
  OTP_EXPIRY_MINUTES: 5, // 5 minutes for better security
  
  // Verification attempts
  MAX_ATTEMPTS: 3,
  
  // Rate limiting
  RATE_LIMIT_HOURS: 1,
  RATE_LIMIT_MAX_REQUESTS: 5,
} as const;

