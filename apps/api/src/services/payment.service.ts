/**
 * Payment service - Create order (GetPay) and verify payment
 */

import { prisma } from '@jyotish/database';
import { ACTIVE_CLIENT_USER_WHERE } from '../constants/user.constants';
import { AppError } from '../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import {
  getPayConfig,
  PAYMENT_CURRENCY_DEFAULT,
  PAYMENT_METHOD_GETPAY,
  PAYMENT_METHOD_FONEPAY_QR,
  PaymentStatus,
  FONEPAY_PRN_PREFIX_QR,
  FONEPAY_PRN_QR_RANDOM_LENGTH,
  PAYMENT_REMARKS_APP_NAME,
  PAYMENT_REMARKS_COINS_PREFIX,
  GETPAY_RESPONSE_STATUS_PENDING,
  GETPAY_RESPONSE_STATUS_SUCCESS,
  GETPAY_RESPONSE_STATUS_COMPLETED,
  GETPAY_RESPONSE_STATUS_CAPTURED,
  GETPAY_RESPONSE_STATUS_AUTHORIZED,
  GETPAY_RESPONSE_MESSAGE_SUCCESS,
} from '../constants/payment.constants';
import * as fonepayQr from '../payments/fonepay/qr';
import * as fonepayWeb from '../payments/fonepay/web';
import type {
  CreateFonepayQrOrderRequest,
  CreateFonepayQrOrderResponse,
  VerifyFonepayQrResponse,
  CreateFonepayCardOrderRequest,
  CreateFonepayCardOrderResponse,
} from '../types/payment.types';
import { getPayMerchantStatus } from './getpay.api';
import type { CreateOrderRequest, CreateOrderResponse } from '../types/payment.types';
import { CoinTransactionReason } from '../types/coin.types';
import { addCoins } from './coin.service';
import { pricingService } from './pricing.service';
import { PurchaseMethod } from '../types/pricing.types';
import {
  makeMySuccessfulPaymentsCacheKey,
  getMySuccessfulPaymentsCache,
  setMySuccessfulPaymentsCache,
  invalidateMySuccessfulPaymentsCache,
} from './paymentCache';
import {
  notifyClientPaymentFailed,
  notifyClientPaymentSuccess,
} from './paymentNotification.service';

/**
 * Build callback URLs for GetPay. The bundle redirects to these after OTP.
 * Use frontend success/fail pages so the app receives the redirect and can verify.
 */
export function buildCallbackUrls(
  baseOrigin: string | undefined,
  orderId: string
): { successUrl: string; failUrl: string } {
  if (!baseOrigin) {
    throw new Error('baseOrigin is undefined. Check FRONTEND_URL or request origin.');
  }

  const origin = baseOrigin.replace(/\/$/, '');

  return {
    successUrl: `${origin}/payment-success?orderId=${encodeURIComponent(orderId)}`,
    failUrl: `${origin}/payment-fail?orderId=${encodeURIComponent(orderId)}`,
  };
}

/**
 * Create a payment order (Payment record PENDING) and return data needed for GetPay checkout.
 * Frontend must use orderId as clientRequestId when initializing GetPay.
 */
