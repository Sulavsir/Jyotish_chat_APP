/**
 * ConfirmDialog Component
 * A reusable confirmation dialog for admin actions
 */

'use client';

import { ReactNode } from 'react';
import { LoadingButton } from './LoadingButton';
import { Button } from '@jyotish/ui';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  isLoading = false,
  icon,
  children,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/90 z-[60] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-md bg-slate-900 border border-slate-800 rounded-lg shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6">
          {/* Header with Icon */}
          <div className="flex items-center gap-3 mb-4">
            {icon && (
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-full ${
                  isDestructive ? 'bg-red-500/20' : 'bg-green-500/20'
                }`}
              >
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="text-sm text-slate-400">{description}</p>
            </div>
          </div>

          {/* Additional Content */}
          {children}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <LoadingButton
              variant="outline"
              onClick={onClose}
              className="flex-1"
              isLoading={isLoading}
            >
              {cancelText}
            </LoadingButton>
            <LoadingButton
              onClick={onConfirm}
              isLoading={isLoading}
              className={`flex-1 ${
                isDestructive
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {confirmText}
            </LoadingButton>
          </div>
        </div>
      </div>
    </>
  );
}
