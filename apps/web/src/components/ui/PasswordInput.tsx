'use client';

import { useState, useCallback, useMemo, memo } from 'react';
import { Input, Button } from '@jyotish/ui';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordInputProps {
  id?: string;
  name: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
  showStrength?: boolean;
  autoComplete?: string;
}

export const PasswordInput = memo(function PasswordInput({
  id,
  name,
  value = '',
  onChange,
  onBlur,
  placeholder = 'Enter your password',
  disabled = false,
  className = '',
  error,
  showStrength = false,
  autoComplete = 'current-password',
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  // Calculate password strength if enabled (memoized)
  const strength = useMemo(() => {
    if (!showStrength || !value) return null;
    
    let score = 0;
    const password = value as string;
    
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
          id={id || name}
          name={name}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          autoComplete={autoComplete}
          className={cn(
            'pr-12',
            className
          )}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={togglePasswordVisibility}
          disabled={disabled}
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

      {error && (
        <p className="text-sm text-red-300 font-medium flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
          <span className="text-red-400">⚠</span> {error}
        </p>
      )}
    </div>
  );
});
