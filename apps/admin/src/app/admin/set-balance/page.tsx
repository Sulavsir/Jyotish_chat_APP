'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Input,
  LoadingButton,
  Button,
} from '@jyotish/ui';
import { ADMIN_QUERY_KEYS } from '@/constants';
import type { PlatformCoinRateRow, PlatformCoinRateType } from '@/types';
import { toast } from 'sonner';

const RATE_LABELS: Partial<Record<PlatformCoinRateType, string>> = {
  BROADCAST_PER_MESSAGE: 'Broadcast chat (per message)',
  BROADCAST_SEND: 'Broadcast send (per message)',
  KUNDALI_MATCH: 'Kundali Match',
  COINS_PER_NPR: 'NRs per NPR (Purchase Rate)',
  FIRST_BROADCAST_DISCOUNT: 'First broadcast discount (%)',
};

export default function SetCoinsPage() {
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editing, setEditing] = useState<Record<PlatformCoinRateType, string>>({
    CHAT_PER_MESSAGE: '',
    BROADCAST_PER_MESSAGE: '',
    BROADCAST_SEND: '',
    APPOINTMENT: '',
    KUNDALI_REVIEW: '',
    KUNDALI_MATCH: '',
    COINS_PER_NPR: '',
    FIRST_BROADCAST_DISCOUNT: '',
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
        KUNDALI_REVIEW: '',
        KUNDALI_MATCH: '',
        COINS_PER_NPR: '',
        FIRST_BROADCAST_DISCOUNT: '',
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
    onSuccess: (data: { rates: PlatformCoinRateRow[]; message?: string }) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.COIN_RATES.ALL });
      setConfirmOpen(false);
      toast.success(data.message ?? 'NRs rates updated successfully.');
    },
    onError: (err: Error) => {
      setConfirmOpen(false);
      toast.error(err.message ?? 'Failed to save NRs rates.');
    },
  });

  const getSavePayload = (): Record<PlatformCoinRateType, number> | null => {
    const body: Record<string, number> = {};
    (Object.keys(editing) as PlatformCoinRateType[]).forEach((key) => {
      const v = parseInt(editing[key], 10);
      if (!Number.isNaN(v) && v >= 0) body[key] = v;
    });
    return Object.keys(body).length
      ? (body as Record<PlatformCoinRateType, number>)
      : null;
  };

  const handleSaveClick = () => {
    if (getSavePayload()) setConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    const body = getSavePayload();
    if (body) mutation.mutate(body);
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
      <div className="space-y-5 sm:space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">NRs Settings</h2>
          <p className="text-sm sm:text-base text-slate-400 mt-1">
            Set platform-wide NRs for broadcast and kundali-related actions. Per-Jyotish chat and
            appointment fees are now configured on each astrologer profile.
          </p>
        </div>

        <Card className="cosmic-card border border-slate-700 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white">Rates</CardTitle>
            <p className="text-sm text-slate-400">NRs per action (0–10000)</p>
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
                  {(rates as PlatformCoinRateRow[])
                    .filter((row) => RATE_LABELS[row.rateType])
                    .map((row) => (
                      <div key={row.id} className="space-y-2">
                        <Label className="text-slate-300">
                          {RATE_LABELS[row.rateType] as string}
                        </Label>
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
                <div className="flex w-full justify-end pt-2 sm:justify-end">
                  <LoadingButton
                    onClick={handleSaveClick}
                    loading={mutation.isPending}
                    loadingText="Saving..."
                    disabled={!hasChanges}
                    className="bg-gradient-to-r from-cosmic-purple to-nebula-pink hover:opacity-90 w-full sm:w-auto"
                  >
                    Save changes
                  </LoadingButton>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white w-[92vw] max-w-md max-h-[90dvh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Save NRs rates?</DialogTitle>
            <DialogDescription className="text-slate-400">
              This will update the platform NRs rates. Users will see the new rates for chat,
              broadcast, appointment, and kundali match.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="border-slate-600 text-slate-300"
              onClick={() => setConfirmOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <LoadingButton
              loading={mutation.isPending}
              loadingText="Saving..."
              onClick={handleConfirmSave}
              className="bg-gradient-to-r from-cosmic-purple to-nebula-pink hover:opacity-90 w-full sm:w-auto"
              type="button"
            >
              Save changes
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
