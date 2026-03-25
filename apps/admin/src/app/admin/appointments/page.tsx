'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import {
  Badge,
  Button,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  LoadingButton,
  Label,
  Textarea,
} from '@jyotish/ui';
import { AdminTable, type AdminTableColumn, AppointmentStatusFilter, type AppointmentFilterValue } from '@/components/admin';
import { ADMIN_QUERY_KEYS, PAGINATION_DEFAULTS } from '@/constants';
import {
  CalendarDays,
  RefreshCw,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Ban,
} from 'lucide-react';
import type {
  Appointment,
  ListAppointmentsResponse,
  AppointmentsPagination,
  CancelAppointmentPayload,
} from '@/types/appointment.types';
import { AstrologerCategory, AppointmentStatus } from '@/types/appointment.types';
import {
  APPOINTMENT_STATUS,
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_ICONS,
  ASTROLOGER_CATEGORY_COLORS,
  BOOKING_TYPE_LABELS,
  BOOKING_TYPE_BADGE_CLASS,
} from '@/constants/appointment.constants';
import { generatePageNumbers } from '@/utils/helpers';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = PAGINATION_DEFAULTS.LIMIT;

const DEFAULT_PAGINATION: AppointmentsPagination = {
  page: PAGINATION_DEFAULTS.PAGE,
  limit: PAGINATION_DEFAULTS.LIMIT,
  total: 0,
  totalPages: 0,
};

const CANCELLABLE_STATUSES: AppointmentStatus[] = [
  APPOINTMENT_STATUS.PENDING,
  APPOINTMENT_STATUS.CONFIRMED,
];

