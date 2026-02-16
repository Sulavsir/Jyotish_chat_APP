/**
 * Jyotish Consultations Page - Appointments that have started or completed (chat history)
 */

'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { JyotishLayout } from '@/components/layouts/JyotishLayout';
import { useRequireAuth } from '@/hooks';
import { USER_ROLES, ROUTE_BUILDERS } from '@/constants';
import { QUERY_KEYS } from '@/constants/query-keys.constants';
import { LoadingScreenWithBackground } from '@/components/ui';
import { listMine as listMyAppointments } from '@/services/appointment.service';
import chatService from '@/services/chat.service';
import type { Appointment } from '@/types/appointment.types';
import { AppointmentStatus } from '@/types/appointment.types';
import { Button, Skeleton } from '@jyotish/ui';
import {
  JyotishDataTable,
  JyotishPagination,
  type JyotishDataTableColumn,
} from '@/components/jyotish/JyotishTable';
import { getAstrologerPermissionsFromUser } from '@/lib/auth';
import { CalendarDays, Clock, MessageSquare, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.IN_PROGRESS]: 'In progress',
  [AppointmentStatus.COMPLETED]: 'Completed',
  [AppointmentStatus.PENDING]: 'Pending',
  [AppointmentStatus.CONFIRMED]: 'Confirmed',
  [AppointmentStatus.CANCELLED]: 'Cancelled',
  [AppointmentStatus.NO_SHOW]: 'No show',
};

const CONSULTATIONS_PER_PAGE = 10;
const CONSULTATION_STATUSES = 'IN_PROGRESS,COMPLETED';

export default function JyotishConsultationsPage() {
  const router = useRouter();
  const { user, isCheckingAccess } = useRequireAuth({
    requiredRole: USER_ROLES.ASTROLOGER,
  });
  const [tablePage, setTablePage] = useState(0);

  const { canAccessAppointments: hasAppointmentAccess } = getAstrologerPermissionsFromUser(user);

  const {
    data: consultationsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.APPOINTMENTS.MY_LIST({
      page: tablePage + 1,
      limit: CONSULTATIONS_PER_PAGE,
      statuses: CONSULTATION_STATUSES,
    }),
    queryFn: () =>
      listMyAppointments({
        page: tablePage + 1,
        limit: CONSULTATIONS_PER_PAGE,
        statuses: CONSULTATION_STATUSES,
      }),
    enabled: hasAppointmentAccess,
  });

  const consultations = consultationsData?.appointments ?? [];
  const pagination = consultationsData?.pagination;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);

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

  const handleOpenChat = async (clientId: string) => {
    try {
      const { chat } = await chatService.getOrCreateChat({ otherUserId: clientId });
      if (chat?.id) {
        router.push(ROUTE_BUILDERS.JYOTISH_CHAT_WITH_ID(chat.id));
      } else {
        toast.error('Could not open chat. Please try from the Chat page.');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to open chat');
    }
  };

  const columns: JyotishDataTableColumn<Appointment>[] = useMemo(
    () => [
      {
        id: 'sn',
        header: 'S.N.',
        cellClassName: 'whitespace-nowrap text-white/70',
        cell: (_, index) => (tablePage * CONSULTATIONS_PER_PAGE + (index ?? 0) + 1),
      },
      {
        id: 'client',
        header: 'Client',
        cell: (row) => (
          <div>
            <p className="font-medium text-white">{row.client.name || 'Client'}</p>
            <p className="text-xs text-white/60">{row.client.phone}</p>
          </div>
        ),
      },
      {
        id: 'type',
        header: 'Type',
        cell: (row) => (
          <span
            className={`inline-block text-xs px-1.5 py-0.5 rounded font-medium ${
              row.bookingType === 'KUNDALI_REVIEW'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
            }`}
          >
            {row.bookingType === 'KUNDALI_REVIEW' ? 'Full Kundali Review' : 'Appointment'}
          </span>
        ),
      },
      {
        id: 'scheduled',
        header: 'Scheduled',
        cell: (row) => (
          <div>
            <p className="text-white">{formatDate(row.scheduledAt)}</p>
            <p className="text-xs text-white/60">{formatTime(row.scheduledAt)}</p>
          </div>
        ),
      },
      {
        id: 'duration',
        header: 'Duration',
        cell: (row) => (
          <div className="flex items-center gap-1 text-white/80">
            <Clock className="w-4 h-4" />
            {row.duration} min
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
              row.status === AppointmentStatus.IN_PROGRESS
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}
          >
            {STATUS_LABELS[row.status] ?? row.status}
          </span>
        ),
      },
      {
        id: 'chat',
        header: 'Chat',
        cell: (row) => (
          <Button
            size="sm"
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={() => handleOpenChat(row.client.id)}
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Chat
          </Button>
        ),
      },
    ],
    [tablePage]
  );

  if (isCheckingAccess) {
    return <LoadingScreenWithBackground message="Verifying access..." />;
  }

  if (!hasAppointmentAccess) {
    return (
      <JyotishLayout>
        <div className="rounded-xl border border-white/10 bg-black/20 p-6 text-center">
          <p className="text-white">You do not have access to consultations.</p>
          <p className="text-sm text-white/60 mt-1">Appointment access is for Professional or Premium astrologers.</p>
        </div>
      </JyotishLayout>
    );
  }

  return (
    <JyotishLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">Consultations</h1>
            <p className="text-gray-300 mt-1">
              Sessions that have started or completed — open chat with the client
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : consultations.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarDays className="w-12 h-12 text-white/30 mx-auto mb-4" />
              <p className="text-white font-medium">No consultations yet</p>
              <p className="text-sm text-white/60 mt-1">
                Appointments that have started or completed will appear here. You can chat with the client from each row.
              </p>
            </div>
          ) : (
            <>
              <JyotishDataTable
                columns={columns}
                data={consultations}
                getRowId={(row) => row.id}
              />
              <JyotishPagination
                page={tablePage}
                totalPages={totalPages}
                onPageChange={setTablePage}
              />
            </>
          )}
        </div>
      </div>
    </JyotishLayout>
  );
}
