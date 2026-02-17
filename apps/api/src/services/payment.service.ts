/**
 * Payment service - Create order (GetPay) and verify payment
 */

import { prisma } from '@jyotish/database';
import { AppError } from '../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import {
  getPayConfig,
  PAYMENT_CURRENCY_DEFAULT,
  PAYMENT_METHOD_GETPAY,
} from '../constants/payment.constants';
import { getPayMerchantStatus } from './getpay.api';
import type { CreateOrderRequest, CreateOrderResponse } from '../types/payment.types';
import { CoinTransactionReason } from '../types/coin.types';
import { addCoins } from './coin.service';
import { pricingService } from './pricing.service';
import { PurchaseMethod } from '../types/pricing.types';

/**
 * Build frontend callback URLs for GetPay redirect (success/fail).
 * orderId is included so the frontend can send it when verifying.
 */
export function buildCallbackUrls(
  baseOrigin: string,
  orderId: string
): { successUrl: string; failUrl: string } {
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
  baseOrigin: string
): Promise<CreateOrderResponse> {
  const { papInfo, isConfigured } = getPayConfig();

  if (!isConfigured) {
    throw new AppError(
      'Payment is not configured',
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      ERROR_CODES.SERVER_ERROR
    );
  }

  const { amount, coins, planId } = body;

  const payment = await prisma.payment.create({
    data: {
      userId,
      consultationId: null,
      amount,
      currency: PAYMENT_CURRENCY_DEFAULT,
      status: 'PENDING',
      paymentMethod: PAYMENT_METHOD_GETPAY,
      transactionId: null,
      metadata: { coins, planId: planId ?? null },
    },
  });

  const { successUrl, failUrl } = buildCallbackUrls(baseOrigin, payment.id);
  const websiteDomain = new URL(successUrl).origin;
  const { scriptUrl } = getPayConfig();

  return {
    orderId: payment.id,
    amount,
    currency: PAYMENT_CURRENCY_DEFAULT,
    coins,
    planId: planId ?? null,
    papInfo,
    successUrl,
    failUrl,
    websiteDomain,
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

  if (payment.status === 'SUCCESS') {
    const balance = await prisma.user.findUnique({
      where: { id: userId },
      select: { coins: true },
    });
    return {
      success: true,
      message: 'Payment already confirmed.',
      balance: balance?.coins ?? 0,
    };
  }

  let getPayResponse: { status?: string; [key: string]: unknown };
  try {
    getPayResponse = await getPayMerchantStatus(token);
  } catch (e) {
    await prisma.payment.update({
      where: { id: orderId },
      data: { status: 'FAILED' },
    });
    const err = e instanceof Error ? e : new Error('Verification failed');
    throw new AppError(
      err.message,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const status = String(getPayResponse?.status ?? '').toUpperCase();
  if (status !== 'SUCCESS' && status !== 'COMPLETED') {
    await prisma.payment.update({
      where: { id: orderId },
      data: { status: 'FAILED' },
    });
    return {
      success: false,
      message: 'Payment was not successful.',
    };
  }

  const metadata = (payment.metadata as { coins?: number; planId?: string }) ?? {};
  const coinsToAdd = metadata.coins ?? 0;
  const planId = metadata.planId;

  await prisma.payment.update({
    where: { id: orderId },
    data: {
      status: 'SUCCESS',
      transactionId: token,
    },
  });

  if (planId) {
    await pricingService.activatePlanForUser(userId, planId, PurchaseMethod.MONEY);
  } else if (coinsToAdd > 0) {
    await addCoins(
      userId,
      coinsToAdd,
      CoinTransactionReason.PAYMENT_SUCCESS,
      undefined,
      payment.id
    );
  }

  const balance = await prisma.user.findUnique({
    where: { id: userId },
    select: { coins: true },
  });

  return {
    success: true,
    message: 'Payment verified. Coins have been added to your account.',
    balance: balance?.coins ?? 0,
  };
}
