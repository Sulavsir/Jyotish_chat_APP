/**
 * GetPay API client (server-side only).
 * Used to verify payment status with GetPay after redirect.
 */

import { getPayConfig } from '../constants/payment.constants';
import type { GetPayMerchantStatusResponse } from '../types/payment.types';

const MERCHANT_STATUS_PATH = '/transactions/merchant-status';

/**
 * Call GetPay merchant-status API to verify a transaction.
 * Returns the raw response; caller must check status.
 */
export async function getPayMerchantStatus(
  transactionId: string
): Promise<GetPayMerchantStatusResponse> {
  const { baseUrl, papInfo, oprKey, isConfigured } = getPayConfig();

  if (!isConfigured) {
    throw new Error('GetPay is not configured (GETPAY_BASE_URL, GETPAY_PAP_INFO, GETPAY_OPR_KEY)');
  }

  const url = `${baseUrl.replace(/\/$/, '')}${MERCHANT_STATUS_PATH}`;
  const body = {
    id: transactionId,
    papInfo,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(oprKey && { Authorization: `Bearer ${oprKey}` }),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GetPay merchant-status failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as GetPayMerchantStatusResponse;
  return data;
}
