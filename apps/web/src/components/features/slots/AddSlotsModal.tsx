'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  Button,
  Input,
  DateInput,
} from '@jyotish/ui';
import { LoadingButton } from '@/components/ui';
import {
  getSlotTimeRangeOptions,
  getMinSlotDate,
  SLOT_DURATION_MINUTES,
} from '@/constants/slot.constants';
import type { BookingType } from '@/types/appointment.types';
import type { CreateSlotBody } from '@/services/astrologerSlots.service';
import { TimeRangeMultiSelect } from './TimeRangeMultiSelect';
import { PendingSessionEditModal, type PendingSlotSession } from './PendingSessionEditModal';
import { Sparkles, Plus, X } from 'lucide-react';

const SLOT_TYPE_LABEL = 'Appointment for Full Kundali Review';

const TIME_RANGE_OPTIONS = getSlotTimeRangeOptions();

function formatSessionDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function generateId(): string {
  return `pending-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface AddSlotsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Creates slots via API; called when user clicks "Add slots" with all pending sessions. */
  onCreateSlots: (bodies: CreateSlotBody[]) => Promise<unknown>;
  isCreating: boolean;
}

export function AddSlotsModal({
  open,
  onOpenChange,
  onCreateSlots,
  isCreating,
}: AddSlotsModalProps) {
  const slotType: BookingType = 'KUNDALI_REVIEW';
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStarts, setSelectedStarts] = useState<string[]>([]);
  const [sessions, setSessions] = useState<PendingSlotSession[]>([]);
  const [editingSession, setEditingSession] = useState<PendingSlotSession | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const minDate = getMinSlotDate();

  const resetForm = useCallback(() => {
    setSelectedDate('');
    setSelectedStarts([]);
  }, []);

  /** Add current form to "Added in this session" (local only). One session per date: merge times if same date+type. */
  const handleAddMore = useCallback(() => {
    if (!selectedDate || selectedStarts.length === 0) return;
    const timeStarts = [...selectedStarts].sort();
    setSessions((prev) => {
      const existing = prev.find((s) => s.date === selectedDate && s.slotType === slotType);
      if (existing) {
        const merged = new Set([...existing.timeStarts, ...timeStarts]);
        return prev.map((s) =>
          s.id === existing.id ? { ...s, timeStarts: [...merged].sort() } : s
        );
      }
      return [...prev, { id: generateId(), date: selectedDate, slotType, timeStarts }];
    });
    resetForm();
  }, [selectedDate, selectedStarts, slotType, resetForm]);

  /** Build CreateSlotBody[] from current form + all sessions, call API, then close modal. */
  const handleSubmit = useCallback(async () => {
    const bodies: CreateSlotBody[] = [];
    const now = new Date();

    const addBodiesFor = (date: string, type: BookingType, timeStarts: string[]) => {
      const base = new Date(date + 'T00:00:00');
      for (const start of timeStarts) {
        const [h, m] = start.split(':').map(Number);
        const startDt = new Date(base);
        startDt.setHours(h, m, 0, 0);
        const endDt = new Date(startDt.getTime() + SLOT_DURATION_MINUTES * 60 * 1000);
        if (startDt < now) continue;
        bodies.push({
          startAt: startDt.toISOString(),
          endAt: endDt.toISOString(),
          slotType: type,
        });
      }
    };

    if (selectedDate && selectedStarts.length > 0) {
      addBodiesFor(selectedDate, slotType, [...selectedStarts].sort());
    }
    for (const session of sessions) {
      addBodiesFor(session.date, session.slotType, session.timeStarts);
    }
    if (bodies.length === 0) return;
    await onCreateSlots(bodies);
    setSessions([]);
    resetForm();
    onOpenChange(false);
  }, [selectedDate, selectedStarts, slotType, sessions, onCreateSlots, resetForm, onOpenChange]);

  const openDetail = useCallback((session: PendingSlotSession) => {
    setEditingSession(session);
    setDetailOpen(true);
  }, []);

  const handleSaveSession = useCallback((updated: PendingSlotSession) => {
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }, []);

  const handleDeleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const timeLabels = TIME_RANGE_OPTIONS;
  const formatTimesSummary = (timeStarts: string[]) => {
    if (timeStarts.length <= 2) {
      return timeStarts.map((t) => timeLabels.find((o) => o.start === t)?.label ?? t).join(', ');
    }
    return `${timeStarts.length} times`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-slate-900/95 border-white/20 text-white max-w-md max-h-[90vh] flex flex-col">
          <DialogClose asChild>
            <button
              type="button"
              className="absolute right-3 top-3 rounded p-1.5 text-white/60 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </DialogClose>
          <DialogHeader>
            <DialogTitle className="text-white pr-8">Add time slots</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-white/60">
            Add date and times, then either <strong>Add slots</strong> to create them now, or{' '}
            <strong>Add more</strong> to queue another session and create all together later.
          </p>
          <div className="space-y-4 flex-1 min-h-0 flex flex-col">
            <div>
              <label className="text-xs text-white/70 mb-1 block">Slot type</label>
              <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-white/5 border border-white/20 text-white">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>{SLOT_TYPE_LABEL}</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-white/70 mb-1 block">Date</label>
              <DateInput
                min={minDate}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border-white/20"
                nepaliDate
              />
            </div>
            <div>
              <label className="text-xs text-white/70 mb-1 block">
                Available times (30 min each)
              </label>
              <TimeRangeMultiSelect
                options={TIME_RANGE_OPTIONS}
                value={selectedStarts}
                onChange={setSelectedStarts}
                placeholder="Select times"
              />
            </div>

            <div className="flex flex-col min-h-0 flex-1">
              <label className="text-xs text-white/70 mb-1 block">
                Added in this session ({sessions.length})
              </label>
              <ul
                className="border border-white/10 rounded-lg overflow-y-auto bg-white/5 min-h-0 flex-1 overscroll-contain"
                style={{ height: '180px' }}
              >
                {sessions.length === 0 ? (
                  <li className="px-3 py-4 text-center text-sm text-white/50">
                    Optional: use &quot;Add more&quot; to queue sessions (one per date). Click a
                    session to edit or delete. &quot;Add slots&quot; creates from the form and/or
                    this list.
                  </li>
                ) : (
                  sessions.map((session) => (
                    <li key={session.id}>
                      <button
                        type="button"
                        onClick={() => openDetail(session)}
                        className="w-full text-left px-3 py-2 flex items-center justify-between gap-2 hover:bg-white/10 border-b border-white/5 last:border-b-0 text-sm"
                      >
                        <span className="text-white/90 truncate">
                          {formatSessionDate(session.date)}
                        </span>
                        <span className="text-white/70 text-xs truncate max-w-[180px]">
                          {formatTimesSummary(session.timeStarts)}
                        </span>
                        <span className="shrink-0 text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                          {SLOT_TYPE_LABEL}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
          <DialogFooter className="flex flex-row justify-between sm:justify-between gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              className="border-white/20 text-white/80 hover:bg-white/10"
              onClick={handleAddMore}
              disabled={!selectedDate || selectedStarts.length === 0}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add more
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                className="text-white/70"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <LoadingButton
                onClick={handleSubmit}
                isLoading={isCreating}
                loadingText="Creating..."
                disabled={(!selectedDate || selectedStarts.length === 0) && sessions.length === 0}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Add slots
              </LoadingButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PendingSessionEditModal
        session={editingSession}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setEditingSession(null);
        }}
        onSave={handleSaveSession}
        onDelete={handleDeleteSession}
      />
    </>
  );
}
