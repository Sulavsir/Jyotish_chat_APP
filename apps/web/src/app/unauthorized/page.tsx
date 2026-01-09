/**
 * Unauthorized Access Page
 * Displays when user tries to access a feature they don't have permission for
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, Button } from '@jyotish/ui';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { LoadingScreenWithBackground } from '@/components/ui';
import { ROUTES } from '@/constants';

function UnauthorizedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  const reason = searchParams.get('reason');
  const category = searchParams.get('category');

  // Get appropriate message based on reason
  const getMessage = () => {
    switch (reason) {
      case 'appointments':
        return {
          title: '401 - Unauthorized',
          description: 'The Appointments feature is only available for Professional and Premium astrologers.',
          details: category ? `Your current category: ${category}` : null,
          action: 'Contact admin to upgrade your account category.',
        };
      default:
        return {
          title: '401 - Unauthorized',
          description: 'You do not have permission to access this resource.',
          details: null,
          action: 'Please contact support if you believe this is an error.',
        };
    }
  };

  const message = getMessage();

  // Auto redirect after 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(ROUTES.JYOTISH_DASHBOARD);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Content */}
      <Card className="max-w-2xl w-full bg-gradient-to-br from-slate-900/90 to-orange-900/30 border-red-500/30 shadow-2xl relative z-10">
        <CardContent className="p-12">
          <div className="text-center space-y-6">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-500/20 border-2 border-red-500/30 mb-4 mx-auto">
              <ShieldAlert className="h-12 w-12 text-red-400" />
            </div>

            {/* Title */}
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{message.title}</h1>
              <div className="h-1 w-24 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mx-auto" />
            </div>

            {/* Description */}
            <p className="text-lg text-slate-300 max-w-md mx-auto">{message.description}</p>

            {/* Details */}
            {message.details && (
              <div className="bg-slate-800/50 border border-red-500/20 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-slate-400 text-sm">{message.details}</p>
              </div>
            )}

            {/* Action */}
            {message.action && (
              <p className="text-sm text-slate-400 max-w-md mx-auto">{message.action}</p>
            )}

            {/* Auto-redirect notice */}
            <div className="pt-4">
              <p className="text-sm text-slate-500">
                Redirecting to dashboard in{' '}
                <span className="text-orange-400 font-semibold">{countdown}</span> seconds...
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="border-orange-500/30 text-orange-400 hover:bg-orange-900/20"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Button
                onClick={() => router.push(ROUTES.JYOTISH_DASHBOARD)}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white"
              >
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense fallback={<LoadingScreenWithBackground message="Loading..." />}>
      <UnauthorizedContent />
    </Suspense>
  );
}
