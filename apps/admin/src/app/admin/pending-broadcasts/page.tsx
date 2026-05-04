'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  LoadingButton,
} from '@jyotish/ui';
import { ChatIcon } from '@jyotish/ui';
import { EyeIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ADMIN_QUERY_KEYS } from '@/constants/query-keys.constants';
import { adminApi } from '@/lib/admin-api';
import { useAdminSocket } from '@/hooks';
import { ADMIN_SOCKET_EVENTS } from '@/constants/socket-events.constants';
import { AdminTable, type AdminTableColumn } from '@/components/admin';

type PendingBroadcastRow = {
  id: string;
  messageId: string;
  content: string;
  createdAt: string;
  expiresAt: string;
  clientId: string;
  client: { id: string; name: string | null; phone: string | null; email: string | null } | null;
  questionCount: number;
  questions: string[];
};

function formatRequestedAt(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    time: d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  };
}

function formatExpiresIn(ms: number) {
  const urgent = ms > 0 && ms <= 120_000;
  if (ms <= 0) return { label: 'Expired', urgent: true };
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return { label: `${h}h ${m}m ${sec}s`, urgent };
  }
  if (m > 0) {
    return { label: `${m}m ${sec}s`, urgent };
  }
  return { label: `${sec}s`, urgent: true };
}

