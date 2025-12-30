/**
 * UnauthorizedScreen Component - Reusable unauthorized access component
 * Can be used inline within pages or modals
 */

'use client';

import Link from 'next/link';
import { Button } from '@jyotish/ui';
import { ROUTES } from '@/constants';

interface UnauthorizedScreenProps {
  title?: string;
  message?: string;
  showLoginButton?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function UnauthorizedScreen({
  title = 'Access Denied',
  message = "You don't have permission to access this resource.",
  showLoginButton = true,
  showBackButton = true,
  onBack,
}: UnauthorizedScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center space-y-6">
      {/* Lock Icon with Animation */}
      <div className="relative">
        <div className="text-8xl animate-bounce">🔒</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full border-2 border-red-500/20 animate-ping" />
        </div>
      </div>

      {/* Message */}
      <div className="space-y-3 max-w-md">
        <h2 className="text-3xl font-bold text-white">{title}</h2>
        <p className="text-gray-400">{message}</p>
      </div>

      {/* Status Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-sm font-semibold text-red-400">401 Unauthorized</span>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-center pt-4">
        {showLoginButton && (
          <Link href={ROUTES.LOGIN}>
            <Button color="primary" size="lg">
              🔑 Sign In
            </Button>
          </Link>
        )}
        {showBackButton && (
          <Button
            color="secondary"
            size="lg"
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                window.history.back();
              }
            }}
          >
            ← Go Back
          </Button>
        )}
      </div>
    </div>
  );
}
