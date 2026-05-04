'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin-api';
import {
  Button,
  DateInput,
  Label,
  Textarea,
  ArrowLeftIcon,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
} from '@jyotish/ui';
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
  const initialOccasionFromQuery = searchParams?.get('occasion') ?? '';
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<SubhaSahitRow[]>([defaultRow()]);
  const [language, setLanguage] = useState<'en' | 'ne' | 'hi'>('en');
  const [isOccasionModalOpen, setIsOccasionModalOpen] = useState(false);
  const [newOccasion, setNewOccasion] = useState('');
  const [newPujaItems, setNewPujaItems] = useState('');
  const [newEstimatedTime, setNewEstimatedTime] = useState('');

  const { data: occasionsData } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.SUBHA_SAHIT.OCCASIONS({ language }),
    queryFn: () => adminApi.subhaSahit.getOccasions({ language }),
  });

  const occasions = occasionsData?.occasions ?? [];

  const batchMutation = useMutation({
    mutationFn: (payload: {
      dates: { date: string; occasion: string; description?: string }[];
      language?: 'en' | 'ne' | 'hi';
    }) => adminApi.subhaSahit.create(payload),
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
    batchMutation.mutate({ dates, language });
  };

  const handleAddOccasionInline = async () => {
    const trimmed = newOccasion.trim();
    if (!trimmed) return;
    try {
      await adminApi.subhaSahit.createOccasion({
        name: trimmed,
        language,
        pujaItems: newPujaItems.trim() || null,
        estimatedTime: newEstimatedTime.trim() || null,
      });
      await queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.SUBHA_SAHIT.OCCASIONS() });
      toast.success('Occasion added');
      setNewOccasion('');
      setNewPujaItems('');
      setNewEstimatedTime('');
      setIsOccasionModalOpen(false);
      // Pre-fill first empty row with this occasion
      setRows((prev) =>
        prev.map((row) => (!row.occasion.trim() ? { ...row, occasion: trimmed } : row))
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to add occasion';
      toast.error(message);
    }
  };

  return (
    <>
      <div className="w-full max-w-full min-w-0">
        {/* Header */}
        <div className="mb-6 sm:mb-10">
          <button
            type="button"
            onClick={() => router.push(ADMIN_ROUTES.SUBHA_SAHIT)}
            className="p-2 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-purple-500/15 transition-all duration-300 mb-3 sm:mb-4 inline-flex"
            aria-label="Back to Subha Sahit"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div className="space-y-2">
            <div className="flex items-start gap-2 sm:items-center">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 shrink-0 mt-1 sm:mt-0" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-300 via-purple-200 to-purple-400 bg-clip-text text-transparent leading-tight">
                Add Auspicious Dates
              </h1>
            </div>
            <p className="text-slate-400 text-sm sm:text-base lg:text-lg">
              Create sacred moments. Each date holds its own occasion and story.
            </p>
            <div className="mt-3 sm:mt-4 flex w-full sm:inline-flex sm:w-auto items-center gap-3 rounded-full border border-purple-500/40 bg-slate-900/60 px-3 sm:px-4 py-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-300 shrink-0">
                Language
              </span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'ne' | 'hi')}
                className="min-w-0 flex-1 sm:flex-none bg-transparent text-sm text-purple-200 focus:outline-none"
              >
                <option value="en">English</option>
                <option value="ne">नेपाली (Nepali)</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSaveAll} className="space-y-5 w-full">
          {/* Cards Container */}
          <div className="grid gap-5 w-full">
            {rows.map((row, index) => (
              <div
                key={row.id}
                className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-purple-500/20 rounded-2xl p-4 sm:p-6 lg:p-8 backdrop-blur-sm hover:border-purple-500/40 hover:shadow-2xl hover:shadow-purple-900/20 transition-all duration-300 overflow-hidden"
              >
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 via-transparent to-slate-600/0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" />

                {/* Section index + delete — in flow so labels/inputs never overlap */}
                <div className="relative z-10 mb-4 flex min-h-[2.25rem] items-center justify-between gap-3 sm:mb-5">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-purple-500/40 bg-purple-500/20">
                      <span className="text-xs font-semibold text-purple-300">{index + 1}</span>
                    </div>
                    <span className="sr-only">
                      Date entry {index + 1} of {rows.length}
                    </span>
                  </div>
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-500/15 hover:text-red-300"
                      aria-label="Remove this date"
                      title="Remove this date"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <div className="relative z-10 space-y-6">
                  {/* Date and Occasion Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                        nepaliDate
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-slate-200 font-semibold text-sm">
                          Occasion <span className="text-purple-400">*</span>
                        </Label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsOccasionModalOpen(true);
                            setNewOccasion(row.occasion || '');
                          }}
                          className="text-xs text-purple-300 hover:text-purple-100 underline-offset-2 hover:underline"
                        >
                          Add occasion
                        </button>
                      </div>
                      {occasions.length > 0 ? (
                        <select
                          value={row.occasion}
                          onChange={(e) => updateRow(row.id, { occasion: e.target.value })}
                          className="w-full mt-1.5 h-11 rounded-lg border-2 border-purple-500/30 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                        >
                          <option value="">Select occasion...</option>
                          {occasions.map((row) => (
                            <option key={row.occasion} value={row.occasion}>
                              {row.occasion}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="w-full mt-1.5 h-11 rounded-lg border-2 border-purple-500/30 bg-slate-900/50 px-3 py-2 text-sm text-slate-400 flex items-center justify-between">
                          <span>No occasions in this language yet.</span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsOccasionModalOpen(true);
                              setNewOccasion('');
                            }}
                            className="text-xs text-purple-300 hover:text-purple-100 underline-offset-2 hover:underline"
                          >
                            Add one
                          </button>
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
                      className="block w-full max-w-none bg-slate-900/40 border-2 border-purple-500/20 text-white placeholder-slate-500 rounded-lg py-3 px-4 focus:border-purple-500/60 focus:bg-slate-900/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 resize-y text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-slate-700/50">
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

        <Dialog open={isOccasionModalOpen} onOpenChange={setIsOccasionModalOpen}>
          <DialogContent className="bg-slate-900 border border-purple-500/30 w-[92vw] max-w-md max-h-[90dvh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-slate-100">
                Add Occasion for Selected Language
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-slate-200 text-sm">Language</Label>
                <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-slate-900/60 px-3 py-1 text-xs text-purple-200">
                  {language === 'en' && 'English'}
                  {language === 'ne' && 'नेपाली (Nepali)'}
                  {language === 'hi' && 'हिन्दी (Hindi)'}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-occasion" className="text-slate-200 text-sm">
                  Occasion name
                </Label>
                <Input
                  id="new-occasion"
                  value={newOccasion}
                  onChange={(e) => setNewOccasion(e.target.value)}
                  placeholder="e.g. शुभ विवाह मुहूर्त"
                  className="bg-slate-900 border-purple-500/40 text-white placeholder-slate-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-puja-items" className="text-slate-200 text-sm">
                  Puja items{' '}
                  <span className="text-slate-500 font-normal">(optional, comma-separated)</span>
                </Label>
                <Input
                  id="new-puja-items"
                  value={newPujaItems}
                  onChange={(e) => setNewPujaItems(e.target.value)}
                  placeholder="e.g. thal, batuka, vada"
                  className="bg-slate-900 border-purple-500/40 text-white placeholder-slate-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-estimated-time" className="text-slate-200 text-sm">
                  Estimated time <span className="text-slate-500 font-normal">(optional)</span>
                </Label>
                <Input
                  id="new-estimated-time"
                  value={newEstimatedTime}
                  onChange={(e) => setNewEstimatedTime(e.target.value)}
                  placeholder="e.g. 2 hours"
                  className="bg-slate-900 border-purple-500/40 text-white placeholder-slate-500"
                />
              </div>
            </div>
            <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOccasionModalOpen(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-800 w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAddOccasionInline}
                disabled={!newOccasion.trim()}
                className="bg-gradient-to-r from-cosmic-purple to-nebula-pink hover:opacity-90 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Save Occasion
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
