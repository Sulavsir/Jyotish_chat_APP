/**
 * Platform coin rates (admin) API types
 */

export type PlatformCoinRateType =
  | 'CHAT_PER_MESSAGE'
  | 'BROADCAST_PER_MESSAGE'
  | 'BROADCAST_SEND'
  | 'APPOINTMENT'
  | 'KUNDALI_REVIEW';

export interface PlatformCoinRateRow {
  id: string;
  rateType: PlatformCoinRateType;
  coins: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePlatformCoinRatesBody {
  CHAT_PER_MESSAGE?: number;
  BROADCAST_PER_MESSAGE?: number;
  BROADCAST_SEND?: number;
  APPOINTMENT?: number;
  KUNDALI_REVIEW?: number;
}
