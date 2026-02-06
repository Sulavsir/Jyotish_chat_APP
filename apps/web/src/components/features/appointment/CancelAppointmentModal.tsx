/**
 * CancelAppointmentModal - Confirm cancel with optional reason
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@jyotish/ui';
import { LoadingButton } from '@/components/ui/LoadingButton';
import type { Appointment } from '@/types/appointment.types';

interface CancelAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onCancelled: () => void;
  cancelFn: (id: string, cancellationNote?: string) => Promise<unknown>;
  isPending: boolean;
}

export function CancelAppointmentModal({
  isOpen,
  onClose,
  appointment,
  onCancelled,
  cancelFn,
  isPending,
}: CancelAppointmentModalProps) {
  const [cancellationNote, setCancellationNote] = useState('');

  const handleClose = () => {
    if (!isPending) {
      setCancellationNote('');
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (!appointment) return;
    await cancelFn(appointment.id, cancellationNote.trim() || undefined);
    setCancellationNote('');
    onCancelled();
    onClose();
  };

  if (!appointment) return null;

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} showCloseButton={!isPending}>
      <DialogHeader>
        <DialogTitle>Cancel appointment?</DialogTitle>
        <DialogDescription>
          This action cannot be undone. The appointment with{' '}
          {'astrologer' in appointment && appointment.astrologer
            ? appointment.astrologer.name
            : 'client' in appointment && appointment.client
              ? appointment.client.name
              : 'this user'}{' '}
          will be cancelled. You may add a reason below (optional).
        </DialogDescription>
      </DialogHeader>
      <DialogBody>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          Reason for cancellation (optional)
        </label>
        <textarea
          value={cancellationNote}
          onChange={(e) => setCancellationNote(e.target.value)}
          placeholder="e.g. Schedule conflict, client request..."
          maxLength={500}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border bg-black/20 text-white placeholder:text-slate-500 border-slate-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none"
          disabled={isPending}
        />
        {cancellationNote.length > 0 && (
          <p className="text-xs mt-1 text-slate-400">{cancellationNote.length}/500</p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" color="neutral" onClick={handleClose} disabled={isPending}>
          Go back
        </Button>
        <LoadingButton
          color="danger"
          onClick={handleConfirm}
          isLoading={isPending}
          loadingText="Cancelling..."
        >
          Cancel appointment
        </LoadingButton>
      </DialogFooter>
    </Dialog>
  );
}
