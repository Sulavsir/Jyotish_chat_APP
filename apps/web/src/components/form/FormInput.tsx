/**
 * FormInput - Input component integrated with react-hook-form
 */

import { forwardRef } from 'react';
import { Input, Label, DateInput } from '@jyotish/ui';
import type { InputHTMLAttributes } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, className, type, ...props }, ref) => {
    const isDate = type === 'date';
    const InputComponent = isDate ? DateInput : Input;
    const inputProps = isDate ? { ...props } : { type, ...props };
    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={props.id} className="text-white">
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </Label>
        )}
        <InputComponent ref={ref} className={className} {...inputProps} />
        {error && <p className="text-sm text-red-400">{error}</p>}
        {!error && helperText && <p className="text-xs text-gray-400 italic">{helperText}</p>}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
