/**
 * Fonepay Dynamic QR – post tax refund (next day). Uses FONEPAY_QR_* env only.
 *
 * Based on Fonepay documentation for online QR integration:
 * - Uses body-based auth (username/password in JSON body)
 * - Signature field is called "dataValidation"
 */

import { getFonepayQrEnv } from '../../../config/fonepay-qr.env';
import { FONEPAY_QR_PATH_TAX_REFUND } from './constants';
import { computeHmacSha512, buildTaxRefundMessage } from '../../../utils/fonepay.crypto';
import { fonepayPostWithBodyAuth } from '../../../services/fonepay.client';
import { AppError } from '../../../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../../../constants';
import type { FonepayTaxRefundRequest } from '../../../types/fonepay.types';

export interface TaxRefundResult {
  success: true;
}

export type TaxRefundErrorResponse = { success: false; error: string; code?: number };

export async function postTaxRefund(
  body: FonepayTaxRefundRequest
): Promise<TaxRefundResult | TaxRefundErrorResponse> {
  const env = getFonepayQrEnv();
  if (!env) {
    throw new AppError(
      'Fonepay QR is not configured',
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      ERROR_CODES.SERVER_ERROR
    );
  }

  const message = buildTaxRefundMessage({
    fonepayTraceId: body.fonepayTraceId,
    merchantPRN: body.merchantPRN,
    invoiceNumber: body.invoiceNumber,
    invoiceDate: body.invoiceDate,
    transactionAmount: body.transactionAmount,
    merchantCode: env.FONEPAY_QR_MERCHANT_CODE,
  });
  const dataValidation = computeHmacSha512(message, env.FONEPAY_QR_SECRET);

  const payload = {
    fonepayTraceId: body.fonepayTraceId,
    merchantPRN: body.merchantPRN,
    invoiceNumber: body.invoiceNumber,
    invoiceDate: body.invoiceDate,
    transactionAmount: body.transactionAmount,
    merchantCode: env.FONEPAY_QR_MERCHANT_CODE,
    dataValidation,
    username: env.FONEPAY_QR_USERNAME,
    password: env.FONEPAY_QR_PASSWORD,
  };

  const baseUrl = env.FONEPAY_QR_BASE_URL.replace(/\/$/, '');
  const url = `${baseUrl}${FONEPAY_QR_PATH_TAX_REFUND}`;

  console.log('[Fonepay QR] postTaxRefund request', {
    url,
    merchantPRN: body.merchantPRN,
    fonepayTraceId: body.fonepayTraceId,
  });

  const response = await fonepayPostWithBodyAuth<{ message?: string; success?: boolean }>(
    url,
    payload
  );

  if (!response.ok) {
    const errMsg = response.data?.message || `Fonepay QR tax-refund error: ${response.status}`;
    console.error('[Fonepay QR] postTaxRefund API error', {
      status: response.status,
      merchantPRN: body.merchantPRN,
      error: errMsg,
      response: response.data,
    });
    return { success: false, error: errMsg, code: response.status };
  }

  console.log('[Fonepay QR] postTaxRefund success', {
    merchantPRN: body.merchantPRN,
    fonepayTraceId: body.fonepayTraceId,
  });

  return { success: true };
}
