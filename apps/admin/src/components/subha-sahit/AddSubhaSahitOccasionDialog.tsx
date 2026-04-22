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
  LoadingButton,
} from '@jyotish/ui';
import { adminApi } from '@/lib/admin-api';
import { ADMIN_QUERY_KEYS } from '@/constants';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import type { SubhaSahitApiLanguage } from '@jyotish/shared';

const LANGUAGE_OPTIONS: { value: SubhaSahitApiLanguage; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'ne', label: 'नेपाली (Nepali)' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
];

export interface AddSubhaSahitOccasionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSubhaSahitOccasionDialog({ open, onOpenChange }: AddSubhaSahitOccasionDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [occasionLanguage, setOccasionLanguage] = useState<SubhaSahitApiLanguage>('en');
  const [pujaItems, setPujaItems] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');

  useEffect(() => {
    if (!open) {
      setName('');
      setOccasionLanguage('en');
      setPujaItems('');
      setEstimatedTime('');
    }
  }, [open]);

  const createMutation = useMutation({
    mutationFn: adminApi.subhaSahit.createOccasion,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'subha-sahit', 'occasions'] });
      await queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.SUBHA_SAHIT.ALL });
      toast.success('Occasion added');
      onOpenChange(false);
    },
    onError: (e: Error) => {
      toast.error(e?.message || 'Failed to add occasion');
    },
  });

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createMutation.mutate({
      name: trimmed,
      language: occasionLanguage,
      pujaItems: pujaItems.trim() || null,
      estimatedTime: estimatedTime.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-purple-600/40 text-white w-[92vw] max-w-md max-h-[90dvh] overflow-y-auto shadow-2xl shadow-purple-900/40 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-purple-100">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-600/30 border border-purple-500/60">
              <Plus className="h-4 w-4" />
            </span>
            Add new occasion
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-3">
          <div className="space-y-1.5">
            <Label className="text-slate-200 text-sm">Occasion name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Satyanarayan Puja"
              className="bg-slate-900/70 border-purple-600/50 focus:border-purple-400 text-white placeholder-slate-500"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label className="text-slate-200 text-xs">Language</Label>
            <select
              value={occasionLanguage}
              onChange={(e) =>
                setOccasionLanguage(e.target.value as SubhaSahitApiLanguage)
              }
              className="mt-1 h-9 rounded-md border border-purple-500/40 bg-slate-900/60 px-2 py-1 text-xs text-white focus:border-purple-400 focus:outline-none"
            >
              {LANGUAGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-200 text-sm">
              Puja items{' '}
              <span className="text-slate-500 font-normal">(optional, comma-separated)</span>
            </Label>
            <Input
              value={pujaItems}
              onChange={(e) => setPujaItems(e.target.value)}
              placeholder="e.g. thal, batuka, vada"
              className="bg-slate-900/70 border-purple-600/50 focus:border-purple-400 text-white placeholder-slate-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-200 text-sm">
              Estimated time <span className="text-slate-500 font-normal">(optional)</span>
            </Label>
            <Input
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              placeholder="e.g. 2 hours"
              className="bg-slate-900/70 border-purple-600/50 focus:border-purple-400 text-white placeholder-slate-500"
            />
          </div>
          <p className="text-xs text-slate-400">
            This occasion will appear in Subha Sahit dropdowns and filters, and in Book Pujari Ji
            booking.
          </p>
        </div>
        <DialogFooter className="mt-2 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-700 w-full sm:w-auto"
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <LoadingButton
            onClick={handleSubmit}
            loading={createMutation.isPending}
            loadingText="Adding…"
            className="w-full sm:w-auto"
            disabled={!name.trim()}
          >
            Add occasion
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