export async function createOrder(
  userId: string,
  body: CreateOrderRequest,
  baseOrigin?: string
): Promise<CreateOrderResponse> {
  const { papInfo, isConfigured, scriptUrl } = getPayConfig();

  if (!isConfigured) {
    throw new AppError(
      'Payment is not configured',
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      ERROR_CODES.SERVER_ERROR
    );
  }

  const { amount, coins, planId } = body;

  if (!amount || amount <= 0) {
    throw new AppError(
      'Invalid payment amount',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const origin = baseOrigin || process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || '';

  if (!origin) {
    throw new AppError(
      'Frontend URL is not configured',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.SERVER_ERROR
    );
  }

  const cleanOrigin = origin.replace(/\/$/, '');

  // 🧾 Create DB record first
  const payment = await prisma.payment.create({
    data: {
      userId,
      consultationId: null,
      amount,
      currency: PAYMENT_CURRENCY_DEFAULT,
      status: PaymentStatus.PENDING,
      paymentMethod: PAYMENT_METHOD_GETPAY,
      transactionId: null,
      metadata: { coins, planId: planId ?? null },
    },
  });

  // 🔗 Build callback URLs
  const successUrl = `${cleanOrigin}/payment-success?orderId=${encodeURIComponent(payment.id)}`;

  const failUrl = `${cleanOrigin}/payment-fail?orderId=${encodeURIComponent(payment.id)}`;

  return {
    orderId: payment.id,
    amount,
    currency: PAYMENT_CURRENCY_DEFAULT,
    coins,
    planId: planId ?? null,
    papInfo,
    successUrl,
    failUrl,
    websiteDomain: cleanOrigin,
    scriptUrl,
  };
}

/**
 * Verify payment with GetPay and, on success, update Payment and add coins or activate plan.
 */
export async function verifyPayment(
  userId: string,
  orderId: string,
  token: string
): Promise<{ success: boolean; message: string; balance?: number }> {
  const payment = await prisma.payment.findUnique({
    where: { id: orderId, userId },
  });

  if (!payment) {
    throw new AppError('Order not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  if (payment.status === PaymentStatus.SUCCESS) {
    const balance = await prisma.user.findFirst({
      where: { id: userId, ...ACTIVE_CLIENT_USER_WHERE },
      select: { coins: true },
    });
    invalidateMySuccessfulPaymentsCache(userId);
    return {
      success: true,
      message: 'Payment already confirmed.',
      balance: balance?.coins ?? 0,
    };
  }

  // Persist transactionId as soon as we attempt verify (paper trail even if GetPay fails)
  const transactionIdToStore = token;
  try {
    await prisma.payment.update({
      where: { id: orderId },
      data: { transactionId: transactionIdToStore },
    });
  } catch (e) {
    // Non-fatal: continue to GetPay verification
  }

  const POLL_INTERVAL_MS = 5_000;
  const POLL_MAX_ATTEMPTS = 6;

  let getPayResponse: {
    status?: string | number;
    message?: string;
    transactionId?: string;
    [key: string]: unknown;
  };
  try {
    getPayResponse = await getPayMerchantStatus(token);
    let rawStatus = String(getPayResponse?.status ?? '')
      .trim()
      .toUpperCase();
    if (rawStatus === GETPAY_RESPONSE_STATUS_PENDING && POLL_MAX_ATTEMPTS > 1) {
      for (let attempt = 1; attempt < POLL_MAX_ATTEMPTS; attempt++) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        getPayResponse = await getPayMerchantStatus(token);
        rawStatus = String(getPayResponse?.status ?? '')
          .trim()
          .toUpperCase();
        if (rawStatus !== GETPAY_RESPONSE_STATUS_PENDING) break;
      }
    }
  } catch (e) {
    await prisma.payment.update({
      where: { id: orderId },
      data: { status: PaymentStatus.FAILED, transactionId: transactionIdToStore },
    });
    void notifyClientPaymentFailed({
      userId,
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      reason: e instanceof Error ? e.message : 'Verification with GetPay failed.',
    });
    const err = e instanceof Error ? e : new Error('Verification failed');
    throw new AppError(err.message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const rawStatus = getPayResponse?.status;
  const rawMessage = String(getPayResponse?.message ?? '')
    .trim()
    .toUpperCase();
  const statusStr = String(rawStatus ?? '')
    .trim()
    .toUpperCase();

  const numericStatus =
    typeof rawStatus === 'number'
      ? rawStatus
      : Number.isNaN(Number(rawStatus))
        ? undefined
        : Number(rawStatus);

  const isSuccess =
    numericStatus === 0 ||
    numericStatus === 1 ||
    statusStr === GETPAY_RESPONSE_STATUS_SUCCESS ||
    statusStr === GETPAY_RESPONSE_STATUS_COMPLETED ||
    statusStr === GETPAY_RESPONSE_STATUS_CAPTURED ||
    statusStr === GETPAY_RESPONSE_STATUS_AUTHORIZED ||
    rawMessage === GETPAY_RESPONSE_MESSAGE_SUCCESS ||
    rawMessage.includes(GETPAY_RESPONSE_MESSAGE_SUCCESS);

  if (!isSuccess) {
    console.error('[GetPay] Verification not successful', {
      status: rawStatus,
      message: rawMessage,
      orderId,
    });
    await prisma.payment.update({
      where: { id: orderId },
      data: { status: PaymentStatus.FAILED, transactionId: transactionIdToStore },
    });
    void notifyClientPaymentFailed({
      userId,
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      reason: `Gateway status: ${String(rawStatus) || rawMessage || 'unknown'}`,
    });
    return {
      success: false,
      message: `Payment was not successful (status: ${String(rawStatus) || rawMessage || 'unknown'}).`,
    };
  }

  const metadata = (payment.metadata as { coins?: number; planId?: string }) ?? {};
  const coinsToAdd = metadata.coins ?? 0;
  const planId = metadata.planId;

  const finalTransactionId =
    (getPayResponse.transactionId && String(getPayResponse.transactionId).trim()) ||
    transactionIdToStore;

  const updateResult = await prisma.payment.updateMany({
    where: {
      id: orderId,
      userId,
      status: PaymentStatus.PENDING,
    },
    data: {
      status: PaymentStatus.SUCCESS,
      transactionId: finalTransactionId,
    },
  });

  if (updateResult.count === 0) {
    // Another request already processed this order — return idempotent success
    const balance = await prisma.user.findFirst({
      where: { id: userId, ...ACTIVE_CLIENT_USER_WHERE },
      select: { coins: true },
    });
    invalidateMySuccessfulPaymentsCache(userId);
    return {
      success: true,
      message: 'Payment already confirmed.',
      balance: balance?.coins ?? 0,
    };
  }

  // We won the race — credit coins or activate plan
  if (planId) {
    await pricingService.activatePlanForUser(userId, planId, PurchaseMethod.MONEY);
    void notifyClientPaymentSuccess({
      userId,
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      planActivated: true,
    });
  } else if (coinsToAdd > 0) {
    await addCoins(
      userId,
      coinsToAdd,
      CoinTransactionReason.PAYMENT_SUCCESS,
      undefined,
      payment.id
    );
    void notifyClientPaymentSuccess({
      userId,
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      coinsAdded: coinsToAdd,
    });
  } else {
    void notifyClientPaymentSuccess({
      userId,
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
    });
  }

  const balance = await prisma.user.findFirst({
    where: { id: userId, ...ACTIVE_CLIENT_USER_WHERE },
    select: { coins: true },
  });

  invalidateMySuccessfulPaymentsCache(userId);
  return {
    success: true,
    message: 'Payment verified. Coins have been added to your account.',
    balance: balance?.coins ?? 0,
  };
}

/**
 * Get only successful (gateway-success) payments for the current user.
 * Excludes PENDING / FAILED / REFUNDED to prevent "pending" items in production UI.
 */
export async function getMySuccessfulPayments(
  userId: string,
  params: { page?: number; limit?: number }
): Promise<{
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    transactionId: string | null;
    status: PaymentStatus;
    createdAt: Date;
    metadata: unknown;
  }>;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const limit = Math.min(100, Math.max(1, Math.floor(params.limit ?? 10)));
  const skip = (page - 1) * limit;

  const cacheKey = makeMySuccessfulPaymentsCacheKey(userId, page, limit);
  const cached = getMySuccessfulPaymentsCache(cacheKey);
  if (cached) return cached;

  const where = { userId, status: PaymentStatus.SUCCESS };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        amount: true,
        currency: true,
        paymentMethod: true,
        transactionId: true,
        status: true,
        createdAt: true,
        metadata: true,
      },
    }),
    prisma.payment.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const result = {
    payments,
    pagination: { page, limit, total, totalPages },
  };

  setMySuccessfulPaymentsCache(cacheKey, result);
  return result;
}

