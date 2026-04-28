'use client';

import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface ProgressBarProps {
  createdAt: Date | string;
  /** Prefer server value when present */
  expiresAt?: Date | string | null;
  /** Fallback window when expiresAt missing */
  expiryMs?: number;
  /**
   * After wall-clock expiry, keep showing a neutral "finalizing" state for this long
   * (server auto-assign / refund). 0 = old behavior (immediate "expired" copy).
   */
  postExpiryGraceMs?: number;
  /** Fired once when `expiresAt` is reached (start of grace). */
  onTimerZero?: () => void;
  /** Fired once when grace ends (or at expiry if no grace). */
  onExpire?: () => void;
  className?: string;
  /** Thicker bar in detail popup */
  variant?: 'compact' | 'prominent';
  disabled?: boolean;
}

/**
 * Smooth countdown strip (inDrive-style). Uses client clock only; no API changes.
 */
export function ProgressBar({
  createdAt,
  expiresAt,
  expiryMs = 10 * 60 * 1000,
  postExpiryGraceMs = 0,
  onTimerZero,
  onExpire,
  className,
  variant = 'compact',
  disabled = false,
}: ProgressBarProps) {
  const [pct, setPct] = useState(100);
  const [phase, setPhase] = useState<'active' | 'grace' | 'expired'>('active');
  const onExpireRef = useRef(onExpire);
  const onTimerZeroRef = useRef(onTimerZero);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);
  useEffect(() => {
    onTimerZeroRef.current = onTimerZero;
  }, [onTimerZero]);

  useEffect(() => {
    let firedTimerZero = false;
    let firedExpire = false;
    const start = new Date(createdAt).getTime();
    const end =
      expiresAt != null && expiresAt !== ''
        ? new Date(expiresAt).getTime()
        : start + expiryMs;
    const total = Math.max(1, end - start);
    const graceEnd = postExpiryGraceMs > 0 ? end + postExpiryGraceMs : end;

    const tick = () => {
      if (disabled) return;
      const now = Date.now();
      if (now < end) {
        setPhase('active');
        const remaining = end - now;
        const ratio = remaining / total;
        setPct(ratio * 100);
        return;
      }

      setPct(0);

      if (postExpiryGraceMs > 0 && now < graceEnd) {
        setPhase('grace');
        if (!firedTimerZero) {
          firedTimerZero = true;
          onTimerZeroRef.current?.();
        }
        return;
      }

      setPhase('expired');
      if (!firedTimerZero) {
        firedTimerZero = true;
        onTimerZeroRef.current?.();
      }
      if (!firedExpire) {
        firedExpire = true;
        onExpireRef.current?.();
      }
    };

    tick();
    const id = window.setInterval(tick, 50);
    return () => window.clearInterval(id);
  }, [createdAt, expiresAt, expiryMs, disabled, postExpiryGraceMs]);

  const barHeight = variant === 'prominent' ? 'h-2.5' : 'h-1.5';

  return (
    <div className={cn('space-y-1.5', className)}>
      <div
        className={cn(
          'rounded-full overflow-hidden bg-slate-200/90 dark:bg-slate-700/90',
          barHeight
        )}
      >
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500',
            'transition-[width] duration-100 ease-linear',
            phase !== 'active' && 'opacity-40'
          )}
          style={{ width: `${phase === 'active' ? pct : 0}%` }}
        />
      </div>
      {phase === 'grace' && (
        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
          Finalizing request…
        </p>
      )}
      {phase === 'expired' && (
        <p className="text-xs font-semibold text-red-600 dark:text-red-400">
          Time&apos;s up — offer expired
        </p>
      )}
    </div>
  );
}
