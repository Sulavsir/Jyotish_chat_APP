'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  LoadingButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@jyotish/ui';
import { ListOrdered, PencilIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { ADMIN_QUERY_KEYS } from '@/constants/query-keys.constants';
import { AdminTable, type AdminTableColumn } from '@/components/admin';
import {
  adminApi,
  type AdminBroadcastAssigneePriority,
  type AdminEligibleBroadcastPriorityAstrologer,
} from '@/lib/admin-api';

export type BroadcastAssigneePriorityPanelProps = {
  assigneePriorities: AdminBroadcastAssigneePriority[];
  eligibleAstrologers: AdminEligibleBroadcastPriorityAstrologer[];
};

export function BroadcastAssigneePriorityPanel({
  assigneePriorities,
  eligibleAstrologers,
}: BroadcastAssigneePriorityPanelProps) {
  const queryClient = useQueryClient();
  const [newAstrologerId, setNewAstrologerId] = useState<string>('');
  const [newPriority, setNewPriority] = useState<string>('1');
  const [editing, setEditing] = useState<AdminBroadcastAssigneePriority | null>(null);
  const [editPriority, setEditPriority] = useState<string>('');
  const [editAstrologerId, setEditAstrologerId] = useState<string>('');

  const usedIds = useMemo(
    () => new Set(assigneePriorities.map((p) => p.astrologerId)),
    [assigneePriorities]
  );

  const addOptions = useMemo(
    () => eligibleAstrologers.filter((a) => !usedIds.has(a.id)),
    [eligibleAstrologers, usedIds]
  );

  const sortedRows = useMemo(
    () =>
      [...assigneePriorities].sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id)),
    [assigneePriorities]
  );

  const createMut = useMutation({
    mutationFn: () =>
      adminApi.broadcastSettings.createAssigneePriority({
        astrologerId: newAstrologerId,
        priority: Number(newPriority),
      }),
    onSuccess: () => {
      toast.success('Priority entry added');
      setNewAstrologerId('');
      setNewPriority('1');
      void queryClient.invalidateQueries({
        queryKey: ADMIN_QUERY_KEYS.BROADCAST_SETTINGS.DETAIL(),
      });
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to add'),
  });

  const updateMut = useMutation({
    mutationFn: async () => {
      if (!editing) throw new Error('No row');
      const payload: { astrologerId?: string; priority?: number } = {};
      const pr = Number(editPriority);
      if (editPriority !== '' && !Number.isNaN(pr)) payload.priority = pr;
      if (editAstrologerId !== editing.astrologerId) payload.astrologerId = editAstrologerId;
      if (Object.keys(payload).length === 0) {
        throw new Error('Change priority or jyotish to update');
      }
      return adminApi.broadcastSettings.updateAssigneePriority(editing.id, payload);
    },
    onSuccess: () => {
      toast.success('Updated');
      setEditing(null);
      void queryClient.invalidateQueries({
        queryKey: ADMIN_QUERY_KEYS.BROADCAST_SETTINGS.DETAIL(),
      });
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to update'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.broadcastSettings.deleteAssigneePriority(id),
    onSuccess: () => {
      toast.success('Removed');
      void queryClient.invalidateQueries({
        queryKey: ADMIN_QUERY_KEYS.BROADCAST_SETTINGS.DETAIL(),
      });
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to delete'),
  });

  const openEditRow = useCallback((row: AdminBroadcastAssigneePriority) => {
    setEditing(row);
    setEditPriority(String(row.priority));
    setEditAstrologerId(row.astrologerId);
  }, []);

  const columns = useMemo<AdminTableColumn<AdminBroadcastAssigneePriority>[]>(
    () => [
      {
        header: 'Order',
        accessor: (row) => (
          <span className="font-mono tabular-nums text-slate-200">{row.priority}</span>
        ),
        className: 'w-[4.5rem]',
      },
      {
        header: 'Jyotish',
        accessor: (row) => (
          <div>
            <div className="font-medium text-white">{row.astrologer.name}</div>
            <div className="text-xs text-slate-500">{row.astrologer.phone ?? '—'}</div>
          </div>
        ),
      },
      {
        header: 'Category',
        accessor: (row) => <span className="text-slate-200">{row.astrologer.category}</span>,
      },
      {
        header: 'Status',
        accessor: (row) => (
          <div className="flex flex-wrap gap-1">
            {row.astrologer.isOnline ? (
              <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-500/30">
                Online
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                Offline
              </Badge>
            )}
            {!row.astrologer.isActive || row.astrologer.isDeleted ? (
              <Badge className="bg-amber-500/20 text-amber-200 border-amber-500/30">Inactive</Badge>
            ) : null}
          </div>
        ),
      },
      {
        header: 'Actions',
        accessor: (row) => (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-slate-600"
              onClick={(e) => {
                e.stopPropagation();
                openEditRow(row);
              }}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-red-500/40 text-red-300 hover:bg-red-500/10"
              disabled={deleteMut.isPending}
              onClick={(e) => {
                e.stopPropagation();
                deleteMut.mutate(row.id);
              }}
            >
              <Trash2Icon className="h-4 w-4" />
            </Button>
          </div>
        ),
        className: 'w-32',
      },
    ],
    [openEditRow, deleteMut]
  );

  const canAdd =
    Boolean(newAstrologerId) && newPriority !== '' && !Number.isNaN(Number(newPriority));

  return (
    <>
      <Card className="cosmic-card rounded-xl border border-slate-700 overflow-hidden">
        <CardHeader className="border-b border-slate-800 space-y-1 px-4 py-3 sm:px-5 sm:py-3">
          <CardTitle className="text-lg font-semibold text-white leading-snug">
            Timer auto-assign priority
          </CardTitle>
          <p className="text-sm text-slate-400 leading-snug">
            When a client&apos;s broadcast timer ends, jyotish are tried in the order below (lower
            order number = earlier).
          </p>
        </CardHeader>
        <CardContent className="px-4 py-3 sm:px-5 sm:py-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_7.5rem_auto] md:items-end">
            <div className="space-y-1.5 min-w-0">
              <Label className="text-slate-200">Add jyotish</Label>
              <Select value={newAstrologerId} onValueChange={setNewAstrologerId}>
                <SelectTrigger className="w-full h-10 bg-slate-950/50 border-slate-700">
                  <SelectValue
                    placeholder={addOptions.length ? 'Select jyotish' : 'All listed already'}
                  />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[min(50dvh,20rem)]">
                  {addOptions.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} ({a.category}){a.isOnline ? ' · online' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 w-full md:w-auto">
              <Label className="text-slate-200">Priority Order</Label>
              <Input
                type="number"
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="bg-slate-950/50 border-slate-700 md:h-10"
              />
            </div>
            <LoadingButton
              className="w-full md:w-auto shrink-0 h-10"
              loading={createMut.isPending}
              disabled={!canAdd || addOptions.length === 0}
              onClick={() => createMut.mutate()}
            >
              Add to list
            </LoadingButton>
          </div>

          <div className="rounded-lg border border-slate-800 overflow-hidden">
            <AdminTable
              data={sortedRows}
              columns={columns}
              keyExtractor={(row) => row.id}
              showSerialNumber={false}
              emptyState={{
                icon: <ListOrdered className="h-10 w-10 text-slate-500" aria-hidden />,
                title: 'No priority rows yet',
                description:
                  'When empty, timer auto-assign still tries all eligible jyotish alphabetically after expiry. Adding someone at an order that already exists shifts the rest down.',
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="bg-slate-950 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle>Edit priority</DialogTitle>
          </DialogHeader>
          {editing ? (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Jyotish</Label>
                <Select value={editAstrologerId} onValueChange={setEditAstrologerId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-[min(50dvh,20rem)]">
                    {eligibleAstrologers.map((a) => {
                      const takenByOther = usedIds.has(a.id) && a.id !== editing.astrologerId;
                      if (takenByOther) return null;
                      return (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name} ({a.category})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority Order</Label>
                <Input
                  type="number"
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <LoadingButton
              loading={updateMut.isPending}
              disabled={!editing || editPriority === '' || Number.isNaN(Number(editPriority))}
              onClick={() => updateMut.mutate()}
            >
              Save
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
