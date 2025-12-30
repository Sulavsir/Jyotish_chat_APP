/**
 * Form Component with Context-based State Management
 * Handles validation, errors, loading states, and submission automatically
 * Uses shadcn/ui components for consistency
 */

'use client';

import React, {
  createContext,
  useContext,
  useState,
  FormEvent,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';
import { z } from 'zod';
import { Label, Input, Button } from '@jyotish/ui';
import { LoadingButton } from './LoadingButton';
import { FormError } from './FormError';
import { parseApiError, displayError, displaySuccess } from '@/utils/error-handler';
import { validateForm, validateField } from '@/utils/validation';
import { cn } from '@/lib/utils';

// Types
export interface FormContextValue {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  setValue: (name: string, value: any) => void;
  setError: (name: string, error: string) => void;
  setTouched: (name: string, touched: boolean) => void;
  clearError: (name: string) => void;
  getFieldError: (name: string) => string | undefined;
}

const FormContext = createContext<FormContextValue | null>(null);

export function useFormContext() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('Form components must be used within a Form component');
  }
  return context;
}

// Main Form Component
interface FormProps<T extends Record<string, any>> {
  initialValues: T;
  validationSchema?: z.ZodSchema<T>;
  onSubmit: (values: T) => Promise<any>;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  successMessage?: string;
  errorMessage?: string;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  children: ReactNode;
  className?: string;
}

export function Form<T extends Record<string, any>>({
  initialValues,
  validationSchema,
  onSubmit,
  onSuccess,
  onError,
  successMessage,
  errorMessage,
  validateOnChange = false,
  validateOnBlur = true,
  children,
  className,
}: FormProps<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback(
    (name: string, value: any) => {
      setValues((prev) => ({ ...prev, [name]: value }));

      // Always clear error when user starts typing (provides immediate feedback)
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });

      // Validate on change if enabled (will re-add error if still invalid)
      if (validateOnChange && validationSchema) {
        try {
          // Check if it's a ZodObject to access shape
          if ('shape' in validationSchema && validationSchema.shape) {
            const fieldSchema = (validationSchema.shape as any)[name];
            if (fieldSchema) {
              const result = validateField(fieldSchema, value);
              if (!result.valid && result.error) {
                setErrors((prev) => ({ ...prev, [name]: result.error! }));
              }
            }
          }
        } catch (e) {
          // Schema doesn't support per-field validation
        }
      }
    },
    [validateOnChange, validationSchema]
  );

  const setError = useCallback((name: string, error: string) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  const clearError = useCallback((name: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  const setTouchedField = useCallback(
    (name: string, isTouched: boolean) => {
      setTouched((prev) => ({ ...prev, [name]: isTouched }));

      // Validate on blur if enabled
      if (isTouched && validateOnBlur && validationSchema) {
        try {
          // Check if it's a ZodObject to access shape
          if ('shape' in validationSchema && validationSchema.shape) {
            const fieldSchema = (validationSchema.shape as any)[name];
            if (fieldSchema) {
              const result = validateField(fieldSchema, values[name]);
              if (!result.valid && result.error) {
                setErrors((prev) => ({ ...prev, [name]: result.error! }));
              } else {
                // Clear error if field is now valid
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors[name];
                  return newErrors;
                });
              }
            }
          }
        } catch (e) {
          // Schema doesn't support per-field validation
        }
      }
    },
    [validateOnBlur, validationSchema, values]
  );

  const getFieldError = useCallback(
    (name: string): string | undefined => {
      return touched[name] ? errors[name] : undefined;
    },
    [touched, errors]
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(values).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    // Validate with schema if provided
    if (validationSchema) {
      const { valid, errors: validationErrors } = validateForm(validationSchema, values);
      if (!valid) {
        setErrors(validationErrors);
        const firstError = Object.values(validationErrors)[0];
        displayError({ message: firstError }, 'Please fix the form errors');
        return;
      }
    }

    // Submit
    setIsSubmitting(true);
    try {
      const result = await onSubmit(values);

      // Success
      if (successMessage) {
        displaySuccess(successMessage);
      }

      if (onSuccess) {
        onSuccess(result);
      }

      // Clear errors on success
      setErrors({});
    } catch (error: any) {
      // Parse API errors
      const { message, fieldErrors } = parseApiError(error);

      // Set field errors
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      }

      // Display error toast
      displayError(error, errorMessage || 'An error occurred');

      if (onError) {
        onError(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const contextValue: FormContextValue = useMemo(
    () => ({
      values,
      errors,
      touched,
      isSubmitting,
      setValue,
      setError,
      setTouched: setTouchedField,
      clearError,
      getFieldError,
    }),
    [
      values,
      errors,
      touched,
      isSubmitting,
      setValue,
      setError,
      setTouchedField,
      clearError,
      getFieldError,
    ]
  );

  return (
    <FormContext.Provider value={contextValue}>
      <form onSubmit={handleSubmit} className={className} noValidate>
        {children}
      </form>
    </FormContext.Provider>
  );
}

// Form.Field Component
interface FormFieldProps {
  name: string;
  label?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  description?: string;
}

Form.Field = function FormField({
  name,
  label,
  required = false,
  children,
  className,
  description,
}: FormFieldProps) {
  const { getFieldError } = useFormContext();
  const error = getFieldError(name);

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={name} className="text-white font-semibold text-sm">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </Label>
      )}
      {children}
      {description && !error && <p className="text-xs text-gray-400">{description}</p>}
      <FormError error={error} />
    </div>
  );
};

