'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Textarea,
  LoadingButton,
} from '@jyotish/ui';
import type { SubhaSahitOccasionListItem } from '@jyotish/shared';
import { adminApi } from '@/lib/admin-api';
import { ADMIN_QUERY_KEYS } from '@/constants';
import { toast } from 'sonner';

export interface EditSubhaSahitOccasionMetaDialogProps {
  row: SubhaSahitOccasionListItem | null;
  onClose: () => void;
}

export function EditSubhaSahitOccasionMetaDialog({
  row,
  onClose,
}: EditSubhaSahitOccasionMetaDialogProps) {
  const queryClient = useQueryClient();
  const open = row !== null;
  const [pujaItems, setPujaItems] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');

  useEffect(() => {
    if (row) {
      setPujaItems(row.pujaItems ?? '');
      setEstimatedTime(row.estimatedTime ?? '');
    }
  }, [row]);

  const updateMutation = useMutation({
    mutationFn: adminApi.subhaSahit.updateOccasionMeta,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'subha-sahit', 'occasions'] });
      await queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.SUBHA_SAHIT.ALL });
      toast.success('Occasion details saved');
      onClose();
    },
    onError: (e: Error) => {
      toast.error(e?.message || 'Failed to save');
    },
  });

  const handleSave = () => {
    if (!row?.language) return;
    updateMutation.mutate({
      language: row.language,
      occasion: row.occasion,
      pujaItems: pujaItems.trim() || null,
      estimatedTime: estimatedTime.trim() || null,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-purple-600/40 text-white w-[92vw] max-w-md max-h-[90dvh] overflow-y-auto shadow-2xl shadow-purple-900/40 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-purple-100">Edit occasion details</DialogTitle>
        </DialogHeader>
        {row && (
          <div className="space-y-3 py-2">
            <p className="text-sm text-slate-300">
              <span className="text-slate-500">Occasion:</span> {row.occasion}{' '}
              <span className="text-slate-500">({row.language})</span>
            </p>
            <div className="space-y-1.5">
              <Label className="text-slate-200 text-sm">Puja items (comma-separated)</Label>
              <Textarea
                value={pujaItems}
                onChange={(e) => setPujaItems(e.target.value)}
                placeholder="e.g. thal, batuka, vada"
                rows={3}
                className="bg-slate-900/70 border-purple-600/50 focus:border-purple-400 text-white placeholder-slate-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-200 text-sm">Estimated time</Label>
              <Input
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                placeholder="e.g. 2 hours"
                className="bg-slate-900/70 border-purple-600/50 focus:border-purple-400 text-white placeholder-slate-500"
              />
            </div>
          </div>
        )}
        <DialogFooter className="mt-2 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-700 w-full sm:w-auto"
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <LoadingButton
            onClick={handleSave}
            loading={updateMutation.isPending}
            loadingText="Saving…"
            className="w-full sm:w-auto"
            disabled={!row?.language}
          >
            Save
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
