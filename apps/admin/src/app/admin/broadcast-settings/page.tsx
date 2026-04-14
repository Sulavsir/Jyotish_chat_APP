'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  LoadingButton,
} from '@jyotish/ui';
import { toast } from 'sonner';
import { ADMIN_QUERY_KEYS } from '@/constants/query-keys.constants';
import { adminApi } from '@/lib/admin-api';
import { useAdminSocket } from '@/hooks';
import { ADMIN_SOCKET_EVENTS } from '@/constants/socket-events.constants';

type FormState = {
  expiryMinutes: string;
  acceptanceLimitOrdinary: string;
  acceptanceLimitProfessional: string;
};

export default function BroadcastSettingsPage() {
  const queryClient = useQueryClient();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasQueuedRefreshRef = useRef(false);
  const { on, off, isConnected } = useAdminSocket();

  const { data, isLoading } = useQuery({
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

  const onlineAstrologers = data?.onlineAstrologers ?? [];

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

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Broadcast Settings</h1>
          <p className="text-sm text-slate-400">
            Control broadcast timer and acceptance limits for ordinary and professional jyotish.
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
      </div>
    </>
  );
}
