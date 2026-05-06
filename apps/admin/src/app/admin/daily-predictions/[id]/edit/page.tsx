'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin-api';
import { ADMIN_QUERY_KEYS, ADMIN_ROUTES, TIP_AUDIENCES } from '@/constants';
import type { AdminDailyTip } from '@/types';
import { Button, DateInput, Label, Textarea } from '@jyotish/ui';
import { LoadingButton } from '@/components/ui';
import { QUESTIONNAIRE_LANGUAGES, type QuestionnaireLanguage, type TipAudience } from '@jyotish/shared';
import { toast } from 'sonner';

const selectClassName =
  'mt-1.5 h-11 w-full rounded-md border-2 border-purple-500/30 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none';

export default function EditDailyPredictionPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const queryClient = useQueryClient();

  if (!id || typeof id !== 'string') {
    router.push(ADMIN_ROUTES.DAILY_PREDICTIONS);
    return null;
  }

  const { data, isLoading } = useQuery<AdminDailyTip>({
    queryKey: ADMIN_QUERY_KEYS.TIPS.DETAIL(id),
    queryFn: async () => {
      const res = await adminApi.tips.get(id);
      return res.tip as AdminDailyTip;
    },
  });

  const [date, setDate] = useState('');
  const [language, setLanguage] = useState<QuestionnaireLanguage>('NEPALI');
  const [audience, setAudience] = useState<TipAudience>('BOTH');
  const [text, setText] = useState('');

  useEffect(() => {
    if (!data) return;
    const isoDate = new Date(data.date).toISOString().slice(0, 10);
    setDate(isoDate);
    setLanguage(data.language);
    setAudience(data.audience);
    setText(data.text);
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!date.trim()) {
        toast.error('Date is required');
        return;
      }
      if (text.trim().length < 5) {
        toast.error('Prediction must be at least 5 characters');
        return;
      }
      await adminApi.tips.update(id, {
        date: date.trim(),
        text: text.trim(),
        language,
        audience,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.TIPS.ALL });
      toast.success('Prediction updated');
      router.push(ADMIN_ROUTES.DAILY_PREDICTIONS);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to update prediction';
      toast.error(message);
    },
  });

  const isSaving = updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  return (
    <>
      <div className="space-y-5 sm:space-y-6 w-full max-w-3xl min-w-0">
        <div className="flex items-start gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => router.push(ADMIN_ROUTES.DAILY_PREDICTIONS)}
            className="text-sm text-slate-400 hover:text-white mt-1"
          >
            ← Back to Daily Predictions
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Edit Daily Prediction</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Update the date, language, audience and prediction text.
            </p>
          </div>
        </div>

        {isLoading || !data ? (
          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 sm:p-6 text-slate-300 text-sm">
            Loading prediction details...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="cosmic-card p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-200">
                    Date <span className="text-red-400">*</span>
                  </Label>
                  <DateInput
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1.5 w-full bg-slate-900/50 border-purple-500/30 text-white [color-scheme:dark]"
                    nepaliDate
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-200">Language</Label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as QuestionnaireLanguage)}
                    className={selectClassName}
                  >
                    {QUESTIONNAIRE_LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-200">Audience</Label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as TipAudience)}
                    className={selectClassName}
                  >
                    {TIP_AUDIENCES.map((aud) => (
                      <option key={aud} value={aud}>
                        {aud}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-200">
                  Prediction text <span className="text-red-400">*</span>
                </Label>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={6}
                  placeholder="Enter the prediction / tip for this day..."
                  className="mt-1.5 block w-full max-w-none bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(ADMIN_ROUTES.DAILY_PREDICTIONS)}
                disabled={isSaving}
                className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white w-full sm:w-auto"
              >
                Cancel
              </Button>
              <LoadingButton
                type="submit"
                isLoading={isSaving}
                loadingText="Saving..."
                className="w-full sm:w-auto"
              >
                Update prediction
              </LoadingButton>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
