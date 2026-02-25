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

/** Request for creating a Fonepay QR order (same as create order: amount, coins, planId) */
export interface CreateFonepayQrOrderRequest {
  amount: number;
  coins: number;
  planId?: string;
}

/** Response: orderId (Payment id), prn, qrMessage, websocketUrl for PaymentQR */
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

/** Request for creating a Fonepay Card (web redirect) order */
export interface CreateFonepayCardOrderRequest {
  amount: number;
  coins: number;
  planId?: string;
}

/** Response: redirectUrl to send user to Fonepay, orderId */
export interface CreateFonepayCardOrderResponse {
  orderId: string;
  redirectUrl: string;
}
