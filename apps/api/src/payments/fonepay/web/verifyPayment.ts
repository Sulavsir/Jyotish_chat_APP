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

// Common Fonepay failure response codes
const FONEPAY_RC_CANCELLED = 'cancelled';
const FONEPAY_RC_USER_CANCELLED = 'user_cancelled';
const FONEPAY_RC_TIMEOUT = 'timeout';
const FONEPAY_RC_FAILED = 'failed';

/**
 * Map Fonepay response code to user-friendly message
 */
function getFailureMessage(rc: string | undefined, ps: string | undefined): string {
  const rcLower = (rc ?? '').toLowerCase();
  
  if (rcLower.includes('cancel') || rcLower === FONEPAY_RC_CANCELLED || rcLower === FONEPAY_RC_USER_CANCELLED) {
    return 'Payment was cancelled';
  }
  if (rcLower.includes('timeout') || rcLower === FONEPAY_RC_TIMEOUT) {
    return 'Payment timed out';
  }
  if (rcLower.includes('fail') || rcLower === FONEPAY_RC_FAILED) {
    return 'Payment failed';
  }
  if (ps === 'False' || ps === 'false') {
    return 'Payment was not completed';
  }
  
  return rc || 'Payment could not be processed';
}

/**
 * Handle Fonepay Web callback: verify DV, update Payment, return redirect URL to frontend success/fail.
 * This function handles all cases including success, failure, cancellation, and timeout.
 */
export async function verifyPayment(
  query: FonepayWebCallbackQuery
): Promise<{ redirectTo: string }> {
  const frontendOrigin = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const successUrl = `${frontendOrigin}/payment-success`;
  const failUrl = `${frontendOrigin}/payment-fail`;

  console.log('[verifyPayment] Processing Fonepay callback:', {
    PRN: query.PRN,
    PS: query.PS,
    RC: query.RC,
    PID: query.PID,
  });

  const env = getFonepayWebEnv();
  if (!env) {
    console.error('[verifyPayment] Fonepay Web not configured');
    return { redirectTo: `${failUrl}?message=${encodeURIComponent('Payment service not configured')}` };
  }
  
  if (env.FONEPAY_WEB_PID !== query.PID) {
    console.error('[verifyPayment] PID mismatch:', { expected: env.FONEPAY_WEB_PID, got: query.PID });
    return { redirectTo: `${failUrl}?message=${encodeURIComponent('Invalid merchant configuration')}` };
  }

  const { PRN, PID, PS, RC, DV, UID, BC, INI, P_AMT, R_AMT } = query;
  
  // Check for explicit failure/cancellation BEFORE DV verification
  // Some cancelled payments might not have valid DV
  const isExplicitFailure = 
    PS === 'False' || 
    PS === 'false' ||
    (RC?.toLowerCase() ?? '').includes('cancel') ||
    (RC?.toLowerCase() ?? '').includes('fail');

  // Try to find the payment by PRN regardless of DV verification
  const payment = await prisma.payment.findFirst({
    where: {
      paymentMethod: PAYMENT_METHOD_FONEPAY_CARD,
      metadata: { path: ['prn'], equals: PRN },
    },
  });

  // If explicit failure and we found the payment, update it and redirect
  if (isExplicitFailure && payment && payment.status === PaymentStatus.PENDING) {
    console.log('[verifyPayment] Explicit failure detected, updating payment status');
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED },
    });
    return {
      redirectTo: `${failUrl}?orderId=${encodeURIComponent(payment.id)}&message=${encodeURIComponent(getFailureMessage(RC, PS))}`,
    };
  }

  // Now verify DV for success cases
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
    console.error('[verifyPayment] DV verification failed');
    // If DV fails but we have a payment, mark it as failed
    if (payment && payment.status === PaymentStatus.PENDING) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });
    }
    return { redirectTo: `${failUrl}?message=${encodeURIComponent('Payment verification failed')}` };
  }

  const isSuccess =
    (PS === FONEPAY_VERIFY_PS_SUCCESS || PS === 'True' || PS === 'true') &&
    RC?.toLowerCase() === FONEPAY_VERIFY_RC_SUCCESSFUL;

  if (!payment) {
    console.error('[verifyPayment] Payment not found for PRN:', PRN);
    return { redirectTo: `${failUrl}?message=${encodeURIComponent('Order not found')}` };
  }

  // Check if already processed
  if (payment.status === PaymentStatus.SUCCESS) {
    console.log('[verifyPayment] Payment already completed, redirecting to success');
    return {
      redirectTo: `${successUrl}?orderId=${encodeURIComponent(payment.id)}&source=fonepay-card`,
    };
  }

  if (payment.status === PaymentStatus.FAILED) {
    console.log('[verifyPayment] Payment already failed');
    return {
      redirectTo: `${failUrl}?orderId=${encodeURIComponent(payment.id)}&message=${encodeURIComponent('Payment already failed')}`,
    };
  }

  const metadata = (payment.metadata as { prn?: string; coins?: number; planId?: string }) ?? {};
  const coinsToAdd = metadata.coins ?? 0;
  const planId = metadata.planId;

  if (isSuccess) {
    console.log('[verifyPayment] Processing successful payment');
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
      try {
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
        console.log('[verifyPayment] Coins/plan activated successfully');
      } catch (err) {
        console.error('[verifyPayment] Error adding coins/activating plan:', err);
        // Don't fail the redirect - payment was successful, we can reconcile later
      }
    }
    
    return {
      redirectTo: `${successUrl}?orderId=${encodeURIComponent(payment.id)}&source=fonepay-card`,
    };
  }

  // Not success - mark as failed
  console.log('[verifyPayment] Payment not successful, marking as failed');
  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: PaymentStatus.FAILED },
  });
  
  return {
    redirectTo: `${failUrl}?orderId=${encodeURIComponent(payment.id)}&message=${encodeURIComponent(getFailureMessage(RC, PS))}`,
  };
}
