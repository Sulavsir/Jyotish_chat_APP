'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@jyotish/ui';
import { LoadingButton } from '@/components/ui';
import type { AstrologerSlot } from '@/types/appointment.types';

function formatSlotSummary(slot: AstrologerSlot): string {
  const d = new Date(slot.startAt);
  const dateStr = d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const h = d.getHours();
  const m = d.getMinutes();
  const endM = m + 30;
  const endH = endM === 60 ? h + 1 : h;
  const endM2 = endM === 60 ? 0 : endM;
  const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} - ${String(endH).padStart(2, '0')}:${String(endM2).padStart(2, '0')}`;
  return `${dateStr}, ${timeStr}`;
}

export interface DeleteSlotConfirmDialogProps {
  slot: AstrologerSlot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (slotId: string) => void;
  isDeleting: boolean;
}

export function DeleteSlotConfirmDialog({
  slot,
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: DeleteSlotConfirmDialogProps) {
  if (!slot) return null;

  const handleConfirm = () => {
    onConfirm(slot.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900/95 border-white/20 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">Delete slot?</DialogTitle>
          <DialogDescription className="text-white/70">
            This will remove the slot <strong className="text-white/90">{formatSlotSummary(slot)}</strong>. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            className="text-white/70"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <LoadingButton
            onClick={handleConfirm}
            isLoading={isDeleting}
            loadingText="Deleting..."
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
