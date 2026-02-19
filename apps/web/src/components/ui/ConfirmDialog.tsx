/**
 * ConfirmDialog Component
 * A reusable confirmation dialog for destructive actions
 */

'use client';

import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './Dialog';
import { Button } from '@jyotish/ui';
import { LoadingButton } from './LoadingButton';

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
  /** e.g. "z-[100010]" to show above other modals */
  overlayClassName?: string;
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
  overlayClassName,
}: ConfirmDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} showCloseButton={false} overlayClassName={overlayClassName}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <Button variant="outline" color="neutral" onClick={onClose} disabled={isLoading}>
          {cancelText}
        </Button>
        <LoadingButton
          color={isDestructive ? 'danger' : 'primary'}
          onClick={onConfirm}
          isLoading={isLoading}
          loadingText="Confirming..."
        >
          {confirmText}
        </LoadingButton>
      </DialogFooter>
    </Dialog>
  );
}
