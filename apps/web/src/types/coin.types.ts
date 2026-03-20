/**
 * Coin Types for Frontend
 */

export type PlatformCoinRateType =
  | 'CHAT_PER_MESSAGE'
  | 'BROADCAST_PER_MESSAGE'
  | 'BROADCAST_SEND'
  | 'APPOINTMENT'
  | 'KUNDALI_REVIEW'
  | 'KUNDALI_MATCH'
  | 'COINS_PER_NPR'
  | 'FIRST_BROADCAST_DISCOUNT';

export interface PlatformCoinRates {
  CHAT_PER_MESSAGE: number;
  BROADCAST_PER_MESSAGE: number;
  BROADCAST_SEND: number;
  APPOINTMENT: number;
  KUNDALI_REVIEW: number;
  KUNDALI_MATCH: number;
  COINS_PER_NPR: number;
  FIRST_BROADCAST_DISCOUNT: number;
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

/** Transaction filter for history */
export type TransactionFilter = 'payment_success' | 'admin_added' | 'app_used';

export interface TransactionHistoryItem {
  id: string;
  userId: string;
  amount: number;
  type: 'ADD' | 'DEDUCT' | 'REFUND';
  reason: string;
  balanceBefore: number;
  balanceAfter: number;
  chatId?: string;
  paymentId?: string;
  adminId?: string;
  createdAt: string;
  paymentMethod?: string;
  transactionId?: string | null;
}

export interface TransactionHistoryResponse {
  transactions: TransactionHistoryItem[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
