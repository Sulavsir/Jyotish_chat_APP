'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import type { SubhaSahitApiLanguage, SubhaSahitOccasionListItem } from '@jyotish/shared';
import { adminApi } from '@/lib/admin-api';
import { Button, Label, Input } from '@jyotish/ui';
import {
  AdminTable,
  AdminRefreshButton,
  AdminClearFiltersButton,
  type AdminTableColumn,
} from '@/components/admin';
import {
  AddSubhaSahitOccasionDialog,
  EditSubhaSahitOccasionMetaDialog,
} from '@/components/subha-sahit';
import { ConfirmDialog } from '@/components/ui';
import { ADMIN_QUERY_KEYS, ADMIN_ROUTES } from '@/constants';
import { useDebounce } from '@/hooks';
import { Plus, Pencil, Calendar, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const SEARCH_DEBOUNCE_MS = 300;

const LANGUAGE_FILTER_OPTIONS: Array<{
  value: '' | SubhaSahitApiLanguage;
  label: string;
}> = [
  { value: '', label: 'All languages' },
  { value: 'en', label: 'English' },
  { value: 'ne', label: 'नेपाली (Nepali)' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
];

function languageLabel(row: SubhaSahitOccasionListItem) {
  if (!row.language) return '—';
  if (row.language === 'en') return 'EN';
  if (row.language === 'ne') return 'NE';
  return 'HI';
}

export default function OccasionsPage() {
  const queryClient = useQueryClient();
  const [language, setLanguage] = useState<'' | SubhaSahitApiLanguage>('');
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<SubhaSahitOccasionListItem | null>(null);
  const [occasionToDelete, setOccasionToDelete] = useState<SubhaSahitOccasionListItem | null>(
    null
  );

  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS);
  const languageParam = language || undefined;

  const occasionsQueryKey = useMemo(
    () => ADMIN_QUERY_KEYS.SUBHA_SAHIT.OCCASIONS({ language: languageParam }),
    [languageParam]
  );

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: occasionsQueryKey,
    queryFn: () => adminApi.subhaSahit.getOccasions({ language: languageParam }),
    placeholderData: keepPreviousData,
  });

  const occasions = data?.occasions ?? [];

  const filteredOccasions = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return occasions;
    return occasions.filter(
      (row) =>
        row.occasion.toLowerCase().includes(q) ||
        (row.pujaItems ?? '').toLowerCase().includes(q) ||
        (row.estimatedTime ?? '').toLowerCase().includes(q)
    );
  }, [occasions, debouncedSearch]);

  const hasActiveFilters = Boolean(language || search);

  const clearFilters = useCallback(() => {
    setLanguage('');
    setSearch('');
  }, []);

  const deleteMutation = useMutation({
    mutationFn: adminApi.subhaSahit.deleteOccasion,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'subha-sahit', 'occasions'] });
      await queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.SUBHA_SAHIT.ALL });
      toast.success('Occasion removed');
      setOccasionToDelete(null);
    },
    onError: (e: Error) => {
      toast.error(e?.message || 'Failed to delete occasion');
    },
  });

  const columns: AdminTableColumn<SubhaSahitOccasionListItem>[] = useMemo(
    () => [
      {
        header: 'Occasion',
        accessor: (row) => <span className="text-slate-200 font-medium">{row.occasion}</span>,
      },
      {
        header: 'Language',
        accessor: (row) => (
          <span className="text-xs text-slate-400 uppercase tabular-nums">
            {languageLabel(row)}
          </span>
        ),
      },
      {
        header: 'Puja items',
        accessor: (row) => (
          <span
            className="text-slate-400 max-w-md truncate block"
            title={row.pujaItems ?? ''}
          >
            {row.pujaItems || '—'}
          </span>
        ),
      },
      {
        header: 'Est. time',
        accessor: (row) => (
          <span className="text-slate-400 whitespace-nowrap">{row.estimatedTime || '—'}</span>
        ),
      },
      {
        header: 'Actions',
        accessor: (row) => (
          <div className="flex justify-end gap-0.5">
            {row.language ? (
              <>
                <button
                  type="button"
                  onClick={() => setEditingRow(row)}
                  className="inline-flex items-center gap-1 rounded-lg p-2 text-slate-400 hover:text-purple-300 hover:bg-purple-500/10"
                  title="Edit puja items and estimated time"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setOccasionToDelete(row)}
                  className="inline-flex items-center gap-1 rounded-lg p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                  title="Delete occasion"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            ) : (
              <span className="text-xs text-slate-500">—</span>
            )}
          </div>
        ),
        className: 'text-right w-[1%]',
      },
    ],
    [deleteMutation.isPending]
  );

  const emptyTitle =
    filteredOccasions.length === 0 && occasions.length > 0
      ? 'No matching occasions'
      : 'No occasions yet';
  const emptyDescription =
    filteredOccasions.length === 0 && occasions.length > 0
      ? 'Try a different search or clear filters'
      : 'Add an occasion for Book Pujari Ji, then manage auspicious dates on Subha Sahit.';

  return (
    <>
      <div className="space-y-5 sm:space-y-6">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <h1 className="min-w-0 flex-1 pr-1 text-2xl sm:text-3xl font-bold leading-tight text-white break-words">
              Occasions
            </h1>
            <div className="flex shrink-0 flex-row flex-wrap items-center justify-end gap-2">
              <AdminRefreshButton
                onClick={() => {
                  void refetch();
                }}
                loading={isFetching}
                className="shrink-0"
              />
              <Button
                variant="outline"
                asChild
                size="sm"
                className="hidden shrink-0 border-purple-500/40 text-purple-300 hover:bg-purple-500/10 sm:inline-flex"
              >
                <Link href={ADMIN_ROUTES.SUBHA_SAHIT}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Auspicious dates
                </Link>
              </Button>
              <Button
                onClick={() => setAddOpen(true)}
                className="hidden shrink-0 bg-gradient-to-r from-cosmic-purple to-nebula-pink hover:opacity-90 sm:inline-flex"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add occasion
              </Button>
            </div>
          </div>
          <p className="text-sm sm:text-base text-slate-400">
            Book Pujari Ji · occasion names, puja items, and estimated time. You can delete an
            occasion only if it has no real Subha Sahit dates (only catalog / placeholder rows).
          </p>
          <div className="flex flex-col gap-2 sm:hidden">
            <Button variant="outline" asChild className="w-full border-purple-500/40 text-purple-300">
              <Link href={ADMIN_ROUTES.SUBHA_SAHIT}>
                <Calendar className="w-4 h-4 mr-2" />
                Auspicious dates
              </Link>
            </Button>
            <Button
              onClick={() => setAddOpen(true)}
              className="w-full bg-gradient-to-r from-cosmic-purple to-nebula-pink hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add occasion
            </Button>
          </div>
        </div>

        <div className="cosmic-card p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:flex-nowrap lg:items-end lg:gap-4">
            <div className="min-w-0 flex-1 basis-0 space-y-2">
              <Label className="text-white font-medium text-sm block">Search</Label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by occasion, puja items, or time"
                className="h-11 w-full rounded-md border-2 border-purple-500/30 bg-slate-900/50 text-white placeholder:text-slate-500 [color-scheme:dark]"
              />
            </div>
            <div className="min-w-0 flex-1 basis-0 space-y-2">
              <Label className="text-white font-medium text-sm block">Language</Label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as '' | SubhaSahitApiLanguage)}
                className="h-11 w-full rounded-md border-2 border-purple-500/30 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
              >
                {LANGUAGE_FILTER_OPTIONS.map((o) => (
                  <option key={o.value || 'all'} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <AdminClearFiltersButton
              show={hasActiveFilters}
              onClear={clearFilters}
              disabled={isLoading || isFetching}
              className="w-full shrink-0 self-end lg:w-auto"
            />
          </div>
        </div>

        <div className="cosmic-card rounded-xl overflow-hidden">
          <AdminTable
            data={filteredOccasions}
            loading={isLoading}
            keyExtractor={(row) => `${row.language ?? 'x'}-${row.occasion}`}
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
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              ),
              title: emptyTitle,
              description: emptyDescription,
            }}
          />
        </div>
      </div>

      <AddSubhaSahitOccasionDialog open={addOpen} onOpenChange={setAddOpen} />
      <EditSubhaSahitOccasionMetaDialog
        row={editingRow}
        onClose={() => setEditingRow(null)}
      />

      <ConfirmDialog
        isOpen={occasionToDelete !== null}
        onClose={() => {
          if (!deleteMutation.isPending) setOccasionToDelete(null);
        }}
        onConfirm={() => {
          if (occasionToDelete?.language) {
            deleteMutation.mutate({
              language: occasionToDelete.language,
              occasion: occasionToDelete.occasion,
            });
          }
        }}
        title="Delete this occasion?"
        description={
          occasionToDelete
            ? `${occasionToDelete.occasion} (${occasionToDelete.language}). Puja details and placeholder rows will be removed. Not allowed if Subha Sahit dates still use this occasion.`
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
