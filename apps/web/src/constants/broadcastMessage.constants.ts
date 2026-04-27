/**
 * Broadcast Message Constants
 */

/**
 * Broadcast message expiry time in milliseconds (10 minutes)
 */
export const BROADCAST_MESSAGE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * After the visible countdown hits zero, keep treating a PENDING broadcast as "in flight"
 * briefly so the UI does not clear before the server's auto-assign / expiry sweep runs.
 */
export const BROADCAST_POST_EXPIRY_GRACE_MS = 120_000;

/**
 * Broadcast message expiry time in minutes
 */
export const BROADCAST_MESSAGE_EXPIRY_MINUTES = 10;

/**
 * Maximum number of concurrent broadcast messages an astrologer can accept
 * based on their category
 */
export const BROADCAST_ACCEPTANCE_LIMITS = {
  ORDINARY: 3,
  PROFESSIONAL: 5,
  PREMIUM: 0, // Premium astrologers cannot accept broadcasts
  KATHA_VACHAK: 0, // Katha Vachak astrologers cannot accept broadcasts
} as const;

/**
 * Coin cost for sending a broadcast message (always 1 coin)
 */
export const BROADCAST_CHAT_COIN_COST = 1;
