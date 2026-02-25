/**
 * Fonepay Third-Party Dynamic QR – frontend types (align with API contracts)
 */

export interface FonepayGenerateRequest {
  amount: string | number;
  remarks1: string;
  remarks2: string;
  prn: string;
  taxAmount?: string;
  taxRefund?: string;
}

export interface FonepayGenerateResponse {
  success: true;
  qrMessage: string;
  websocketUrl: string;
  status: 'CREATED';
}

export interface FonepayErrorResponse {
  success: false;
  error: string;
  code?: number;
}

export type FonepayGenerateResult = FonepayGenerateResponse | FonepayErrorResponse;

export interface FonepayCheckStatusRequest {
  prn: string;
}

export type FonepayPaymentStatus = 'success' | 'failed' | 'pending';

export interface FonepayStatusResponse {
  success: true;
  paymentStatus: FonepayPaymentStatus;
  fonepayTraceId?: string;
  transactionDetails?: Record<string, unknown>;
}

export type FonepayCheckStatusResult = FonepayStatusResponse | FonepayErrorResponse;

export interface FonepayTaxRefundRequest {
  fonepayTraceId: string;
  merchantPRN: string;
  invoiceNumber: string;
  invoiceDate: string;
  transactionAmount: string;
}

/** WebSocket verification message (qrVerified / transactionStatus VERIFIED) */
export interface WebSocketVerificationMsg {
  transactionStatus?: string;
  qrVerified?: boolean;
  [key: string]: unknown;
}

/** WebSocket payment result (transactionStatus JSON with paymentSuccess) */
export interface WebSocketPaymentMsg {
  transactionStatus?: string;
  [key: string]: unknown;
}

export interface FonepayTransactionStatusPayload {
  paymentSuccess?: boolean;
  fonepayTraceId?: string;
  [key: string]: unknown;
}

/** Payment flow state for useFonepayPayment hook */
export type FonepayPaymentState =
  | 'idle'
  | 'generating'
  | 'waiting_scan'
  | 'verified'
  | 'paid'
  | 'failed';

/** WebSocket event from useFonepayWebSocket */
export type FonepayWsEvent =
  | { type: 'verified' }
  | { type: 'payment_success'; fonepayTraceId?: string }
  | { type: 'payment_failed' }
  | { type: 'close' }
  | { type: 'error'; message: string };
