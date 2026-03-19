/**
 * Broadcast Message Constants
 */

/**
 * Broadcast message expiry time in milliseconds (10 minutes)
 */
export const BROADCAST_MESSAGE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Broadcast message expiry time in minutes
 */
export const BROADCAST_MESSAGE_EXPIRY_MINUTES = 10;

/**
 * Maximum number of concurrent broadcast messages an astrologer can accept
 * based on their category
 */
export const BROADCAST_ACCEPTANCE_LIMITS = {
  ORDINARY: 10,
  PROFESSIONAL: 10,
  PREMIUM: 0, // Premium astrologers cannot accept broadcasts
  KATHA_VACHAK: 0, // Katha Vachak astrologers cannot accept broadcasts
} as const;
