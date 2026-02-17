/**
 * Payment (GetPay) types - align with API contracts
 */

export interface CreateOrderRequest {
  amount: number;
  coins: number;
  planId?: string;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  coins: number;
  planId?: string | null;
  papInfo: string;
  successUrl: string;
  failUrl: string;
  websiteDomain: string;
  scriptUrl: string;
}

export interface VerifyPaymentRequest {
  token: string;
  orderId: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  balance?: number;
  orderId?: string;
}
