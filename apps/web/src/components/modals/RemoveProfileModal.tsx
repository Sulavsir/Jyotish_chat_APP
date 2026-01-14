/**
 * Remove Profile Photo Confirmation Modal
 * Confirms user's intention to remove their profile photo
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

interface RemoveProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function RemoveProfileModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: RemoveProfileModalProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Remove Profile Photo</DialogTitle>
        <DialogDescription>Are you sure you want to remove your profile photo?</DialogDescription>
      </DialogHeader>

      <DialogBody>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Your profile will display the default avatar with your initial. You can always upload a
          new photo later.
        </p>
      </DialogBody>

      <DialogFooter>
        <Button onClick={onClose} disabled={isLoading} variant="outline" color="neutral">
          Cancel
        </Button>
        <LoadingButton
          onClick={onConfirm}
          isLoading={isLoading}
          loadingText="Removing..."
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Remove Photo
        </LoadingButton>
      </DialogFooter>
    </Dialog>
  );
}
