'use client';

import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { FacebookSignInButton } from '@/components/auth/FacebookSignInButton';

interface SocialOAuthSignInRowProps {
  className?: string;
  /** Icon-only compact row (e.g. under password form) */
  variant?: 'icon' | 'full';
}

export function SocialOAuthSignInRow({ className, variant = 'icon' }: SocialOAuthSignInRowProps) {
  if (variant === 'full') {
    return (
      <div className={`flex flex-col gap-2 ${className ?? ''}`}>
        <GoogleSignInButton variant="full" />
        <FacebookSignInButton variant="full" />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center gap-2 ${className ?? ''}`}>
      <GoogleSignInButton variant="icon" />
      <FacebookSignInButton variant="icon" />
    </div>
  );
}
