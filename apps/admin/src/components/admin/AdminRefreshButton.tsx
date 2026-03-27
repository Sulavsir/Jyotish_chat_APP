'use client';

import { Button } from '@jyotish/ui';
import { cn } from '@jyotish/ui';
import { RefreshCw } from 'lucide-react';

export interface AdminRefreshButtonProps {
  onClick: () => void;
  /** When true, shows a spinner on the icon */
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  'aria-label'?: string;
}

/**
 * Standard outline refresh for admin list headers / toolbars.
 * Icon + label at all breakpoints; pass `className` for layout (e.g. `w-full sm:w-auto`).
 */
export function AdminRefreshButton({
  onClick,
  loading = false,
  disabled,
  className,
  label = 'Refresh',
  'aria-label': ariaLabel,
}: AdminRefreshButtonProps) {
  const isDisabled = disabled ?? loading;
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isDisabled}
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center border-slate-700 text-white hover:bg-slate-800',
        'gap-2 px-2.5 sm:px-3',
        'min-h-10',
        className
      )}
    >
      <RefreshCw className={cn('h-4 w-4 shrink-0', loading && 'animate-spin')} />
      <span className="whitespace-nowrap text-sm">{label}</span>
    </Button>
  );
}
