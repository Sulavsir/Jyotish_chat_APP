'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import { Button, DateInput, Label, Textarea, ArrowLeftIcon } from '@jyotish/ui';
import { LoadingButton } from '@/components/ui';
import { ADMIN_QUERY_KEYS, ADMIN_ROUTES, TIP_AUDIENCES } from '@/constants';
import type { CreateTipRequest } from '@/types';
import type { QuestionnaireLanguage, TipAudience } from '@jyotish/shared';
import { QUESTIONNAIRE_LANGUAGES } from '@jyotish/shared';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

const selectClassName =
  'mt-1.5 h-11 w-full rounded-md border-2 border-purple-500/30 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none';

interface TipRow {
  id: string;
  date: string;
  language: QuestionnaireLanguage;
  audience: TipAudience;
  text: string;
}

const defaultRow = (): TipRow => ({
  id: crypto.randomUUID(),
  date: new Date().toISOString().slice(0, 10),
  language: 'NEPALI',
  audience: 'BOTH',
  text: '',
});

export default function CreateDailyPredictionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<TipRow[]>([defaultRow()]);

  const batchMutation = useMutation({
    mutationFn: (payload: { tips: CreateTipRequest[] }) => adminApi.tips.create(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.TIPS.ALL });
      toast.success(`${variables.tips.length} prediction(s) created`);
      router.push(ADMIN_ROUTES.DAILY_PREDICTIONS);
    },
    onError: (e: Error) => {
      toast.error(e?.message || 'Failed to create predictions');
    },
  });

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, defaultRow()]);
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  }, []);

  const updateRow = useCallback((id: string, updates: Partial<TipRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  }, []);

  const validRows = rows.filter((r) => r.date && r.text.trim().length >= 5);

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    if (validRows.length === 0) {
      toast.error('Add at least one prediction with date and text (min 5 characters).');
      return;
    }
    const tips: CreateTipRequest[] = validRows.map(({ date, text, language, audience }) => ({
      date,
      text: text.trim(),
      language,
      audience,
    }));
    batchMutation.mutate({ tips });
  };

  return (
    <AdminLayout>
      <div className="space-y-5 sm:space-y-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => router.push(ADMIN_ROUTES.DAILY_PREDICTIONS)}
            className="p-2 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
            aria-label="Back to Daily Predictions"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold cosmic-text">Add Daily Predictions</h1>
            <p className="text-sm sm:text-base text-slate-400 mt-1">
              Add one or more predictions for different dates. Fill in each row and save all at once.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveAll} className="space-y-6 w-full">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className="cosmic-card p-4 sm:p-6 space-y-4 relative"
            >
              <div className="mb-2 flex min-h-[2.25rem] items-center justify-between gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-purple-500/40 bg-purple-500/20">
                  <span className="text-xs font-semibold text-purple-300">{index + 1}</span>
                </div>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    aria-label="Remove row"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-200">Date <span className="text-red-400">*</span></Label>
                  <DateInput
                    min={new Date().toISOString().slice(0, 10)}
                    value={row.date}
                    onChange={(e) => updateRow(row.id, { date: e.target.value })}
                    className="mt-1.5 w-full bg-slate-900/50 border-purple-500/30 text-white [color-scheme:dark]"
                    nepaliDate
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-200">Language</Label>
                  <select
                    value={row.language}
                    onChange={(e) => updateRow(row.id, { language: e.target.value as QuestionnaireLanguage })}
                    className={selectClassName}
                  >
                    {QUESTIONNAIRE_LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-200">Audience</Label>
                  <select
                    value={row.audience}
                    onChange={(e) => updateRow(row.id, { audience: e.target.value as TipAudience })}
                    className={selectClassName}
                  >
                    {TIP_AUDIENCES.map((aud) => (
                      <option key={aud} value={aud}>{aud}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-200">Prediction text <span className="text-red-400">*</span></Label>
                <Textarea
                  value={row.text}
                  onChange={(e) => updateRow(row.id, { text: e.target.value })}
                  rows={4}
                  placeholder="Enter the prediction / tip for this day..."
                  className="mt-1.5 block w-full max-w-none bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
          ))}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={addRow}
              disabled={batchMutation.isPending}
              className="w-full sm:w-auto border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add another date
            </Button>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(ADMIN_ROUTES.DAILY_PREDICTIONS)}
                disabled={batchMutation.isPending}
                className="flex-1 sm:flex-none border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Cancel
              </Button>
              <LoadingButton
                type="submit"
                isLoading={batchMutation.isPending}
                loadingText="Saving..."
                disabled={validRows.length === 0}
                className="flex-1 sm:flex-none"
              >
                Save all ({validRows.length} prediction{validRows.length !== 1 ? 's' : ''})
              </LoadingButton>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
