/**
 * Coin Types for Frontend
 */

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
