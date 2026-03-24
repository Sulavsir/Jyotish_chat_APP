'use client';

import { Button, cn } from '@jyotish/ui';
import { X } from 'lucide-react';

export interface AdminClearFiltersButtonProps {
  show: boolean;
  onClear: () => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

/** Shown when list filters are active; resets search + dropdown filters (parent defines onClear). */
export function AdminClearFiltersButton({
  show,
  onClear,
  disabled,
  label = 'Clear filters',
  className,
}: AdminClearFiltersButtonProps) {
  if (!show) return null;
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClear}
      disabled={disabled}
      className={cn('h-9 shrink-0 gap-1.5 text-slate-400 hover:text-white', className)}
    >
      <X className="h-4 w-4" />
      {label}
    </Button>
  );
}
