/**
 * FormPasswordInput - Password input component integrated with react-hook-form
 */

import { PasswordInput } from '@/components/ui';
import { Label } from '@jyotish/ui';

interface FormPasswordInputProps {
  id?: string;
  name: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  autoComplete?: string;
}

export const FormPasswordInput = ({
  label,
  error,
  helperText,
  required,
  ...props
}: FormPasswordInputProps) => {
  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={props.id} className="text-white">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </Label>
      )}
      <PasswordInput {...props} />
      {error && <p className="text-sm text-red-400">{error}</p>}
      {!error && helperText && <p className="text-sm text-gray-400">{helperText}</p>}
    </div>
  );
};
