/**
 * Jyotish Appointments Page - For Professional and Premium astrologers only
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { JyotishLayout } from '@/components/layouts/JyotishLayout';
import { useRequireAuth } from '@/hooks';
import { USER_ROLES } from '@/constants';
import { AstrologerCategory } from '@jyotish/shared';
import { QUERY_KEYS } from '@/constants/query-keys.constants';
import { LoadingScreenWithBackground } from '@/components/ui';
import { listMine as listMyAppointments } from '@/services/appointment.service';
import type { Appointment } from '@/types/appointment.types';
import { AppointmentStatus } from '@/types/appointment.types';
import { Button, Skeleton } from '@jyotish/ui';
import {
  JyotishDataTable,
  JyotishPagination,
  type JyotishDataTableColumn,
} from '@/components/jyotish/JyotishTable';
import { getAstrologerPermissionsFromUser } from '@/lib/auth';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Coins,
} from 'lucide-react';

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  [AppointmentStatus.CONFIRMED]: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  [AppointmentStatus.IN_PROGRESS]: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  [AppointmentStatus.COMPLETED]: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  [AppointmentStatus.CANCELLED]: 'bg-red-500/20 text-red-400 border-red-500/30',
  [AppointmentStatus.NO_SHOW]: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const STATUS_ICONS: Record<AppointmentStatus, typeof AlertCircle> = {
  [AppointmentStatus.PENDING]: AlertCircle,
  [AppointmentStatus.CONFIRMED]: CheckCircle2,
  [AppointmentStatus.IN_PROGRESS]: Clock,
  [AppointmentStatus.COMPLETED]: CheckCircle2,
  [AppointmentStatus.CANCELLED]: XCircle,
  [AppointmentStatus.NO_SHOW]: XCircle,
};

const APPOINTMENTS_PER_PAGE = 10;

export default function JyotishAppointmentsPage() {
  const { user, isCheckingAccess } = useRequireAuth({
    requiredRole: USER_ROLES.ASTROLOGER,
  });
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [tablePage, setTablePage] = useState(0);

  // Permissions from /me stored in Zustand (works in production; no cookie dependency)
  const { canAccessAppointments: hasAppointmentAccess, category: astrologerCategory } =
    getAstrologerPermissionsFromUser(user);

  // fetch appointments (paginated from backend)
  const {
    data: appointmentsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.APPOINTMENTS.MY_LIST({
      page: tablePage + 1,
      limit: APPOINTMENTS_PER_PAGE,
      status: filterStatus || undefined,
    }),
    queryFn: () =>
      listMyAppointments({
        page: tablePage + 1,
        limit: APPOINTMENTS_PER_PAGE,
        status: filterStatus || undefined,
      }),
    enabled: hasAppointmentAccess,
  });

  const appointments = appointmentsData?.appointments ?? [];
  const pagination = appointmentsData?.pagination;
  const totalAppointments = pagination?.total ?? 0;
  const totalAppointmentPages = Math.max(1, pagination?.totalPages ?? 1);

  useEffect(() => {
    setTablePage(0);
  }, [filterStatus]);

  // Jyotish does not confirm or cancel appointments; status flows: CONFIRMED -> IN_PROGRESS (when time arrives) -> COMPLETED (when time ends). Chat available only when IN_PROGRESS.
  // confirmMutation / cancelMutation / CancelAppointmentModal commented out per product requirement.

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

  const appointmentColumns: JyotishDataTableColumn<Appointment>[] = useMemo(
    () => [
      {
        id: 'sn',
        header: 'S.N.',
        cellClassName: 'whitespace-nowrap text-white/70',
        cell: (_row, index) => tablePage * APPOINTMENTS_PER_PAGE + (index ?? 0) + 1,
      },
      {
        id: 'bookingDate',
        header: 'Booking Date',
        cell: (row) => formatDate(row.createdAt),
        cellClassName: 'whitespace-nowrap',
      },
      {
        id: 'client',
        header: 'Client',
        cell: (row) => (
          <div>
            <p className="font-medium text-white">{row.client.name || 'Client'}</p>
            <p className="text-xs text-white/60">{row.client.phone}</p>
            {row.bookingType && (
              <span
                className={`mt-1 inline-block text-xs px-1.5 py-0.5 rounded font-medium ${
                  row.bookingType === 'KUNDALI_REVIEW'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                }`}
              >
                {row.bookingType === 'KUNDALI_REVIEW' ? 'Full Kundali Review' : 'Appointment'}
              </span>
            )}
          </div>
        ),
      },
      {
        id: 'date',
        header: 'Appointment Date',
        cell: (row) => formatDate(row.scheduledAt),
        cellClassName: 'whitespace-nowrap',
      },
      {
        id: 'time',
        header: 'Time',
        cell: (row) => formatTime(row.scheduledAt),
        cellClassName: 'whitespace-nowrap',
      },
      {
        id: 'duration',
        header: 'Duration',
        cell: (row) => `${row.duration}m`,
      },
      {
        id: 'notes',
        header: 'Notes',
        cell: (row) => (
          <span className="max-w-[200px] truncate block text-white/80" title={row.notes ?? ''}>
            {row.notes || '—'}
          </span>
        ),
      },
      {
        id: 'coins',
        header: 'Coins',
        cell: (row) => {
          const rate = row.astrologer?.commissionRate ?? 0;
          const coins = Math.ceil((row.amount * rate) / 100);
          return (
            <span className="inline-flex items-center gap-1.5 font-medium text-amber-400">
              <Coins className="h-4 w-4 shrink-0" />
              {coins}
            </span>
          );
        },
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row) => {
          const StatusIcon = STATUS_ICONS[row.status] || AlertCircle;
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${STATUS_COLORS[row.status]}`}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {row.status.replace('_', ' ')}
            </span>
          );
        },
      },
    ],
    [tablePage]
  );

  // Show loading state while checking access
  if (isCheckingAccess) {
    return <LoadingScreenWithBackground message="Verifying access..." />;
  }

  // Permission check - Only Professional and Premium astrologers
  // If category is loaded but not Professional/Premium, redirect to dashboard
  if (!hasAppointmentAccess) {
    // Instead of showing inline message, redirect to unauthorized page
    if (typeof window !== 'undefined') {
      window.location.href =
        '/unauthorized?reason=appointments&category=' +
        encodeURIComponent(astrologerCategory ?? AstrologerCategory.ORDINARY);
    }
    return <LoadingScreenWithBackground message="Redirecting..." />;
  }

  return (
    <JyotishLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              My Appointments
            </h1>
            <p className="text-slate-400 mt-1">Manage your scheduled consultations</p>
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50 transition-colors"
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards — PENDING and NO_SHOW not shown; status flows CONFIRMED -> IN_PROGRESS -> COMPLETED */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900/20 border border-purple-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total</p>
                <p className="text-2xl font-bold text-white mt-1">{totalAppointments}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-purple-400/50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-slate-900 to-indigo-900/20 border border-indigo-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Confirmed</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {appointments.filter((a) => a.status === AppointmentStatus.CONFIRMED).length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-indigo-400/50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-slate-900 to-purple-900/20 border border-purple-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">In progress</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {appointments.filter((a) => a.status === AppointmentStatus.IN_PROGRESS).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-400/50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-slate-900 to-emerald-900/20 border border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Completed</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {appointments.filter((a) => a.status === AppointmentStatus.COMPLETED).length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-400/50" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-900/10 border border-indigo-500/20 rounded-xl p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={filterStatus === '' ? 'default' : 'ghost'}
              onClick={() => setFilterStatus('')}
              className={
                filterStatus === ''
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0'
                  : 'border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10'
              }
            >
              All
            </Button>
            {(
              [
                AppointmentStatus.CONFIRMED,
                AppointmentStatus.IN_PROGRESS,
                AppointmentStatus.COMPLETED,
                AppointmentStatus.CANCELLED,
              ] as const
            ).map((status) => (
              <Button
                key={status}
                size="sm"
                variant={filterStatus === status ? 'default' : 'ghost'}
                onClick={() => setFilterStatus(status)}
                className={
                  filterStatus === status
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0'
                    : 'border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10'
                }
              >
                {status.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </div>

        {/* Appointments List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-slate-900 to-indigo-900/10 border border-indigo-500/20 rounded-xl p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  {/* Left Section - Client & Details Skeleton */}
                  <div className="flex-1 space-y-4">
                    {/* Client Info Skeleton */}
                    <div className="flex items-start gap-4">
                      <Skeleton className="w-14 h-14 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-40" />
                        <div className="flex gap-4">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </div>
                    </div>

                    {/* Details Grid Skeleton */}
                    <div className="grid sm:grid-cols-3 gap-4">
                      {[1, 2, 3].map((j) => (
                        <div
                          key={j}
                          className="bg-slate-800/30 border border-purple-500/10 rounded-lg p-4 space-y-2"
                        >
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-5 w-full" />
                        </div>
                      ))}
                    </div>

                    {/* Notes Skeleton */}
                    <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-4">
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>

                  {/* Right Section - Status & Actions Skeleton */}
                  <div className="flex flex-col items-end gap-3">
                    <Skeleton className="h-8 w-24 rounded-full" />
                    <Skeleton className="h-9 w-28 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-900 to-indigo-900/10 border border-indigo-500/20 rounded-xl p-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
                <CalendarDays className="h-10 w-10 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Appointments</h3>
              <p className="text-slate-400">
                {filterStatus
                  ? `No ${filterStatus.toLowerCase().replace('_', ' ')} appointments found.`
                  : 'You have no appointments yet. They will appear here once clients book.'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <JyotishDataTable<Appointment>
                columns={appointmentColumns}
                data={appointments}
                getRowId={(row) => row.id}
              />
            </div>
            {totalAppointments > 0 && (
              <JyotishPagination
                page={tablePage}
                totalPages={totalAppointmentPages}
                onPageChange={setTablePage}
              />
            )}
          </>
        )}
      </div>
    </JyotishLayout>
  );
}