export default function AppointmentsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<AppointmentFilterValue>('ALL');
  const [cancelModalAppointment, setCancelModalAppointment] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const queryClient = useQueryClient();

  // Reset to page 1 when status filter changes
  useEffect(() => {
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  }, [statusFilter]);

  // Fetch appointments with TanStack Query (server-side pagination)
  const {
    data: appointmentsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery<ListAppointmentsResponse>({
    queryKey: [...ADMIN_QUERY_KEYS.APPOINTMENTS.LIST(), currentPage, statusFilter],
    queryFn: () =>
      adminApi.appointments.list({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }),
    refetchInterval: 20000,
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, cancellationNote }: { id: string } & CancelAppointmentPayload) =>
      adminApi.appointments.cancel(id, { cancellationNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.APPOINTMENTS.ALL });
      setCancelModalAppointment(null);
      setCancelReason('');
      toast.success('Appointment cancelled successfully.');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to cancel appointment'),
  });

  const appointments = appointmentsResponse?.appointments ?? [];
  const pagination = appointmentsResponse?.pagination ?? DEFAULT_PAGINATION;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryBadgeColor = (category: AstrologerCategory): string => {
    return (
      ASTROLOGER_CATEGORY_COLORS[category] ||
      ASTROLOGER_CATEGORY_COLORS[AstrologerCategory.ORDINARY]
    );
  };

  // Calculate stats using useMemo
  const stats = useMemo(() => {
    return {
      total: appointments.length,
      pending: appointments.filter((a) => a.status === APPOINTMENT_STATUS.PENDING).length,
      confirmed: appointments.filter((a) => a.status === APPOINTMENT_STATUS.CONFIRMED).length,
      completed: appointments.filter((a) => a.status === APPOINTMENT_STATUS.COMPLETED).length,
    };
  }, [appointments]);

  const columns: AdminTableColumn<Appointment>[] = [
    {
      header: 'Scheduled',
      accessor: (appointment) => (
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-purple-400" />
          <div>
            <div className="text-sm font-medium text-white">
              {formatDate(appointment.scheduledAt)}
            </div>
            <div className="text-xs text-slate-400">{formatTime(appointment.scheduledAt)}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Client',
      accessor: (appointment) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-blue-400" />
          <div>
            <div className="text-sm font-medium text-white">{appointment.client.name || 'N/A'}</div>
            <div className="text-xs text-slate-400">{appointment.client.phone}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Astrologer',
      accessor: (appointment) => (
        <div>
          <div className="text-sm font-medium text-white mb-1 flex flex-col gap-1.5">
            {appointment.astrologer.name}
            {appointment.bookingType && (
              <Badge
                className={`w-fit shrink-0 ${BOOKING_TYPE_BADGE_CLASS[appointment.bookingType]}`}
              >
                {BOOKING_TYPE_LABELS[appointment.bookingType]}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getCategoryBadgeColor(appointment.astrologer.category)}`}
            >
              {appointment.astrologer.category}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Duration',
      accessor: (appointment) => (
        <div className="flex items-center gap-1 text-sm text-slate-300">
          <Clock className="w-4 h-4" />
          {appointment.duration} min
        </div>
      ),
    },
    {
      header: 'Commission (NRs)',
      accessor: (appointment) => {
        const rate = appointment.astrologer?.kundaliReviewCommissionPercent ?? 0;
        const commissionedAmount = Math.ceil((appointment.amount * rate) / 100);
        return (
          <div className="flex items-center gap-1.5 text-sm font-medium text-amber-400">
            <span>NRs {commissionedAmount.toLocaleString()}</span>
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessor: (appointment) => {
        const StatusIcon = APPOINTMENT_STATUS_ICONS[appointment.status];
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${APPOINTMENT_STATUS_COLORS[appointment.status]}`}
          >
            <StatusIcon className="w-3 h-3" />
            {appointment.status.replace('_', ' ')}
          </span>
        );
      },
    },
    {
      header: 'Booked',
      accessor: (appointment) => (
        <span className="text-sm text-slate-400">{formatDate(appointment.createdAt)}</span>
      ),
    },
    {
      header: 'Actions',
      accessor: (appointment) =>
        CANCELLABLE_STATUSES.includes(appointment.status) ? (
          <Button
            variant="outline"
            size="sm"
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            onClick={() => setCancelModalAppointment(appointment)}
          >
            <Ban className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        ) : (
          <span className="text-slate-500 text-sm">—</span>
        ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">Appointment Audits</h2>
            <p className="text-slate-400 mt-1">Real-time monitoring of all appointment bookings</p>
          </div>
          <div className="flex items-center gap-2">
            <AppointmentStatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
              disabled={isLoading}
            />
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="border-slate-700 text-white hover:bg-slate-800"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="cosmic-card rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <CalendarDays className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <div className="cosmic-card rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          <div className="cosmic-card rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Confirmed</p>
                <p className="text-2xl font-bold text-blue-400">{stats.confirmed}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="cosmic-card rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Completed</p>
                <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="cosmic-card rounded-xl overflow-hidden">
          {error ? (
            <div className="p-8 text-center">
              <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 mb-4">
                {error instanceof Error ? error.message : 'Failed to load appointments'}
              </p>
              <Button onClick={() => refetch()} variant="outline">
                Try Again
              </Button>
            </div>
          ) : (
            <AdminTable
              data={appointments}
              columns={columns}
              loading={isLoading}
              keyExtractor={(appointment) => appointment.id}
              emptyState={{
                icon: <CalendarDays className="w-12 h-12 text-slate-600" />,
                title: 'No appointments yet',
                description: 'Appointment bookings will appear here',
              }}
            />
          )}
        </div>

        {/* Cancel appointment modal */}
        <Dialog
          open={!!cancelModalAppointment}
          onOpenChange={(open) => {
            if (!open) {
              setCancelModalAppointment(null);
              setCancelReason('');
            }
          }}
        >
          <DialogContent className="bg-slate-900 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Cancel appointment</DialogTitle>
              <DialogDescription className="text-slate-400">
                {cancelModalAppointment && (
                  <>
                    Cancel appointment for{' '}
                    <span className="font-medium text-white">
                      {cancelModalAppointment.client.name || cancelModalAppointment.client.phone}
                    </span>{' '}
                    on {formatDate(cancelModalAppointment.scheduledAt)}? You can add a reason below
                    (visible to the client).
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="cancel-reason" className="text-slate-300">
                Cancellation reason (optional)
              </Label>
              <Textarea
                id="cancel-reason"
                placeholder="e.g. Astrologer unavailable"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                maxLength={500}
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                rows={3}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setCancelModalAppointment(null);
                  setCancelReason('');
                }}
                className="border-slate-600 text-slate-300"
              >
                Keep
              </Button>
              <LoadingButton
                loading={cancelMutation.isPending}
                variant="outline"
                color="danger"
                onClick={() => {
                  if (cancelModalAppointment) {
                    cancelMutation.mutate({
                      id: cancelModalAppointment.id,
                      cancellationNote: cancelReason.trim() || undefined,
                    });
                  }
                }}
              >
                Cancel appointment
              </LoadingButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Pagination - same pattern as audit-logs */}
        {!isLoading && !error && pagination.total > 0 && (
          <div className="rounded-xl p-4">
            <div className="flex flex-col gap-2 items-center justify-between">
              <div className="text-sm text-white font-medium">
                Showing{' '}
                <span className="text-purple-400">
                  {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
                </span>{' '}
                to{' '}
                <span className="text-purple-400">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="text-purple-400">{pagination.total}</span> entries
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
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))
                      }
                      disabled={currentPage === pagination.totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