/**
 * Create a Fonepay QR order: Payment (PENDING) + FonepayTransaction (type QR) + generate QR.
 * Returns orderId, prn, qrMessage, websocketUrl for frontend PaymentQR.
 */
export async function createFonepayQrOrder(
  userId: string,
  body: CreateFonepayQrOrderRequest
): Promise<CreateFonepayQrOrderResponse> {
  const { amount, coins, planId } = body;
  const prn =
    FONEPAY_PRN_PREFIX_QR +
    crypto.randomUUID().replace(/-/g, '').slice(0, FONEPAY_PRN_QR_RANDOM_LENGTH);
  const remarks1 = PAYMENT_REMARKS_APP_NAME;
  const remarks2 = `${PAYMENT_REMARKS_COINS_PREFIX}${coins}`;

  const payment = await prisma.payment.create({
    data: {
      userId,
      consultationId: null,
      amount,
      currency: PAYMENT_CURRENCY_DEFAULT,
      status: PaymentStatus.PENDING,
      paymentMethod: PAYMENT_METHOD_FONEPAY_QR,
      transactionId: null,
      metadata: { prn, coins, planId: planId ?? null },
    },
  });

  const result = await fonepayQr.generateQr({
    amount: String(amount),
    remarks1,
    remarks2,
    prn,
  });

  if (!result.success) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED },
    });
    void notifyClientPaymentFailed({
      userId,
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: PAYMENT_METHOD_FONEPAY_QR,
      reason: result.error ?? 'Could not generate payment QR.',
    });
    throw new AppError(
      result.error ?? 'Failed to generate Fonepay QR',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.SERVER_ERROR
    );
  }

  return {
    orderId: payment.id,
    prn,
    amount,
    coins,
    qrMessage: result.qrMessage,
    websocketUrl: result.websocketUrl,
  };
}

