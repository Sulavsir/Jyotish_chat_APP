'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@jyotish/ui';
import { Loader2, CheckCircle2, XCircle, Banknote, ArrowLeft } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '@/services/payment.service';
import broadcastMessageService from '@/services/broadcastMessage.service';
import { QUERY_KEYS, ROUTES } from '@/constants';
import { toast } from 'sonner';
import { showErrorToast } from '@/lib/error-handler';
import {
  getPendingBroadcastQuestions,
  clearPendingBroadcastQuestions,
} from '@/components/modals/BroadcastRemainingPayModal';
import {
  getPendingKundaliBooking,
  clearPendingKundaliBooking,
} from '@/lib/pending-kundali-booking.storage';
import appointmentService from '@/services/appointment.service';
import type { QueryClient } from '@tanstack/react-query';

async function completePendingKundaliBookingAfterTopUp(queryClient: QueryClient): Promise<void> {
  const pending = getPendingKundaliBooking();
  if (!pending) return;
  try {
    await appointmentService.createAppointment({
      astrologerId: pending.astrologerId,
      slotId: pending.slotId,
      bookingType: pending.bookingType,
      notes: pending.notes,
    });
    clearPendingKundaliBooking();
    toast.success('Your full kundali appointment is confirmed.');
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.APPOINTMENTS.ALL });
    await queryClient.invalidateQueries({ queryKey: ['appointments'] });
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
  } catch (e) {
    toast.error(
      e instanceof Error
        ? e.message
        : 'Could not complete booking. The slot may have been taken — please book again from the dashboard.'
    );
  }
}

/**
 * Payment sources that are already verified on backend (no frontend verification needed)
 * - fonepay-card: Fonepay Web redirects to backend callback, which verifies and adds coins
 * - fonepay-qr: Verification happens via WebSocket + backend verify endpoint
 */
const PRE_VERIFIED_SOURCES = ['fonepay-card', 'fonepay-qr'] as const;

/**
 * GetPay Step 04: "To fetch token from success/fail URL"
 * Doc: const url = window.frames[0]?.location.hash || window.location.hash
 *      const urlParams = new URLSearchParams(url.split("?")[1]);
 *      const token = urlParams.get("token");
 * We also read from query (GetPay sometimes uses ?orderid=...&token=...) and accept orderId/orderid.
 */
const TOKEN_PARAM_NAMES = ['token', 'transactionId', 'requestId', 'id'] as const;

/**
 * GetPay appends token with a second "?" or in hash: #?token=...
 * Normalize so URLSearchParams can parse: collapse multiple ? to &, and #? to ?.
 */
