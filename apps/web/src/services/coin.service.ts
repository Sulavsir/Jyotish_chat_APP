/**
 * Coin Service
 * Handles coin-related API calls
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';
import type {
  CoinBalance,
  AddCoinsRequest,
  AddCoinsResponse,
  PlatformCoinRates,
  TransactionHistoryResponse,
} from '@/types/coin.types';

class CoinService {
  /**
   * Get user's coin balance
   */
  async getBalance(): Promise<CoinBalance> {
    return apiClient.get<CoinBalance>(API_ENDPOINTS.COINS.BALANCE);
  }

  /**
   * Get platform coin rates (admin-configured: chat, broadcast, appointment)
   */
  async getRates(): Promise<{ rates: PlatformCoinRates }> {
    return apiClient.get<{ rates: PlatformCoinRates }>(API_ENDPOINTS.COINS.RATES);
  }

  /**
   * Add coins to user balance or activate a plan
   */
  async addCoins(
    data: { amount?: number; paymentId?: string; planId?: string }
  ): Promise<AddCoinsResponse> {
    return apiClient.post<AddCoinsResponse>(API_ENDPOINTS.COINS.ADD, data);
  }

  /**
   * Get transaction history with optional filter
   * Filter: payment_success | admin_added | app_used
   */
  async getTransactionHistory(params?: {
    page?: number;
    limit?: number;
    filter?: 'payment_success' | 'admin_added' | 'app_used';
  }): Promise<TransactionHistoryResponse> {
    return apiClient.get(API_ENDPOINTS.COINS.TRANSACTIONS, { params });
  }
}

export const coinService = new CoinService();
export default coinService;
