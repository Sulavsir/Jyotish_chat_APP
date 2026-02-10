'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  LoadingButton,
} from '@jyotish/ui';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ASTROLOGER_EDIT_PASSWORD } from '@/constants/app.constants';

export interface AstrologerEditPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (password: string) => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
  submitLabel?: string;
}

/**
 * Modal that prompts for the astrologer edit/delete password.
 * Rounded styling and password visibility toggle (eye icon).
 */
export function AstrologerEditPasswordModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  title = ASTROLOGER_EDIT_PASSWORD.MODAL_TITLE,
  description = ASTROLOGER_EDIT_PASSWORD.MODAL_DESCRIPTION,
  submitLabel = ASTROLOGER_EDIT_PASSWORD.SUBMIT,
}: AstrologerEditPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    onSubmit(password.trim());
    setPassword('');
  };

  const handleClose = (next: boolean) => {
    if (!next) {
      setPassword('');
      setShowPassword(false);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          'rounded-md bg-slate-900 border border-slate-700 text-white shadow-xl',
          'gap-0 overflow-hidden'
        )}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader className="space-y-2 pb-4">
            <DialogTitle className="text-lg font-semibold text-white">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-400">
              {description}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div
              className={cn(
                'flex items-center gap-0 overflow-hidden rounded-md',
                'h-11 w-full border-2 border-slate-600 bg-slate-800/80',
                'focus-within:border-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500/20',
                'transition-all duration-200'
              )}
            >
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={ASTROLOGER_EDIT_PASSWORD.PASSWORD_PLACEHOLDER}
                autoComplete="current-password"
                disabled={isLoading}
                className="min-w-0 flex-1 border-0 bg-transparent px-4 py-2.5 text-white outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword((p) => !p)}
                disabled={isLoading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
                className="h-9 w-9 shrink-0 rounded-md text-slate-400 hover:bg-slate-700/50 hover:text-slate-300"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <DialogFooter className="mt-6 flex gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              className="rounded-md border-slate-600"
            >
              {ASTROLOGER_EDIT_PASSWORD.CANCEL}
            </Button>
            <LoadingButton
              type="submit"
              loading={isLoading}
              disabled={!password.trim()}
              className="rounded-md bg-gradient-to-r from-cosmic-purple to-nebula-pink hover:opacity-90"
            >
              {submitLabel}
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
