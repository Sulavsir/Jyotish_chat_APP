'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { ADMIN_QUERY_KEYS, PAGINATION_DEFAULTS } from '@/constants';
import { useDebounce } from '@/hooks';
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@jyotish/ui';
import { JyotishBookingStatus, JyotishBookingType } from '@jyotish/shared';
import { AdminTable, type AdminTableColumn, BookingStatusFilter, type BookingStatusFilterValue } from '@/components/admin';
import { formatAdminDate } from '@/utils/helpers';
import { generatePageNumbers } from '@/utils/helpers';
import { RefreshCw } from 'lucide-react';

const ITEMS_PER_PAGE = PAGINATION_DEFAULTS.LIMIT;

interface JyotishBookingsResponse {
  bookings: Array<
    import('@jyotish/shared').JyotishBookingRequest & {
      client: {
        id: string;
        phone: string;
        name: string | null;
        email: string | null;
        profilePhoto: string | null;
      };
      preferredAstrologer?: {
        id: string;
        name: string;
        category: import('@jyotish/shared').AstrologerCategory;
        specialization: string[];
        profilePhoto: string | null;
      } | null;
    }
  >;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

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
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<BookingStatusFilterValue>('ALL');
  const [action, setAction] = useState<ActionState>({ open: false });
  const [adminNotes, setAdminNotes] = useState('');

  const {
    data: bookingsResponse,
    isLoading,
    refetch,
    isFetching,
  } = useQuery<JyotishBookingsResponse>({
    queryKey: [
      ...ADMIN_QUERY_KEYS.JYOTISH_BOOKINGS.LIST({ type: JyotishBookingType.VAASTU }),
      currentPage,
      debouncedSearch,
      statusFilter,
    ],
    queryFn: () =>
      adminApi.jyotishBookings.list({
        type: JyotishBookingType.VAASTU,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }),
  });

  const bookings = bookingsResponse?.bookings ?? [];
  const pagination = bookingsResponse?.pagination || {
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
  };

  // Reset to page 1 when search term or status filter changes
  useEffect(() => {
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  }, [debouncedSearch, statusFilter]);

  const updateStatusMutation = useMutation({
    mutationFn: (input: {
      id: string;
      status: JyotishBookingStatus.APPROVED | JyotishBookingStatus.REJECTED;
      adminNotes?: string;
    }) =>
      adminApi.jyotishBookings.updateStatus(input.id, {
        status: input.status,
        adminNotes: input.adminNotes,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ADMIN_QUERY_KEYS.JYOTISH_BOOKINGS.LIST({ type: JyotishBookingType.VAASTU }),
      });
      toast.success('Updated successfully');
      setAction({ open: false });
      setAdminNotes('');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to update'),
  });

  const columns: AdminTableColumn<(typeof bookings)[number]>[] = [
    {
      header: 'Booking Date',
      accessor: (b) => (
        <span className="text-slate-200">{formatAdminDate(b.bookingDate)}</span>
      ),
      width: '140px',
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
      header: 'Location',
      accessor: (b) =>
        b.location ? (
          <span className="text-slate-200 truncate block max-w-[200px]" title={b.location}>
            {b.location}
          </span>
        ) : (
          <span className="text-slate-500">—</span>
        ),
      width: '200px',
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
          <div className="flex items-center gap-3">
            <BookingStatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
              disabled={isLoading}
            />
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
              size="sm"
              className="border-slate-700 text-white hover:bg-slate-800"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <Search
          placeholder="Search by category, details, client name, or phone..."
          value={searchTerm}
          onSearch={setSearchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="cosmic-card rounded-xl overflow-hidden">
          <AdminTable
            data={bookings}
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
              title: debouncedSearch ? 'No Vaastu booking requests found' : 'No Vaastu booking requests',
              description: debouncedSearch
                ? 'Try adjusting your search terms'
                : 'Requests submitted by clients will appear here.',
            }}
          />
        </div>

        {/* Pagination */}
        {!isLoading && pagination.totalPages > 0 && (
          <div className="rounded-xl p-4">
            <div className="flex flex-col gap-2 items-center justify-between">
              <div className="text-sm text-white font-medium">
                Showing <span className="text-purple-400">
                  {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
                </span> to{' '}
                <span className="text-purple-400">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span> of{' '}
                <span className="text-purple-400">{pagination.total}</span> entries
              </div>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    />
                  </PaginationItem>

                  {generatePageNumbers(
                    currentPage,
                    pagination.totalPages,
                    PAGINATION_DEFAULTS.MAX_VISIBLE_PAGES
                  ).map((page, index) => (
                    <PaginationItem key={index}>
                      {typeof page === 'number' ? (
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      ) : (
                        <PaginationEllipsis />
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                      disabled={currentPage === pagination.totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}

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

