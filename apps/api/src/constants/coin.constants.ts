/**
 * Coin Constants
 */

import { AstrologerCategory } from '@jyotish/shared';
import { CoinTransactionReason } from '../types/coin.types';
import { AstrologerCategory as PrismaAstrologerCategory } from '@prisma/client';

/**
 * Convert Prisma AstrologerCategory to shared AstrologerCategory
 */
export function toSharedAstrologerCategory(
  category: PrismaAstrologerCategory | AstrologerCategory | string
): AstrologerCategory {
  return category as AstrologerCategory;
}

/**
 * Coin cost per message for direct DMs based on astrologer category
 * PREMIUM astrologers don't require coins (they can only chat during appointment window)
 */
export const DIRECT_CHAT_COIN_COSTS: Record<AstrologerCategory, number> = {
  [AstrologerCategory.ORDINARY]: 2,
  [AstrologerCategory.PROFESSIONAL]: 2,
  [AstrologerCategory.PREMIUM]: 0, // No coins required (chat only allowed during appointment window)
  [AstrologerCategory.KATHA_VACHAK]: 0, // Booking-only category (no direct chat)
};

/**
 * Coin cost per message for broadcast chats (always 1 coin regardless of category)
 */
export const BROADCAST_CHAT_COIN_COST = 1;

/**
 * Coin transaction reasons mapping
 */
export const COIN_REASON_MAPPING: Record<AstrologerCategory, CoinTransactionReason> = {
  [AstrologerCategory.ORDINARY]: CoinTransactionReason.CHAT_ORDINARY,
  [AstrologerCategory.PROFESSIONAL]: CoinTransactionReason.CHAT_PREMIUM,
  [AstrologerCategory.PREMIUM]: CoinTransactionReason.CHAT_PREMIUM, // Should not be used, but included for completeness
  [AstrologerCategory.KATHA_VACHAK]: CoinTransactionReason.CHAT_PREMIUM, // Not used (no direct chat)
};

/**
 * Get coin cost for direct DM based on astrologer category
 * Accepts both Prisma and shared enum types
 */
export function getDirectChatCoinCost(
  category: PrismaAstrologerCategory | AstrologerCategory | string
): number {
  const sharedCategory = toSharedAstrologerCategory(category);
  return DIRECT_CHAT_COIN_COSTS[sharedCategory] ?? 0;
}

/**
 * Get coin cost for broadcast chat (always 1 coin)
 */
export function getBroadcastChatCoinCost(): number {
  return BROADCAST_CHAT_COIN_COST;
}

/**
 * Check if category requires coins for chat
 * PREMIUM astrologers don't require coins (they can only chat during appointment window)
 * Accepts both Prisma and shared enum types
 */
export function requiresCoinsForChat(
  category: PrismaAstrologerCategory | AstrologerCategory | string
): boolean {
  const sharedCategory = toSharedAstrologerCategory(category);
  return DIRECT_CHAT_COIN_COSTS[sharedCategory] > 0;
}
