/**
 * Logout Confirmation Modal
 * Simple confirmation dialog matching the cosmic theme
 */

'use client';

import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  LoadingButton,
} from '@/components/ui';
import { Button } from '@jyotish/ui';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function LogoutModal({ isOpen, onClose, onConfirm, isLoading }: LogoutModalProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogDescription>Are you sure you want to logout from your account?</DialogDescription>
      </DialogHeader>

      <DialogBody>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          You&apos;ll need to login again to access your account and continue your consultations.
        </p>
      </DialogBody>

      <DialogFooter>
        <Button onClick={onClose} disabled={isLoading} variant="outline" color="neutral">
          Cancel
        </Button>
        <LoadingButton
          onClick={onConfirm}
          isLoading={isLoading}
          loadingText="Logging out..."
          color="danger"
        >
          Logout
        </LoadingButton>
      </DialogFooter>
    </Dialog>
  );
}
