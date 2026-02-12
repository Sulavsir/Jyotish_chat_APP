'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import { Card, CardContent, CardHeader, CardTitle, Label, Input, LoadingButton } from '@jyotish/ui';
import { ADMIN_QUERY_KEYS } from '@/constants';
import type { PlatformCoinRateRow, PlatformCoinRateType } from '@/types';

const RATE_LABELS: Record<PlatformCoinRateType, string> = {
  CHAT_PER_MESSAGE: 'Chat (per message)',
  BROADCAST_PER_MESSAGE: 'Broadcast chat (per message)',
  BROADCAST_SEND: 'Broadcast send (per message)',
  APPOINTMENT: 'Appointment',
};

export default function SetCoinsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Record<PlatformCoinRateType, string>>({
    CHAT_PER_MESSAGE: '',
    BROADCAST_PER_MESSAGE: '',
    BROADCAST_SEND: '',
    APPOINTMENT: '',
  });

  const { data: ratesData, isLoading, isError, error } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.COIN_RATES.ALL,
    queryFn: () => adminApi.coinRates.get(),
    staleTime: 30 * 1000,
  });

  const rates = ratesData?.rates ?? [];

  useEffect(() => {
    if (rates.length > 0) {
      const next: Record<PlatformCoinRateType, string> = {
        CHAT_PER_MESSAGE: '',
        BROADCAST_PER_MESSAGE: '',
        BROADCAST_SEND: '',
        APPOINTMENT: '',
      };
      rates.forEach((r: PlatformCoinRateRow) => {
        next[r.rateType] = String(r.coins);
      });
      setEditing(next);
    }
  }, [rates]);

  const mutation = useMutation({
    mutationFn: (body: Record<PlatformCoinRateType, number>) =>
      adminApi.coinRates.update(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.COIN_RATES.ALL });
    },
  });

  const handleSave = () => {
    const body: Record<string, number> = {};
    (Object.keys(editing) as PlatformCoinRateType[]).forEach((key) => {
      const v = parseInt(editing[key], 10);
      if (!Number.isNaN(v) && v >= 0) body[key] = v;
    });
    if (Object.keys(body).length) {
      mutation.mutate(body as Record<PlatformCoinRateType, number>);
    }
  };

  const hasChanges =
    rates.length > 0 &&
    (Object.keys(editing) as PlatformCoinRateType[]).some(
      (key) =>
        String((rates as PlatformCoinRateRow[]).find((r) => r.rateType === key)?.coins ?? '') !==
        editing[key]
    );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-white">Coin Settings</h2>
          <p className="text-slate-400 mt-1">
            Set coins deducted for chat, broadcast, and appointment. Defaults (200, 100, 300) apply
            if not set.
          </p>
        </div>

        <Card className="cosmic-card border border-slate-700 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white">Rates</CardTitle>
            <p className="text-sm text-slate-400">Coins per action (0–10000)</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && <p className="text-slate-400">Loading...</p>}
            {isError && (
              <p className="text-red-400">
                {error instanceof Error ? error.message : 'Failed to load rates.'}
              </p>
            )}
            {!isLoading && !isError && rates.length > 0 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  {(rates as PlatformCoinRateRow[]).map((row) => (
                    <div key={row.id} className="space-y-2">
                      <Label className="text-slate-300">{RATE_LABELS[row.rateType]}</Label>
                      <Input
                        type="number"
                        min={0}
                        max={10000}
                        step={1}
                        value={editing[row.rateType]}
                        onChange={(e) =>
                          setEditing((prev) => ({
                            ...prev,
                            [row.rateType]: e.target.value,
                          }))
                        }
                        className="bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end pt-2">
                  <LoadingButton
                    onClick={handleSave}
                    loading={mutation.isPending}
                    loadingText="Saving..."
                    disabled={!hasChanges}
                    className="bg-gradient-to-r from-cosmic-purple to-nebula-pink hover:opacity-90"
                  >
                    Save changes
                  </LoadingButton>
                </div>
                {mutation.isError && (
                  <p className="text-red-400 text-sm">
                    {mutation.error instanceof Error ? mutation.error.message : 'Save failed'}
                  </p>
                )}
                {mutation.isSuccess && (
                  <p className="text-emerald-400 text-sm">Rates updated.</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
