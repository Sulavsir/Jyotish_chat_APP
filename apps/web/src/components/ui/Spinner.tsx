/**
 * Spinner Component - Reusable loading spinner with cosmic theme
 */

'use client';

import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'default' | 'cosmic' | 'simple';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export function Spinner({ size = 'md', className, variant = 'default' }: SpinnerProps) {
  if (variant === 'cosmic') {
    return (
      <div className={cn('relative', sizeClasses[size], className)}>
        {/* Outer rotating ring */}
        <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />

        {/* Inner rotating ring */}
        <div
          className="absolute inset-1 rounded-full border-2 border-pink-500/30 border-t-pink-500 animate-spin"
          style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}
        />

        {/* Center glow */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 animate-pulse" />
      </div>
    );
  }

  if (variant === 'simple') {
    return (
      <div
        className={cn(
          'rounded-full border-2 border-gray-300/30 border-t-white animate-spin',
          sizeClasses[size],
          className
        )}
      />
    );
  }

  // Default variant - gradient spinner
  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 border-r-pink-500 animate-spin" />
      <div
        className="absolute inset-1 rounded-full border-2 border-transparent border-t-pink-500 border-r-blue-500 animate-spin"
        style={{ animationDirection: 'reverse' }}
      />
    </div>
  );
}
