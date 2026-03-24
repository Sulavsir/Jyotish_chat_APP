/**
 * Broadcast Message Constants
 */

/**
 * Broadcast pending window for new messages (milliseconds). Each row stores its own `expiresAt`
 * at creation time from this value — change here (or per-deploy constants) if you need a different TTL.
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
