'use client';

import { useState } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants';
import { LoadingButton } from '@/components/ui';

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );
}

interface FacebookSignInButtonProps {
  className?: string;
  variant?: 'full' | 'icon';
}

export function FacebookSignInButton({ className, variant = 'full' }: FacebookSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleFacebookLogin = () => {
    setIsLoading(true);
    const params = new URLSearchParams({
      frontend: typeof window !== 'undefined' ? window.location.origin : '',
    });
    window.location.href = `${API_BASE_URL}${API_ENDPOINTS.AUTH.FACEBOOK_LOGIN}?${params.toString()}`;
  };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleFacebookLogin}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-600 bg-slate-800/70 hover:bg-slate-700/90 text-slate-100 transition-colors disabled:opacity-60 ${className ?? ''}`}
        aria-label="Sign in with Facebook"
        disabled={isLoading}
      >
        <FacebookIcon className="w-4 h-4" />
      </button>
    );
  }

  return (
    <LoadingButton
      type="button"
      variant="outline"
      onClick={handleFacebookLogin}
      isLoading={isLoading}
      loadingText="Redirecting..."
      className={`w-full border-slate-600 bg-slate-800/50 hover:bg-slate-700/80 !text-slate-200 font-medium rounded-xl py-2.5 transition-colors ${className ?? ''}`}
    >
      <FacebookIcon className="w-5 h-5 mr-2.5" />
      Sign in with Facebook
    </LoadingButton>
  );
}
