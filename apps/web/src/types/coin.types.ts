/**
 * Coin Types for Frontend
 */

export type PlatformCoinRateType =
  | 'CHAT_PER_MESSAGE'
  | 'BROADCAST_PER_MESSAGE'
  | 'BROADCAST_SEND'
  | 'APPOINTMENT'
  | 'KUNDALI_REVIEW'
  | 'KUNDALI_MATCH';

export interface PlatformCoinRates {
  CHAT_PER_MESSAGE: number;
  BROADCAST_PER_MESSAGE: number;
  BROADCAST_SEND: number;
  APPOINTMENT: number;
  KUNDALI_REVIEW: number;
  KUNDALI_MATCH: number;
}

export interface CoinBalance {
  balance: number;
}

export interface AddCoinsRequest {
  amount?: number; // Optional when planId is provided
  planId?: string; // Optional plan ID for activating plans
}

export interface AddCoinsResponse {
  userId: string;
  balance: number;
  transactionId?: string;
  planActivated?: boolean;
  isUnlimited?: boolean;
}