function normalizeSearch(search: string): string {
  const q = search.startsWith('?') ? search.slice(1) : search;
  if (!q) return q;
  return q.replace(/#\?/g, '&').replace(/\?+/g, '&');
}

/** If a param value has "?token=" stuck to it (from unnormalized URL), return the UUID part only. */
function cleanOrderId(value: string): string {
  const s = value.trim();
  const idx = s.indexOf('?');
  return idx >= 0 ? s.slice(0, idx).trim() : s;
}

const ORDER_ID_PARAM_NAMES = ['orderId', 'orderid'] as const;

function getParamsFromUrl(): { orderId: string; token: string } {
  let orderId = '';
  let token = '';
  if (typeof window === 'undefined') return { orderId, token };

  const search = window.location.search || '';
  const normalized = normalizeSearch(search);
  if (normalized) {
    const params = new URLSearchParams(normalized);
    for (const name of ORDER_ID_PARAM_NAMES) {
      const v = params.get(name)?.trim();
      if (v) {
        orderId = cleanOrderId(v);
        break;
      }
    }
    for (const name of TOKEN_PARAM_NAMES) {
      const v = params.get(name)?.trim();
      if (v) {
        token = v;
        break;
      }
    }
  }

  if (token) return { orderId, token };

  // 3DS-disabled / iframe return: token often in hash. GetPay: window.frames[0]?.location.hash || window.location.hash
  let url: string;
  try {
    url = window.frames[0]?.location?.href || window.location.href;
  } catch {
    url = window.location.href;
  }
  // Normalize #? and multiple ? so we can parse (e.g. #?token=yyy or #?orderId=xxx?token=yyy)
  const hashIdx = url.indexOf('#');
  const hashPart = hashIdx >= 0 ? url.slice(hashIdx + 1) : '';
  const queryFromHash = hashPart.replace(/^\?/, '').replace(/\?+/g, '&');
  if (queryFromHash) {
    const params = new URLSearchParams(queryFromHash);
    token = params.get('token')?.trim() ?? '';
    for (const name of TOKEN_PARAM_NAMES) {
      if (token) break;
      token = params.get(name)?.trim() ?? '';
    }
    if (!orderId) {
      for (const name of ORDER_ID_PARAM_NAMES) {
        const v = params.get(name)?.trim();
        if (v) {
          orderId = cleanOrderId(v);
          break;
        }
      }
    }
  }
  return { orderId, token };
}

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const verifiedRef = useRef(false);
  const verifyInFlightRef = useRef(false);
  const iframeHandledRef = useRef(false);
  
  // Check if this is a pre-verified source (Fonepay Card/QR - verified on backend)
  const source = searchParams.get('source') ?? '';
  const isPreVerified = PRE_VERIFIED_SOURCES.includes(source as typeof PRE_VERIFIED_SOURCES[number]);
  
  // Parse orderId and token from URL; normalize ?orderId=xxx?token=yyy (GetPay quirk) to & so both are parsed
  const [urlParams, setUrlParams] = useState<{ orderId: string; token: string }>(() =>
    typeof window !== 'undefined' ? getParamsFromUrl() : { orderId: '', token: '' }
  );
  const orderId = cleanOrderId(
    urlParams.orderId ||
      searchParams.get('orderId') ||
      searchParams.get('orderid') ||
      ''
  );
  const token = urlParams.token;

  // Handle pre-verified sources (Fonepay Card/QR) - coins already added on backend
  useEffect(() => {
    if (!isPreVerified || verifiedRef.current) return;
    
    verifiedRef.current = true;
    setStatus('success');
    
    // Invalidate caches to refresh balance
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRICING.PLANS });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BROADCAST.MY_MESSAGES });
    
    toast.success('Payment successful! Balance has been added to your account.');
    
    // Handle pending broadcast questions
    (async () => {
      try {
        const pending = getPendingBroadcastQuestions();
        if (pending?.questionItems?.length && pending.totalNr >= 0) {
          clearPendingBroadcastQuestions();
          await broadcastMessageService.sendQuestions({
            questionItems: pending.questionItems,
            totalNr: pending.totalNr,
            birthDetails: pending.birthDetails,
          });
          toast.success(
            `${pending.questionItems.length} question${pending.questionItems.length === 1 ? '' : 's'} published to all Jyotish.`
          );
        }
      } catch (sendErr) {
        toast.error(
          sendErr instanceof Error ? sendErr.message : 'Failed to publish questions. You can try again from the dashboard.'
        );
      }
      await completePendingKundaliBookingAfterTopUp(queryClient);
    })();
    
    // Clean up session storage
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('getpay_pending_order_id');
        if (sessionStorage.getItem('pendingChatAfterPurchase')) {
          sessionStorage.removeItem('pendingChatAfterPurchase');
          window.dispatchEvent(new CustomEvent('coinsPurchased'));
        }
      }
    } catch {
      // ignore
    }
  }, [isPreVerified, queryClient]);

  // When in iframe (3DS return), open success URL in new tab / redirect top. Next.js or embedded contexts
  // may not expose window.self the same way — use window.location or document.location for the current URL.
  useEffect(() => {
    if (typeof window === 'undefined' || iframeHandledRef.current) return;
    const inIframe =
      typeof window.top !== 'undefined' &&
      window.top !== window.self;
    if (!inIframe) return;
    iframeHandledRef.current = true;
    const url =
      (typeof window.location !== 'undefined' && window.location.href) ||
      (typeof document !== 'undefined' && (document as { location?: { href?: string } }).location?.href) ||
      '';
    if (!url) return;
    console.log('Payment success: iframe detected, opening in new tab and redirecting top');
    try {
      window.open(url, '_blank');
    } catch {
      // ignore
    }
    try {
      if (window.top && window.top.location != null) {
        (window.top as Window).location.href = url;
      }
    } catch {
      // top redirect may be blocked; new tab already opened
    }
  }, []);

  // Step 04: We send token (from URL) to our backend; backend calls GetPay merchant-status (id + papInfo). No direct request to GetPay from frontend.
  const verifyMutation = useMutation({
    mutationFn: () => paymentService.verifyPayment({ orderId: orderId!, token }),
    onSuccess: async (data) => {
      verifiedRef.current = true;
      verifyInFlightRef.current = false;
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRICING.PLANS });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BROADCAST.MY_MESSAGES });
        setStatus('success');
        toast.success(data.message);
        try {
          const pending = getPendingBroadcastQuestions();
          if (pending?.questionItems?.length && pending.totalNr >= 0) {
            clearPendingBroadcastQuestions();
            await broadcastMessageService.sendQuestions({
              questionItems: pending.questionItems,
              totalNr: pending.totalNr,
              birthDetails: pending.birthDetails,
            });
            toast.success(
              `${pending.questionItems.length} question${pending.questionItems.length === 1 ? '' : 's'} published to all Jyotish.`
            );
          }
        } catch (sendErr) {
          toast.error(
            sendErr instanceof Error ? sendErr.message : 'Failed to publish questions. You can try again from the dashboard.'
          );
        }
        await completePendingKundaliBookingAfterTopUp(queryClient);
        try {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem('getpay_pending_order_id');
            if (sessionStorage.getItem('pendingChatAfterPurchase')) {
              sessionStorage.removeItem('pendingChatAfterPurchase');
              window.dispatchEvent(new CustomEvent('coinsPurchased'));
            }
          }
        } catch {
          // ignore
        }
      } else {
        setStatus('failed');
        toast.error(data.message);
      }
    },
    onError: (err) => {
      verifiedRef.current = true;
      verifyInFlightRef.current = false;
      setStatus('failed');
      showErrorToast(err);
    },
    onSettled: () => {
      verifyInFlightRef.current = false;
    },
  });

  // Re-read URL once after mount; if orderId missing but we have token, try sessionStorage (e.g. redirect from /?token=...)
  useEffect(() => {
    const parsed = getParamsFromUrl();
    if (parsed.orderId || parsed.token) {
      let orderId = parsed.orderId;
      if (!orderId && parsed.token && typeof sessionStorage !== 'undefined') {
        try {
          orderId = sessionStorage.getItem('getpay_pending_order_id')?.trim() ?? '';
        } catch {
          // ignore
        }
      }
      setUrlParams({ orderId: orderId || parsed.orderId, token: parsed.token });
    }
  }, []);

  // Verify when we have both orderId and token — only once (avoid duplicate API call and double toast).
  // Skip for pre-verified sources (Fonepay) which don't need frontend verification.
  useEffect(() => {
    if (isPreVerified) return; // Fonepay already verified on backend
    if (!orderId || !token || verifiedRef.current || verifyInFlightRef.current) return;
    verifyInFlightRef.current = true;
    verifyMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run when orderId/token become available
  }, [orderId, token, isPreVerified]);

  // Only treat as failed if we're sure we have no token (allow a short delay for hash/redirect)
  // Skip for pre-verified sources (Fonepay)
  useEffect(() => {
    if (isPreVerified) return; // Fonepay handled separately
    if (status !== 'verifying' || verifiedRef.current) return;
    const t = setTimeout(() => {
      if (verifiedRef.current) return;
      if (!orderId || !token) {
        setStatus('failed');
        toast.error('Invalid payment redirect. Missing order or transaction ID.');
      }
    }, 2500);
    return () => clearTimeout(t);
  }, [orderId, token, status, isPreVerified]);

  const handleGoDashboard = () => router.push(ROUTES.DASHBOARD);
  const handleGoPricing = () => router.push(ROUTES.PRICING);

  return (
    <DashboardLayout>
      <div className="w-full bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 text-black text-sm md:text-base font-semibold hover:bg-gray-100 hover:text-black"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </Button>
        </div>
      </div>
      <div className="max-w-2xl mx-auto py-12 px-4">
        {status === 'verifying' && (
          <Card className="bg-gradient-to-br from-purple-950 via-indigo-950/90 to-slate-950 border border-purple-500/40">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-bold text-white">
                Verifying Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 text-purple-200 animate-spin mx-auto mb-6" />
                <p className="text-purple-100/80">
                  Please wait while we confirm your payment.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {status === 'success' && (
          <Card className="bg-gradient-to-br from-green-950 via-emerald-950/90 to-green-900 border border-green-500/40">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-bold text-white">
                Payment Successful
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-500/30 to-emerald-500/30 border border-green-400/50 mb-6">
                  <CheckCircle2 className="h-12 w-12 text-green-100" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">Thank you!</h3>
                <p className="text-green-50/90 mb-6">
                  Your payment has been verified. Balance has been added to your account.
                </p>
                {verifyMutation.data?.balance !== undefined && (
                  <div className="mb-6 p-4 bg-green-800/40 border border-green-400/50 rounded-xl">
                    <p className="text-green-50 text-sm mb-1">Current balance</p>
                    <p className="text-yellow-200 font-bold text-2xl flex items-center justify-center gap-2">
                      <Banknote className="h-6 w-6" />
                      {verifyMutation.data.balance} NRs
                    </p>
                  </div>
                )}
                <Button
                  onClick={handleGoDashboard}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                >
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {status === 'failed' && (
          <Card className="bg-gradient-to-br from-red-950 via-rose-950/90 to-red-900 border border-red-500/40">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-bold text-white">
                Payment Verification Failed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-red-500/30 to-rose-500/30 border border-red-400/50 mb-6">
                  <XCircle className="h-12 w-12 text-red-100" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">
                  We couldn&apos;t verify your payment
                </h3>
                <p className="text-red-50/90 mb-6">
                  If you were charged, please contact support with your order details.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={handleGoPricing}
                    variant="outline"
                    className="border-red-400/50 text-red-100 hover:bg-red-900/30"
                  >
                    Try Again
                  </Button>
                  <Button
                    onClick={handleGoDashboard}
                    className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
