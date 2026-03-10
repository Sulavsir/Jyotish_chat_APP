'use client';

import { Clock } from 'lucide-react';
import { formatOtpCountdown } from '@/utils/otp.utils';

interface OtpExpiryCountdownProps {
  /** Seconds remaining until OTP expires */
  secondsRemaining: number;
  /** Optional class for the wrapper (e.g. text color) */
  className?: string;
  /** Optional class for the time display (e.g. red when &lt; 60s) */
  timeClassName?: string;
}

/**
 * Displays "Your OTP will expire in [clock icon] [M:SS]".
 * Use with OTP_EXPIRY_SECONDS (5 min) for countdown state.
 */
export function OtpExpiryCountdown({
  secondsRemaining,
  className = '',
  timeClassName,
}: OtpExpiryCountdownProps) {
  if (secondsRemaining <= 0) return null;

  const isLow = secondsRemaining < 60;
  const timeClass =
    timeClassName ?? `text-sm font-mono font-semibold ${isLow ? 'text-red-300' : 'text-amber-300'}`;

  return (
    <div className={`flex items-center justify-center gap-2 py-2 ${className}`}>
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-amber-400/90">
        Your OTP will expire in
        <Clock className="w-4 h-4 shrink-0" aria-hidden />
        <span className={timeClass}>{formatOtpCountdown(secondsRemaining)}</span>
      </div>
    </div>
  );
}
