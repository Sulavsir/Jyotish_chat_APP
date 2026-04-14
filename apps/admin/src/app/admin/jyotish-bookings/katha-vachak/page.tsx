'use client';

import { useEffect, useState } from 'react';
import {
  ADMIN_QUERY_KEYS,
  PAGINATION_DEFAULTS,
  ADMIN_ROWS_PER_PAGE_OPTIONS,
  ADMIN_SEARCH_DEBOUNCE_MS,
} from '@/constants';
import { useDebounce, useDebouncedPageSize } from '@/hooks';
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
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@jyotish/ui';
import { JyotishBookingStatus, JyotishBookingType } from '@jyotish/shared';
import {
  AdminTable,
  AdminListPaginationSection,
  AdminRefreshButton,
  type AdminTableColumn,
  BookingStatusFilter,
  type BookingStatusFilterValue,
} from '@/components/admin';
import { formatAdminDate, getImageUrl } from '@/utils/helpers';

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
    return (
      <Badge className="bg-green-500/15 text-green-300 border border-green-500/30">Approved</Badge>
    );
  }
  if (status === JyotishBookingStatus.REJECTED) {
    return <Badge className="bg-red-500/15 text-red-300 border border-red-500/30">Rejected</Badge>;
  }
  return (
    <Badge className="bg-yellow-500/15 text-yellow-200 border border-yellow-500/30">Pending</Badge>
  );
}

export default function KathaVachakBookingsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, ADMIN_SEARCH_DEBOUNCE_MS);
  const [currentPage, setCurrentPage] = useState(1);
  const {
    pageSize: rowsPerPage,
    setPageSize: setRowsPerPage,
    debouncedPageSize: debouncedRowsPerPage,
  } = useDebouncedPageSize(PAGINATION_DEFAULTS.LIMIT);
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
      ...ADMIN_QUERY_KEYS.JYOTISH_BOOKINGS.LIST({ type: JyotishBookingType.KATHA_VACHAK }),
      currentPage,
      debouncedSearch,
      statusFilter,
      debouncedRowsPerPage,
    ],
    queryFn: () =>
      adminApi.jyotishBookings.list({
        type: JyotishBookingType.KATHA_VACHAK,
        page: currentPage,
        limit: debouncedRowsPerPage,
        search: debouncedSearch || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }),
  });

  const handlePageSizeChange = (size: number) => {
    if (size === rowsPerPage) return;
    setRowsPerPage(size);
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  };

  const bookings = bookingsResponse?.bookings ?? [];
  const pagination = bookingsResponse?.pagination || {
    page: 1,
    limit: debouncedRowsPerPage,
    total: 0,
    totalPages: 0,
  };

  // Reset to page 1 when search term, status filter, or rows per page changes
  useEffect(() => {
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  }, [debouncedSearch, statusFilter, debouncedRowsPerPage]);

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
        queryKey: ADMIN_QUERY_KEYS.JYOTISH_BOOKINGS.LIST({ type: JyotishBookingType.KATHA_VACHAK }),
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
      accessor: (b) => <span className="text-slate-200">{formatAdminDate(b.bookingDate)}</span>,
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
      header: 'Selected Jyotish',
      accessor: (b) =>
        b.preferredAstrologer ? (
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={getImageUrl(b.preferredAstrologer.profilePhoto) || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs">
                {(b.preferredAstrologer.name || 'A').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-white truncate" title={b.preferredAstrologer.name}>
              {b.preferredAstrologer.name}
            </span>
          </div>
        ) : (
          <span className="text-slate-500">—</span>
        ),
      width: '200px',
    },
    {
      header: 'Booking reason',
      accessor: (b) => (
        <span className="text-white truncate block max-w-[260px]" title={b.category}>
          {b.category}
        </span>
      ),
      width: '160px',
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
    <>
      <div className="space-y-5 sm:space-y-6">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-3">
            <h1 className="min-w-0 flex-1 pr-1 text-2xl sm:text-3xl font-bold cosmic-text break-words">
              Katha Vachak Requests
            </h1>
            <div className="flex items-center gap-2 shrink-0 self-start">
              <AdminRefreshButton
                onClick={() => refetch()}
                loading={isLoading || isFetching}
                className="shrink-0"
              />
              <div className="hidden sm:block [&_button]:w-auto">
                <BookingStatusFilter
                  value={statusFilter}
                  onChange={setStatusFilter}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
          <p className="text-sm sm:text-base text-slate-400">
            Approve or reject Katha Vachak booking requests
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="sm:hidden w-full [&_button]:w-full">
            <BookingStatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
              disabled={isLoading}
            />
          </div>
          <div className="w-full min-w-0">
            <Search
              containerClassName="w-full"
              placeholder="Search by reason, remarks, client....."
              value={searchTerm}
              onSearch={setSearchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="cosmic-card rounded-xl overflow-hidden">
          <AdminTable
            data={bookings}
            loading={isLoading}
            keyExtractor={(b) => b.id}
            columns={columns}
            showSerialNumber
            emptyState={{
              icon: (
                <svg
                  className="w-12 h-12 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 7h8m-8 4h8m-8 4h6M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z"
                  />
                </svg>
              ),
              title: debouncedSearch
                ? 'No Katha Vachak booking requests found'
                : 'No Katha Vachak booking requests',
              description: debouncedSearch
                ? 'Try adjusting your search terms'
                : 'Requests submitted by clients will appear here.',
            }}
          />
        </div>

        {!isLoading && (
          <AdminListPaginationSection
            pagination={{
              page: pagination.page,
              limit: pagination.limit,
              total: pagination.total,
              totalPages: pagination.totalPages,
            }}
            onPageChange={setCurrentPage}
            pageSize={rowsPerPage}
            pageSizeOptions={ADMIN_ROWS_PER_PAGE_OPTIONS}
            onPageSizeChange={handlePageSizeChange}
            disabled={isFetching}
          />
        )}

        <Dialog
          open={action.open}
          onOpenChange={(open) => {
            if (!open) setAction({ open: false });
          }}
        >
          <DialogContent className="flex max-h-[min(90vh,800px)] w-[calc(100vw-2rem)] flex-col overflow-y-auto bg-slate-900 border-slate-700 text-white sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">
                {action.open && action.status === JyotishBookingStatus.APPROVED
                  ? 'Approve request'
                  : 'Reject request'}
              </DialogTitle>
            </DialogHeader>

            <div className="min-w-0 space-y-2">
              <Label className="text-white">Admin notes (optional)</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Write a note for the client..."
                rows={4}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setAction({ open: false })}
                className="w-full border-slate-700 sm:w-auto"
              >
                Cancel
              </Button>
              <LoadingButton
                onClick={() => {
                  if (!action.open) return;
                  updateStatusMutation.mutate({
                    id: action.id,
                    status: action.status,
                    adminNotes: adminNotes.trim() || undefined,
                  });
                }}
                loading={updateStatusMutation.isPending}
                loadingText="Saving..."
                className="w-full bg-gradient-to-r from-cosmic-purple to-nebula-pink hover:opacity-90 sm:w-auto"
              >
                Confirm
              </LoadingButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
