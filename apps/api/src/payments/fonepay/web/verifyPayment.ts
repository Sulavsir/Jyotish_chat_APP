/**
 * Fonepay Web Redirect (card) – verify callback DV and complete payment. Uses FONEPAY_WEB_* env only.
 */

import { prisma } from '@jyotish/database';
import { getFonepayWebEnv } from '../../../config/fonepay-web.env';
import { computeHmacSha512, buildFonepayWebVerifyMessage } from '../../../utils/fonepay.crypto';
import {
  PAYMENT_METHOD_FONEPAY_CARD,
  PaymentStatus,
  FONEPAY_VERIFY_PS_SUCCESS,
  FONEPAY_VERIFY_RC_SUCCESSFUL,
} from '../../../constants/payment.constants';
import { addCoins } from '../../../services/coin.service';
import { pricingService } from '../../../services/pricing.service';
import { PurchaseMethod } from '../../../types/pricing.types';
import { CoinTransactionReason } from '../../../types/coin.types';
import type { FonepayWebCallbackQuery } from '../../../types/fonepay.types';

/**
 * Handle Fonepay Web callback: verify DV, update Payment, return redirect URL to frontend success/fail.
 */
export async function verifyPayment(
  query: FonepayWebCallbackQuery
): Promise<{ redirectTo: string }> {
  const frontendOrigin = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const successUrl = `${frontendOrigin}/payment-success`;
  const failUrl = `${frontendOrigin}/payment-fail`;

  const env = getFonepayWebEnv();
  if (!env || env.FONEPAY_WEB_PID !== query.PID) {
    return { redirectTo: `${failUrl}?message=${encodeURIComponent('Invalid merchant')}` };
  }

  const { PRN, PID, PS, RC, DV, UID, BC, INI, P_AMT, R_AMT } = query;
  const verifyMessage = buildFonepayWebVerifyMessage({
    PRN: PRN ?? '',
    PID: PID ?? '',
    PS: PS ?? '',
    RC: RC ?? '',
    UID: UID ?? '',
    BC: BC ?? 'N/A',
    INI: INI ?? 'N/A',
    P_AMT: P_AMT ?? '0',
    R_AMT: R_AMT ?? '0',
  });
  const expectedDV = computeHmacSha512(verifyMessage, env.FONEPAY_WEB_SECRET);
  const providedDV = (DV ?? '').trim().toUpperCase();
  if (expectedDV !== providedDV) {
    return { redirectTo: `${failUrl}?message=${encodeURIComponent('Verification failed')}` };
  }

  const isSuccess =
    (PS === FONEPAY_VERIFY_PS_SUCCESS || PS === 'True') &&
    RC?.toLowerCase() === FONEPAY_VERIFY_RC_SUCCESSFUL;

  const payment = await prisma.payment.findFirst({
    where: {
      paymentMethod: PAYMENT_METHOD_FONEPAY_CARD,
      status: PaymentStatus.PENDING,
      metadata: { path: ['prn'], equals: PRN },
    },
  });

  if (!payment) {
    return { redirectTo: `${failUrl}?message=${encodeURIComponent('Order not found')}` };
  }

  const metadata = (payment.metadata as { prn?: string; coins?: number; planId?: string }) ?? {};
  const coinsToAdd = metadata.coins ?? 0;
  const planId = metadata.planId;

  if (isSuccess) {
    const updateResult = await prisma.payment.updateMany({
      where: {
        id: payment.id,
        status: PaymentStatus.PENDING,
      },
      data: {
        status: PaymentStatus.SUCCESS,
        transactionId: UID ?? PRN,
      },
    });
    if (updateResult.count === 1) {
      if (planId) {
        await pricingService.activatePlanForUser(payment.userId, planId, PurchaseMethod.MONEY);
      } else if (coinsToAdd > 0) {
        await addCoins(
          payment.userId,
          coinsToAdd,
          CoinTransactionReason.PAYMENT_SUCCESS,
          undefined,
          payment.id
        );
      }
    }
    return {
      redirectTo: `${successUrl}?orderId=${encodeURIComponent(payment.id)}&source=fonepay-card`,
    };
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: PaymentStatus.FAILED },
  });
  return {
    redirectTo: `${failUrl}?orderId=${encodeURIComponent(payment.id)}&message=${encodeURIComponent(RC || 'Payment failed')}`,
  };
}
