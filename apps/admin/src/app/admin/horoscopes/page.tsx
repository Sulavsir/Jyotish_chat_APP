'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin-api';
import { Button, DateInput, Label } from '@jyotish/ui';
import {
  AdminTable,
  AdminListPaginationSection,
  AdminRefreshButton,
  type AdminTableColumn,
} from '@/components/admin';
import { ConfirmDialog } from '@/components/ui';
import { getRashiDisplayName } from '@jyotish/shared';
import {
  ADMIN_ROUTES,
  ADMIN_QUERY_KEYS,
  HOROSCOPE_CATEGORIES,
  ZODIAC_SIGNS,
  PAGINATION_DEFAULTS,
  ADMIN_ROWS_PER_PAGE_OPTIONS,
} from '@/constants';
import type {
  AdminHoroscopeEntry,
  HoroscopeCategory,
  HoroscopeLanguage,
  ListHoroscopesParams,
} from '@/types';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useDebouncedPageSize } from '@/hooks';

export default function AdminHoroscopesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState<HoroscopeCategory>('DAILY');
  const [zodiacFilter, setZodiacFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState<HoroscopeLanguage | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const {
    pageSize: rowsPerPage,
    setPageSize: setRowsPerPage,
    debouncedPageSize: debouncedRowsPerPage,
  } = useDebouncedPageSize(PAGINATION_DEFAULTS.LIMIT);
  const [horoscopeToDelete, setHoroscopeToDelete] = useState<AdminHoroscopeEntry | null>(null);

  const listParams = useMemo<ListHoroscopesParams>(
    () => ({
      category: categoryFilter,
      ...(zodiacFilter && { zodiacSign: zodiacFilter }),
      ...(languageFilter && { language: languageFilter }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
      page,
      limit: debouncedRowsPerPage,
    }),
    [categoryFilter, zodiacFilter, languageFilter, dateFrom, dateTo, page, debouncedRowsPerPage]
  );

  useEffect(() => {
    setPage(PAGINATION_DEFAULTS.PAGE);
  }, [categoryFilter, zodiacFilter, languageFilter, dateFrom, dateTo, debouncedRowsPerPage]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.HOROSCOPES.LIST(listParams),
    queryFn: () => adminApi.horoscopes.list(listParams),
    placeholderData: keepPreviousData,
  });

  const handlePageSizeChange = (size: number) => {
    if (size === rowsPerPage) return;
    setRowsPerPage(size);
    setPage(PAGINATION_DEFAULTS.PAGE);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.horoscopes.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.HOROSCOPES.ALL });
      toast.success('Horoscope deleted');
      setHoroscopeToDelete(null);
    },
    onError: (e: Error) => toast.error(e?.message || 'Delete failed'),
  });

  const horoscopes = data?.horoscopes ?? [];
  const pagination = data?.pagination;

  const HOROSCOPE_LANGUAGES: HoroscopeLanguage[] = ['NEPALI', 'HINDI', 'ENGLISH'];

  const columns: AdminTableColumn<AdminHoroscopeEntry>[] = [
    {
      header: 'Rashi',
      accessor: (row) => (
        <span className="font-medium text-white">
          {getRashiDisplayName(
            row.zodiacSign,
            (row.language ?? 'NEPALI') as 'NEPALI' | 'HINDI' | 'ENGLISH'
          )}
        </span>
      ),
    },
    {
      header: 'Language',
      accessor: (row) => <span className="text-slate-300 text-sm">{row.language ?? 'NEPALI'}</span>,
    },
    {
      header: 'Category',
      accessor: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
          {row.category}
        </span>
      ),
    },
    {
      header: 'Date',
      accessor: (row) => (
        <span className="text-slate-300">
          {new Date(row.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      header: 'Content',
      accessor: (row) => (
        <span className="text-slate-400 max-w-xs truncate block" title={row.content}>
          {row.content}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push(ADMIN_ROUTES.HOROSCOPES_EDIT(row.id))}
            className="p-2 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setHoroscopeToDelete(row)}
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

  return (
    <>
      <div className="space-y-5 sm:space-y-6">
        <div className="space-y-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="min-w-0 flex-1 pr-1 text-2xl sm:text-3xl font-bold cosmic-text break-words">
              Horoscopes
            </h1>
            <div className="flex items-center gap-2 shrink-0 self-start flex-wrap justify-end">
              <AdminRefreshButton
                onClick={() => refetch()}
                loading={isFetching}
                className="shrink-0"
              />
              <Button
                onClick={() => router.push(ADMIN_ROUTES.HOROSCOPES_CREATE)}
                className="hidden sm:inline-flex gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add Horoscope
              </Button>
            </div>
          </div>
          <p className="text-sm sm:text-base text-slate-400">
            Manage daily, weekly, monthly and yearly horoscope content by Rashi
          </p>
          <Button
            onClick={() => router.push(ADMIN_ROUTES.HOROSCOPES_CREATE)}
            className="gap-2 w-full sm:hidden"
          >
            <Plus className="w-4 h-4" />
            Add Horoscope
          </Button>
        </div>

        <div className="cosmic-card p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4 items-end">
          <div className="w-full">
            <Label className="text-xs text-slate-400 mb-1 block">Category</Label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as HoroscopeCategory)}
              className="h-11 w-full rounded-md border-2 border-purple-500/30 bg-slate-800/50 px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
            >
              {HOROSCOPE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full">
            <Label className="text-xs text-slate-400 mb-1 block">Rashi</Label>
            <select
              value={zodiacFilter}
              onChange={(e) => setZodiacFilter(e.target.value)}
              className="h-11 w-full rounded-md border-2 border-purple-500/30 bg-slate-800/50 px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
            >
              <option value="">All</option>
              {ZODIAC_SIGNS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full">
            <Label className="text-xs text-slate-400 mb-1 block">Language</Label>
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value as HoroscopeLanguage | '')}
              className="h-11 w-full rounded-md border-2 border-purple-500/30 bg-slate-800/50 px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
            >
              <option value="">All</option>
              <option value="NEPALI">NEPALI</option>
              <option value="HINDI">HINDI</option>
              <option value="ENGLISH">ENGLISH</option>
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
            data={horoscopes}
            columns={columns}
            loading={isLoading}
            keyExtractor={(row) => row.id}
            emptyState={{
              title: 'No horoscopes found',
              description:
                zodiacFilter || languageFilter || dateFrom || dateTo
                  ? 'Try adjusting filters'
                  : `No ${categoryFilter.toLowerCase()} horoscopes yet. Add your first entry.`,
              action:
                !zodiacFilter && !languageFilter && !dateFrom && !dateTo
                  ? {
                      label: 'Add Horoscope',
                      onClick: () => router.push(ADMIN_ROUTES.HOROSCOPES_CREATE),
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
        isOpen={horoscopeToDelete !== null}
        onClose={() => {
          if (!deleteMutation.isPending) setHoroscopeToDelete(null);
        }}
        onConfirm={() => {
          if (horoscopeToDelete) deleteMutation.mutate(horoscopeToDelete.id);
        }}
        title="Delete horoscope entry?"
        description={
          horoscopeToDelete
            ? `${new Date(horoscopeToDelete.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })} · ${getRashiDisplayName(
                horoscopeToDelete.zodiacSign,
                (horoscopeToDelete.language ?? 'NEPALI') as 'NEPALI' | 'HINDI' | 'ENGLISH'
              )} · ${horoscopeToDelete.category}. This cannot be undone.`
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
