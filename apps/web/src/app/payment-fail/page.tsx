'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@jyotish/ui';
import { XCircle, ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/constants';

export default function PaymentFailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || searchParams.get('orderid');
  const message = searchParams.get('message') ?? '';

  // After OTP validated, GetPay bundle.js redirects to this FAIL URL. If we're in an iframe, break out.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.top && window.top !== window.self) {
      console.log('Payment fail: breaking out of iframe');
      window.top.location = window.self.location.href;
    }
  }, []);

  const handleGoPricing = () => router.push(ROUTES.PRICING);
  const handleGoDashboard = () => router.push(ROUTES.DASHBOARD);

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
        <Card className="bg-gradient-to-br from-red-950 via-rose-950/90 to-red-900 border border-red-500/40">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold text-white">Payment Failed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-red-500/30 to-rose-500/30 border border-red-400/50 mb-6">
                <XCircle className="h-12 w-12 text-red-100" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">Payment was not completed</h3>
              <p className="text-red-50/90 mb-6">
                {message || 'Your payment could not be processed. You have not been charged.'}
              </p>
              {orderId && (
                <p className="text-red-200/70 text-sm mb-6">Order reference: {orderId}</p>
              )}
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
      </div>
    </DashboardLayout>
  );
}
