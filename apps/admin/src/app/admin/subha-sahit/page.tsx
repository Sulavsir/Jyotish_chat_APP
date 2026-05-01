'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin-api';
import { Button, Label, AdminMonthRangeFilter, getTodayDateRange } from '@jyotish/ui';
import {
  ADMIN_QUERY_KEYS,
  ADMIN_ROUTES,
  PAGINATION_DEFAULTS,
  ADMIN_ROWS_PER_PAGE_OPTIONS,
  ADMIN_DATE_FILTER_DEBOUNCE_MS,
} from '@/constants';
import type { ListSubhaSahitDatesParams, SubhaSahitDate } from '@/types';
import {
  AdminTable,
  AdminListPaginationSection,
  AdminRefreshButton,
  AdminClearFiltersButton,
  type AdminTableColumn,
} from '@/components/admin';
import { ConfirmDialog } from '@/components/ui';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, BookOpen } from 'lucide-react';
import { formatAdminDate } from '@/utils/helpers';
import { useDebouncedPageSize, useDebounce } from '@/hooks';

export default function SubhaSahitPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [occasionFilter, setOccasionFilter] = useState('');
  const [dateRange, setDateRange] = useState(getTodayDateRange);
  const debouncedDateFrom = useDebounce(dateRange.from, ADMIN_DATE_FILTER_DEBOUNCE_MS);
  const debouncedDateTo = useDebounce(dateRange.to, ADMIN_DATE_FILTER_DEBOUNCE_MS);
  const [page, setPage] = useState(1);
  const {
    pageSize: rowsPerPage,
    setPageSize: setRowsPerPage,
    debouncedPageSize: debouncedRowsPerPage,
  } = useDebouncedPageSize(PAGINATION_DEFAULTS.LIMIT);
  const [language, setLanguage] = useState<'en' | 'ne' | 'hi' | ''>('');
  const [dateToDelete, setDateToDelete] = useState<SubhaSahitDate | null>(null);

  const { data: occasionsData } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.SUBHA_SAHIT.OCCASIONS(),
    queryFn: () => adminApi.subhaSahit.getOccasions(),
  });

  const occasionList = occasionsData?.occasions ?? [];

  const listParams: ListSubhaSahitDatesParams = useMemo(
    () => ({
      ...(occasionFilter && { occasion: occasionFilter }),
      ...(debouncedDateFrom && { dateFrom: debouncedDateFrom }),
      ...(debouncedDateTo && { dateTo: debouncedDateTo }),
      ...(language && { language }),
      page,
      limit: debouncedRowsPerPage,
    }),
    [occasionFilter, debouncedDateFrom, debouncedDateTo, language, page, debouncedRowsPerPage]
  );

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.SUBHA_SAHIT.LIST(listParams),
    queryFn: () => adminApi.subhaSahit.list(listParams),
  });

  const dates = data?.dates ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    limit: debouncedRowsPerPage,
    total: 0,
    totalPages: 0,
  };

  useEffect(() => {
    setPage(PAGINATION_DEFAULTS.PAGE);
  }, [debouncedRowsPerPage]);

  useEffect(() => {
    setPage(PAGINATION_DEFAULTS.PAGE);
  }, [debouncedDateFrom, debouncedDateTo, occasionFilter, language]);

  const defaultDateRange = getTodayDateRange();
  const hasListFilters = Boolean(
    occasionFilter ||
      language ||
      dateRange.from !== defaultDateRange.from ||
      dateRange.to !== defaultDateRange.to
  );

  const clearListFilters = useCallback(() => {
    setOccasionFilter('');
    setLanguage('');
    setDateRange(getTodayDateRange());
    setPage(PAGINATION_DEFAULTS.PAGE);
  }, []);

  const handlePageSizeChange = (size: number) => {
    if (size === rowsPerPage) return;
    setRowsPerPage(size);
    setPage(PAGINATION_DEFAULTS.PAGE);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.subhaSahit.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.SUBHA_SAHIT.ALL });
      toast.success('Subha Sahit date deleted');
      setDateToDelete(null);
    },
    onError: (e: Error) => {
      toast.error(e?.message || 'Failed to delete date');
    },
  });

  const columns: AdminTableColumn<SubhaSahitDate>[] = [
    {
      header: 'Date',
      accessor: (date) => <span className="text-slate-300">{formatAdminDate(date.date)}</span>,
    },
    {
      header: 'Occasion',
      accessor: (date) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
          {date.occasion}
        </span>
      ),
    },
    {
      header: 'Language',
      accessor: (date) => (
        <span className="text-xs text-slate-400 uppercase">{date.language ?? 'EN'}</span>
      ),
    },
    {
      header: 'Description',
      accessor: (date) => (
        <span className="text-slate-400 max-w-xs truncate block" title={date.description || ''}>
          {date.description || '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (date) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            date.isActive
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}
        >
          {date.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (date) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={() => router.push(ADMIN_ROUTES.SUBHA_SAHIT_EDIT(date.id))}
            className="p-2 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDateToDelete(date)}
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      className: 'text-right',
    },
  ];

  return (
    <>
      <div className="space-y-5 sm:space-y-6">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <h1 className="min-w-0 flex-1 pr-1 text-2xl sm:text-3xl font-bold leading-tight text-white break-words">
              Subha Sahit
            </h1>
            <div className="flex shrink-0 flex-row flex-wrap items-center justify-end gap-2">
              <Button
                variant="outline"
                asChild
                size="sm"
                className="hidden shrink-0 border-purple-500/40 text-purple-300 hover:bg-purple-500/10 sm:inline-flex"
              >
                <Link href={ADMIN_ROUTES.OCCASIONS}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Occasions
                </Link>
              </Button>
              <AdminRefreshButton
                onClick={() => refetch()}
                loading={isFetching}
                className="shrink-0"
              />
              <Button
                onClick={() => router.push(ADMIN_ROUTES.SUBHA_SAHIT_CREATE)}
                className="hidden shrink-0 bg-gradient-to-r from-cosmic-purple to-nebula-pink hover:opacity-90 sm:inline-flex"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add dates
              </Button>
            </div>
          </div>
          <p className="text-sm sm:text-base text-slate-400">
            Auspicious dates for Book Pujari Ji. Manage occasion names and puja details on{' '}
            <Link
              href={ADMIN_ROUTES.OCCASIONS}
              className="text-purple-300 hover:text-purple-200 underline-offset-2 hover:underline"
            >
              Occasions
            </Link>
            .
          </p>
          <div className="flex flex-col gap-2 sm:hidden">
            <Button
              variant="outline"
              asChild
              className="w-full border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
            >
              <Link href={ADMIN_ROUTES.OCCASIONS}>
                <BookOpen className="w-4 h-4 mr-2" />
                Occasions
              </Link>
            </Button>
            <Button
              onClick={() => router.push(ADMIN_ROUTES.SUBHA_SAHIT_CREATE)}
              className="w-full bg-gradient-to-r from-cosmic-purple to-nebula-pink hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add dates
            </Button>
          </div>
        </div>

        <div className="cosmic-card p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:flex-nowrap lg:items-end lg:gap-4">
            <div className="min-w-0 flex-1 basis-0 space-y-2">
              <Label className="text-white font-medium text-sm block">Filter by Occasion</Label>
              <select
                value={occasionFilter}
                onChange={(e) => {
                  setOccasionFilter(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full rounded-md border-2 border-purple-500/30 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="">All occasions</option>
                {occasionList.map((row) => (
                  <option
                    key={`${row.language ?? 'x'}-${row.occasion}`}
                    value={row.occasion}
                  >
                    {row.language ? `${row.occasion} (${row.language})` : row.occasion}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0 flex-1 basis-0 space-y-2">
              <Label className="text-white font-medium text-sm block">Language</Label>
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value as 'en' | 'ne' | 'hi' | '');
                  setPage(1);
                }}
                className="h-11 w-full rounded-md border-2 border-purple-500/30 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="">All languages</option>
                <option value="en">English</option>
                <option value="ne">नेपाली (Nepali)</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
            </div>
            <div className="min-w-0 flex-1 basis-0 space-y-2">
              <Label className="text-white font-medium text-sm block">Date</Label>
              <AdminMonthRangeFilter
                fromValue={dateRange.from}
                toValue={dateRange.to}
                onRangeChange={(from, to) => {
                  setDateRange({ from, to });
                  setPage(PAGINATION_DEFAULTS.PAGE);
                }}
                disabled={isLoading || isFetching}
                showInlineFilterPrefix={false}
                className="w-full min-w-0"
              />
            </div>
            <AdminClearFiltersButton
              show={hasListFilters}
              onClear={clearListFilters}
              disabled={isLoading || isFetching}
              className="w-full shrink-0 self-end lg:w-auto"
            />
          </div>
        </div>

        <div className="cosmic-card rounded-xl overflow-hidden">
          <AdminTable
            data={dates}
            loading={isLoading}
            keyExtractor={(date) => date.id}
            columns={columns}
            showSerialNumber
            emptyState={{
              icon: (
                <svg
                  className="w-12 h-12 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              ),
              title:
                occasionFilter || debouncedDateFrom || debouncedDateTo || language
                  ? 'No Subha Sahit dates found'
                  : 'No Subha Sahit dates',
              description:
                occasionFilter || debouncedDateFrom || debouncedDateTo || language
                  ? 'Try adjusting your filters'
                  : 'Add auspicious dates for Book Pujari Ji.',
            }}
          />
        </div>

        {!isLoading && (
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
        isOpen={dateToDelete !== null}
        onClose={() => {
          if (!deleteMutation.isPending) setDateToDelete(null);
        }}
        onConfirm={() => {
          if (dateToDelete) deleteMutation.mutate(dateToDelete.id);
        }}
        title="Delete Subha Sahit date?"
        description={
          dateToDelete
            ? `${formatAdminDate(dateToDelete.date)} · ${dateToDelete.occasion}. This cannot be undone.`
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
