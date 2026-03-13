/**
 * Fonepay Dynamic QR – check payment status. Uses FONEPAY_QR_* env only.
 *
 * Based on Fonepay documentation for online QR integration:
 * - Uses body-based auth (username/password in JSON body)
 * - Signature field is called "dataValidation"
 * - Message format for HMAC: PRN,MERCHANT-CODE
 */

import { prisma } from '@jyotish/database';
import { getFonepayQrEnv } from '../../../config/fonepay-qr.env';
import {
  FONEPAY_QR_PATH_CHECK_STATUS,
  FONEPAY_QR_STATUS_SUCCESS,
  FONEPAY_QR_STATUS_FAILED,
  FONEPAY_QR_STATUS_VERIFIED,
  FONEPAY_QR_STATUS_CREATED,
} from './constants';
import { computeHmacSha512, buildCheckStatusMessage } from '../../../utils/fonepay.crypto';
import { fonepayPostWithBodyAuth } from '../../../services/fonepay.client';
import { AppError } from '../../../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../../../constants';
import type {
  FonepayCheckStatusRequest,
  FonepayStatusResponse,
  FonepayErrorResponse,
  FonepayPaymentStatus,
  FonepayCheckStatusApiResponse,
} from '../../../types/fonepay.types';

export async function checkStatus(
  body: FonepayCheckStatusRequest
): Promise<FonepayStatusResponse | FonepayErrorResponse> {
  const env = getFonepayQrEnv();
  if (!env) {
    throw new AppError(
      'Fonepay QR is not configured',
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      ERROR_CODES.SERVER_ERROR
    );
  }

  const prn = body.prn?.trim();
  if (!prn) {
    throw new AppError('prn is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const message = buildCheckStatusMessage(prn, env.FONEPAY_QR_MERCHANT_CODE);
  const dataValidation = computeHmacSha512(message, env.FONEPAY_QR_SECRET);

  const payload = {
    prn,
    merchantCode: env.FONEPAY_QR_MERCHANT_CODE,
    dataValidation,
    username: env.FONEPAY_QR_USERNAME,
    password: env.FONEPAY_QR_PASSWORD,
  };

  const baseUrl = env.FONEPAY_QR_BASE_URL.replace(/\/$/, '');
  const url = `${baseUrl}${FONEPAY_QR_PATH_CHECK_STATUS}`;

  console.log('[Fonepay QR] checkStatus request', { url, prn });

  const response = await fonepayPostWithBodyAuth<FonepayCheckStatusApiResponse>(url, payload);

  if (!response.ok) {
    const errMsg = response.data?.message || `Fonepay QR check-status error: ${response.status}`;
    console.error('[Fonepay QR] checkStatus API error', {
      status: response.status,
      prn,
      error: errMsg,
      response: response.data,
    });
    return { success: false, error: errMsg, code: response.status };
  }

  const data = response.data;

  console.log('[Fonepay QR] checkStatus response', { prn, response: data });

  let paymentStatus: FonepayPaymentStatus = 'pending';
  const rawStatus = (data.paymentStatus ?? data.status ?? '').toLowerCase();
  const rawPaymentSuccess = data.paymentSuccess;

  if (rawPaymentSuccess === true || rawStatus === 'success') {
    paymentStatus = 'success';
  } else if (rawPaymentSuccess === false || rawStatus === 'failed' || rawStatus === 'failure') {
    paymentStatus = 'failed';
  } else if (rawStatus === 'verified') {
    paymentStatus = 'verified';
  } else if (rawStatus === 'created') {
    paymentStatus = 'pending';
  }

  // Fonepay returns fonepayTraceId as number, convert to string for database
  const rawTraceId = data.fonepayTraceId ?? data.traceId;
  const fonepayTraceId = rawTraceId != null ? String(rawTraceId) : undefined;

  const dbStatus = mapPaymentStatusToDbStatus(paymentStatus);

  try {
    await prisma.fonepayTransaction.updateMany({
      where: { prn },
      data: {
        status: dbStatus,
        ...(fonepayTraceId ? { fonepayTraceId } : {}),
      },
    });
    console.log('[Fonepay QR] FonepayTransaction updated', { prn, dbStatus });
  } catch (dbErr) {
    // Log but don't fail - the important thing is the payment status from Fonepay
    console.error('[Fonepay QR] Failed to update FonepayTransaction', { prn, error: dbErr });
  }

  console.log('[Fonepay QR] checkStatus completed', { prn, paymentStatus, fonepayTraceId });

  return {
    success: true,
    paymentStatus,
    fonepayTraceId,
    transactionDetails: data as Record<string, unknown>,
  };
}

function mapPaymentStatusToDbStatus(paymentStatus: FonepayPaymentStatus): string {
  switch (paymentStatus) {
    case 'success':
      return FONEPAY_QR_STATUS_SUCCESS;
    case 'failed':
      return FONEPAY_QR_STATUS_FAILED;
    case 'verified':
      return FONEPAY_QR_STATUS_VERIFIED;
    case 'pending':
    default:
      return FONEPAY_QR_STATUS_CREATED;
  }
}

export async function updateTransactionStatus(
  prn: string,
  status: string,
  fonepayTraceId?: string
): Promise<void> {
  await prisma.fonepayTransaction.updateMany({
    where: { prn },
    data: { status, ...(fonepayTraceId ? { fonepayTraceId } : {}) },
  });
}

/**
 * Parse WebSocket transactionStatus JSON and update database.
 * Called when receiving WebSocket payment notification.
 */
export async function handleWebSocketPaymentResult(
  prn: string,
  transactionStatusJson: string
): Promise<{ paymentStatus: FonepayPaymentStatus; fonepayTraceId?: string }> {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(transactionStatusJson);
  } catch {
    console.error('[Fonepay QR] Failed to parse WebSocket transactionStatus', {
      prn,
      raw: transactionStatusJson,
    });
    return { paymentStatus: 'pending' };
  }

  const paymentSuccess = parsed.paymentSuccess === true;
  const fonepayTraceId = parsed.traceId ? String(parsed.traceId) : undefined;

  const paymentStatus: FonepayPaymentStatus = paymentSuccess ? 'success' : 'failed';
  const dbStatus = paymentSuccess ? FONEPAY_QR_STATUS_SUCCESS : FONEPAY_QR_STATUS_FAILED;

  await prisma.fonepayTransaction.updateMany({
    where: { prn },
    data: {
      status: dbStatus,
      ...(fonepayTraceId ? { fonepayTraceId } : {}),
    },
  });

  console.log('[Fonepay QR] WebSocket payment result processed', {
    prn,
    paymentStatus,
    fonepayTraceId,
  });

  return { paymentStatus, fonepayTraceId };
}

/**
 * Handle QR verification WebSocket message.
 * Called when QR is scanned by customer.
 */
export async function handleWebSocketQrVerified(prn: string): Promise<void> {
  await prisma.fonepayTransaction.updateMany({
    where: { prn },
    data: { status: FONEPAY_QR_STATUS_VERIFIED },
  });

  console.log('[Fonepay QR] QR verified', { prn });
}
