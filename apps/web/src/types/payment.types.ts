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

export interface CreateFonepayQrOrderRequest {
  amount: number;
  coins: number;
  planId?: string;
}

export interface CreateFonepayQrOrderResponse {
  orderId: string;
  prn: string;
  amount: number;
  coins: number;
  qrMessage: string;
  websocketUrl: string;
}

export interface VerifyFonepayQrRequest {
  prn: string;
}

export interface VerifyFonepayQrResponse {
  success: boolean;
  message: string;
  balance?: number;
  orderId?: string;
}

export interface CreateFonepayCardOrderRequest {
  amount: number;
  coins: number;
  planId?: string;
}

export interface CreateFonepayCardOrderResponse {
  orderId: string;
  redirectUrl: string;
}
