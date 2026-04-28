/**
 * Countdown Timer Component
 * Shows remaining time until expiry
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  createdAt: Date | string;
  expiryMs: number;
  /** When set (e.g. from API), drives remaining time instead of createdAt + expiryMs. */
  expiresAt?: Date | string;
  /**
   * After wall-clock expiry, show neutral copy for this many ms (server auto-assign).
   * 0 = show "Expired" immediately when time hits zero.
   */
  postExpiryGraceMs?: number;
  /** Fired once when wall-clock expiry is reached (start of grace if grace > 0). */
  onTimerZero?: () => void;
  onExpire?: () => void;
  className?: string;
  showIcon?: boolean;
}

export function CountdownTimer({
  createdAt,
  expiryMs,
  expiresAt: expiresAtProp,
  postExpiryGraceMs = 0,
  onTimerZero,
  onExpire,
  className = '',
  showIcon = true,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [phase, setPhase] = useState<'active' | 'grace' | 'expired'>('active');
  const onExpireRef = React.useRef(onExpire);
  const onTimerZeroRef = React.useRef(onTimerZero);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);
  useEffect(() => {
    onTimerZeroRef.current = onTimerZero;
  }, [onTimerZero]);

  useEffect(() => {
    let firedTimerZero = false;
    let firedExpire = false;

    const calculate = () => {
      const created = new Date(createdAt).getTime();
      const now = Date.now();
      const end =
        expiresAtProp != null && expiresAtProp !== ''
          ? new Date(expiresAtProp).getTime()
          : created + expiryMs;
      const graceEnd = postExpiryGraceMs > 0 ? end + postExpiryGraceMs : end;
      const remaining = end - now;

      if (remaining > 0) {
        setPhase('active');
        setTimeLeft(remaining);
        return remaining;
      }

      if (postExpiryGraceMs > 0 && now < graceEnd) {
        setPhase('grace');
        setTimeLeft(0);
        if (!firedTimerZero) {
          firedTimerZero = true;
          onTimerZeroRef.current?.();
        }
        return 1;
      }

      setPhase('expired');
      setTimeLeft(0);
      if (!firedTimerZero) {
        firedTimerZero = true;
        onTimerZeroRef.current?.();
      }
      if (!firedExpire) {
        firedExpire = true;
        onExpireRef.current?.();
      }
      return 0;
    };

    calculate();

    const interval = setInterval(() => {
      const r = calculate();
      if (r <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt, expiryMs, expiresAtProp, postExpiryGraceMs]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getColorClass = () => {
    const created = new Date(createdAt).getTime();
    const totalMs =
      expiresAtProp != null && expiresAtProp !== ''
        ? Math.max(1, new Date(expiresAtProp).getTime() - created)
        : expiryMs;
    const percentageLeft = (timeLeft / totalMs) * 100;
    if (percentageLeft > 50) return 'text-green-600';
    if (percentageLeft > 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (phase === 'grace') {
    return (
      <div
        className={cn('flex items-center gap-1.5 text-amber-600 text-xs font-medium', className)}
      >
        {showIcon && <Clock className="h-3.5 w-3.5" />}
        <span>Finalizing…</span>
      </div>
    );
  }

  if (phase === 'expired') {
    return (
      <div className={cn('flex items-center gap-1.5 text-red-600 text-xs font-medium', className)}>
        {showIcon && <Clock className="h-3.5 w-3.5" />}
        <span>Expired</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1.5 text-xs font-medium', getColorClass(), className)}>
      {showIcon && <Clock className="h-3.5 w-3.5" />}
      <span>{formatTime(timeLeft)}</span>
    </div>
  );
}
