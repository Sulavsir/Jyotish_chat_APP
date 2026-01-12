'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import { Button } from '@jyotish/ui';
import { AdminTable, type AdminTableColumn } from '@/components/admin';
import { ADMIN_QUERY_KEYS } from '@/constants';
import {
  CalendarDays,
  RefreshCw,
  Clock,
  User,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface Appointment {
  id: string;
  scheduledAt: string;
  duration: number;
  status: string;
  amount: number;
  notes: string | null;
  createdAt: string;
  client: {
    id: string;
    name: string | null;
    phone: string;
    email: string | null;
  };
  astrologer: {
    id: string;
    name: string;
    phone: string;
    category: string;
    appointmentFee: number | null;
  };
}

const STATUS_COLORS = {
  PENDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  CONFIRMED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  IN_PROGRESS: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  COMPLETED: 'bg-green-500/10 text-green-500 border-green-500/20',
  CANCELLED: 'bg-red-500/10 text-red-500 border-red-500/20',
  NO_SHOW: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const STATUS_ICONS = {
  PENDING: AlertCircle,
  CONFIRMED: CheckCircle2,
  IN_PROGRESS: Clock,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
  NO_SHOW: XCircle,
};

export default function AppointmentsPage() {
  // Fetch appointments with TanStack Query - auto-refresh every 30 seconds
  const {
    data: appointments = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Appointment[]>({
    queryKey: ADMIN_QUERY_KEYS.APPOINTMENTS.LIST(),
    queryFn: async () => {
      const response = await adminApi.appointments.list();
      return response.data || [];
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

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

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'PREMIUM':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'PROFESSIONAL':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  // Calculate stats using useMemo
  const stats = useMemo(() => {
    return {
      total: appointments.length,
      pending: appointments.filter((a) => a.status === 'PENDING').length,
      confirmed: appointments.filter((a) => a.status === 'CONFIRMED').length,
      completed: appointments.filter((a) => a.status === 'COMPLETED').length,
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
          <DollarSign className="w-4 h-4" />
          Rs. {appointment.amount}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (appointment) => {
        const StatusIcon =
          STATUS_ICONS[appointment.status as keyof typeof STATUS_ICONS] || AlertCircle;
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[appointment.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.PENDING}`}
          >
            <StatusIcon className="w-3 h-3" />
            {appointment.status}
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
      </div>
    </AdminLayout>
  );
}
