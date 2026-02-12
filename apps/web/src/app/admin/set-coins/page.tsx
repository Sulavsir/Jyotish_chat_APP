/**
 * Admin Coin Settings (Set Coins)
 * Set coins for chat, broadcast, appointment (stored in DB, not hardcoded)
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@jyotish/ui';
import { LoadingButton } from '@/components/ui';
import { getCoinRates, updateCoinRates } from '@/services/adminCoinRates.service';
import { QUERY_KEYS } from '@/constants';
import type { PlatformCoinRateRow, PlatformCoinRateType } from '@/types/platformCoinRate.types';
import { Coins } from 'lucide-react';
import { toast } from 'sonner';

const RATE_LABELS: Record<PlatformCoinRateType, string> = {
  CHAT_PER_MESSAGE: 'Chat (per message)',
  BROADCAST_PER_MESSAGE: 'Broadcast chat (per message)',
  BROADCAST_SEND: 'Broadcast send (per message)',
  APPOINTMENT: 'Appointment',
};

export default function AdminSetCoinsPage() {
  const queryClient = useQueryClient();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Record<PlatformCoinRateType, string>>({
    CHAT_PER_MESSAGE: '',
    BROADCAST_PER_MESSAGE: '',
    BROADCAST_SEND: '',
    APPOINTMENT: '',
  });

  const { data: ratesData, isLoading, isError, error } = useQuery({
    queryKey: QUERY_KEYS.ADMIN_COIN_RATES,
    queryFn: getCoinRates,
    staleTime: 30 * 1000,
  });

  const rates = useMemo(() => ratesData ?? [], [ratesData]);

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
      updateCoinRates(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_COIN_RATES });
      setSaveDialogOpen(false);
      toast.success('Coin rates updated successfully.');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to save coin rates.');
    },
  });

  const handleSaveClick = () => setSaveDialogOpen(true);

  const handleConfirmSave = () => {
    const body: Record<string, number> = {};
    (Object.keys(editing) as PlatformCoinRateType[]).forEach((key) => {
      const v = parseInt(editing[key], 10);
      if (!Number.isNaN(v) && v >= 0) body[key] = v;
    });
    if (Object.keys(body).length) {
      mutation.mutate(body as Record<PlatformCoinRateType, number>);
    } else {
      setSaveDialogOpen(false);
      toast.error('No valid rates to save.');
    }
  };

  const hasChanges =
    rates.length > 0 &&
    (Object.keys(editing) as PlatformCoinRateType[]).some(
      (key) =>
        String(rates.find((r: PlatformCoinRateRow) => r.rateType === key)?.coins ?? '') !==
        editing[key]
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
          <Coins className="h-7 w-7 text-amber-400" />
          Coin Settings
        </h1>
        <p className="text-white/60 text-sm mt-1">
          Set coins deducted for chat, broadcast, and appointment. If not set, defaults (200, 100, 300) are used.
        </p>
      </div>

      <Card className="bg-black/40 backdrop-blur-sm border border-white/[0.12] rounded-xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-white">Rates</CardTitle>
          <p className="text-sm text-white/60">Coins per action (integers, 0–10000)</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && <p className="text-white/60">Loading...</p>}
          {isError && (
            <p className="text-red-400">
              {error instanceof Error ? error.message : 'Failed to load rates. Ensure you are logged in as admin.'}
            </p>
          )}
          {!isLoading && !isError && rates.length > 0 && (
            <>
              <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-white/80 font-medium">Rate type</TableHead>
                      <TableHead className="text-white/80 font-medium">Description</TableHead>
                      <TableHead className="text-white/80 font-medium w-40">Coins</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(rates as PlatformCoinRateRow[]).map((row) => (
                      <TableRow key={row.id} className="border-white/10">
                        <TableCell className="text-white font-medium">
                          {RATE_LABELS[row.rateType]}
                        </TableCell>
                        <TableCell className="text-white/60 text-sm">
                          {row.description ?? '—'}
                        </TableCell>
                        <TableCell>
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
                            className="bg-white/10 border-white/20 text-white w-full max-w-[8rem]"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end pt-2">
                <LoadingButton
                  onClick={handleSaveClick}
                  isLoading={mutation.isPending}
                  loadingText="Saving..."
                  disabled={!hasChanges}
                >
                  Save changes
                </LoadingButton>
              </div>

              <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <DialogContent className="bg-slate-900 border-slate-700 text-white">
                  <DialogHeader>
                    <DialogTitle>Save coin rate changes?</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Updated rates will apply to chat, broadcast, and appointment deductions. This
                      affects all users.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSaveDialogOpen(false)}
                      className="border-slate-600 text-slate-200 hover:bg-slate-800"
                    >
                      Cancel
                    </Button>
                    <LoadingButton
                      onClick={handleConfirmSave}
                      isLoading={mutation.isPending}
                      loadingText="Saving..."
                    >
                      Save changes
                    </LoadingButton>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
