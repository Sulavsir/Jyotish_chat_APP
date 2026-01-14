/**
 * Coin Constants
 */

import { AstrologerCategory } from '../types/appointment.types';
import { CoinTransactionReason } from '../types/coin.types';

/**
 * Coin cost per chat based on astrologer category
 */
export const CHAT_COIN_COSTS: Record<string, number> = {
  [AstrologerCategory.ORDINARY]: 1,
  [AstrologerCategory.PROFESSIONAL]: 2,
  [AstrologerCategory.PREMIUM]: 3,
};

/**
 * Coin transaction reasons mapping
 */
export const COIN_REASON_MAPPING: Record<string, CoinTransactionReason> = {
  [AstrologerCategory.ORDINARY]: CoinTransactionReason.CHAT_ORDINARY,
  [AstrologerCategory.PREMIUM]: CoinTransactionReason.CHAT_PREMIUM,
  [AstrologerCategory.PROFESSIONAL]: CoinTransactionReason.CHAT_PREMIUM,
};

/**
 * Get coin cost for astrologer category
 */
export function getChatCoinCost(category: string): number {
  return CHAT_COIN_COSTS[category] || 0;
}

/**
 * Check if category requires coins for chat
 */
export function requiresCoinsForChat(category: string): boolean {
  return category in CHAT_COIN_COSTS;
}
