'use client';

import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface ProgressBarProps {
  createdAt: Date | string;
  /** Prefer server value when present */
  expiresAt?: Date | string | null;
  /** Fallback window when expiresAt missing */
  expiryMs?: number;
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
  onExpire,
  className,
  variant = 'compact',
  disabled = false,
}: ProgressBarProps) {
  const [pct, setPct] = useState(100);
  const [expired, setExpired] = useState(false);
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    let fired = false;
    const start = new Date(createdAt).getTime();
    const end =
      expiresAt != null && expiresAt !== ''
        ? new Date(expiresAt).getTime()
        : start + expiryMs;
    const total = Math.max(1, end - start);

    const tick = () => {
      if (disabled) return;
      const now = Date.now();
      const remaining = Math.max(0, end - now);
      const ratio = remaining / total;
      setPct(ratio * 100);
      if (remaining <= 0) {
        setExpired(true);
        if (!fired) {
          fired = true;
          onExpireRef.current?.();
        }
      }
    };

    tick();
    const id = window.setInterval(tick, 50);
    return () => window.clearInterval(id);
  }, [createdAt, expiresAt, expiryMs, disabled]);

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
            expired && 'opacity-40'
          )}
          style={{ width: `${expired ? 0 : pct}%` }}
        />
      </div>
      {expired && (
        <p className="text-xs font-semibold text-red-600 dark:text-red-400">Time&apos;s up — offer expired</p>
      )}
    </div>
  );
}
