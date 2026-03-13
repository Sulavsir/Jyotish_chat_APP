/**
 * Payment/Checkout Page
 * Choose payment method: GetPay (card) | Fonepay (card) | Fonepay (QR)
 * Then show the selected checkout UI.
 *
 * Uses TanStack Query mutations via custom hooks:
 * - useGetPayPayment for GetPay payments
 * - useFonepayQrOrder for Fonepay QR payments
 * - useFonepayCardOrder for Fonepay Card payments
 */

'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@jyotish/ui';
import { Loader2, Banknote, ArrowLeft } from 'lucide-react';
import { useGetPayPayment } from '@/hooks/useGetPayPayment';
import { useFonepayQrOrder } from '@/hooks/useFonepayQrOrder';
import { useFonepayCardOrder } from '@/hooks/useFonepayCardOrder';
import { BackToPaymentMethodsButton } from '@/components/payment/BackToPaymentMethodsButton';
import { GetPayCheckout } from '@/components/payment/GetPayCheckout';
import { FonepayQRCheckout } from '@/components/payment/FonepayQRCheckout';
import { toast } from 'sonner';
import { showErrorToast } from '@/lib/error-handler';
import { ROUTES, PAYMENT_METHOD, type PaymentMethod } from '@/constants';

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  
  // Refs to prevent duplicate API calls (React Strict Mode, re-renders, etc.)
  const qrOrderInitiatedRef = useRef(false);
  const getPayOrderInitiatedRef = useRef(false);

  const planId = searchParams.get('planId');
  const amountParam = searchParams.get('amount');
  const coinsParam = searchParams.get('coins');

  const amount = amountParam ? Number(amountParam) : NaN;
  const coins = coinsParam ? Number(coinsParam) : NaN;
  const isValid = !Number.isNaN(amount) && amount > 0 && !Number.isNaN(coins) && coins > 0;

  const normalizedPlanId = useMemo(
    () =>
      planId && !planId.startsWith('custom') && /^[0-9a-f-]{36}$/i.test(planId)
        ? planId
        : undefined,
    [planId]
  );

  const {
    createOrder: createGetPayOrder,
    checkoutData,
    isCreating: isCreatingGetPayOrder,
  } = useGetPayPayment({
    onError: (err) => showErrorToast(err),
  });

  const {
    createOrder: createFonepayQrOrder,
    orderData: fonepayQrData,
    isCreating: isCreatingFonepayQr,
  } = useFonepayQrOrder({
    onError: (err) => {
      // Reset the ref so user can retry
      qrOrderInitiatedRef.current = false;
      showErrorToast(err);
    },
  });

  const {
    createOrder: createFonepayCardOrder,
    isCreating: isCreatingFonepayCard,
    error: fonepayCardError,
    reset: resetFonepayCard,
  } = useFonepayCardOrder({
    onError: (err) => showErrorToast(err),
  });

  useEffect(() => {
    if (!isValid) {
      router.replace(ROUTES.PRICING);
      return;
    }
  }, [isValid, router]);

  const handleSelectGetPay = useCallback(() => {
    setPaymentMethod(PAYMENT_METHOD.GETPAY);
    // Only create order if not already created or in progress
    if (!checkoutData && !isCreatingGetPayOrder && !getPayOrderInitiatedRef.current) {
      getPayOrderInitiatedRef.current = true;
      createGetPayOrder({ amount, coins, planId: normalizedPlanId });
    }
  }, [checkoutData, isCreatingGetPayOrder, createGetPayOrder, amount, coins, normalizedPlanId]);

  const handleSelectFonepayCard = useCallback(() => {
    setPaymentMethod(PAYMENT_METHOD.FONEPAY_CARD);
    if (!isCreatingFonepayCard) {
      createFonepayCardOrder({ amount, coins, planId: normalizedPlanId });
    }
  }, [isCreatingFonepayCard, createFonepayCardOrder, amount, coins, normalizedPlanId]);

  const handleSelectFonepayQr = useCallback(() => {
    setPaymentMethod(PAYMENT_METHOD.FONEPAY_QR);
    // CRITICAL: Only create QR order ONCE - prevent duplicate calls that expire previous QR
    if (!fonepayQrData && !isCreatingFonepayQr && !qrOrderInitiatedRef.current) {
      qrOrderInitiatedRef.current = true;
      createFonepayQrOrder({ amount, coins, planId: normalizedPlanId });
    }
  }, [fonepayQrData, isCreatingFonepayQr, createFonepayQrOrder, amount, coins, normalizedPlanId]);

  const handleFonepayQrSuccess = useCallback(() => {
    window.dispatchEvent(new CustomEvent('coinsPurchased'));
    router.push(
      `${ROUTES.PAYMENT_SUCCESS}?orderId=${fonepayQrData?.orderId ?? ''}&source=fonepay-qr`
    );
  }, [router, fonepayQrData?.orderId]);

  const handleBackToMethods = useCallback(() => {
    setPaymentMethod(null);
    // Note: Don't reset qrOrderInitiatedRef here - we want to keep using the same QR
  }, []);

  const handleTopBack = useCallback(() => {
    if (paymentMethod !== null) {
      handleBackToMethods();
    } else {
      router.back();
    }
  }, [paymentMethod, handleBackToMethods, router]);

  if (!isValid) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-12">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Redirecting to pricing…</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const showMethodSelector = paymentMethod === null;

  return (
    <DashboardLayout>
      <div className="w-full bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Button
            onClick={handleTopBack}
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 text-black text-sm md:text-base font-semibold hover:bg-gray-100 hover:text-black"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </Button>
        </div>
      </div>

      <div className="w-full bg-gray-50 min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8 items-start">
            {/* Left: Order Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Information</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Banknote className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">Balance top-up</p>
                    <p className="text-sm text-gray-600">{coins} NRs</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      NPR {amount.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="pt-4">
                  <div className="bg-gray-100 rounded-lg px-4 py-3 flex items-center justify-between">
                    <span className="font-bold text-gray-900">Total:</span>
                    <span className="font-bold text-lg text-gray-900">
                      NPR {amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Payment method choice or checkout */}
            <div className="bg-white rounded-lg shadow-md px-6 pb-6 pt-6 min-w-0">
              {showMethodSelector ? (
                <>
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Choose payment method</h2>
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleSelectGetPay}
                      disabled={isCreatingGetPayOrder}
                      className="w-full flex items-center gap-4 p-6 rounded-xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50/50 transition-colors disabled:opacity-60 text-left"
                    >
                      <div className="flex-shrink-0 w-32 min-h-[56px] flex items-center justify-start">
                        <Image
                          src="/images/payment/getpay.webp"
                          alt="GetPay"
                          width={180}
                          height={56}
                          className="object-contain max-h-14 w-auto"
                          unoptimized
                        />
                      </div>
                      {isCreatingGetPayOrder && (
                        <Loader2 className="h-5 w-5 animate-spin text-purple-600 flex-shrink-0 ml-auto" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleSelectFonepayCard}
                      className="w-full flex items-center gap-3 p-6 rounded-xl border border-gray-200 hover:border-amber-400 hover:bg-amber-50/30 transition-colors text-left"
                    >
                      <div className="flex-shrink-0 flex items-center gap-3">
                        <Image
                          src="/images/payment/fonepay.png"
                          alt="Fonepay"
                          width={140}
                          height={44}
                          className="object-contain h-11 w-auto"
                          unoptimized
                        />
                        <span className="font-semibold text-gray-700">Login to pay</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={handleSelectFonepayQr}
                      disabled={isCreatingFonepayQr}
                      className="w-full flex items-center gap-3 p-6 rounded-xl border border-gray-200 hover:border-red-500 hover:bg-red-50/30 transition-colors disabled:opacity-60 text-left"
                    >
                      <div className="flex-shrink-0 flex items-center gap-3">
                        <Image
                          src="/images/payment/fonepay.png"
                          alt="Fonepay"
                          width={140}
                          height={44}
                          className="object-contain h-11 w-auto"
                          unoptimized
                        />
                        <span className="font-semibold text-gray-700">QR</span>
                      </div>
                      {isCreatingFonepayQr && (
                        <Loader2 className="h-5 w-5 animate-spin text-red-600 flex-shrink-0 ml-auto" />
                      )}
                    </button>
                  </div>
                </>
              ) : paymentMethod === PAYMENT_METHOD.GETPAY && checkoutData ? (
                <div className="space-y-4">
                  <BackToPaymentMethodsButton onClick={handleBackToMethods} />
                  <GetPayCheckout
                    checkoutData={checkoutData}
                    onError={(msg) => {
                      toast.error(msg);
                    }}
                  />
                </div>
              ) : paymentMethod === PAYMENT_METHOD.FONEPAY_CARD &&
                isCreatingFonepayCard ? (
                <div className="space-y-4">
                  <BackToPaymentMethodsButton onClick={handleBackToMethods} />
                  <div className="rounded-xl border-2 border-amber-200 bg-amber-50/50 p-6 text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-amber-600 mx-auto mb-4" />
                    <p className="text-gray-700 font-medium">Redirecting to Fonepay…</p>
                    <p className="text-sm text-gray-600 mt-1">
                      You will enter your card details on Fonepay.
                    </p>
                  </div>
                </div>
              ) : paymentMethod === PAYMENT_METHOD.FONEPAY_CARD && fonepayCardError ? (
                <div className="space-y-4">
                  <BackToPaymentMethodsButton onClick={handleBackToMethods} />
                  <div className="rounded-xl border-2 border-red-200 bg-red-50/50 p-6 text-center">
                    <p className="text-red-700 text-sm">
                      Could not start Fonepay payment. Please try again.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        resetFonepayCard();
                        createFonepayCardOrder({ amount, coins, planId: normalizedPlanId });
                      }}
                      className="mt-4"
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              ) : paymentMethod === PAYMENT_METHOD.FONEPAY_QR && fonepayQrData ? (
                <div className="space-y-4">
                  <BackToPaymentMethodsButton onClick={handleBackToMethods} />
                  <FonepayQRCheckout
                    orderId={fonepayQrData.orderId}
                    prn={fonepayQrData.prn}
                    qrMessage={fonepayQrData.qrMessage}
                    websocketUrl={fonepayQrData.websocketUrl}
                    onSuccess={handleFonepayQrSuccess}
                    onError={(msg) => toast.error(msg)}
                  />
                </div>
              ) : isCreatingGetPayOrder || isCreatingFonepayQr ? (
                <div className="space-y-4">
                  <BackToPaymentMethodsButton onClick={handleBackToMethods} />
                  <div className="py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600 text-sm">Preparing payment…</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <BackToPaymentMethodsButton onClick={handleBackToMethods} />
                  <div className="py-12 text-center">
                    <p className="text-gray-600 mb-4">Choose a payment method above.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
