'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import { Button, DateInput, Label, Textarea, ArrowLeftIcon, Input } from '@jyotish/ui';
import { LoadingButton } from '@/components/ui';
import { ADMIN_QUERY_KEYS, ADMIN_ROUTES } from '@/constants';
import { toast } from 'sonner';
import { Plus, Trash2, Calendar } from 'lucide-react';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

interface SubhaSahitRow {
  id: string;
  date: string;
  occasion: string;
  description: string;
}

const defaultRow = (): SubhaSahitRow => ({
  id: crypto.randomUUID(),
  date: todayISO(),
  occasion: '',
  description: '',
});

export default function CreateSubhaSahitPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<SubhaSahitRow[]>([defaultRow()]);

  const batchMutation = useMutation({
    mutationFn: (payload: { dates: { date: string; occasion: string; description?: string }[] }) =>
      adminApi.subhaSahit.create(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.SUBHA_SAHIT.ALL });
      toast.success(`${variables.dates.length} Subha Sahit date(s) created`);
      router.push(ADMIN_ROUTES.SUBHA_SAHIT);
    },
    onError: (e: Error) => {
      toast.error(e?.message || 'Failed to create dates');
    },
  });

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, defaultRow()]);
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  }, []);

  const updateRow = useCallback((id: string, updates: Partial<SubhaSahitRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }, []);

  const validRows = rows.filter((r) => r.date && r.occasion.trim().length > 0);

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    if (validRows.length === 0) {
      toast.error('Add at least one date with occasion.');
      return;
    }
    const dates = validRows.map(({ date, occasion, description }) => ({
      date,
      occasion: occasion.trim(),
      description: description.trim() || undefined,
    }));
    batchMutation.mutate({ dates });
  };

  return (
    <AdminLayout>
      <form onSubmit={handleSaveAll} className="space-y-6 w-full">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push(ADMIN_ROUTES.SUBHA_SAHIT)}
            className="p-2 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
            aria-label="Back to Subha Sahit"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold cosmic-text">Add Subha Sahit Dates</h1>
            <p className="text-slate-400 mt-1">
              Add one or more auspicious dates. Each date can have its own occasion and description.
            </p>
          </div>
        </div>
      </form>

      <form onSubmit={handleSaveAll} className="space-y-6 w-full">
        {rows.map((row) => (
          <div key={row.id} className="cosmic-card p-6 space-y-4 relative">
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                aria-label="Remove row"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-200">
                  Date <span className="text-red-400">*</span>
                </Label>
                <DateInput
                  min={todayISO()}
                  value={row.date}
                  onChange={(e) => updateRow(row.id, { date: e.target.value })}
                  className="mt-1.5 w-full bg-slate-900/50 border-purple-500/30 text-white [color-scheme:dark]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-200">
                  Occasion <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={row.occasion}
                  onChange={(e) => updateRow(row.id, { occasion: e.target.value })}
                  placeholder="e.g. Satyanarayan Puja, Griha Pravesh"
                  className="mt-1.5 h-11 w-full rounded-md border-2 border-purple-500/30 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-200">Description (Optional)</Label>
                <Textarea
                  value={row.description}
                  onChange={(e) => updateRow(row.id, { description: e.target.value })}
                  rows={3}
                  placeholder="Short note about this Subha Sahit..."
                  className="mt-1.5 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={addRow}
            disabled={batchMutation.isPending}
            className="border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add another date
          </Button>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(ADMIN_ROUTES.SUBHA_SAHIT)}
              disabled={batchMutation.isPending}
              className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              isLoading={batchMutation.isPending}
              loadingText="Saving..."
              disabled={validRows.length === 0}
            >
              Save all ({validRows.length} date{validRows.length !== 1 ? 's' : ''})
            </LoadingButton>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
