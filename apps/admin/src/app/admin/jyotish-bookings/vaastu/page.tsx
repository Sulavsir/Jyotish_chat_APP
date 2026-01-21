'use client';

import { useMemo, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { ADMIN_QUERY_KEYS } from '@/constants';
import { adminApi } from '@/lib/admin-api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Search,
  Textarea,
  LoadingButton,
} from '@jyotish/ui';
import { JyotishBookingStatus, JyotishBookingType } from '@jyotish/shared';
import { AdminTable, type AdminTableColumn } from '@/components/admin';
import { formatAdminDate } from '@/utils/helpers';

type ActionState =
  | { open: false }
  | {
      open: true;
      id: string;
      status: JyotishBookingStatus.APPROVED | JyotishBookingStatus.REJECTED;
    };

function statusBadge(status: JyotishBookingStatus) {
  if (status === JyotishBookingStatus.APPROVED) {
    return <Badge className="bg-green-500/15 text-green-300 border border-green-500/30">Approved</Badge>;
  }
  if (status === JyotishBookingStatus.REJECTED) {
    return <Badge className="bg-red-500/15 text-red-300 border border-red-500/30">Rejected</Badge>;
  }
  return <Badge className="bg-yellow-500/15 text-yellow-200 border border-yellow-500/30">Pending</Badge>;
}

export default function VaastuBookingsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [action, setAction] = useState<ActionState>({ open: false });
  const [adminNotes, setAdminNotes] = useState('');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.JYOTISH_BOOKINGS.LIST({ type: JyotishBookingType.VAASTU }),
    queryFn: () => adminApi.jyotishBookings.list({ type: JyotishBookingType.VAASTU }),
  });

  const bookings = data?.bookings ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter((b) => {
      const hay =
        `${b.category} ${b.details ?? ''} ${b.adminNotes ?? ''} ${b.client?.phone ?? ''} ${b.client?.name ?? ''} ${
          b.client?.email ?? ''
        }`.toLowerCase();
      return hay.includes(q);
    });
  }, [bookings, search]);

  const updateStatusMutation = useMutation({
    mutationFn: (input: { id: string; status: JyotishBookingStatus.APPROVED | JyotishBookingStatus.REJECTED; adminNotes?: string }) =>
      adminApi.jyotishBookings.updateStatus(input.id, { status: input.status, adminNotes: input.adminNotes }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.JYOTISH_BOOKINGS.LIST({ type: JyotishBookingType.VAASTU }) });
      toast.success('Updated successfully');
      setAction({ open: false });
      setAdminNotes('');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to update'),
  });

  const columns: AdminTableColumn<(typeof filtered)[number]>[] = [
    {
      header: 'Date',
      accessor: (b) => (
        <span className="text-slate-200">{formatAdminDate(b.bookingDate)}</span>
      ),
      width: '140px',
    },
    {
      header: 'Booking reason',
      accessor: (b) => (
        <div className="space-y-1 min-w-0">
          <div className="font-medium text-white truncate" title={b.category}>
            {b.category}
          </div>
        </div>
      ),
    },
    {
      header: 'Remarks (Optional)',
      accessor: (b) =>
        b.details ? (
          <span className="text-slate-200 truncate block max-w-[280px]" title={b.details}>
            {b.details}
          </span>
        ) : (
          <span className="text-slate-500">—</span>
        ),
      width: '320px',
    },
    {
      header: 'Client',
      accessor: (b) => (
        <div className="space-y-1 min-w-0">
          <div className="text-white truncate" title={b.client?.name ?? b.client?.phone ?? ''}>
            {b.client?.name ?? 'Unknown client'}
          </div>
          <div className="text-sm text-slate-400 truncate" title={b.client?.phone ?? ''}>
            {b.client?.phone ?? '—'}
          </div>
          {b.client?.email ? (
            <div className="text-sm text-slate-500 truncate" title={b.client.email}>
              {b.client.email}
            </div>
          ) : null}
        </div>
      ),
      width: '260px',
    },
    {
      header: 'Status',
      accessor: (b) => statusBadge(b.status),
      width: '140px',
    },
    {
      header: 'Actions',
      accessor: (b) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            className="border-slate-700"
            disabled={b.status !== JyotishBookingStatus.PENDING}
            onClick={() => {
              setAdminNotes('');
              setAction({ open: true, id: b.id, status: JyotishBookingStatus.APPROVED });
            }}
          >
            Approve
          </Button>
          <Button
            variant="outline"
            className="border-red-500/40 text-red-300 hover:bg-red-500/10 hover:text-red-200"
            disabled={b.status !== JyotishBookingStatus.PENDING}
            onClick={() => {
              setAdminNotes('');
              setAction({ open: true, id: b.id, status: JyotishBookingStatus.REJECTED });
            }}
          >
            Reject
          </Button>
        </div>
      ),
      className: 'text-right',
      width: '260px',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Book Vaastu Shastri Requests</h1>
            <p className="text-slate-400">Approve or reject Vaastu Shastri booking requests</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
              className="border-slate-700"
            >
              Refresh
            </Button>
          </div>
        </div>

        <Search
          placeholder="Search by category, details, client name, or phone..."
          value={search}
          onSearch={setSearch}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="cosmic-card rounded-xl overflow-hidden">
          <AdminTable
            data={filtered}
            loading={isLoading}
            keyExtractor={(b) => b.id}
            columns={columns}
            showSerialNumber
            emptyState={{
              icon: (
                <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 7h8m-8 4h8m-8 4h6M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z"
                  />
                </svg>
              ),
              title: 'No Vaastu booking requests',
              description: 'Requests submitted by clients will appear here.',
            }}
          />
        </div>

        <Dialog
          open={action.open}
          onOpenChange={(open) => {
            if (!open) setAction({ open: false });
          }}
        >
          <DialogContent className="bg-slate-900 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">
                {action.open && action.status === JyotishBookingStatus.APPROVED ? 'Approve request' : 'Reject request'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-2">
              <Label className="text-white">Admin notes (optional)</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                placeholder="Any notes for this decision..."
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" className="border-slate-700" onClick={() => setAction({ open: false })}>
                Cancel
              </Button>
              <LoadingButton
                className="bg-gradient-to-r from-cosmic-purple to-nebula-pink hover:opacity-90"
                disabled={!action.open}
                loading={updateStatusMutation.isPending}
                loadingText="Saving..."
                onClick={() => {
                  if (!action.open) return;
                  updateStatusMutation.mutate({
                    id: action.id,
                    status: action.status,
                    adminNotes: adminNotes.trim() ? adminNotes.trim() : undefined,
                  });
                }}
              >
                Confirm
              </LoadingButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

