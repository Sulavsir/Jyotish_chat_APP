/**
 * Form Error Component
 * Displays field-level validation errors in forms
 * Optimized with memo for performance
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';

interface FormErrorProps {
  error?: string;
  className?: string;
}

export const FormError = memo(function FormError({ error, className }: FormErrorProps) {
  if (!error) return null;

  return (
    <p
      className={cn(
        'text-sm font-medium flex items-center gap-1 mt-1',
        'text-red-300 animate-in fade-in slide-in-from-top-1 duration-200',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <span className="text-red-400">⚠</span> {error}
    </p>
  );
});

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
  description?: string;
}

/**
 * FormField wrapper component
 * Includes label, input, and error message
 * Optimized with memo for performance
 */
export const FormField = memo(function FormField({
  label,
  error,
  required = false,
  children,
  className,
  htmlFor,
  description,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor={htmlFor} className="text-white font-semibold text-sm block">
        {label}
        {required && (
          <span className="text-red-400 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      {children}
      {description && !error && <p className="text-xs text-gray-400">{description}</p>}
      <FormError error={error} />
    </div>
  );
});
