'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import {
  Button,
  DateInput,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
} from '@jyotish/ui';
import {
  ADMIN_QUERY_KEYS,
  ADMIN_ROUTES,
  PAGINATION_DEFAULTS,
  ADMIN_ROWS_PER_PAGE_OPTIONS,
} from '@/constants';
import type { ListSubhaSahitDatesParams, SubhaSahitDate } from '@/types';
import {
  AdminTable,
  AdminListPaginationSection,
  AdminRefreshButton,
  type AdminTableColumn,
} from '@/components/admin';
import { ConfirmDialog } from '@/components/ui';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { formatAdminDate } from '@/utils/helpers';
import { useDebouncedPageSize } from '@/hooks';

export default function SubhaSahitPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [occasionFilter, setOccasionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const {
    pageSize: rowsPerPage,
    setPageSize: setRowsPerPage,
    debouncedPageSize: debouncedRowsPerPage,
  } = useDebouncedPageSize(PAGINATION_DEFAULTS.LIMIT);
  const [language, setLanguage] = useState<'en' | 'ne' | 'hi' | ''>('');
  const [isOccasionModalOpen, setIsOccasionModalOpen] = useState(false);
  const [newOccasion, setNewOccasion] = useState('');
  const [occasionLanguage, setOccasionLanguage] = useState<'en' | 'ne' | 'hi'>('en');
  const [dateToDelete, setDateToDelete] = useState<SubhaSahitDate | null>(null);

  const { data: occasionsData } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.SUBHA_SAHIT.OCCASIONS(),
    queryFn: () => adminApi.subhaSahit.getOccasions(),
  });

  const occasions = occasionsData?.occasions ?? [];

  const listParams: ListSubhaSahitDatesParams = useMemo(
    () => ({
      ...(occasionFilter && { occasion: occasionFilter }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
      ...(language && { language }),
      page,
      limit: debouncedRowsPerPage,
    }),
    [occasionFilter, dateFrom, dateTo, language, page, debouncedRowsPerPage]
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

  const handleAddOccasion = async () => {
    const trimmed = newOccasion.trim();
    if (!trimmed) return;
    try {
      await adminApi.subhaSahit.createOccasion(trimmed, occasionLanguage);
      await queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.SUBHA_SAHIT.OCCASIONS() });
      toast.success('Occasion added');
      setIsOccasionModalOpen(false);
      setNewOccasion('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to add occasion';
      toast.error(message);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5 sm:space-y-6">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <h1 className="min-w-0 flex-1 pr-1 text-2xl sm:text-3xl font-bold leading-tight text-white break-words">
              Subha Sahit
            </h1>
            <div className="flex shrink-0 flex-row flex-wrap items-center justify-end gap-2">
              <AdminRefreshButton
                onClick={() => refetch()}
                loading={isFetching}
                className="shrink-0"
              />
              <Button
                variant="outline"
                onClick={() => setIsOccasionModalOpen(true)}
                size="sm"
                className="hidden shrink-0 border-purple-500/40 text-purple-300 hover:bg-purple-500/10 sm:inline-flex"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Occasion
              </Button>
              <Button
                onClick={() => router.push(ADMIN_ROUTES.SUBHA_SAHIT_CREATE)}
                className="hidden shrink-0 bg-gradient-to-r from-cosmic-purple to-nebula-pink hover:opacity-90 sm:inline-flex"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Dates
              </Button>
            </div>
          </div>
          <p className="text-sm sm:text-base text-slate-400">
            Manage auspicious dates for Pandit Ji bookings
          </p>
          <div className="flex flex-col gap-2 sm:hidden">
            <Button
              variant="outline"
              onClick={() => setIsOccasionModalOpen(true)}
              size="sm"
              className="w-full border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Occasion
            </Button>
            <Button
              onClick={() => router.push(ADMIN_ROUTES.SUBHA_SAHIT_CREATE)}
              className="w-full bg-gradient-to-r from-cosmic-purple to-nebula-pink hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Dates
            </Button>
          </div>
        </div>

        <div className="cosmic-card p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <Label className="text-slate-200">Filter by Occasion</Label>
            <select
              value={occasionFilter}
              onChange={(e) => {
                setOccasionFilter(e.target.value);
                setPage(1);
              }}
              className="mt-1.5 h-11 w-full rounded-md border-2 border-purple-500/30 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="">All occasions</option>
              {occasions.map((occ) => (
                <option key={occ} value={occ}>
                  {occ}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-200">Date From</Label>
            <DateInput
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="bg-slate-900/50 border-purple-500/30 text-white [color-scheme:dark]"
              nepaliDate
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-200">Date To</Label>
            <DateInput
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="bg-slate-900/50 border-purple-500/30 text-white [color-scheme:dark]"
              nepaliDate
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-200">Language</Label>
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value as 'en' | 'ne' | 'hi' | '');
                setPage(1);
              }}
              className="mt-1.5 h-11 w-full rounded-md border-2 border-purple-500/30 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="">All languages</option>
              <option value="en">English</option>
              <option value="ne">नेपाली (Nepali)</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>
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
                occasionFilter || dateFrom || dateTo
                  ? 'No Subha Sahit dates found'
                  : 'No Subha Sahit dates',
              description:
                occasionFilter || dateFrom || dateTo
                  ? 'Try adjusting your filters'
                  : 'Add auspicious dates for Pandit Ji bookings.',
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

      <Dialog open={isOccasionModalOpen} onOpenChange={setIsOccasionModalOpen}>
        <DialogContent className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-purple-600/40 text-white w-[92vw] max-w-md max-h-[90dvh] overflow-y-auto shadow-2xl shadow-purple-900/40 p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-purple-100">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-600/30 border border-purple-500/60">
                <Plus className="h-4 w-4" />
              </span>
              Add new occasion
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <Label className="text-slate-200 text-sm">Occasion name</Label>
            <Input
              value={newOccasion}
              onChange={(e) => setNewOccasion(e.target.value)}
              placeholder="e.g. Satyanarayan Puja"
              className="bg-slate-900/70 border-purple-600/50 focus:border-purple-400 text-white placeholder-slate-500"
            />
            <div className="flex items-center justify-between gap-3">
              <Label className="text-slate-200 text-xs">Language</Label>
              <select
                value={occasionLanguage}
                onChange={(e) => setOccasionLanguage(e.target.value as 'en' | 'ne' | 'hi')}
                className="mt-1 h-9 rounded-md border border-purple-500/40 bg-slate-900/60 px-2 py-1 text-xs text-white focus:border-purple-400 focus:outline-none"
              >
                <option value="en">English</option>
                <option value="ne">नेपाली (Nepali)</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
            </div>
            <p className="text-xs text-slate-400">
              This occasion will appear in all Subha Sahit dropdowns and filters, and can be used
              while creating dates and booking Pandit Ji.
            </p>
          </div>
          <DialogFooter className="mt-2 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsOccasionModalOpen(false)}
              className="border-slate-700 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddOccasion}
              disabled={!newOccasion.trim()}
              className="w-full sm:w-auto"
            >
              Add Occasion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </AdminLayout>
  );
}
