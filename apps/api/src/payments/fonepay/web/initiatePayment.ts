/**
 * Fonepay Web Redirect (card) – build DV and redirect URL. Uses FONEPAY_WEB_* env only.
 */

import * as crypto from 'crypto';
import { prisma } from '@jyotish/database';
import { getFonepayWebEnv, getFonepayWebReturnUrl } from '../../../config/fonepay-web.env';
import { computeHmacSha512, buildFonepayWebRequestMessage } from '../../../utils/fonepay.crypto';
import { AppError } from '../../../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../../../constants';
import {
  PAYMENT_CURRENCY_DEFAULT,
  PAYMENT_METHOD_FONEPAY_CARD,
  PaymentStatus,
  FONEPAY_PRN_PREFIX_WEB,
  FONEPAY_PRN_WEB_RANDOM_LENGTH,
  PAYMENT_REMARKS_APP_NAME,
  PAYMENT_REMARKS_COINS_PREFIX,
  FONEPAY_WEB_MD_PAYMENT,
  FONEPAY_WEB_CRN_NPR,
  FONEPAY_WEB_R2_NA,
} from '../../../constants/payment.constants';
import type {
  CreateFonepayCardOrderRequest,
  CreateFonepayCardOrderResponse,
} from '../../../types/payment.types';

function formatFonepayDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

export interface InitiatePaymentInput {
  userId: string;
  body: CreateFonepayCardOrderRequest;
}

/**
 * Create Payment (PENDING), build redirect URL to Fonepay Web (merchantRequest).
 * Frontend redirects user to redirectUrl; Fonepay redirects back to RU (getFonepayWebReturnUrl()).
 */
export async function initiatePayment(
  input: InitiatePaymentInput
): Promise<CreateFonepayCardOrderResponse> {
  const env = getFonepayWebEnv();
  if (!env) {
    throw new AppError(
      'Fonepay Web is not configured',
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      ERROR_CODES.SERVER_ERROR
    );
  }

  const { userId, body } = input;
  const { amount, coins, planId } = body;
  const prn =
    FONEPAY_PRN_PREFIX_WEB +
    crypto.randomUUID().replace(/-/g, '').slice(0, FONEPAY_PRN_WEB_RANDOM_LENGTH);
  const PID = env.FONEPAY_WEB_PID;
  const MD = FONEPAY_WEB_MD_PAYMENT;
  const AMT = String(amount);
  const CRN = FONEPAY_WEB_CRN_NPR;
  const DT = formatFonepayDate(new Date());
  const R1 = `${PAYMENT_REMARKS_APP_NAME}-${PAYMENT_REMARKS_COINS_PREFIX}${coins}`.slice(0, 160);
  const R2 = FONEPAY_WEB_R2_NA;
  const RU = getFonepayWebReturnUrl();
  const apiBase = RU.replace(/\/api\/v1\/payments\/fonepay-card-callback$/, '');
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(apiBase)) {
    throw new AppError(
      'Fonepay Web requires a public callback URL. Set API_URL or FONEPAY_WEB_RETURN_URL to your public URL (e.g. ngrok: https://your-subdomain.ngrok.io).',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }
  if (!/^https:\/\//i.test(apiBase)) {
    throw new AppError(
      'Fonepay Web callback URL (RU) must be HTTPS. Use ngrok or a public HTTPS URL for API_URL.',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const message = buildFonepayWebRequestMessage({
    PID,
    MD,
    PRN: prn,
    AMT,
    CRN,
    DT,
    R1,
    R2,
    RU,
  });
  const DV = computeHmacSha512(message, env.FONEPAY_WEB_SECRET);

  const payment = await prisma.payment.create({
    data: {
      userId,
      consultationId: null,
      amount,
      currency: PAYMENT_CURRENCY_DEFAULT,
      status: PaymentStatus.PENDING,
      paymentMethod: PAYMENT_METHOD_FONEPAY_CARD,
      transactionId: null,
      metadata: { prn, coins, planId: planId ?? null },
    },
  });

  const baseUrl = env.FONEPAY_WEB_URL.replace(/\/$/, '');
  const params = new URLSearchParams({
    PID,
    MD,
    PRN: prn,
    AMT,
    CRN,
    DT,
    R1,
    R2,
    RU,
    DV,
  });
  const redirectUrl = `${baseUrl}/api/merchantRequest?${params.toString()}`;

  return {
    orderId: payment.id,
    redirectUrl,
  };
}
