/**
 * Fonepay Dynamic QR – generate QR. Uses FONEPAY_QR_* env only.
 *
 * Based on Fonepay documentation for online QR integration:
 * - Uses body-based auth (username/password in JSON body)
 * - Signature field is called "dataValidation"
 * - Response contains "thirdpartyQrWebSocketUrl" for WebSocket connection
 */

import { prisma } from '@jyotish/database';
import { getFonepayQrEnv } from '../../../config/fonepay-qr.env';
import {
  FONEPAY_QR_PATH_GENERATE,
  FONEPAY_QR_STATUS_CREATED,
  FONEPAY_TRANSACTION_TYPE_QR,
} from './constants';
import { computeHmacSha512, buildGenerateQrMessage } from '../../../utils/fonepay.crypto';
import { fonepayPostWithBodyAuth } from '../../../services/fonepay.client';
import { AppError } from '../../../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../../../constants';
import type {
  FonepayGenerateRequest,
  FonepayGenerateResponse,
  FonepayErrorResponse,
  FonepayQrApiResponse,
} from '../../../types/fonepay.types';

function normalizeAmount(amount: string | number): string {
  const n = typeof amount === 'number' ? amount : parseFloat(amount);
  if (Number.isNaN(n)) return '0';
  return n.toFixed(2).replace(/\.?0+$/, '') || '0';
}

export async function generateQr(
  body: FonepayGenerateRequest
): Promise<FonepayGenerateResponse | FonepayErrorResponse> {
  const env = getFonepayQrEnv();
  if (!env) {
    throw new AppError(
      'Fonepay QR is not configured',
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      ERROR_CODES.SERVER_ERROR
    );
  }

  const amountStr = normalizeAmount(body.amount);
  const remarks1 = body.remarks1 ?? '';
  const remarks2 = body.remarks2 ?? '';
  const prn = body.prn.trim();
  if (!prn) {
    throw new AppError('prn is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const message = buildGenerateQrMessage({
    amount: amountStr,
    prn,
    merchantCode: env.FONEPAY_QR_MERCHANT_CODE,
    remarks1,
    remarks2,
    taxAmount: body.taxAmount,
    taxRefund: body.taxRefund,
  });
  const dataValidation = computeHmacSha512(message, env.FONEPAY_QR_SECRET);

  const payload: Record<string, string> = {
    amount: amountStr,
    remarks1,
    remarks2,
    prn,
    merchantCode: env.FONEPAY_QR_MERCHANT_CODE,
    dataValidation,
    username: env.FONEPAY_QR_USERNAME,
    password: env.FONEPAY_QR_PASSWORD,
  };

  if (body.taxAmount != null && body.taxRefund != null) {
    payload.taxAmount = body.taxAmount;
    payload.taxRefund = body.taxRefund;
  }

  const baseUrl = env.FONEPAY_QR_BASE_URL.replace(/\/$/, '');
  const url = `${baseUrl}${FONEPAY_QR_PATH_GENERATE}`;

  console.log('[Fonepay QR] generateQr request', { url, prn, amount: amountStr });

  const response = await fonepayPostWithBodyAuth<FonepayQrApiResponse>(url, payload);

  if (!response.ok) {
    const errMsg = response.data?.message || `Fonepay QR API error: ${response.status}`;
    console.error('[Fonepay QR] generateQr API error', {
      status: response.status,
      prn,
      error: errMsg,
      response: response.data,
    });
    return { success: false, error: errMsg, code: response.status };
  }

  const data = response.data;

  if (!data.success) {
    const errMsg = data.message || 'Fonepay QR request failed';
    console.error('[Fonepay QR] generateQr failed', { prn, response: data });
    return { success: false, error: errMsg };
  }

  const qrMessage = data.qrMessage || '';
  const websocketUrl = data.thirdpartyQrWebSocketUrl || data.merchantWebSocketUrl || '';
  const deviceId = data.deviceId;

  if (!qrMessage) {
    console.error('[Fonepay QR] No qrMessage in response', { prn, response: data });
    return { success: false, error: 'Fonepay did not return qrMessage' };
  }

  await prisma.fonepayTransaction.upsert({
    where: { prn },
    create: {
      prn,
      amount: amountStr,
      type: FONEPAY_TRANSACTION_TYPE_QR,
      status: FONEPAY_QR_STATUS_CREATED,
      remarks1: remarks1 || null,
      remarks2: remarks2 || null,
    },
    update: {
      amount: amountStr,
      type: FONEPAY_TRANSACTION_TYPE_QR,
      status: FONEPAY_QR_STATUS_CREATED,
      remarks1: remarks1 || null,
      remarks2: remarks2 || null,
    },
  });

  console.log('[Fonepay QR] generateQr success', {
    prn,
    deviceId,
    websocketUrl: websocketUrl ? 'provided' : 'using fallback',
  });

  return {
    success: true,
    qrMessage,
    websocketUrl: websocketUrl || env.FONEPAY_QR_WS_BASE,
    deviceId,
    status: 'CREATED',
  };
}
