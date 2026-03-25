'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import { Button, DateInput, Label } from '@jyotish/ui';
import { ADMIN_QUERY_KEYS, ADMIN_ROUTES, TIP_AUDIENCES } from '@/constants';
import type { AdminDailyTip, ListTipsParams } from '@/types';
import { QUESTIONNAIRE_LANGUAGES } from '@jyotish/shared';
import type { QuestionnaireLanguage, TipAudience } from '@jyotish/shared';
import { AdminTable, type AdminTableColumn } from '@/components/admin';
import { toast } from 'sonner';
import { Plus, RefreshCw, Trash2, Pencil } from 'lucide-react';

export default function DailyPredictionsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [languageFilter, setLanguageFilter] = useState<QuestionnaireLanguage | ''>('');
  const [audienceFilter, setAudienceFilter] = useState<TipAudience | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const listParams: ListTipsParams = useMemo(
    () => ({
      ...(languageFilter && { language: languageFilter }),
      ...(audienceFilter && { audience: audienceFilter }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
      page,
      limit: 20,
    }),
    [languageFilter, audienceFilter, dateFrom, dateTo, page]
  );

  const { data, isLoading, refetch } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.TIPS.LIST(listParams),
    queryFn: () => adminApi.tips.list(listParams),
  });

  const tips = data?.tips ?? [];
  const pagination = data?.pagination;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.tips.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.TIPS.ALL });
      toast.success('Prediction deleted');
    },
    onError: (e: Error) => {
      toast.error(e?.message || 'Failed to delete prediction');
    },
  });

  const columns: AdminTableColumn<AdminDailyTip>[] = [
    {
      header: 'Date',
      accessor: (tip) => (
        <span className="text-slate-300">
          {new Date(tip.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      header: 'Language',
      accessor: (tip) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
          {tip.language}
        </span>
      ),
    },
    {
      header: 'Audience',
      accessor: (tip) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
          {tip.audience}
        </span>
      ),
    },
    {
      header: 'Prediction',
      accessor: (tip) => (
        <span className="text-slate-400 max-w-xs truncate block" title={tip.text}>
          {tip.text}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (tip) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={() => router.push(ADMIN_ROUTES.DAILY_PREDICTIONS_EDIT(tip.id))}
            className="p-2 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (!confirm('Delete this prediction?')) return;
              deleteMutation.mutate(tip.id);
            }}
            disabled={deleteMutation.isPending}
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      className: 'text-right',
    },
  ];

  const hasFilters = Boolean(languageFilter || audienceFilter || dateFrom || dateTo);

  return (
    <AdminLayout>
      <div className="space-y-5 sm:space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
          <div className="min-w-0 w-full lg:flex-1 lg:min-w-0">
            <div className="flex items-start justify-between gap-2 sm:items-center">
              <h1 className="min-w-0 flex-1 text-2xl sm:text-3xl font-bold cosmic-text leading-tight break-words">
                Daily Predictions
              </h1>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={() => refetch()}
                className="border-slate-700 text-white hover:bg-slate-800 shrink-0 w-auto lg:hidden"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            <p className="text-sm sm:text-base text-slate-400 mt-1">
              Manage daily dashboard predictions (tips) by date, language and audience.
            </p>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-2 lg:w-auto lg:flex-row lg:flex-wrap lg:items-center lg:justify-end lg:gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={() => refetch()}
              className="hidden lg:inline-flex border-slate-700 text-white hover:bg-slate-800 w-full lg:w-auto"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => router.push(ADMIN_ROUTES.DAILY_PREDICTIONS_CREATE)}
              className="gap-2 w-full lg:w-auto"
            >
              <Plus className="w-4 h-4" />
              Add Predictions
            </Button>
          </div>
        </div>

        <div className="cosmic-card p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 items-end">
          <div className="w-full">
            <Label className="text-xs text-slate-400 mb-1 block">Language</Label>
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value as QuestionnaireLanguage | '')}
              className="h-11 w-full rounded-md border-2 border-purple-500/30 bg-slate-800/50 px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
            >
              <option value="">All</option>
              {QUESTIONNAIRE_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full">
            <Label className="text-xs text-slate-400 mb-1 block">Audience</Label>
            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value as TipAudience | '')}
              className="h-11 w-full rounded-md border-2 border-purple-500/30 bg-slate-800/50 px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
            >
              <option value="">All</option>
              {TIP_AUDIENCES.map((aud) => (
                <option key={aud} value={aud}>
                  {aud}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full">
            <Label className="text-xs text-slate-400 mb-1 block">Date from</Label>
            <DateInput
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-11 w-full bg-slate-800/50 border-purple-500/30 text-white [color-scheme:dark]"
              iconClassName="text-purple-400"
              nepaliDate
            />
          </div>
          <div className="w-full">
            <Label className="text-xs text-slate-400 mb-1 block">Date to</Label>
            <DateInput
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-11 w-full bg-slate-800/50 border-purple-500/30 text-white [color-scheme:dark]"
              iconClassName="text-purple-400"
              nepaliDate
            />
          </div>
        </div>

        <div className="cosmic-card overflow-hidden">
          <AdminTable
            data={tips}
            columns={columns}
            loading={isLoading}
            keyExtractor={(tip) => tip.id}
            emptyState={{
              title: 'No predictions found',
              description: hasFilters
                ? 'Try adjusting filters'
                : 'No daily predictions yet. Add your first entry.',
              action: !hasFilters
                ? {
                    label: 'Add Predictions',
                    onClick: () => router.push(ADMIN_ROUTES.DAILY_PREDICTIONS_CREATE),
                  }
                : undefined,
              icon: <></>,
            }}
          />
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-wrap justify-center items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="border-slate-600 text-white"
            >
              Previous
            </Button>
            <span className="flex items-center px-2 sm:px-4 text-slate-400 text-xs sm:text-sm text-center">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="border-slate-600 text-white"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
