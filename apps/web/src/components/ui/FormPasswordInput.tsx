/**
 * Form Password Input Component
 * Password input that integrates with Form context
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { Input, Button } from '@jyotish/ui';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFormContext } from './Form';

interface FormPasswordInputProps {
  name: string;
  placeholder?: string;
  autoComplete?: string;
  className?: string;
  showStrength?: boolean;
}

export function FormPasswordInput({
  name,
  placeholder = 'Enter your password',
  autoComplete = 'current-password',
  className = '',
  showStrength = false,
}: FormPasswordInputProps) {
  const { values, setValue, setTouched, isSubmitting } = useFormContext();
  const [showPassword, setShowPassword] = useState(false);

  const value = values[name] || '';

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(name, e.target.value);
    },
    [name, setValue]
  );

  const handleBlur = useCallback(() => {
    setTouched(name, true);
  }, [name, setTouched]);

  // Calculate password strength if enabled
  const strength = useMemo(() => {
    if (!showStrength || !value) return null;

    const password = value as string;
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;

    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-400 text-red-400' };
    if (score <= 4) return { score, label: 'Medium', color: 'bg-yellow-400 text-yellow-400' };
    return { score, label: 'Strong', color: 'bg-green-400 text-green-400' };
  }, [showStrength, value]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          id={name}
          name={name}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isSubmitting}
          autoComplete={autoComplete}
          className={cn('pr-12', className)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={togglePasswordVisibility}
          disabled={isSubmitting}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          tabIndex={-1}
          className={cn(
            'absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8',
            'text-gray-400 hover:text-gray-300 hover:bg-white/10',
            'focus-visible:ring-0 focus-visible:ring-offset-0'
          )}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>

      {/* Password Strength Indicator */}
      {showStrength && strength && strength.score > 0 && (
        <div className="space-y-1">
          <div className="flex gap-1">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded ${
                  i < strength.score ? strength.color.split(' ')[0] : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
          <p className={`text-xs font-medium ${strength.color.split(' ')[1]}`}>
            Password strength: {strength.label}
          </p>
        </div>
      )}
    </div>
  );
}