export default function PendingBroadcastsPage() {
  const queryClient = useQueryClient();
  const [assignSelection, setAssignSelection] = useState<Record<string, string>>({});
  const [viewingQuestions, setViewingQuestions] = useState<PendingBroadcastRow | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasQueuedRefreshRef = useRef(false);
  const [now, setNow] = useState(() => Date.now());
  const { on, off, isConnected } = useAdminSocket();

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.BROADCAST_SETTINGS.DETAIL(),
    queryFn: () => adminApi.broadcastSettings.get(),
  });

  const assignMutation = useMutation({
    mutationFn: ({ messageId, astrologerId }: { messageId: string; astrologerId: string }) =>
      adminApi.broadcastSettings.assignPending(messageId, astrologerId),
    onSuccess: () => {
      toast.success('Pending broadcast assigned successfully');
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.BROADCAST_SETTINGS.DETAIL() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to assign pending broadcast');
    },
  });

  const onlineAstrologers = data?.onlineAstrologers ?? [];
  const pendingBroadcasts: PendingBroadcastRow[] = useMemo(() => {
    const raw = data?.pendingBroadcasts ?? [];
    return raw.filter((row) => new Date(row.expiresAt).getTime() > now);
  }, [data?.pendingBroadcasts, now]);

  // Real-time sync with broadcast queue (same as broadcast-settings): invalidate list when
  // new pending items arrive, assignments complete, or sidebar counts need refresh.
  useEffect(() => {
    if (!isConnected) return;

    const scheduleRefresh = () => {
      hasQueuedRefreshRef.current = true;
      if (refreshTimerRef.current) return;

      refreshTimerRef.current = setTimeout(() => {
        if (!hasQueuedRefreshRef.current) return;
        hasQueuedRefreshRef.current = false;
        refreshTimerRef.current = null;

        void queryClient.invalidateQueries({
          queryKey: ADMIN_QUERY_KEYS.BROADCAST_SETTINGS.DETAIL(),
        });
        void queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.SIDEBAR_COUNTS() });
        toast.info('Broadcast queue updated');
      }, 350);
    };

    on(ADMIN_SOCKET_EVENTS.BROADCAST.NEW, scheduleRefresh);
    on(ADMIN_SOCKET_EVENTS.BROADCAST.UPDATE, scheduleRefresh);
    on(ADMIN_SOCKET_EVENTS.SIDEBAR.INVALIDATE, scheduleRefresh);

    return () => {
      off(ADMIN_SOCKET_EVENTS.BROADCAST.NEW, scheduleRefresh);
      off(ADMIN_SOCKET_EVENTS.BROADCAST.UPDATE, scheduleRefresh);
      off(ADMIN_SOCKET_EVENTS.SIDEBAR.INVALIDATE, scheduleRefresh);
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [isConnected, on, off, queryClient]);

  const columns: AdminTableColumn<PendingBroadcastRow>[] = [
    {
      header: 'Client',
      accessor: (row) => {
        const label = row.client?.name || row.client?.phone || row.client?.email || row.clientId;
        return (
          <div className="max-w-[260px]">
            <div className="text-sm text-slate-300 truncate">{label}</div>
          </div>
        );
      },
    },
    {
      header: 'Assign to',
      accessor: (row) => (
        <select
          className="w-[320px] max-w-full h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
          value={assignSelection[row.id] || ''}
          disabled={onlineAstrologers.length === 0}
          onChange={(e) =>
            setAssignSelection((prev) => ({
              ...prev,
              [row.id]: e.target.value,
            }))
          }
        >
          <option value="">
            {onlineAstrologers.length === 0 ? 'No online astrologers' : 'Select online astrologer'}
          </option>
          {onlineAstrologers.map((astro) => (
            <option key={astro.id} value={astro.id}>
              {astro.name} ({astro.category})
            </option>
          ))}
        </select>
      ),
    },
    {
      header: 'Questions',
      accessor: (row) => {
        const first = row.questions[0] || row.content;
        const moreCount = Math.max(0, row.questionCount - 1);
        return (
          <div className="max-w-[420px] flex items-start gap-2">
            <div className="min-w-0">
              <div className="text-sm text-slate-200 truncate">
                {first}
                {moreCount > 0 ? ` (...+${moreCount} more)` : ''}
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewingQuestions(row)}
              className="h-8 w-8 shrink-0"
            >
              <EyeIcon className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
    {
      header: 'Requested At',
      accessor: (row) => {
        const { date, time } = formatRequestedAt(row.createdAt);
        return (
          <div className="whitespace-nowrap">
            <div className="text-sm text-slate-200">{date}</div>
            <div className="text-xs text-slate-500">{time}</div>
          </div>
        );
      },
    },
    {
      header: 'Expires in',
      accessor: (row) => {
        const remaining = new Date(row.expiresAt).getTime() - now;
        const { label, urgent } = formatExpiresIn(remaining);
        return (
          <div
            className={`text-sm font-mono tabular-nums whitespace-nowrap ${
              urgent ? 'text-amber-400' : 'text-slate-300'
            }`}
          >
            {label}
          </div>
        );
      },
    },
    {
      header: 'Action',
      className: 'text-right',
      accessor: (row) => (
        <div className="flex justify-end">
          <LoadingButton
            loading={
              assignMutation.isPending && assignMutation.variables?.messageId === row.messageId
            }
            disabled={!assignSelection[row.id]}
            onClick={() =>
              assignMutation.mutate({
                messageId: row.messageId,
                astrologerId: assignSelection[row.id],
              })
            }
          >
            Assign
          </LoadingButton>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Pending Broadcasts</h1>
            <p className="text-sm text-slate-400">
              Assign pending broadcast requests to online jyotish. The list updates in real time.
            </p>
          </div>
          <Button
            variant="outline"
            className="shrink-0 self-start"
            onClick={() =>
              queryClient.invalidateQueries({
                queryKey: ADMIN_QUERY_KEYS.BROADCAST_SETTINGS.DETAIL(),
              })
            }
            disabled={isFetching}
          >
            Refresh
          </Button>
        </div>

        <div className="w-full min-w-0 rounded-xl border border-slate-700 overflow-hidden">
          <AdminTable
            data={pendingBroadcasts}
            columns={columns}
            loading={isLoading}
            keyExtractor={(row) => row.id}
            showSerialNumber
            emptyState={{
              icon: <ChatIcon className="w-16 h-16 text-slate-600" />,
              title: 'No pending broadcast requests',
              description: 'New requests will appear here automatically.',
            }}
          />
        </div>
      </div>
      <Dialog
        open={viewingQuestions !== null}
        onOpenChange={(open) => !open && setViewingQuestions(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Broadcast Questions</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {(viewingQuestions?.questions ?? []).map((q, idx) => (
              <div
                key={`${idx}-${q.slice(0, 16)}`}
                className="rounded-md border border-slate-700 p-3 text-sm text-slate-200"
              >
                <span className="text-slate-400 mr-2">Q{idx + 1}.</span>
                {q}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
