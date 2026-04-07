'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  LoadingButton,
} from '@jyotish/ui';
import { ChatIcon } from '@jyotish/ui';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { ADMIN_QUERY_KEYS } from '@/constants/query-keys.constants';
import { adminApi } from '@/lib/admin-api';
import { useAdminSocket } from '@/hooks';
import { ADMIN_SOCKET_EVENTS } from '@/constants/socket-events.constants';
import { AdminTable, type AdminTableColumn } from '@/components/admin';

type FormState = {
  expiryMinutes: string;
  acceptanceLimitOrdinary: string;
  acceptanceLimitProfessional: string;
};

type PendingBroadcastRow = {
  id: string;
  content: string;
  createdAt: string;
  expiresAt: string;
  clientId: string;
  client: { id: string; name: string | null; phone: string | null; email: string | null } | null;
};

export default function BroadcastSettingsPage() {
  const queryClient = useQueryClient();
  const [assignSelection, setAssignSelection] = useState<Record<string, string>>({});
  const { on, off, isConnected } = useAdminSocket();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.BROADCAST_SETTINGS.DETAIL(),
    queryFn: () => adminApi.broadcastSettings.get(),
  });

  const initialForm: FormState = useMemo(
    () => ({
      expiryMinutes: String(data?.settings.expiryMinutes ?? 10),
      acceptanceLimitOrdinary: String(data?.settings.acceptanceLimitOrdinary ?? 10),
      acceptanceLimitProfessional: String(data?.settings.acceptanceLimitProfessional ?? 10),
    }),
    [data]
  );

  const [form, setForm] = useState<FormState>(initialForm);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  const normalizedInitial = useMemo(() => JSON.stringify(initialForm), [initialForm]);
  const normalizedCurrent = useMemo(() => JSON.stringify(form), [form]);
  const hasChanges = normalizedInitial !== normalizedCurrent;

  const updateMutation = useMutation({
    mutationFn: () =>
      adminApi.broadcastSettings.update({
        expiryMinutes: Number(form.expiryMinutes),
        acceptanceLimitOrdinary: Number(form.acceptanceLimitOrdinary),
        acceptanceLimitProfessional: Number(form.acceptanceLimitProfessional),
      }),
    onSuccess: () => {
      toast.success('Broadcast settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.BROADCAST_SETTINGS.DETAIL() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update broadcast settings');
    },
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
  const pendingBroadcasts: PendingBroadcastRow[] = (data?.pendingBroadcasts ?? []) as any;

  // Real-time: refresh list when new pending broadcasts arrive or get accepted/expired
  useEffect(() => {
    if (!isConnected) return;

    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.BROADCAST_SETTINGS.DETAIL() });
    };

    on(ADMIN_SOCKET_EVENTS.BROADCAST.NEW, invalidate);
    on(ADMIN_SOCKET_EVENTS.BROADCAST.UPDATE, invalidate);

    return () => {
      off(ADMIN_SOCKET_EVENTS.BROADCAST.NEW, invalidate);
      off(ADMIN_SOCKET_EVENTS.BROADCAST.UPDATE, invalidate);
    };
  }, [isConnected, on, off, queryClient]);

  const columns: AdminTableColumn<PendingBroadcastRow>[] = [
    {
      header: 'Request',
      accessor: (row) => (
        <div className="max-w-[420px]">
          <div className="text-sm text-slate-200 truncate">{row.content}</div>
          <div className="text-xs text-slate-500">{new Date(row.createdAt).toLocaleString()}</div>
        </div>
      ),
    },
    {
      header: 'Client',
      accessor: (row) => {
        const label = row.client?.name || row.client?.phone || row.client?.email || row.clientId;
        return (
          <div className="max-w-[260px]">
            <div className="text-sm text-slate-300 truncate">{label}</div>
            <div className="text-xs text-slate-500">
              Expires: {new Date(row.expiresAt).toLocaleString()}
            </div>
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
      header: 'Action',
      className: 'text-right',
      accessor: (row) => (
        <div className="flex justify-end">
          <LoadingButton
            loading={assignMutation.isPending && assignMutation.variables?.messageId === row.id}
            disabled={!assignSelection[row.id]}
            onClick={() =>
              assignMutation.mutate({
                messageId: row.id,
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
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Broadcast Settings</h1>
          <p className="text-sm text-slate-400">
            Control broadcast timer, acceptance limits, and assign pending requests.
          </p>
        </div>

        <Card className="cosmic-card rounded-xl border border-slate-700 overflow-hidden">
          <CardHeader className="border-b border-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-semibold text-white">
                  Runtime Configuration
                </CardTitle>
                <p className="text-sm text-slate-400">
                  Admin-controlled broadcast expiry and acceptance limits.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                <Badge variant="secondary" className="bg-slate-800 border-slate-700 text-slate-200">
                  Pending: {pendingBroadcasts.length}
                </Badge>
                <Badge variant="secondary" className="bg-slate-800 border-slate-700 text-slate-200">
                  Online Jyotish: {onlineAstrologers.length}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="expiryMinutes">Broadcast Expiry (minutes)</Label>
                <Input
                  id="expiryMinutes"
                  type="number"
                  min={1}
                  max={120}
                  value={form.expiryMinutes}
                  onChange={(e) => setForm((prev) => ({ ...prev, expiryMinutes: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acceptanceLimitOrdinary">Ordinary Jyotish Acceptance Limit</Label>
                <Input
                  id="acceptanceLimitOrdinary"
                  type="number"
                  min={0}
                  max={100}
                  value={form.acceptanceLimitOrdinary}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, acceptanceLimitOrdinary: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acceptanceLimitProfessional">
                  Professional Jyotish Acceptance Limit
                </Label>
                <Input
                  id="acceptanceLimitProfessional"
                  type="number"
                  min={0}
                  max={100}
                  value={form.acceptanceLimitProfessional}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, acceptanceLimitProfessional: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex justify-end">
              <LoadingButton
                onClick={() => updateMutation.mutate()}
                loading={updateMutation.isPending}
                disabled={!hasChanges || isLoading}
              >
                Save Broadcast Settings
              </LoadingButton>
            </div>
          </CardContent>
        </Card>

        <Card className="cosmic-card rounded-xl border border-slate-700 overflow-hidden">
          <CardHeader className="border-b border-slate-800">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-lg font-semibold text-white">
                Pending Broadcast Requests
              </CardTitle>
              <Button
                variant="outline"
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
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            {pendingBroadcasts.length === 0 ? (
              <p className="text-sm text-slate-400">No pending broadcast requests right now.</p>
            ) : (
              <div className="cosmic-card w-full max-w-full min-w-0 rounded-xl overflow-hidden">
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
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
