/**
 * Fonepay Dynamic QR – generate QR. Uses FONEPAY_QR_* env only.
 */

import { prisma } from '@jyotish/database';
import { getFonepayQrEnv } from '../../../config/fonepay-qr.env';
import {
  FONEPAY_QR_PATH_GENERATE,
  FONEPAY_QR_STATUS_CREATED,
  FONEPAY_TRANSACTION_TYPE_QR,
} from './constants';
import { computeHmacSha512, buildGenerateQrMessage } from '../../../utils/fonepay.crypto';
import { fonepayPost, buildBasicAuthHeader } from '../../../services/fonepay.client';
import { AppError } from '../../../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../../../constants';
import type {
  FonepayGenerateRequest,
  FonepayGenerateResponse,
  FonepayErrorResponse,
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
  const signature = computeHmacSha512(message, env.FONEPAY_QR_SECRET);

  const payload: Record<string, string> = {
    amount: amountStr,
    prn,
    merchantCode: env.FONEPAY_QR_MERCHANT_CODE,
    remarks1,
    remarks2,
    signature,
  };
  if (body.taxAmount != null && body.taxRefund != null) {
    payload.taxAmount = body.taxAmount;
    payload.taxRefund = body.taxRefund;
  }

  const baseUrl = env.FONEPAY_QR_BASE_URL.replace(/\/$/, '');
  const url = `${baseUrl}${FONEPAY_QR_PATH_GENERATE}`;
  const authHeader = buildBasicAuthHeader(env.FONEPAY_QR_USERNAME, env.FONEPAY_QR_PASSWORD);

  const response = await fonepayPost<{
    qrMessage?: string;
    websocketUrl?: string;
    status?: string;
    message?: string;
  }>(url, payload, authHeader);

  if (!response.ok) {
    const errMsg =
      (response.data && typeof response.data === 'object' && 'message' in response.data
        ? String((response.data as { message?: string }).message)
        : null) || `Fonepay QR API error: ${response.status}`;
    console.error('[Fonepay QR] generateQr API error', { status: response.status, prn });
    return { success: false, error: errMsg, code: response.status };
  }

  const qrMessage =
    response.data && typeof response.data === 'object' && 'qrMessage' in response.data
      ? String((response.data as { qrMessage?: string }).qrMessage)
      : '';
  const websocketUrl =
    response.data && typeof response.data === 'object' && 'websocketUrl' in response.data
      ? String((response.data as { websocketUrl?: string }).websocketUrl)
      : '';

  if (!qrMessage) {
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

  // Use WebSocket URL from Fonepay response; do not hardcode (fallback to env only if missing)
  return {
    success: true,
    qrMessage,
    websocketUrl: websocketUrl || env.FONEPAY_QR_WS_BASE,
    status: 'CREATED',
  };
}
