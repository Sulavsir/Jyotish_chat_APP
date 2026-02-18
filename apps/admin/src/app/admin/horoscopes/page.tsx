'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import { Button, DateInput, Label } from '@jyotish/ui';
import { AdminTable, type AdminTableColumn } from '@/components/admin';
import { getRashiDisplayName } from '@jyotish/shared';
import { ADMIN_ROUTES, ADMIN_QUERY_KEYS, HOROSCOPE_CATEGORIES, ZODIAC_SIGNS } from '@/constants';
import type { AdminHoroscopeEntry, HoroscopeCategory, HoroscopeLanguage, ListHoroscopesParams } from '@/types';
import { toast } from 'sonner';
import { RefreshCw, Plus, Pencil, Trash2 } from 'lucide-react';

export default function AdminHoroscopesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState<HoroscopeCategory>('DAILY');
  const [zodiacFilter, setZodiacFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState<HoroscopeLanguage | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const listParams = useMemo<ListHoroscopesParams>(() => ({
    category: categoryFilter,
    ...(zodiacFilter && { zodiacSign: zodiacFilter }),
    ...(languageFilter && { language: languageFilter }),
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
    page,
    limit: 20,
  }), [categoryFilter, zodiacFilter, languageFilter, dateFrom, dateTo, page]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.HOROSCOPES.LIST(listParams),
    queryFn: () => adminApi.horoscopes.list(listParams),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.horoscopes.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.HOROSCOPES.ALL });
      toast.success('Horoscope deleted');
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
          {getRashiDisplayName(row.zodiacSign, (row.language ?? 'NEPALI') as 'NEPALI' | 'HINDI' | 'ENGLISH')}
        </span>
      ),
    },
    {
      header: 'Language',
      accessor: (row) => (
        <span className="text-slate-300 text-sm">{row.language ?? 'NEPALI'}</span>
      ),
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
          {new Date(row.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
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
            onClick={() => {
              if (confirm('Delete this horoscope entry?')) deleteMutation.mutate(row.id);
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold cosmic-text">Horoscopes</h1>
            <p className="text-slate-400 mt-1">Manage daily, weekly, monthly and yearly horoscope content by Rashi</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={() => refetch()}
              className="border-slate-700 text-white hover:bg-slate-800"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => router.push(ADMIN_ROUTES.HOROSCOPES_CREATE)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Horoscope
            </Button>
          </div>
        </div>

        <div className="cosmic-card p-4 flex flex-wrap gap-4 items-end">
          <div>
            <Label className="text-xs text-slate-400 mb-1 block">Category</Label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as HoroscopeCategory)}
              className="h-11 rounded-md border-2 border-purple-500/30 bg-slate-800/50 px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none min-w-[140px]"
            >
              {HOROSCOPE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs text-slate-400 mb-1 block">Rashi</Label>
            <select
              value={zodiacFilter}
              onChange={(e) => setZodiacFilter(e.target.value)}
              className="h-11 rounded-md border-2 border-purple-500/30 bg-slate-800/50 px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none min-w-[140px]"
            >
              <option value="">All</option>
              {ZODIAC_SIGNS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs text-slate-400 mb-1 block">Language</Label>
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value as HoroscopeLanguage | '')}
              className="h-11 rounded-md border-2 border-purple-500/30 bg-slate-800/50 px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none min-w-[120px]"
            >
              <option value="">All</option>
              <option value="NEPALI">NEPALI</option>
              <option value="HINDI">HINDI</option>
              <option value="ENGLISH">ENGLISH</option>
            </select>
          </div>
          <div>
            <Label className="text-xs text-slate-400 mb-1 block">Date from</Label>
            <DateInput
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-11 w-full min-w-[160px] bg-slate-800/50 border-purple-500/30 text-white [color-scheme:dark]"
              iconClassName="text-purple-400"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-400 mb-1 block">Date to</Label>
            <DateInput
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-11 w-full min-w-[160px] bg-slate-800/50 border-purple-500/30 text-white [color-scheme:dark]"
              iconClassName="text-purple-400"
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
              description: zodiacFilter || languageFilter || dateFrom || dateTo
                ? 'Try adjusting filters'
                : `No ${categoryFilter.toLowerCase()} horoscopes yet. Add your first entry.`,
              action: !zodiacFilter && !languageFilter && !dateFrom && !dateTo
                ? { label: 'Add Horoscope', onClick: () => router.push(ADMIN_ROUTES.HOROSCOPES_CREATE) }
                : undefined,
              icon: <></>,
            }}
          />
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="border-slate-600 text-white"
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-slate-400 text-sm">
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
