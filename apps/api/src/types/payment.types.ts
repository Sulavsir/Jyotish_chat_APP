/**
 * Payment (GetPay) types
 */

export interface CreateOrderRequest {
  amount: number; // NPR
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
  scriptUrl: string; // GetPay checkout bundle.js URL (load in frontend)
}

export interface VerifyPaymentRequest {
  token: string; // GetPay transaction id from redirect
  orderId: string; // Our Payment id (clientRequestId)
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  balance?: number;
  orderId?: string;
}

export interface GetPayMerchantStatusRequest {
  id: string; // transactionId from GetPay
  papInfo: string;
}

export interface GetPayMerchantStatusResponse {
  status?: string;
  transactionId?: string;
  [key: string]: unknown;
}