// Form.Input Component
interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'> {
  name: string;
}

Form.Input = function FormInput({ name, className, ...props }: FormInputProps) {
  const { values, setValue, setTouched, isSubmitting } = useFormContext();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(name, e.target.value);
    },
    [name, setValue]
  );

  const handleBlur = useCallback(() => {
    setTouched(name, true);
  }, [name, setTouched]);

  return (
    <Input
      id={name}
      name={name}
      value={values[name] || ''}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={isSubmitting || props.disabled}
      className={cn(
        'bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-500/50 focus:ring-purple-500/20',
        className
      )}
      {...props}
    />
  );
};

// Form.Textarea Component
interface FormTextareaProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'name'
> {
  name: string;
}

Form.Textarea = function FormTextarea({ name, className, ...props }: FormTextareaProps) {
  const { values, setValue, setTouched, isSubmitting } = useFormContext();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(name, e.target.value);
    },
    [name, setValue]
  );

  const handleBlur = useCallback(() => {
    setTouched(name, true);
  }, [name, setTouched]);

  return (
    <textarea
      id={name}
      name={name}
      value={values[name] || ''}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={isSubmitting || props.disabled}
      className={cn(
        'w-full bg-white/10 border border-white/20 text-white placeholder:text-gray-400',
        'focus:border-purple-500/50 focus:ring-purple-500/20 rounded-lg p-3 resize-none',
        'disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
        className
      )}
      {...props}
    />
  );
};

// Form.SubmitButton Component
interface FormSubmitButtonProps {
  children: ReactNode;
  loadingText?: string;
  className?: string;
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  size?: 'default' | 'sm' | 'lg' | 'xl';
}

Form.SubmitButton = function FormSubmitButton({
  children,
  loadingText = 'Submitting...',
  className,
  color = 'primary',
  size = 'default',
}: FormSubmitButtonProps) {
  const { isSubmitting } = useFormContext();

  return (
    <LoadingButton
      type="submit"
      color={color}
      size={size}
      className={cn('w-full', className)}
      isLoading={isSubmitting}
      loadingText={loadingText}
    >
      {children}
    </LoadingButton>
  );
};

// Form.ErrorSummary Component
interface FormErrorSummaryProps {
  className?: string;
}

Form.ErrorSummary = function FormErrorSummary({ className }: FormErrorSummaryProps) {
  const { errors, touched } = useFormContext();

  const visibleErrors = Object.entries(errors).filter(([key]) => touched[key]);

  if (visibleErrors.length === 0) return null;

  return (
    <div className={cn('bg-red-500/10 border border-red-500/30 rounded-lg p-4', className)}>
      <p className="text-red-300 font-semibold mb-2">Please fix the following errors:</p>
      <ul className="list-disc list-inside space-y-1">
        {visibleErrors.map(([field, error]) => (
          <li key={field} className="text-sm text-red-200">
            {error}
          </li>
        ))}
      </ul>
    </div>
  );
};
