'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@jyotish/ui';
import { LoadingButton } from '@/components/ui';
import { getMinSlotDate } from '@/constants/slot.constants';
import type { BookingType } from '@/types/appointment.types';
import { TimeRangeMultiSelect } from './TimeRangeMultiSelect';
import { getSlotTimeRangeOptions } from '@/constants/slot.constants';
import { CalendarDays, Sparkles } from 'lucide-react';

const SLOT_TYPE_LABELS: Record<BookingType, string> = {
  APPOINTMENT: 'Appointment',
  KUNDALI_REVIEW: 'Full Kundali Review',
};

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
  const [slotType, setSlotType] = useState<BookingType>('APPOINTMENT');
  const [timeStarts, setTimeStarts] = useState<string[]>([]);

  useEffect(() => {
    if (session) {
      setDate(session.date);
      setSlotType(session.slotType);
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
            <Input
              type="date"
              min={getMinSlotDate()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white/5 border-white/20 text-white"
            />
          </div>
          <div>
            <label className="text-xs text-white/70 mb-1 block">Slot type</label>
            <Select value={slotType} onValueChange={(v) => setSlotType(v as BookingType)}>
              <SelectTrigger className="w-full bg-white/5 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="APPOINTMENT">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {SLOT_TYPE_LABELS.APPOINTMENT}
                  </span>
                </SelectItem>
                <SelectItem value="KUNDALI_REVIEW">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    {SLOT_TYPE_LABELS.KUNDALI_REVIEW}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
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
