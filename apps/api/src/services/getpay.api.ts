/**
 * GetPay API client (server-side only).
 * Used to verify payment status with GetPay after redirect.
 */

import { getPayConfig, GETPAY_MERCHANT_STATUS_PATH } from '../constants/payment.constants';
import type { GetPayMerchantStatusResponse } from '../types/payment.types';

type GetPayTokenPayload = {
  id?: string;
  oprSecret?: string;
};

/**
 * Extract transaction id and optional operator secret from token.
 *
 * GetPay may pass token as:
 * - plain transaction id string, or
 * - base64 JSON: { "id": "...", "oprSecret": "..." }.
 *
 * The merchant-status API for some environments now expects both
 * the transaction id and the operator secret in the request body.
 */
function extractTransactionFields(token: string): { id: string; oprSecret?: string } {
  const trimmed = token.trim();
  if (!trimmed) {
    return { id: '' };
  }

  try {
    const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
    const parsed = JSON.parse(decoded) as GetPayTokenPayload;
    const id = typeof parsed?.id === 'string' ? parsed.id.trim() : '';
    const oprSecret =
      typeof parsed?.oprSecret === 'string' && parsed.oprSecret.trim()
        ? parsed.oprSecret.trim()
        : undefined;

    if (id) {
      return { id, oprSecret };
    }
  } catch {
    // Not base64 JSON – fall back to plain token as id.
  }

  return { id: trimmed };
}

/**
 * GetPay Step 04: Verify payment status after redirect (e.g. after 3DS/OTP).
 * API: POST {baseURL}/v1/secure-merchant/transactions/merchant-status
 * Body: { "id": "id fetch from tokenInfo", "papInfo": "Already Provided Pap Info" }
 * The "id" is the same transaction id as in the status request (e.g. status?id=98fc6d7c...).
 * Frontend may pass plain id or base64 token payload with "id" and "oprSecret".
 */
export async function getPayMerchantStatus(
  transactionId: string
): Promise<GetPayMerchantStatusResponse> {
  const { baseUrl, papInfo, oprKey, isConfigured } = getPayConfig();

  if (!isConfigured) {
    throw new Error('GetPay is not configured (GETPAY_BASE_URL, GETPAY_PAP_INFO, GETPAY_OPR_KEY)');
  }

  const { id, oprSecret } = extractTransactionFields(transactionId);
  if (!id) {
    throw new Error('Transaction ID is required for merchant-status verification');
  }

  if (!papInfo || papInfo.trim() === '') {
    throw new Error('PAP Info is required for merchant-status verification');
  }

  // Final URL: {baseURL}/v1/secure-merchant/transactions/merchant-status
  const url = `${baseUrl.replace(/\/$/, '')}${GETPAY_MERCHANT_STATUS_PATH}`;

  // Request body as per GetPay documentation:
  //   { "id": "id", "papInfo": "...", "oprSecret": "..." }
  // "oprSecret" is optional and only sent when present in the token payload.
  const body: { id: string; papInfo: string; oprSecret?: string } = {
    id,
    papInfo: papInfo.trim(),
    ...(oprSecret ? { oprSecret } : {}),
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add Authorization header if oprKey is provided (some environments require this)
  if (oprKey && oprKey.trim() !== '') {
    headers.Authorization = `Bearer ${oprKey.trim()}`;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      let errorMessage = `GetPay merchant-status API failed: ${response.status}`;
      try {
        const errorJson = JSON.parse(text);
        errorMessage += ` - ${JSON.stringify(errorJson)}`;
      } catch {
        errorMessage += ` - ${text}`;
      }
      throw new Error(errorMessage);
    }

    const data = (await response.json()) as GetPayMerchantStatusResponse;
    return data;
  } catch (error) {
    // Re-throw with more context if it's not already an Error
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to call GetPay merchant-status API: ${String(error)}`);
  }
}
