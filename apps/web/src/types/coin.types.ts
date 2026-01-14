/**
 * Coin Types for Frontend
 */

export interface CoinBalance {
  balance: number;
}

export interface AddCoinsRequest {
  amount: number;
}

export interface AddCoinsResponse {
  userId: string;
  balance: number;
}
