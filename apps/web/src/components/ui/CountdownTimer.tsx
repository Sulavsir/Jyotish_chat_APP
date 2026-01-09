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
  onExpire?: () => void;
  className?: string;
  showIcon?: boolean;
}

export function CountdownTimer({
  createdAt,
  expiryMs,
  onExpire,
  className = '',
  showIcon = true,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const onExpireRef = React.useRef(onExpire);

  // Update ref when onExpire changes
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const created = new Date(createdAt).getTime();
      const now = Date.now();
      const elapsed = now - created;
      const remaining = expiryMs - elapsed;

      if (remaining <= 0) {
        setIsExpired(true);
        setTimeLeft(0);
        // Use ref to avoid infinite loop
        if (onExpireRef.current) {
          onExpireRef.current();
        }
        return 0;
      }

      setTimeLeft(remaining);
      return remaining;
    };

    // Initial calculation
    calculateTimeLeft();

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt, expiryMs]); // ✅ Removed onExpire from dependencies

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getColorClass = () => {
    const percentageLeft = (timeLeft / expiryMs) * 100;
    if (percentageLeft > 50) return 'text-green-600';
    if (percentageLeft > 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isExpired) {
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

