'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import { Button, DateInput, Label, Textarea, ArrowLeftIcon } from '@jyotish/ui';
import { LoadingButton } from '@/components/ui';
import { ADMIN_QUERY_KEYS, ADMIN_ROUTES } from '@/constants';
import { toast } from 'sonner';
import { Plus, Trash2, Calendar, Sparkles } from 'lucide-react';

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
  const searchParams = useSearchParams();
  const initialOccasionFromQuery = searchParams.get('occasion') ?? '';
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<SubhaSahitRow[]>([defaultRow()]);

  const { data: occasionsData } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.SUBHA_SAHIT.OCCASIONS(),
    queryFn: () => adminApi.subhaSahit.getOccasions(),
  });

  const occasions = occasionsData?.occasions ?? [];

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

  useEffect(() => {
    if (!initialOccasionFromQuery.trim()) return;
    setRows((prev) =>
      prev.map((row, index) =>
        index === 0 && !row.occasion.trim() ? { ...row, occasion: initialOccasionFromQuery } : row
      )
    );
  }, [initialOccasionFromQuery]);

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
      <div className="w-full min-h-screen">
        {/* Header */}
        <div className="mb-10">
          <button
            type="button"
            onClick={() => router.push(ADMIN_ROUTES.SUBHA_SAHIT)}
            className="p-2 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-purple-500/15 transition-all duration-300 mb-4 inline-flex"
            aria-label="Back to Subha Sahit"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-300 via-purple-200 to-purple-400 bg-clip-text text-transparent">
                Add Auspicious Dates
              </h1>
            </div>
            <p className="text-slate-400 text-lg">
              Create sacred moments. Each date holds its own occasion and story.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSaveAll} className="space-y-5 w-full">
          {/* Cards Container */}
          <div className="grid gap-5 w-full">
            {rows.map((row, index) => (
              <div
                key={row.id}
                className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-purple-500/20 rounded-2xl p-8 backdrop-blur-sm hover:border-purple-500/40 hover:shadow-2xl hover:shadow-purple-900/20 transition-all duration-300 overflow-hidden"
              >
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 via-transparent to-slate-600/0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" />

                {/* Card number badge */}
                <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                  <span className="text-xs font-semibold text-purple-300">{index + 1}</span>
                </div>

                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="absolute top-4 right-4 p-2.5 rounded-lg text-slate-400 bg-slate-800/0 hover:bg-red-500/15 hover:text-red-300 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
                    aria-label="Remove row"
                    title="Remove this date"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}

                <div className="relative z-10 space-y-6">
                  {/* Date and Occasion Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-slate-200 font-semibold text-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        Date <span className="text-purple-400">*</span>
                      </Label>
                      <DateInput
                        min={todayISO()}
                        value={row.date}
                        onChange={(e) => updateRow(row.id, { date: e.target.value })}
                        className="w-full bg-slate-900/40 border-2 border-purple-500/20 text-white placeholder-slate-500 rounded-lg py-3 px-4 focus:border-purple-500/60 focus:bg-slate-900/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 [color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-slate-200 font-semibold text-sm">
                        Occasion <span className="text-purple-400">*</span>
                      </Label>
                      {occasions.length > 0 ? (
                        <select
                          value={row.occasion}
                          onChange={(e) => updateRow(row.id, { occasion: e.target.value })}
                          className="w-full mt-1.5 h-11 rounded-lg border-2 border-purple-500/30 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                        >
                          <option value="">Select occasion...</option>
                          {occasions.map((occ) => (
                            <option key={occ} value={occ}>
                              {occ}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="w-full mt-1.5 h-11 rounded-lg border-2 border-purple-500/30 bg-slate-900/50 px-3 py-2 text-sm text-slate-400 flex items-center">
                          No occasions available. Add one from the Subha Sahit page.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description Row - Full Width */}
                  <div className="space-y-3">
                    <Label className="text-slate-200 font-semibold text-sm">
                      Description <span className="text-slate-500 font-normal">(Optional)</span>
                    </Label>
                    <Textarea
                      value={row.description}
                      onChange={(e) => updateRow(row.id, { description: e.target.value })}
                      rows={3}
                      placeholder="Share details about this sacred occasion..."
                      className="w-full bg-slate-900/40 border-2 border-purple-500/20 text-white placeholder-slate-500 rounded-lg py-3 px-4 focus:border-purple-500/60 focus:bg-slate-900/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 resize-none text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-700/50">
            <Button
              type="button"
              variant="outline"
              onClick={addRow}
              disabled={batchMutation.isPending}
              className="w-full sm:w-auto border-2 border-purple-500/40 text-purple-300 hover:bg-purple-500/15 hover:border-purple-500/60 transition-all duration-300 gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Another Date
            </Button>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(ADMIN_ROUTES.SUBHA_SAHIT)}
                disabled={batchMutation.isPending}
                className="flex-1 sm:flex-none border-2 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all duration-300 font-medium"
              >
                Cancel
              </Button>
              <LoadingButton
                type="submit"
                isLoading={batchMutation.isPending}
                loadingText="Saving..."
                disabled={validRows.length === 0}
                className="flex-1 sm:flex-none bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-purple-600/50"
              >
                Save all ({validRows.length} date{validRows.length !== 1 ? 's' : ''})
              </LoadingButton>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
