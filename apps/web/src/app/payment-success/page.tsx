'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@jyotish/ui';
import { Loader2, CheckCircle2, XCircle, Coins } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '@/services/payment.service';
import { QUERY_KEYS, ROUTES } from '@/constants';
import { toast } from 'sonner';
import { showErrorToast } from '@/lib/error-handler';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const verifiedRef = useRef(false);

  const orderId = searchParams.get('orderId');
  const token = searchParams.get('token') ?? searchParams.get('transactionId') ?? '';

  const verifyMutation = useMutation({
    mutationFn: () => paymentService.verifyPayment({ orderId: orderId!, token }),
    onSuccess: (data) => {
      verifiedRef.current = true;
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRICING.PLANS });
        setStatus('success');
        toast.success(data.message);
      } else {
        setStatus('failed');
        toast.error(data.message);
      }
    },
    onError: (err) => {
      verifiedRef.current = true;
      setStatus('failed');
      showErrorToast(err);
    },
  });

  useEffect(() => {
    if (!orderId || !token || verifiedRef.current) return;
    verifyMutation.mutate();
  }, [orderId, token]);

  useEffect(() => {
    if (!orderId && !token && status === 'verifying') {
      setStatus('failed');
      toast.error('Invalid payment redirect. Missing order or transaction.');
    }
  }, [orderId, token, status]);

  const handleGoDashboard = () => router.push(ROUTES.DASHBOARD);
  const handleGoPricing = () => router.push(ROUTES.PRICING);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto py-12">
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
                  Your payment has been verified. Coins have been added to your account.
                </p>
                {verifyMutation.data?.balance !== undefined && (
                  <div className="mb-6 p-4 bg-green-800/40 border border-green-400/50 rounded-xl">
                    <p className="text-green-50 text-sm mb-1">Current balance</p>
                    <p className="text-yellow-200 font-bold text-2xl flex items-center justify-center gap-2">
                      <Coins className="h-6 w-6" />
                      {verifyMutation.data.balance} Coins
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
