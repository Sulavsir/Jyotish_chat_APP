/**
 * Fonepay Third-Party Dynamic QR – API request/response and WebSocket message types
 */

/** Fonepay Web (card) callback query params from redirect URL */
export interface FonepayWebCallbackQuery {
  PRN: string;
  PID: string;
  PS: string;
  RC: string;
  DV: string;
  UID: string;
  BC: string;
  INI: string;
  P_AMT: string;
  R_AMT: string;
}

/** Request body for generating a dynamic QR */
export interface FonepayGenerateRequest {
  amount: string | number;
  remarks1: string;
  remarks2: string;
  prn: string;
  taxAmount?: string;
  taxRefund?: string;
}

/** Success response from generate QR API */
export interface FonepayGenerateResponse {
  success: true;
  qrMessage: string;
  websocketUrl: string;
  status: 'CREATED';
}

/** Error response from any Fonepay API */
export interface FonepayErrorResponse {
  success: false;
  error: string;
  code?: number;
}

/** Request body for check status */
export interface FonepayCheckStatusRequest {
  prn: string;
}

/** Payment status from check-status API */
export type FonepayPaymentStatus = 'success' | 'failed' | 'pending';

export interface FonepayStatusResponse {
  success: true;
  paymentStatus: FonepayPaymentStatus;
  fonepayTraceId?: string;
  transactionDetails?: Record<string, unknown>;
}

/** Request body for post tax refund (next day) */
export interface FonepayTaxRefundRequest {
  fonepayTraceId: string;
  merchantPRN: string;
  invoiceNumber: string;
  invoiceDate: string; // BS format YYYY.MM.DD e.g. 2081.05.12
  transactionAmount: string;
}

/** WebSocket message – verification (qr verified) */
export interface WebSocketVerificationMsg {
  transactionStatus?: string;
  qrVerified?: boolean;
  [key: string]: unknown;
}

/** WebSocket message – payment result (parse transactionStatus JSON for paymentSuccess) */
export interface WebSocketPaymentMsg {
  transactionStatus?: string; // JSON string with paymentSuccess, etc.
  [key: string]: unknown;
}

/** Parsed transactionStatus from WebSocket */
export interface FonepayTransactionStatusPayload {
  paymentSuccess?: boolean;
  fonepayTraceId?: string;
  [key: string]: unknown;
}
