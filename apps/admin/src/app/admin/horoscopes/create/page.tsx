'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import { Label, Textarea, ArrowLeftIcon, Button, DateInput } from '@jyotish/ui';
import { LoadingButton } from '@/components/ui';
import { getRashiDisplayName } from '@jyotish/shared';
import type { QuestionnaireLanguage } from '@jyotish/shared';
import { ADMIN_ROUTES, ADMIN_QUERY_KEYS, HOROSCOPE_CATEGORIES, ZODIAC_SIGNS } from '@/constants';
import type { CreateHoroscopeRequest, HoroscopeCategory, HoroscopeLanguage } from '@/types';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

const HOROSCOPE_LANGUAGES: HoroscopeLanguage[] = ['NEPALI', 'HINDI', 'ENGLISH'];

const selectClassName =
  'mt-1.5 h-11 w-full rounded-md border-2 border-purple-500/30 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder:text-slate-400 hover:border-purple-400/50 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 disabled:opacity-50';

interface BulkRow {
  id: string;
  zodiacSign: string;
  content: string;
}

export default function CreateHoroscopePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([{ id: '1', zodiacSign: '', content: '' }]);
  const [bulkShared, setBulkShared] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: 'DAILY' as HoroscopeCategory,
    language: 'NEPALI' as HoroscopeLanguage,
  });

  const createBulkMutation = useMutation({
    mutationFn: (data: { horoscopes: CreateHoroscopeRequest[] }) =>
      adminApi.horoscopes.createBulk(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.HOROSCOPES.ALL });
      const count = variables.horoscopes.length;
      toast.success(count === 1 ? 'Horoscope created' : `${count} horoscopes created`);
      router.push(ADMIN_ROUTES.HOROSCOPES);
    },
    onError: (e: Error) => toast.error(e?.message || 'Create failed'),
  });

  const addBulkRow = () => {
    setBulkRows((prev) => [...prev, { id: String(Date.now()), zodiacSign: '', content: '' }]);
  };

  const removeBulkRow = (id: string) => {
    setBulkRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };

  const updateBulkRow = (id: string, field: 'zodiacSign' | 'content', value: string) => {
    setBulkRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const onSubmitBulk = () => {
    const valid = bulkRows.filter((r) => r.zodiacSign && r.content.trim());
    if (valid.length === 0) {
      toast.error('Add at least one rashi with content');
      return;
    }
    createBulkMutation.mutate({
      horoscopes: valid.map((r) => ({
        zodiacSign: r.zodiacSign,
        category: bulkShared.category,
        date: bulkShared.date,
        content: r.content.trim(),
        language: bulkShared.language,
      })),
    });
  };

  return (
    <AdminLayout>
      <div className="w-full max-w-full text-left space-y-5 sm:space-y-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => router.push(ADMIN_ROUTES.HOROSCOPES)}
            className="p-2 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
            aria-label="Back to horoscopes"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold cosmic-text">Add Horoscope</h1>
            <p className="text-sm sm:text-base text-slate-400 mt-1">
              Add one or more rashi entries. Same date, period and language for all; add a row per
              Rashi.
            </p>
          </div>
        </div>

        <div className="cosmic-card p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
            <div>
              <Label className="text-slate-200 text-xs">Date</Label>
              <DateInput
                value={bulkShared.date}
                onChange={(e) => setBulkShared((s) => ({ ...s, date: e.target.value }))}
                className="mt-1 h-11 w-full bg-slate-900/50 border-purple-500/30 text-white [color-scheme:dark]"
                iconClassName="text-purple-400"
                nepaliDate
              />
            </div>
            <div>
              <Label className="text-slate-200 text-xs">Period</Label>
              <select
                value={bulkShared.category}
                onChange={(e) =>
                  setBulkShared((s) => ({ ...s, category: e.target.value as HoroscopeCategory }))
                }
                className={selectClassName}
              >
                {HOROSCOPE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-slate-200 text-xs">Language</Label>
              <select
                value={bulkShared.language}
                onChange={(e) =>
                  setBulkShared((s) => ({ ...s, language: e.target.value as HoroscopeLanguage }))
                }
                className={selectClassName}
              >
                {HOROSCOPE_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-3">
            {bulkRows.map((row) => (
              <div
                key={row.id}
                className="flex flex-col md:flex-row gap-3 items-start md:items-center"
              >
                <div className="w-full md:w-44 lg:w-48 flex-shrink-0">
                  <select
                    key={`bulk-rashi-${bulkShared.language}-${row.id}`}
                    value={row.zodiacSign}
                    onChange={(e) => updateBulkRow(row.id, 'zodiacSign', e.target.value)}
                    className={selectClassName}
                  >
                    <option value="">Select Rashi</option>
                    {ZODIAC_SIGNS.map((s) => (
                      <option key={s} value={s}>
                        {getRashiDisplayName(s, bulkShared.language as QuestionnaireLanguage)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full flex-1 min-w-0">
                  <Textarea
                    value={row.content}
                    onChange={(e) => updateBulkRow(row.id, 'content', e.target.value)}
                    placeholder="Content for this Rashi..."
                    rows={2}
                    className="block w-full max-w-none rounded-md border-2 border-purple-500/30 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeBulkRow(row.id)}
                  disabled={bulkRows.length <= 1}
                  className="border-slate-600 text-slate-400 hover:text-red-400 shrink-0 self-end md:self-auto"
                  aria-label="Remove row"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={addBulkRow}
              className="border-slate-600 text-slate-300 hover:bg-slate-800 gap-2 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Add row
            </Button>
            <LoadingButton
              type="button"
              isLoading={createBulkMutation.isPending}
              loadingText="Creating..."
              onClick={onSubmitBulk}
              className="w-full sm:w-auto"
            >
              Save
            </LoadingButton>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(ADMIN_ROUTES.HOROSCOPES)}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
