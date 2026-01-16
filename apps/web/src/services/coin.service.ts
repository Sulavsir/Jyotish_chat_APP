/**
 * Coin Service
 * Handles coin-related API calls
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';
import type { CoinBalance, AddCoinsRequest, AddCoinsResponse } from '@/types/coin.types';

class CoinService {
  /**
   * Get user's coin balance
   */
  async getBalance(): Promise<CoinBalance> {
    return apiClient.get<CoinBalance>(API_ENDPOINTS.COINS.BALANCE);
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
   * Get transaction history
   */
  async getTransactionHistory(params?: { limit?: number; offset?: number }): Promise<{
    transactions: Array<{
      id: string;
      userId: string;
      amount: number;
      type: string;
      reason: string;
      balanceBefore: number;
      balanceAfter: number;
      chatId?: string;
      paymentId?: string;
      adminId?: string;
      createdAt: Date;
    }>;
    total: number;
  }> {
    return apiClient.get(API_ENDPOINTS.COINS.TRANSACTIONS, { params });
  }
}

export const coinService = new CoinService();
export default coinService;
