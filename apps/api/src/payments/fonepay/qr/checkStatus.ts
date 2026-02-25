/**
 * Fonepay Dynamic QR – check payment status. Uses FONEPAY_QR_* env only.
 */

import { prisma } from '@jyotish/database';
import { getFonepayQrEnv } from '../../../config/fonepay-qr.env';
import {
  FONEPAY_QR_PATH_CHECK_STATUS,
  FONEPAY_QR_STATUS_SUCCESS,
  FONEPAY_QR_STATUS_FAILED,
  FONEPAY_QR_STATUS_VERIFIED,
} from './constants';
import { computeHmacSha512, buildCheckStatusMessage } from '../../../utils/fonepay.crypto';
import { fonepayPost, buildBasicAuthHeader } from '../../../services/fonepay.client';
import { AppError } from '../../../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../../../constants';
import type {
  FonepayCheckStatusRequest,
  FonepayStatusResponse,
  FonepayErrorResponse,
  FonepayPaymentStatus,
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
  const signature = computeHmacSha512(message, env.FONEPAY_QR_SECRET);

  const baseUrl = env.FONEPAY_QR_BASE_URL.replace(/\/$/, '');
  const url = `${baseUrl}${FONEPAY_QR_PATH_CHECK_STATUS}`;
  const authHeader = buildBasicAuthHeader(env.FONEPAY_QR_USERNAME, env.FONEPAY_QR_PASSWORD);
  const response = await fonepayPost<{
    paymentStatus?: string;
    status?: string;
    fonepayTraceId?: string;
    [key: string]: unknown;
  }>(url, { prn, merchantCode: env.FONEPAY_QR_MERCHANT_CODE, signature }, authHeader);

  if (!response.ok) {
    const errMsg =
      (response.data && typeof response.data === 'object' && 'message' in response.data
        ? String((response.data as { message?: string }).message)
        : null) || `Fonepay QR check-status error: ${response.status}`;
    return { success: false, error: errMsg, code: response.status };
  }

  const data = response.data as {
    paymentStatus?: string;
    status?: string;
    fonepayTraceId?: string;
  };
  let paymentStatus: FonepayPaymentStatus = 'pending';
  const raw = (data.paymentStatus ?? data.status ?? '').toLowerCase();
  if (raw === 'success' || raw === 'verified') paymentStatus = 'success';
  else if (raw === 'failed' || raw === 'failure') paymentStatus = 'failed';

  const fonepayTraceId = data.fonepayTraceId ?? undefined;
  const dbStatus =
    paymentStatus === 'success'
      ? FONEPAY_QR_STATUS_SUCCESS
      : paymentStatus === 'failed'
        ? FONEPAY_QR_STATUS_FAILED
        : FONEPAY_QR_STATUS_VERIFIED;

  await prisma.fonepayTransaction.updateMany({
    where: { prn },
    data: {
      status: dbStatus,
      ...(fonepayTraceId ? { fonepayTraceId } : {}),
    },
  });

  return {
    success: true,
    paymentStatus,
    fonepayTraceId,
    transactionDetails: data as Record<string, unknown>,
  };
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
