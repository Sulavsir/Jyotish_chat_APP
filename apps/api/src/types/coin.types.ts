/**
 * Coin Types
 */

export enum CoinTransactionType {
  DEDUCT = 'DEDUCT',
  ADD = 'ADD',
  REFUND = 'REFUND',
}

export enum CoinTransactionReason {
  CHAT_ORDINARY = 'CHAT_ORDINARY',
  CHAT_PREMIUM = 'CHAT_PREMIUM',
  PURCHASE = 'PURCHASE',
  REFUND = 'REFUND',
  ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
}

export interface CoinDeductionParams {
  userId: string;
  astrologerCategory: string;
  chatId?: string;
}

export interface CoinTransaction {
  id: string;
  userId: string;
  amount: number;
  type: CoinTransactionType;
  reason: CoinTransactionReason;
  balanceBefore: number;
  balanceAfter: number;
  chatId?: string;
  paymentId?: string;
  adminId?: string;
  createdAt: Date;
}

export interface CoinBalance {
  userId: string;
  balance: number;
}
