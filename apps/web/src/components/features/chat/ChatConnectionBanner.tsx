'use client';

import { Alert, AlertDescription, AlertTitle } from '@jyotish/ui';

interface ChatConnectionBannerProps {
  isConnected: boolean;
  variant?: 'default' | 'jyotish';
}

/**
 * Shown when the real-time socket is disconnected (reconnect is automatic).
 */
export function ChatConnectionBanner({ isConnected, variant = 'default' }: ChatConnectionBannerProps) {
  if (isConnected) return null;

  const isJyotish = variant === 'jyotish';

  return (
    <Alert
      variant="warning"
      className={
        isJyotish
          ? 'border-amber-500/40 bg-amber-500/10 text-[#fafaf9] rounded-lg'
          : 'border-amber-500/30 bg-amber-500/10 text-white rounded-lg'
      }
    >
      <AlertTitle className="text-sm font-semibold">Reconnecting to chat…</AlertTitle>
      <AlertDescription className="text-xs opacity-90">
        Messages will send again once the connection is restored. Please wait a moment.
      </AlertDescription>
    </Alert>
  );
}
