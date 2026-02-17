/**
 * Jyotish My Slots Page
 * Add slots via modal (date picker + time range buttons). Table and pagination below.
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { JyotishLayout } from '@/components/layouts/JyotishLayout';
import { useRequireAuth } from '@/hooks';
import { USER_ROLES } from '@/constants';
import { LoadingScreenWithBackground } from '@/components/ui';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Popover,
  PopoverContent,
  PopoverTrigger,
  DateInput,
} from '@jyotish/ui';
import { LoadingButton } from '@/components/ui';
import {
  JyotishDataTable,
  JyotishPagination,
  type JyotishDataTableColumn,
} from '@/components/jyotish/JyotishTable';
import {
  AddSlotsModal,
  DeleteSlotConfirmDialog,
  TimeRangeSelect,
} from '@/components/features/slots';
import * as astrologerSlotsService from '@/services/astrologerSlots.service';
import { getAstrologerPermissionsFromUser } from '@/lib/auth';
import { showErrorToast, showSuccessToast } from '@/lib/error-handler';
import type { AstrologerSlot, BookingType } from '@/types/appointment.types';
import { getSlotTimeRangeOptions, getMinSlotDate } from '@/constants/slot.constants';
import { Clock, Trash2, Pencil, Plus, ChevronDown } from 'lucide-react';

const SLOT_TYPE_LABEL = 'Appointment for Full Kundali Review';

const TIME_RANGE_OPTIONS = getSlotTimeRangeOptions();

function formatSlotTime(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function formatSlotTimeRange(isoStart: string): string {
  const d = new Date(isoStart);
  const h = d.getHours();
  const m = d.getMinutes();
  const endM = m + 30;
  const endH = endM === 60 ? h + 1 : h;
  const endM2 = endM === 60 ? 0 : endM;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} - ${String(endH).padStart(2, '0')}:${String(endM2).padStart(2, '0')}`;
}

/** Group slots by same date and type so one row shows all times for that date+type. */
interface GroupedSlotRow {
  dateKey: string;
  dateLabel: string;
  slotType: BookingType;
  slots: AstrologerSlot[];
}

function groupSlotsByDateAndType(slots: AstrologerSlot[]): GroupedSlotRow[] {
  const map = new Map<string, GroupedSlotRow>();
  for (const slot of slots) {
    const d = new Date(slot.startAt);
    const dateKey = d.toISOString().slice(0, 10);
    const dateLabel = d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const key = `${dateKey}|${slot.slotType}`;
    const existing = map.get(key);
    if (existing) {
      existing.slots.push(slot);
    } else {
      map.set(key, { dateKey, dateLabel, slotType: slot.slotType, slots: [slot] });
    }
  }
  const rows = Array.from(map.values());
  for (const row of rows) {
    row.slots.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }
  rows.sort(
    (a, b) =>
      a.dateKey.localeCompare(b.dateKey) || a.slots[0].startAt.localeCompare(b.slots[0].startAt)
  );
  return rows;
}

