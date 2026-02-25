/**
 * GetPay API client (server-side only).
 * Used to verify payment status with GetPay after redirect.
 */

import { getPayConfig, GETPAY_MERCHANT_STATUS_PATH } from '../constants/payment.constants';
import type { GetPayMerchantStatusResponse } from '../types/payment.types';

/**
 * GetPay may pass token as base64 JSON { "id": "...", "oprSecret": "..." }.
 * Merchant-status expects the plain transaction "id", so extract it if present.
 */
function extractTransactionId(token: string): string {
  const trimmed = token.trim();
  if (!trimmed) return trimmed;
  try {
    const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
    const parsed = JSON.parse(decoded) as { id?: string };
    if (typeof parsed?.id === 'string' && parsed.id.trim()) return parsed.id.trim();
  } catch {
    // not base64 JSON, use as-is
  }
  return trimmed;
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

  const id = extractTransactionId(transactionId);
  if (!id) {
    throw new Error('Transaction ID is required for merchant-status verification');
  }

  if (!papInfo || papInfo.trim() === '') {
    throw new Error('PAP Info is required for merchant-status verification');
  }

  // Construct URL: baseUrl should already include /v1/secure-merchant
  // Then append /transactions/merchant-status
  // Final URL: {baseURL}/v1/secure-merchant/transactions/merchant-status
  const url = `${baseUrl.replace(/\/$/, '')}${GETPAY_MERCHANT_STATUS_PATH}`;
  
  // Request body as per GetPay documentation:
  // { "id": "id fetch from tokenInfo", "papInfo": "Already Provided Pap Info" }
  const body: { id: string; papInfo: string } = {
    id,
    papInfo: papInfo.trim(),
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add Authorization header if oprKey is provided
  if (oprKey && oprKey.trim() !== '') {
    headers.Authorization = `Bearer ${oprKey.trim()}`;
  }

  // Log API call details (without sensitive data)
  console.log('[GetPay] Calling merchant-status API:', {
    url,
    method: 'POST',
    hasId: !!body.id,
    hasPapInfo: !!body.papInfo,
    hasAuth: !!headers.Authorization,
  });

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
    // Log response for debugging (only safe/sanitized keys; no raw card or secrets)
    const safeKeys = ['status', 'transactionId', 'message', 'code', 'id'];
    const logPayload: Record<string, unknown> = {};
    for (const k of safeKeys) {
      if (k in data && data[k] !== undefined) logPayload[k] = data[k];
    }
    console.log('[GetPay] merchant-status API response:', logPayload);
    return data;
  } catch (error) {
    // Re-throw with more context if it's not already an Error
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to call GetPay merchant-status API: ${String(error)}`);
  }
}
