/**
 * Payment Page
 * Handles coin purchase payment flow
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@jyotish/ui';
import { Loader2, CheckCircle2, XCircle, Coins } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coinService } from '@/services/coin.service';
import { QUERY_KEYS } from '@/constants';
import { toast } from 'sonner';
import { ROUTES } from '@/constants';

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'success' | 'failed'>(
    'processing'
  );
  const hasProcessedRef = useRef(false); // Track if payment has been processed

  const planId = searchParams.get('planId');
  const amount = searchParams.get('amount');
  const coins = searchParams.get('coins');

  const addCoinsMutation = useMutation({
    mutationFn: (data: { amount: number; paymentId?: string }) => coinService.addCoins(data),
    onSuccess: () => {
      // Mark as processed to prevent duplicate calls
      hasProcessedRef.current = true;
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
      setPaymentStatus('success');
      toast.success('Payment successful! Coins added to your account.');

      // Check if we should retry a pending chat
      const pendingChatData = sessionStorage.getItem('pendingChatAfterPurchase');
      if (pendingChatData) {
        try {
          const pendingChat = JSON.parse(pendingChatData);
          sessionStorage.removeItem('pendingChatAfterPurchase');

          // If there's a callback, wait a bit for backend to update then trigger event
          if (pendingChat.hasCallback) {
            // Wait for backend to update coins, then trigger event
            setTimeout(() => {
              // Trigger a custom event that components can listen to
              window.dispatchEvent(new CustomEvent('coinsPurchased'));
            }, 1500);
          } else if (pendingChat.otherUserId) {
            // Use useChat hook to start chat after coins are added
            setTimeout(async () => {
              // Import and use chat service to start chat
              const { default: chatService } = await import('@/services/chat.service');
              try {
                const chat = await chatService.getOrCreateChat({
                  otherUserId: pendingChat.otherUserId,
                });
                if (chat?.id) {
                  router.push(`/chat?chatId=${chat.id}`);
                }
              } catch (error) {
                console.error('Error starting chat after purchase:', error);
                router.push(ROUTES.CHAT);
              }
            }, 1500);
          }
        } catch (error) {
          console.error('Error parsing pending chat data:', error);
        }
      }
    },
    onError: (error) => {
      // Reset the ref on error so user can retry
      hasProcessedRef.current = false;
      setPaymentStatus('failed');
      toast.error(error instanceof Error ? error.message : 'Payment failed');
    },
  });

  const handlePaymentSuccess = React.useCallback(() => {
    // Prevent multiple calls
    if (hasProcessedRef.current) {
      return;
    }

    if (coins && amount) {
      const coinsAmount = parseInt(coins, 10);
      if (isNaN(coinsAmount) || coinsAmount <= 0) {
        setPaymentStatus('failed');
        toast.error('Invalid coin amount');
        return;
      }

      // Mark as processing to prevent duplicate calls
      hasProcessedRef.current = true;

      // Call API without paymentId (will be integrated later)
      addCoinsMutation.mutate({
        amount: coinsAmount,
      });
    } else {
      setPaymentStatus('failed');
      toast.error('Invalid payment parameters');
    }
  }, [coins, amount, addCoinsMutation]);

  // Redirect if no plan parameters
  useEffect(() => {
    if (!planId || !amount || !coins) {
      router.push(ROUTES.PRICING);
    }
  }, [planId, amount, coins, router]);

  // Trigger payment processing immediately when params are valid (only once)
  useEffect(() => {
    // Only process if:
    // 1. Status is processing
    // 2. All params are valid
    // 3. Haven't processed yet
    // 4. Mutation is not already in progress
    if (
      paymentStatus === 'processing' &&
      planId &&
      amount &&
      coins &&
      !hasProcessedRef.current &&
      !addCoinsMutation.isPending
    ) {
      // Directly call our "payment success" handler which will
      // call the backend API and update state accordingly.
      handlePaymentSuccess();
    }
  }, [paymentStatus, planId, amount, coins, handlePaymentSuccess, addCoinsMutation.isPending]);

  const handleRetry = () => {
    // Reset the ref to allow retry
    hasProcessedRef.current = false;
    setPaymentStatus('processing');
    if (planId && amount && coins) {
      handlePaymentSuccess();
    }
  };

  const handleGoHome = () => {
    router.push(ROUTES.DASHBOARD);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto py-12">
        {paymentStatus === 'processing' && (
          <Card className="bg-gradient-to-br from-purple-950 via-indigo-950/90 to-slate-950 border border-purple-500/40 shadow-[0_0_40px_rgba(129,140,248,0.5)]">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-bold text-white mb-2">
                Completing Your Purchase
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/25 via-purple-500/30 to-blue-500/25 border border-purple-500/40 shadow-[0_0_30px_rgba(129,140,248,0.8)] mb-6">
                  <Loader2 className="h-12 w-12 text-purple-200 animate-spin" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">Processing your payment…</h3>
                <p className="text-purple-100/80">
                  This will just take a moment while we add coins to your account.
                </p>
                {coins && amount && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-blue-900/40 border border-purple-500/40 rounded-xl">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-purple-100">Coins:</span>
                      <span className="text-yellow-300 font-semibold flex items-center gap-1">
                        <Coins className="h-4 w-4" />
                        {coins}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-purple-100">Amount:</span>
                      <span className="text-white font-semibold">Rs. {amount}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {paymentStatus === 'success' && (
          <Card className="bg-gradient-to-br from-green-950 via-emerald-950/90 to-green-900 border border-green-500/40 shadow-[0_0_40px_rgba(34,197,94,0.5)]">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-bold text-white mb-2">Payment Successful</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-500/30 to-emerald-500/30 border border-green-400/50 shadow-[0_0_30px_rgba(34,197,94,0.8)] mb-6">
                  <CheckCircle2 className="h-12 w-12 text-green-100" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">Payment Successful!</h3>
                <p className="text-green-50/90 mb-6">
                  Your coins have been added to your account. You&apos;re ready to start chatting.
                </p>
                {coins && (
                  <div className="mb-6 p-4 bg-green-800/40 border border-green-400/50 rounded-xl">
                    <p className="text-green-50 text-sm mb-1">Coins Added</p>
                    <p className="text-yellow-200 font-bold text-2xl flex items-center justify-center gap-2">
                      <Coins className="h-6 w-6" />
                      {coins} Coins
                    </p>
                  </div>
                )}
                <Button
                  onClick={handleGoHome}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                >
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {paymentStatus === 'failed' && (
          <Card className="bg-gradient-to-br from-red-950 via-rose-950/90 to-red-900 border border-red-500/40 shadow-[0_0_40px_rgba(248,113,113,0.5)]">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-bold text-white mb-2">Payment Failed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-red-500/30 to-rose-500/30 border border-red-400/50 shadow-[0_0_30px_rgba(248,113,113,0.8)] mb-6">
                  <XCircle className="h-12 w-12 text-red-100" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">Payment Failed</h3>
                <p className="text-red-50/90 mb-6">
                  We couldn&apos;t process your payment automatically. Please try again.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={handleRetry}
                    variant="outline"
                    className="border-red-400/50 text-red-100 hover:bg-red-900/30"
                  >
                    Try Again
                  </Button>
                  <Button
                    onClick={handleGoHome}
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