/**
 * Verify Fonepay QR payment by prn: check status with Fonepay, then update Payment and add coins.
 */
export async function verifyFonepayQrPayment(
  userId: string,
  prn: string
): Promise<VerifyFonepayQrResponse> {
  console.log('[verifyFonepayQrPayment] Starting verification', { userId, prn });
  
  // First check if already completed (avoid unnecessary Fonepay API call)
  const existingPayment = await prisma.payment.findFirst({
    where: {
      userId,
      paymentMethod: PAYMENT_METHOD_FONEPAY_QR,
      metadata: { path: ['prn'], equals: prn },
    },
  });

  console.log('[verifyFonepayQrPayment] Found payment:', existingPayment?.id, 'status:', existingPayment?.status);

  if (!existingPayment) {
    throw new AppError(
      'Fonepay QR order not found',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.NOT_FOUND
    );
  }

  // If already completed, return success (idempotent)
  if (existingPayment.status === PaymentStatus.SUCCESS) {
    console.log('[verifyFonepayQrPayment] Payment already completed, returning cached result');
    const balance = await prisma.user.findFirst({
      where: { id: userId, ...ACTIVE_CLIENT_USER_WHERE },
      select: { coins: true },
    });
    invalidateMySuccessfulPaymentsCache(userId);
    return {
      success: true,
      message: 'Payment already verified.',
      balance: balance?.coins ?? 0,
      orderId: existingPayment.id,
    };
  }

  // If already failed, return failure
  if (existingPayment.status === PaymentStatus.FAILED) {
    return {
      success: false,
      message: 'This payment has already failed. Please try again with a new order.',
    };
  }

  // Only process PENDING payments
  const payment = existingPayment.status === PaymentStatus.PENDING ? existingPayment : null;

  if (!payment) {
    throw new AppError(
      'Fonepay QR order is in an invalid state',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const metadata = (payment.metadata as { prn?: string; coins?: number; planId?: string }) ?? {};
  console.log('[verifyFonepayQrPayment] Payment metadata:', metadata);
  
  if (metadata.prn !== prn) {
    console.error('[verifyFonepayQrPayment] PRN mismatch:', { expected: prn, got: metadata.prn });
    throw new AppError(
      'Order does not match PRN',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  console.log('[verifyFonepayQrPayment] Checking status with Fonepay...');
  const statusResult = await fonepayQr.checkStatus({ prn });
  console.log('[verifyFonepayQrPayment] Fonepay status result:', statusResult);
  
  if (!statusResult.success) {
    // Do not notify: order stays PENDING; user may retry without a false "failed payment" alert.
    return {
      success: false,
      message: statusResult.error ?? 'Could not verify payment status',
    };
  }

  if (statusResult.paymentStatus !== 'success') {
    console.log('[verifyFonepayQrPayment] Payment not successful, status:', statusResult.paymentStatus);
    if (statusResult.paymentStatus === 'failed') {
      void notifyClientPaymentFailed({
        userId,
        paymentId: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: PAYMENT_METHOD_FONEPAY_QR,
        reason: 'The payment was declined or failed at the gateway.',
      });
    }
    return {
      success: false,
      message:
        statusResult.paymentStatus === 'failed'
          ? 'Payment failed.'
          : 'Payment is still pending. Please try again in a moment.',
    };
  }

  const coinsToAdd = metadata.coins ?? 0;
  const planId = metadata.planId;
  console.log('[verifyFonepayQrPayment] Processing success - coins:', coinsToAdd, 'planId:', planId);

  // Ensure transactionId is always a string (fonepayTraceId might come as number from API)
  const transactionId = statusResult.fonepayTraceId != null 
    ? String(statusResult.fonepayTraceId) 
    : prn;

  const updateResult = await prisma.payment.updateMany({
    where: {
      id: payment.id,
      userId,
      status: PaymentStatus.PENDING,
    },
    data: {
      status: PaymentStatus.SUCCESS,
      transactionId,
    },
  });

  console.log('[verifyFonepayQrPayment] Payment update result:', updateResult);

  if (updateResult.count === 0) {
    console.log('[verifyFonepayQrPayment] Update count 0 - payment already processed');
    const balance = await prisma.user.findFirst({
      where: { id: userId, ...ACTIVE_CLIENT_USER_WHERE },
      select: { coins: true },
    });
    invalidateMySuccessfulPaymentsCache(userId);
    return {
      success: true,
      message: 'Payment already confirmed.',
      balance: balance?.coins ?? 0,
      orderId: payment.id,
    };
  }

  try {
    if (planId) {
      console.log('[verifyFonepayQrPayment] Activating plan:', planId);
      await pricingService.activatePlanForUser(userId, planId, PurchaseMethod.MONEY);
      void notifyClientPaymentSuccess({
        userId,
        paymentId: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: PAYMENT_METHOD_FONEPAY_QR,
        planActivated: true,
      });
    } else if (coinsToAdd > 0) {
      console.log('[verifyFonepayQrPayment] Adding coins:', coinsToAdd);
      await addCoins(
        userId,
        coinsToAdd,
        CoinTransactionReason.PAYMENT_SUCCESS,
        undefined,
        payment.id
      );
      void notifyClientPaymentSuccess({
        userId,
        paymentId: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: PAYMENT_METHOD_FONEPAY_QR,
        coinsAdded: coinsToAdd,
      });
    } else {
      void notifyClientPaymentSuccess({
        userId,
        paymentId: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: PAYMENT_METHOD_FONEPAY_QR,
      });
    }
  } catch (err) {
    console.error('[verifyFonepayQrPayment] Error adding coins/activating plan:', err);
    throw err;
  }

  const balance = await prisma.user.findFirst({
    where: { id: userId, ...ACTIVE_CLIENT_USER_WHERE },
    select: { coins: true },
  });

  console.log('[verifyFonepayQrPayment] Success! New balance:', balance?.coins);

  return {
    success: true,
    message: 'Payment verified. Coins have been added to your account.',
    balance: balance?.coins ?? 0,
    orderId: payment.id,
  };
}

/**
 * Create Fonepay Web (card) order: Payment PENDING, redirect URL to Fonepay. Uses FONEPAY_WEB_* only.
 */
export async function createFonepayCardOrder(
  userId: string,
  body: CreateFonepayCardOrderRequest
): Promise<CreateFonepayCardOrderResponse> {
  return fonepayWeb.initiatePayment({ userId, body });
}

/**
 * Payment abstraction: single entry for Fonepay by mode (QR or WEB).
 * Use this to avoid mixing gateways and to keep PRN/flow consistent.
 */
export type FonepayPayParams =
  | { gateway: 'fonepay'; mode: 'QR'; amount: number; coins: number; planId?: string }
  | { gateway: 'fonepay'; mode: 'WEB'; amount: number; coins: number; planId?: string };

export type FonepayPayResult = CreateFonepayQrOrderResponse | CreateFonepayCardOrderResponse;

export async function payWithFonepay(
  userId: string,
  params: FonepayPayParams
): Promise<FonepayPayResult> {
  const { amount, coins, planId } = params;
  const body = { amount, coins, planId };
  if (params.mode === 'QR') {
    return createFonepayQrOrder(userId, body);
  }
  return createFonepayCardOrder(userId, body);
}

/** Fonepay Web callback query (re-export for controller). */
export type FonepayCardCallbackQuery = import('../types/fonepay.types').FonepayWebCallbackQuery;

/**
 * Handle Fonepay Web callback: verify DV, update Payment, redirect to frontend success/fail.
 */
export async function handleFonepayCardCallback(
  query: FonepayCardCallbackQuery
): Promise<{ redirectTo: string }> {
  return fonepayWeb.verifyPayment(query);
}
