'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import {
  Button,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@jyotish/ui';
import { AdminTable, type AdminTableColumn } from '@/components/admin';
import { ADMIN_QUERY_KEYS, PAGINATION_DEFAULTS } from '@/constants';
import {
  CalendarDays,
  RefreshCw,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import type { Appointment } from '@/types/appointment.types';
import { AstrologerCategory } from '@/types/appointment.types';
import {
  APPOINTMENT_STATUS,
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_ICONS,
  ASTROLOGER_CATEGORY_COLORS,
} from '@/constants/appointment.constants';
import { generatePageNumbers } from '@/utils/helpers';

const ITEMS_PER_PAGE = PAGINATION_DEFAULTS.LIMIT;

interface AppointmentsResponse {
  appointments: Appointment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AppointmentsPage() {
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch appointments with TanStack Query (server-side pagination)
  const {
    data: appointmentsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery<AppointmentsResponse>({
    queryKey: ['admin', 'appointments', 'list', currentPage],
    queryFn: async () => {
      const response: any = await adminApi.appointments.list({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      });
      // Handle both response formats
      if (response?.appointments && response?.pagination) {
        return response;
      } else if (Array.isArray(response)) {
        // Fallback for old format
        return {
          appointments: response,
          pagination: {
            page: 1,
            limit: ITEMS_PER_PAGE,
            total: response.length,
            totalPages: 1,
          },
        };
      }
      return {
        appointments: [],
        pagination: { page: 1, limit: ITEMS_PER_PAGE, total: 0, totalPages: 0 },
      };
    },
    refetchInterval: 20000,
  });

  const appointments = appointmentsResponse?.appointments || [];
  const pagination = appointmentsResponse?.pagination || {
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
  };

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
          <div className="text-sm font-medium text-white mb-1">{appointment.astrologer.name}</div>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getCategoryBadgeColor(appointment.astrologer.category)}`}
          >
            {appointment.astrologer.category}
          </span>
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
      header: 'Amount',
      accessor: (appointment) => (
        <div className="flex items-center gap-1 text-sm font-medium text-green-400">
          Rs. {appointment.amount}
        </div>
      ),
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

        {/* Pagination */}
        {!isLoading && !error && pagination.totalPages > 0 && (
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
      </div>
    </AdminLayout>
  );
}
