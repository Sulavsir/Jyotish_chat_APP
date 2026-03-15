'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  DateInput,
} from '@jyotish/ui';
import { LoadingButton } from '@/components/ui';
import { getMinSlotDate } from '@/constants/slot.constants';
import type { BookingType } from '@/types/appointment.types';
import { TimeRangeMultiSelect } from './TimeRangeMultiSelect';
import { getSlotTimeRangeOptions } from '@/constants/slot.constants';
import { Sparkles } from 'lucide-react';

const SLOT_TYPE_LABEL = 'Appointment for Full Kundali Review';

const TIME_RANGE_OPTIONS = getSlotTimeRangeOptions();

export interface PendingSlotSession {
  id: string;
  date: string;
  slotType: BookingType;
  timeStarts: string[];
}

export interface PendingSessionEditModalProps {
  session: PendingSlotSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (session: PendingSlotSession) => void;
  onDelete: (id: string) => void;
}

export function PendingSessionEditModal({
  session,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: PendingSessionEditModalProps) {
  const [date, setDate] = useState('');
  const slotType: BookingType = 'KUNDALI_REVIEW';
  const [timeStarts, setTimeStarts] = useState<string[]>([]);

  useEffect(() => {
    if (session) {
      setDate(session.date);
      setTimeStarts([...session.timeStarts].sort());
    }
  }, [session]);

  if (!session) return null;

  const handleSave = () => {
    if (!date || timeStarts.length === 0) return;
    onSave({ ...session, date, slotType, timeStarts: [...timeStarts].sort() });
    onOpenChange(false);
  };

  const handleDelete = () => {
    onDelete(session.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900/95 border-white/20 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">Edit session</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/70 mb-1 block">Date</label>
            <DateInput
              min={getMinSlotDate()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white/5 border-white/20 text-white"
              nepaliDate
            />
          </div>
          <div>
            <label className="text-xs text-white/70 mb-1 block">Slot type</label>
            <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-white/5 border border-white/20 text-white">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>{SLOT_TYPE_LABEL}</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/70 mb-1 block">Times</label>
            <TimeRangeMultiSelect
              options={TIME_RANGE_OPTIONS}
              value={timeStarts}
              onChange={setTimeStarts}
              placeholder="Select times"
            />
          </div>
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            onClick={handleDelete}
          >
            Delete session
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" className="text-white/70" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <LoadingButton
              onClick={handleSave}
              disabled={!date || timeStarts.length === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Save
            </LoadingButton>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
