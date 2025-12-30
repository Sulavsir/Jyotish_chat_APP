/**
 * OTP Input Component
 * Optimized OTP input with paste support and keyboard navigation
 */

'use client';

import { useState, useRef, useCallback, KeyboardEvent, ClipboardEvent, memo } from 'react';
import { Input } from '@jyotish/ui';
import { cn } from '@/lib/utils';

interface OTPInputProps {
  length?: number;
  value: string[];
  onChange: (value: string[]) => void;
  onComplete?: (otp: string) => void;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export const OTPInput = memo(function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error,
  className,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check if OTP is complete and trigger onComplete
  const checkComplete = useCallback(
    (newValue: string[]) => {
      const isComplete = newValue.every((digit) => digit !== '');
      if (isComplete && onComplete) {
        const otp = newValue.join('');
        // Small delay to ensure UI updates before submission
        setTimeout(() => {
          onComplete(otp);
        }, 100);
      }
    },
    [onComplete]
  );

  // Handle paste event
  const handlePaste = useCallback(
    (pastedData: string, startIndex: number = 0) => {
      const digits = pastedData.replace(/[^0-9]/g, '').split('');
      const newValue = [...value];

      // Fill boxes starting from current index
      digits.forEach((digit, i) => {
        const targetIndex = startIndex + i;
        if (targetIndex < length) {
          newValue[targetIndex] = digit;
        }
      });

      onChange(newValue);

      // Check if complete
      checkComplete(newValue);

      // Focus the next empty box or the last filled box
      const nextEmptyIndex = newValue.findIndex((v, i) => i >= startIndex && !v);
      const focusIndex =
        nextEmptyIndex !== -1 ? nextEmptyIndex : Math.min(startIndex + digits.length, length - 1);

      setTimeout(() => {
        inputRefs.current[focusIndex]?.focus();
      }, 0);
    },
    [value, onChange, length, checkComplete]
  );

  // Handle input change
  const handleChange = useCallback(
    (index: number, inputValue: string) => {
      // Only allow numbers
      const sanitized = inputValue.replace(/[^0-9]/g, '');

      if (sanitized.length === 0) {
        // Clear current box
        const newValue = [...value];
        newValue[index] = '';
        onChange(newValue);
        return;
      }

      if (sanitized.length === 1) {
        // Single digit - update current box
        const newValue = [...value];
        newValue[index] = sanitized;
        onChange(newValue);

        // Check if complete
        checkComplete(newValue);

        // Auto-focus next input
        if (index < length - 1) {
          inputRefs.current[index + 1]?.focus();
        }
      } else if (sanitized.length > 1) {
        // Multiple digits pasted - distribute across boxes
        handlePaste(sanitized, index);
      }
    },
    [value, onChange, length, handlePaste, checkComplete]
  );

  // Handle clipboard paste
  const onPaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>, index: number) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text');
      handlePaste(pastedData, index);
    },
    [handlePaste]
  );

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      const target = e.target as HTMLInputElement;

      if (e.key === 'Backspace') {
        e.preventDefault();

        if (value[index]) {
          // If current box has value, clear it
          const newValue = [...value];
          newValue[index] = '';
          onChange(newValue);
        } else if (index > 0) {
          // If current box is empty, move to previous and clear it
          const newValue = [...value];
          newValue[index - 1] = '';
          onChange(newValue);
          inputRefs.current[index - 1]?.focus();
        }
      } else if (e.key === 'Delete') {
        e.preventDefault();

        if (value[index]) {
          // Clear current box
          const newValue = [...value];
          newValue[index] = '';
          onChange(newValue);
        } else if (index < length - 1) {
          // If current box is empty, clear next box
          const newValue = [...value];
          newValue[index + 1] = '';
          onChange(newValue);
        }
      } else if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === 'ArrowRight' && index < length - 1) {
        e.preventDefault();
        inputRefs.current[index + 1]?.focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        inputRefs.current[0]?.focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        inputRefs.current[length - 1]?.focus();
      } else if (e.key >= '0' && e.key <= '9') {
        // Allow number keys to override current value
        e.preventDefault();
        handleChange(index, e.key);
      }
    },
    [value, onChange, length, handleChange]
  );

  // Handle focus - select all text
  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  }, []);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex gap-2 justify-center">
        {Array.from({ length }, (_, index) => (
          <Input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={(e) => onPaste(e, index)}
            onFocus={handleFocus}
            disabled={disabled}
            className={cn(
              'w-12 h-14 text-center text-2xl font-bold',
              'bg-white/10 border-2 border-white/20 text-white rounded-lg',
              'focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20',
              'transition-all duration-200',
              error && 'border-red-500/50',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            aria-label={`Digit ${index + 1} of ${length}`}
          />
        ))}
      </div>
      {error && (
        <p className="text-sm text-red-300 font-medium flex items-center justify-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
          <span className="text-red-400">⚠</span> {error}
        </p>
      )}
    </div>
  );
});
