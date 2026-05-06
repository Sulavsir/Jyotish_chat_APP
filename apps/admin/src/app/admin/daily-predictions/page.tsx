'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin-api';
import { Button, DateInput, Label, getTodayDateRange } from '@jyotish/ui';
import {
  ADMIN_QUERY_KEYS,
  ADMIN_ROUTES,
  TIP_AUDIENCES,
  PAGINATION_DEFAULTS,
  ADMIN_ROWS_PER_PAGE_OPTIONS,
} from '@/constants';
import type { AdminDailyTip, ListTipsParams } from '@/types';
import { QUESTIONNAIRE_LANGUAGES, type QuestionnaireLanguage, type TipAudience } from '@jyotish/shared';
import {
  AdminTable,
  AdminListPaginationSection,
  AdminRefreshButton,
  AdminDualCalendarDateCell,
  type AdminTableColumn,
} from '@/components/admin';
import { ConfirmDialog } from '@/components/ui';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { useDebouncedPageSize } from '@/hooks';
import { useNepaliDateBulkMap } from '@/hooks/useNepaliDateBulkMap';
import { calendarPrimaryFromAdminLanguageFilter } from '@/utils/admin-table-calendar-primary';
import { toIsoDateKeyLocal } from '@/utils/to-iso-date-key-local';

export default function DailyPredictionsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const defaultListDates = useMemo(() => getTodayDateRange(), []);
  const [languageFilter, setLanguageFilter] = useState<QuestionnaireLanguage | ''>('');
  const [audienceFilter, setAudienceFilter] = useState<TipAudience | ''>('');
  const [dateFrom, setDateFrom] = useState(defaultListDates.from);
  const [dateTo, setDateTo] = useState(defaultListDates.to);
  const [page, setPage] = useState(1);
  const {
    pageSize: rowsPerPage,
    setPageSize: setRowsPerPage,
    debouncedPageSize: debouncedRowsPerPage,
  } = useDebouncedPageSize(PAGINATION_DEFAULTS.LIMIT);
  const [tipToDelete, setTipToDelete] = useState<AdminDailyTip | null>(null);

  const listParams: ListTipsParams = useMemo(
    () => ({
      ...(languageFilter && { language: languageFilter }),
      ...(audienceFilter && { audience: audienceFilter }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
      page,
      limit: debouncedRowsPerPage,
    }),
    [languageFilter, audienceFilter, dateFrom, dateTo, page, debouncedRowsPerPage]
  );

  useEffect(() => {
    setPage(PAGINATION_DEFAULTS.PAGE);
  }, [languageFilter, audienceFilter, dateFrom, dateTo, debouncedRowsPerPage]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.TIPS.LIST(listParams),
    queryFn: () => adminApi.tips.list(listParams),
    placeholderData: keepPreviousData,
  });

  const handlePageSizeChange = (size: number) => {
    if (size === rowsPerPage) return;
    setRowsPerPage(size);
    setPage(PAGINATION_DEFAULTS.PAGE);
  };

  const tips = data?.tips ?? [];
  const pagination = data?.pagination;

  const tipDatesForBs = useMemo(() => tips.map((t) => t.date), [tips]);
  const { data: tipBsMap = {}, isLoading: tipBsLoading } = useNepaliDateBulkMap(tipDatesForBs);
  const tipDatePrimary = calendarPrimaryFromAdminLanguageFilter(languageFilter || '');

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.tips.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.TIPS.ALL });
      toast.success('Prediction deleted');
      setTipToDelete(null);
    },
    onError: (e: Error) => {
      toast.error(e?.message || 'Failed to delete prediction');
    },
  });

  const columns: AdminTableColumn<AdminDailyTip>[] = [
    {
      header: 'Date',
      accessor: (tip) => (
        <AdminDualCalendarDateCell
          value={tip.date}
          bsMapping={tipBsMap[toIsoDateKeyLocal(tip.date)]}
          primary={tipDatePrimary}
          isLoading={tipBsLoading}
        />
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
            onClick={() => setTipToDelete(tip)}
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

  const dateFilterActive = dateFrom !== defaultListDates.from || dateTo !== defaultListDates.to;
  const hasFilters = Boolean(languageFilter || audienceFilter || dateFilterActive);

  return (
    <>
      <div className="space-y-5 sm:space-y-6">
        <div className="space-y-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="min-w-0 flex-1 pr-1 text-2xl sm:text-3xl font-bold cosmic-text break-words">
              Daily Predictions
            </h1>
            <div className="flex items-center gap-2 shrink-0 self-start flex-wrap justify-end">
              <AdminRefreshButton
                onClick={() => refetch()}
                loading={isFetching}
                className="shrink-0"
              />
              <Button
                onClick={() => router.push(ADMIN_ROUTES.DAILY_PREDICTIONS_CREATE)}
                className="hidden sm:inline-flex gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add Predictions
              </Button>
            </div>
          </div>
          <p className="text-sm sm:text-base text-slate-400">
            Manage daily dashboard predictions (tips) by date, language and audience.
          </p>
          <Button
            onClick={() => router.push(ADMIN_ROUTES.DAILY_PREDICTIONS_CREATE)}
            className="gap-2 w-full sm:hidden"
          >
            <Plus className="w-4 h-4" />
            Add Predictions
          </Button>
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

        {!isLoading && pagination && (
          <AdminListPaginationSection
            pagination={{
              page: pagination.page,
              limit: pagination.limit,
              total: pagination.total,
              totalPages: pagination.totalPages,
            }}
            onPageChange={setPage}
            pageSize={rowsPerPage}
            pageSizeOptions={ADMIN_ROWS_PER_PAGE_OPTIONS}
            onPageSizeChange={handlePageSizeChange}
            disabled={isFetching}
          />
        )}
      </div>

      <ConfirmDialog
        isOpen={tipToDelete !== null}
        onClose={() => {
          if (!deleteMutation.isPending) setTipToDelete(null);
        }}
        onConfirm={() => {
          if (tipToDelete) deleteMutation.mutate(tipToDelete.id);
        }}
        title="Delete this prediction?"
        description={
          tipToDelete
            ? `${new Date(tipToDelete.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })} · ${tipToDelete.language} · ${tipToDelete.audience}. This cannot be undone.`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive
        isLoading={deleteMutation.isPending}
        icon={<Trash2 className="w-6 h-6 text-red-400" />}
      />
    </>
  );
}
