'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@jyotish/ui';
import { XCircle } from 'lucide-react';
import { ROUTES } from '@/constants';

export default function PaymentFailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const message = searchParams.get('message') ?? '';

  const handleGoPricing = () => router.push(ROUTES.PRICING);
  const handleGoDashboard = () => router.push(ROUTES.DASHBOARD);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto py-12">
        <Card className="bg-gradient-to-br from-red-950 via-rose-950/90 to-red-900 border border-red-500/40">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold text-white">
              Payment Failed
            </CardTitle>
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