function SlotActionsCell({
  row,
  onEdit,
  onDelete,
}: {
  row: GroupedSlotRow;
  onEdit: (slot: AstrologerSlot) => void;
  onDelete: (slot: AstrologerSlot) => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const availableSlots = row.slots.filter((s) => s.status === 'AVAILABLE');
  if (availableSlots.length === 0) return <span className="text-white/40 text-xs">—</span>;
  return (
    <div className="flex items-center gap-1">
      <Popover open={editOpen} onOpenChange={setEditOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-white/70 hover:text-white hover:bg-white/10 text-xs"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit <ChevronDown className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56 p-1 bg-slate-900 border-white/20">
          {availableSlots.map((slot) => (
            <button
              key={slot.id}
              type="button"
              className="w-full text-left px-2 py-1.5 text-sm text-white/90 hover:bg-white/10 rounded flex items-center gap-2"
              onClick={() => {
                onEdit(slot);
                setEditOpen(false);
              }}
            >
              {formatSlotTimeRange(slot.startAt)}
            </button>
          ))}
        </PopoverContent>
      </Popover>
      <Popover open={deleteOpen} onOpenChange={setDeleteOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete <ChevronDown className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56 p-1 bg-slate-900 border-white/20">
          {availableSlots.map((slot) => (
            <button
              key={slot.id}
              type="button"
              className="w-full text-left px-2 py-1.5 text-sm text-white/90 hover:bg-white/10 rounded flex items-center gap-2 text-red-300"
              onClick={() => {
                onDelete(slot);
                setDeleteOpen(false);
              }}
            >
              {formatSlotTimeRange(slot.startAt)}
            </button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function JyotishSlotsPage() {
  const { user, isCheckingAccess } = useRequireAuth({
    requiredRole: USER_ROLES.ASTROLOGER,
  });
  const queryClient = useQueryClient();
  const [slotTypeFilter, setSlotTypeFilter] = useState<BookingType | 'ALL'>('ALL');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AstrologerSlot | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTimeStart, setEditTimeStart] = useState('');
  const [slotToDelete, setSlotToDelete] = useState<AstrologerSlot | null>(null);
  const [slotsPage, setSlotsPage] = useState(0);
  const SLOTS_PER_PAGE = 15;

  const { canAccessAppointments } = getAstrologerPermissionsFromUser(user);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['jyotish', 'slots', slotTypeFilter, slotsPage, SLOTS_PER_PAGE],
    queryFn: () =>
      astrologerSlotsService.listMySlots({
        ...(slotTypeFilter !== 'ALL' ? { slotType: slotTypeFilter } : {}),
        limit: SLOTS_PER_PAGE,
        offset: slotsPage * SLOTS_PER_PAGE,
      }),
    enabled: !!canAccessAppointments,
  });

  const createMutation = useMutation({
    mutationFn: (bodies: astrologerSlotsService.CreateSlotBody[]) =>
      astrologerSlotsService.createSlots(bodies),
    onSuccess: (_, bodies) => {
      queryClient.invalidateQueries({ queryKey: ['jyotish', 'slots'] });
      showSuccessToast(
        bodies.length === 1 ? 'Slot created' : `${bodies.length} slots created`
      );
    },
    onError: (e) => showErrorToast(e),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: astrologerSlotsService.UpdateSlotBody }) =>
      astrologerSlotsService.updateSlot(id, body),
    onSuccess: () => {
      showSuccessToast('Slot updated');
      queryClient.invalidateQueries({ queryKey: ['jyotish', 'slots'] });
      setEditingSlot(null);
    },
    onError: (e) => showErrorToast(e),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => astrologerSlotsService.deleteSlot(id),
    onSuccess: () => {
      showSuccessToast('Slot deleted');
      queryClient.invalidateQueries({ queryKey: ['jyotish', 'slots'] });
      setSlotToDelete(null);
    },
    onError: (e) => showErrorToast(e),
  });

  const handleCreateSlots = useCallback(
    async (bodies: astrologerSlotsService.CreateSlotBody[]) => {
      await createMutation.mutateAsync(bodies);
    },
    [createMutation]
  );

  const openEdit = (slot: AstrologerSlot) => {
    if (slot.status !== 'AVAILABLE') return;
    setEditingSlot(slot);
    const d = new Date(slot.startAt);
    setEditDate(d.toISOString().slice(0, 10));
    setEditTimeStart(formatSlotTime(slot.startAt));
  };

  const handleSaveEdit = () => {
    if (!editingSlot || !editDate || !editTimeStart) return;
    const [h, m] = editTimeStart.split(':').map(Number);
    const start = new Date(editDate + 'T00:00:00');
    start.setHours(h, m, 0, 0);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    if (start < new Date()) {
      showErrorToast(new Error('Start must be in the future'));
      return;
    }
    updateMutation.mutate({
      id: editingSlot.id,
      body: {
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      },
    });
  };

  const slots: AstrologerSlot[] = data?.slots ?? [];
  const groupedSlots = useMemo(() => groupSlotsByDateAndType(data?.slots ?? []), [data?.slots]);
  const totalSlots = data?.total ?? 0;
  const totalSlotsPages = Math.max(1, Math.ceil(totalSlots / SLOTS_PER_PAGE));

  const slotColumns: JyotishDataTableColumn<GroupedSlotRow>[] = useMemo(
    () => [
      {
        id: 'sn',
        header: 'S.N.',
        cellClassName: 'whitespace-nowrap text-white/70',
        cell: (_row, index) => slotsPage * SLOTS_PER_PAGE + (index ?? 0) + 1,
      },
      {
        id: 'date',
        header: 'Date',
        cellClassName: 'whitespace-nowrap text-white/80',
        cell: (row) => row.dateLabel,
      },
      {
        id: 'type',
        header: 'Type',
        cell: () => (
          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
            {SLOT_TYPE_LABEL}
          </span>
        ),
      },
      {
        id: 'time',
        header: 'Time',
        cellClassName: 'text-white/90',
        cell: (row) => row.slots.map((s) => formatSlotTimeRange(s.startAt)).join(', '),
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row) => {
          const booked = row.slots.filter((s) => s.status === 'BOOKED').length;
          const available = row.slots.filter((s) => s.status === 'AVAILABLE').length;
          if (booked === 0)
            return <span className="text-white/70">{row.slots.length} Available</span>;
          if (available === 0)
            return <span className="text-amber-400">{row.slots.length} Booked</span>;
          return (
            <span className="text-white/70">
              {available} Available, {booked} Booked
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        headerClassName: 'border-r-0',
        cellClassName: 'border-r-0',
        cell: (row) => <SlotActionsCell row={row} onEdit={openEdit} onDelete={setSlotToDelete} />,
      },
    ],
    [slotsPage]
  );

  if (isCheckingAccess) {
    return <LoadingScreenWithBackground message="Verifying access..." />;
  }

  if (!canAccessAppointments) {
    return (
      <JyotishLayout>
        <Card className="bg-black/40 border border-white/10">
          <CardContent className="py-8">
            <p className="text-white/80 text-center">
              Only Professional and Premium astrologers can manage slots.
            </p>
          </CardContent>
        </Card>
      </JyotishLayout>
    );
  }

  return (
    <JyotishLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
              <Clock className="h-7 w-7 text-purple-400" />
              My time slots
            </h1>
            <p className="text-white/60 text-sm mt-1">
              Choose a date and one or more 30-minute times. Clients cannot book same-day slots.
            </p>
          </div>
          <Button
            onClick={() => setAddModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add slots
          </Button>
        </div>

        <Card className="bg-black/40 backdrop-blur-sm border border-white/[0.12] rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">My Available Time Slots</CardTitle>
            <Select
              value={slotTypeFilter}
              onValueChange={(v) => setSlotTypeFilter(v as BookingType | 'ALL')}
            >
              <SelectTrigger className="w-[180px] bg-white/5 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All types</SelectItem>
                <SelectItem value="KUNDALI_REVIEW">{SLOT_TYPE_LABEL}</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {isLoading && <div className="py-8 text-center text-white/60">Loading slots...</div>}
            {isError && (
              <div className="py-8 text-center text-red-400">
                {error instanceof Error ? error.message : 'Failed to load slots'}
              </div>
            )}
            {!isLoading && !isError && (totalSlots === 0 || slots.length === 0) && (
              <div className="py-8 text-center text-white/60">
                No slots yet. Click &quot;Add slots&quot; to add time slots.
              </div>
            )}
            {!isLoading && !isError && slots.length > 0 && (
              <>
                <div className="overflow-x-auto rounded-lg border border-white/10">
                  <JyotishDataTable<GroupedSlotRow>
                    columns={slotColumns}
                    data={groupedSlots}
                    getRowId={(row) => `${row.dateKey}|${row.slotType}`}
                  />
                </div>
                {totalSlots > 0 && (
                  <JyotishPagination
                    page={slotsPage}
                    totalPages={totalSlotsPages}
                    onPageChange={setSlotsPage}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <AddSlotsModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onCreateSlots={handleCreateSlots}
        isCreating={createMutation.isPending}
      />

      <Dialog open={!!editingSlot} onOpenChange={(open) => !open && setEditingSlot(null)}>
        <DialogContent className="bg-slate-900/95 border-white/20 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Edit slot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/70 mb-1 block">Date</label>
              <DateInput
                min={getMinSlotDate()}
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full bg-white/5 border-white/20 text-white"
              />
            </div>
            <div>
              <label className="text-xs text-white/70 mb-1 block">Time (30 min)</label>
              <TimeRangeSelect
                options={TIME_RANGE_OPTIONS}
                value={editTimeStart}
                onValueChange={setEditTimeStart}
                placeholder="Select time"
                className="w-full bg-white/5 border-white/20 text-white"
              />
            </div>
            <LoadingButton
              onClick={handleSaveEdit}
              isLoading={updateMutation.isPending}
              loadingText="Saving..."
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              Save
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteSlotConfirmDialog
        slot={slotToDelete}
        open={!!slotToDelete}
        onOpenChange={(open) => !open && setSlotToDelete(null)}
        onConfirm={(id) => deleteMutation.mutate(id)}
        isDeleting={deleteMutation.isPending}
      />
    </JyotishLayout>
  );
}
