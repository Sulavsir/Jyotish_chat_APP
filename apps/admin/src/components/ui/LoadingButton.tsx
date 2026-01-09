/**
 * Loading Button Component
 * Wraps the existing Button component from @jyotish/ui
 * Adds loading state with spinner animation
 */

'use client';

import { ReactNode } from 'react';
import { Button, type ButtonProps } from '@jyotish/ui';

interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  children: ReactNode;
}

export function LoadingButton({
  isLoading = false,
  loadingText,
  children,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button {...props} disabled={isLoading || disabled}>
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4 mr-2 flex-shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {isLoading && loadingText ? loadingText : children}
    </Button>
  );
}
