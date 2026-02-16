'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@jyotish/ui';
import type { AstrologerSlot } from '@/types/appointment.types';

const SLOT_TYPE_LABEL = 'Appointment for Full Kundali Review';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeRange(isoStart: string): string {
  const d = new Date(isoStart);
  const h = d.getHours();
  const m = d.getMinutes();
  const endM = m + 30;
  const endH = endM === 60 ? h + 1 : h;
  const endM2 = endM === 60 ? 0 : endM;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} - ${String(endH).padStart(2, '0')}:${String(endM2).padStart(2, '0')}`;
}

export interface SlotDetailModalProps {
  slot: AstrologerSlot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SlotDetailModal({
  slot,
  open,
  onOpenChange,
}: SlotDetailModalProps) {
  if (!slot) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900/95 border-white/20 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">Slot details</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-white/60">Date</span>
            <p className="text-white font-medium">{formatDate(slot.startAt)}</p>
          </div>
          <div>
            <span className="text-white/60">Type</span>
            <p className="text-white font-medium">{SLOT_TYPE_LABEL}</p>
          </div>
          <div>
            <span className="text-white/60">Time</span>
            <p className="text-white font-medium">{formatTimeRange(slot.startAt)}</p>
          </div>
          <div>
            <span className="text-white/60">Status</span>
            <p className="text-white font-medium">
              {slot.status === 'BOOKED' ? 'Booked' : 'Available'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
