/**
 * Fonepay Dynamic QR – WebSocket utilities.
 *
 * WebSocket URL format from Fonepay:
 * wss://ws.fonepay.com/merchantEndPoint/{deviceId}/{merchantCode}/Y
 *
 * The thirdpartyQrWebSocketUrl from QR generation response should be used directly.
 * This file provides fallback base URL and message parsing utilities.
 */

import { getFonepayQrEnv } from '../../../config/fonepay-qr.env';
import type {
  FonepayWebSocketMessage,
  FonepayVerificationStatus,
  FonepayPaymentResult,
} from '../../../types/fonepay.types';

/**
 * Get the base WebSocket URL for Fonepay QR.
 * Prefer using the thirdpartyQrWebSocketUrl from QR generation response.
 */
export function getFonepayQrWebSocketBase(): string {
  const env = getFonepayQrEnv();
  return env?.FONEPAY_QR_WS_BASE ?? 'wss://ws.fonepay.com/convergent-webSocket-web/merchantEndPoint';
}

/**
 * Parse a WebSocket message from Fonepay.
 * The transactionStatus field is a JSON string that needs to be parsed.
 */
export function parseWebSocketMessage(message: string): FonepayWebSocketMessage | null {
  try {
    return JSON.parse(message) as FonepayWebSocketMessage;
  } catch {
    console.error('[Fonepay WS] Failed to parse WebSocket message', { raw: message });
    return null;
  }
}

/**
 * Parse the transactionStatus JSON string from a WebSocket message.
 * Returns the parsed verification or payment result.
 */
export function parseTransactionStatus(
  transactionStatusJson: string
): FonepayVerificationStatus | FonepayPaymentResult | null {
  try {
    return JSON.parse(transactionStatusJson);
  } catch {
    console.error('[Fonepay WS] Failed to parse transactionStatus', { raw: transactionStatusJson });
    return null;
  }
}

/**
 * Check if the WebSocket message indicates QR verification (customer scanned QR).
 */
export function isQrVerificationMessage(
  status: FonepayVerificationStatus | FonepayPaymentResult | null
): status is FonepayVerificationStatus {
  if (!status) return false;
  return 'qrVerified' in status && status.qrVerified === true;
}

/**
 * Check if the WebSocket message indicates payment result.
 */
export function isPaymentResultMessage(
  status: FonepayVerificationStatus | FonepayPaymentResult | null
): status is FonepayPaymentResult {
  if (!status) return false;
  return 'paymentSuccess' in status;
}

/**
 * Determine the payment outcome from a WebSocket payment result.
 */
export function getPaymentOutcome(result: FonepayPaymentResult): 'success' | 'failed' {
  return result.paymentSuccess ? 'success' : 'failed';
}
