/**
 * Jyotish Appointments Page - For Professional and Premium astrologers only
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { JyotishLayout } from '@/components/layouts/JyotishLayout';
import { useRequireAuth } from '@/hooks';
import { USER_ROLES } from '@/constants';
import { QUERY_KEYS } from '@/constants/query-keys.constants';
import { LoadingScreenWithBackground, LoadingButton } from '@/components/ui';
import appointmentService from '@/services/appointment.service';
import type { Appointment } from '@/types/appointment.types';
import { AppointmentStatus } from '@/types/appointment.types';
import { Button, Skeleton, Card, CardContent, CardHeader, CardTitle } from '@jyotish/ui';
import { getAstrologerCategoryFromToken } from '@/lib/jwt-utils';
import { showErrorToast, showSuccessToast, getSuccessMessage } from '@/lib/error-handler';
import {
  CalendarDays,
  Clock,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Phone,
  Mail,
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

export default function JyotishAppointmentsPage() {
  const { user, isCheckingAccess } = useRequireAuth({
    requiredRole: USER_ROLES.ASTROLOGER,
  });
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Get category from JWT token (not from state)
  const astrologerCategory = getAstrologerCategoryFromToken();
  const hasAppointmentAccess =
    astrologerCategory === 'PROFESSIONAL' || astrologerCategory === 'PREMIUM';

  // fetch appointments
  const {
    data: appointments = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.APPOINTMENTS.LIST({ status: filterStatus || undefined }),
    queryFn: () => appointmentService.getMyAppointments(filterStatus || undefined),
    enabled: hasAppointmentAccess, // Only fetch if has access
  });

  // Confirm appointment mutation
  const confirmMutation = useMutation({
    mutationFn: (id: string) => appointmentService.confirmAppointment(id),
    onSuccess: (response) => {
      showSuccessToast(getSuccessMessage(response) || 'Appointment confirmed successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.APPOINTMENTS.ALL });
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });

  const handleConfirmAppointment = (id: string) => {
    confirmMutation.mutate(id);
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
        '/unauthorized?reason=appointments&category=' + (astrologerCategory || 'ORDINARY');
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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900/20 border border-purple-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total</p>
                <p className="text-2xl font-bold text-white mt-1">{appointments.length}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-purple-400/50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-slate-900 to-amber-900/20 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Pending</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {appointments.filter((a) => a.status === AppointmentStatus.PENDING).length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-amber-400/50" />
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
            {Object.values(AppointmentStatus).map((status) => (
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
          <div className="space-y-4">
            {appointments.map((appointment) => {
              const StatusIcon = STATUS_ICONS[appointment.status] || AlertCircle;
              return (
                <div
                  key={appointment.id}
                  className="bg-gradient-to-br from-slate-900 to-indigo-900/10 border border-indigo-500/20 hover:border-purple-500/40 rounded-xl p-6 transition-all duration-200"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    {/* Left Section - Client & Details */}
                    <div className="flex-1 space-y-4">
                      {/* Client Info */}
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                          {appointment.client.name?.charAt(0) || 'C'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-semibold text-white mb-1">
                            {appointment.client.name || 'Client'}
                          </h3>
                          <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <Phone className="h-4 w-4 text-purple-400" />
                              {appointment.client.phone}
                            </span>
                            {appointment.client.email && (
                              <span className="flex items-center gap-1.5">
                                <Mail className="h-4 w-4 text-purple-400" />
                                {appointment.client.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Appointment Details Grid */}
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="bg-slate-800/30 border border-purple-500/10 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-purple-400 mb-1">
                            <CalendarDays className="h-4 w-4" />
                            <span className="text-xs font-medium uppercase tracking-wide">
                              Date
                            </span>
                          </div>
                          <p className="text-white font-semibold">
                            {formatDate(appointment.scheduledAt)}
                          </p>
                        </div>
                        <div className="bg-slate-800/30 border border-indigo-500/10 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-indigo-400 mb-1">
                            <Clock className="h-4 w-4" />
                            <span className="text-xs font-medium uppercase tracking-wide">
                              Time
                            </span>
                          </div>
                          <p className="text-white font-semibold">
                            {formatTime(appointment.scheduledAt)} · {appointment.duration}m
                          </p>
                        </div>
                        <div className="bg-slate-800/30 border border-emerald-500/10 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-emerald-400 mb-1">
                            <DollarSign className="h-4 w-4" />
                            <span className="text-xs font-medium uppercase tracking-wide">
                              Amount
                            </span>
                          </div>
                          <p className="text-white font-semibold">Rs. {appointment.amount}</p>
                        </div>
                      </div>

                      {/* Notes */}
                      {appointment.notes && (
                        <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-4">
                          <p className="text-sm text-slate-300">
                            <span className="font-semibold text-purple-400">Notes: </span>
                            {appointment.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right Section - Status & Actions */}
                    <div className="flex lg:flex-col items-start gap-3">
                      <span
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border ${STATUS_COLORS[appointment.status]}`}
                      >
                        <StatusIcon className="h-4 w-4" />
                        {appointment.status.replace('_', ' ')}
                      </span>

                      {appointment.status === AppointmentStatus.PENDING && (
                        <LoadingButton
                          size="sm"
                          onClick={() => handleConfirmAppointment(appointment.id)}
                          isLoading={confirmMutation.isPending}
                          loadingText="Confirming..."
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow-lg"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Confirm
                        </LoadingButton>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </JyotishLayout>
  );
}
