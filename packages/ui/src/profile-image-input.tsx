'use client';

import * as React from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Button } from './button';
import { cn } from './utils';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface ProfileImageInputProps {
  value?: File | null;
  onChange?: (file: File | null) => void;
  placeholderName?: string;
  disabled?: boolean;
  className?: string;
  description?: string;
  /** Theme variant: 'admin' matches slate/purple form; 'jyotish' matches orange form */
  variant?: 'admin' | 'jyotish';
}

const variantStyles = {
  admin: {
    container:
      'rounded-lg  border-slate-700 bg-slate-800/50 hover:border-slate-600 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500/50',
    avatar: '',
    fallback: 'bg-slate-700 text-slate-400',
    button: 'h-9 border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white hover:border-slate-500',
    removeButton: 'h-9 border-slate-600 bg-slate-800 text-slate-400 hover:bg-red-950/30 hover:text-red-400 hover:border-red-900/50',
    description: 'text-slate-400',
  },
  jyotish: {
    container:
      'rounded-lg border border-white/20 bg-white/5 hover:border-white/30 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500/50',
    avatar: '',
    fallback: 'bg-white/10 text-slate-400',
    button: 'h-9 border-white/20 bg-white/5 text-white hover:bg-white/10',
    removeButton: 'h-9 border-white/20 bg-white/5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50',
    description: 'text-gray-400',
  },
} as const;

export function ProfileImageInput({
  value,
  onChange,
  placeholderName = 'A',
  disabled = false,
  className,
  description = 'Your profile image will be displayed in your profile.',
  variant = 'admin',
}: ProfileImageInputProps) {
  const styles = variantStyles[variant];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return 'Please select a valid image (JPEG, PNG, GIF, or WebP).';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 5MB.';
    }
    return null;
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      onChange?.(file);
    },
    [onChange, validateFile]
  );

  const handleUploadClick = useCallback(() => {
    if (disabled) return;
    setError(null);
    fileInputRef.current?.click();
  }, [disabled]);

  const handleChangeClick = useCallback(() => {
    if (disabled) return;
    setError(null);
    fileInputRef.current?.click();
  }, [disabled]);

  const handleRemoveClick = useCallback(() => {
    if (disabled) return;
    setError(null);
    onChange?.(null);
  }, [disabled, onChange]);

  return (
    <div
      className={cn(
        'px-4 py-3 transition-colors focus-within:ring-offset-0 focus-within:ring-offset-slate-900',
        styles.container,
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <Avatar className={cn('h-20 w-20 overflow-hidden', styles.avatar)}>
            {previewUrl ? (
              <AvatarImage src={previewUrl} alt="Profile preview" className="object-cover" />
            ) : (
              <AvatarFallback className={cn('text-xl font-medium', styles.fallback)}>
                {placeholderName.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
        </div>

        <div className="flex flex-1 flex-col gap-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {!value ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUploadClick}
                disabled={disabled}
                className={styles.button}
              >
                Upload photo
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleChangeClick}
                  disabled={disabled}
                  className={styles.button}
                >
                  Change
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveClick}
                  disabled={disabled}
                  className={styles.removeButton}
                >
                  Remove
                </Button>
              </>
            )}
          </div>
          {description && <p className={cn('text-xs', styles.description)}>{description}</p>}
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        aria-hidden
      />
    </div>
  );
}

