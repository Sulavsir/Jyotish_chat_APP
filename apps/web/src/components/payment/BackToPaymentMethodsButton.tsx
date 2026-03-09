'use client';

import React from 'react';
import { Button } from '@jyotish/ui';
import { ArrowLeft } from 'lucide-react';

interface BackToPaymentMethodsButtonProps {
  onClick: () => void;
  className?: string;
}

/**
 * Visible "Back to payment methods" control used on the payment page
 * when a method is selected. Styled to stand out on white background
 * (outline + subtle bg) so it is not hidden until hover/selection.
 */
export function BackToPaymentMethodsButton({
  onClick,
  className = '',
}: BackToPaymentMethodsButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className={
        [
          'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50/80 text-gray-800',
          'hover:bg-gray-100 hover:text-gray-900 hover:border-gray-400',
          'focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2',
          className,
        ].join(' ')
      }
    >
      <ArrowLeft className="h-4 w-4 shrink-0" />
      <span>Back to payment methods</span>
    </Button>
  );
}
