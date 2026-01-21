/**
 * LoadingButton
 * Wrapper around Button that shows an inline spinner.
 */
 
import * as React from 'react';
import { Button, type ButtonProps } from './button';
import { cn } from './utils';
 
export type LoadingButtonProps = ButtonProps & {
  loading?: boolean;
  loadingText?: string;
};
 
export function LoadingButton({
  loading = false,
  loadingText,
  disabled,
  children,
  className,
  ...props
}: LoadingButtonProps) {
  const isDisabled = disabled || loading;
 
  return (
    <Button disabled={isDisabled} className={cn(className)} {...props}>
      {loading ? (
        <>
          <span className="mr-2 inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

