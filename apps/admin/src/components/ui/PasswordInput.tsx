'use client';

import { useState, useCallback, useMemo, memo } from 'react';
import { Button } from '@jyotish/ui';
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

  const inputBaseStyles =
    'flex h-11 w-full rounded-md border-2 border-purple-500/30 bg-slate-900/50 backdrop-blur-sm text-sm text-white transition-all duration-300 placeholder:text-slate-400 hover:border-purple-400/50 hover:bg-slate-900/70 focus-within:outline-none focus-within:border-purple-500 focus-within:bg-slate-900/80 focus-within:ring-4 focus-within:ring-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'flex items-center gap-0 overflow-hidden',
          inputBaseStyles,
          className
        )}
      >
        <input
          id={id || name}
          name={name}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          autoComplete={autoComplete}
          className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
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
            'h-8 w-8 shrink-0 rounded-md mr-1',
            'text-gray-400 hover:text-gray-300 hover:bg-white/10',
            'focus-visible:ring-0 focus-visible:ring-offset-0'
          )}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>

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
