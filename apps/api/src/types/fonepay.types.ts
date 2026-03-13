/**
 * Fonepay Third-Party Dynamic QR – API request/response and WebSocket message types
 *
 * Based on Fonepay documentation for online QR integration.
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

/**
 * Raw response from Fonepay QR generate API.
 * Note: Fonepay returns thirdpartyQrWebSocketUrl for WebSocket connection.
 */
export interface FonepayQrApiResponse {
  qrMessage?: string;
  clientCode?: string;
  status?: string;
  statusCode?: number;
  success?: boolean;
  deviceId?: string;
  requested_date?: string;
  merchantCode?: string;
  merchantWebSocketUrl?: string;
  thirdpartyQrWebSocketUrl?: string;
  message?: string;
}

/** Success response from generate QR API (normalized for client) */
export interface FonepayGenerateResponse {
  success: true;
  qrMessage: string;
  websocketUrl: string;
  deviceId?: string;
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
export type FonepayPaymentStatus = 'success' | 'failed' | 'pending' | 'verified';

/**
 * Raw response from Fonepay check status API.
 * Note: fonepayTraceId is returned as number from the API, not string
 */
export interface FonepayCheckStatusApiResponse {
  success?: boolean;
  status?: string;
  paymentStatus?: string;
  fonepayTraceId?: string | number; // Fonepay returns this as number
  traceId?: string | number;
  amount?: string;
  remarks1?: string;
  remarks2?: string;
  productNumber?: string;
  transactionDate?: string;
  message?: string;
  commissionType?: string;
  commissionAmount?: number;
  totalCalculatedAmount?: number;
  paymentSuccess?: boolean;
}

export interface FonepayStatusResponse {
  success: true;
  paymentStatus: FonepayPaymentStatus;
  fonepayTraceId?: string | number; // Can be number from API, we convert to string when saving
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

/**
 * WebSocket message from Fonepay.
 * The transactionStatus field is a JSON string that needs to be parsed.
 */
export interface FonepayWebSocketMessage {
  merchantId?: number;
  deviceId?: string;
  transactionStatus?: string; // JSON string
}

/** Parsed transactionStatus for QR verification */
export interface FonepayVerificationStatus {
  success: boolean;
  message: string;
  qrVerified: boolean;
}

/** Parsed transactionStatus for payment result */
export interface FonepayPaymentResult {
  success: boolean;
  paymentSuccess: boolean;
  message: string;
  remarks1?: string;
  remarks2?: string;
  transactionDate?: string;
  productNumber?: string;
  amount?: string;
  traceId?: number;
  commissionType?: string;
  commissionAmount?: number;
  totalCalculatedAmount?: number;
}

/** WebSocket message – verification (qr verified) - legacy alias */
export interface WebSocketVerificationMsg {
  transactionStatus?: string;
  qrVerified?: boolean;
  [key: string]: unknown;
}

/** WebSocket message – payment result (parse transactionStatus JSON for paymentSuccess) - legacy alias */
export interface WebSocketPaymentMsg {
  transactionStatus?: string;
  [key: string]: unknown;
}

/** Parsed transactionStatus from WebSocket - legacy alias */
export interface FonepayTransactionStatusPayload {
  paymentSuccess?: boolean;
  fonepayTraceId?: string;
  [key: string]: unknown;
}
