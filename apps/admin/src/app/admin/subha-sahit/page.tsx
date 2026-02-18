'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import { Button, DateInput, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input } from '@jyotish/ui';
import { ADMIN_QUERY_KEYS, ADMIN_ROUTES, PAGINATION_DEFAULTS } from '@/constants';
import type { ListSubhaSahitDatesParams, SubhaSahitDate } from '@/types';
import { AdminTable, type AdminTableColumn } from '@/components/admin';
import { toast } from 'sonner';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';
import { formatAdminDate } from '@/utils/helpers';
import { generatePageNumbers } from '@/utils/helpers';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@jyotish/ui';

export default function SubhaSahitPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [occasionFilter, setOccasionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [isOccasionModalOpen, setIsOccasionModalOpen] = useState(false);
  const [newOccasion, setNewOccasion] = useState('');

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
      page,
      limit: PAGINATION_DEFAULTS.LIMIT,
    }),
    [occasionFilter, dateFrom, dateTo, page]
  );

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.SUBHA_SAHIT.LIST(listParams),
    queryFn: () => adminApi.subhaSahit.list(listParams),
  });

  const dates = data?.dates ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    limit: PAGINATION_DEFAULTS.LIMIT,
    total: 0,
    totalPages: 0,
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.subhaSahit.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.SUBHA_SAHIT.ALL });
      toast.success('Subha Sahit date deleted');
    },
    onError: (e: Error) => {
      toast.error(e?.message || 'Failed to delete date');
    },
  });

  const columns: AdminTableColumn<SubhaSahitDate>[] = [
    {
      header: 'Date',
      accessor: (date) => (
        <span className="text-slate-300">
          {formatAdminDate(date.date)}
        </span>
      ),
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
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          date.isActive
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
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
            onClick={() => {
              if (!confirm('Delete this Subha Sahit date?')) return;
              deleteMutation.mutate(date.id);
            }}
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
      await adminApi.subhaSahit.createOccasion(trimmed);
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
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Subha Sahit Dates</h1>
            <p className="text-slate-400">Manage auspicious dates for Pandit Ji bookings</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
              size="sm"
              className="border-slate-700 text-white hover:bg-slate-800"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOccasionModalOpen(true)}
              size="sm"
              className="border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Occasion
            </Button>
            <Button
              onClick={() => router.push(ADMIN_ROUTES.SUBHA_SAHIT_CREATE)}
              className="bg-gradient-to-r from-cosmic-purple to-nebula-pink hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Dates
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              ),
              title: occasionFilter || dateFrom || dateTo ? 'No Subha Sahit dates found' : 'No Subha Sahit dates',
              description: occasionFilter || dateFrom || dateTo
                ? 'Try adjusting your filters'
                : 'Add auspicious dates for Pandit Ji bookings.',
            }}
          />
        </div>

        {/* Pagination */}
        {!isLoading && pagination.totalPages > 0 && (
          <div className="rounded-xl p-4">
            <div className="flex flex-col gap-2 items-center justify-between">
              <div className="text-sm text-white font-medium">
                Showing <span className="text-purple-400">
                  {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
                </span> to{' '}
                <span className="text-purple-400">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span> of{' '}
                <span className="text-purple-400">{pagination.total}</span> entries
              </div>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      disabled={page === 1}
                    />
                  </PaginationItem>

                  {generatePageNumbers(
                    page,
                    pagination.totalPages,
                    PAGINATION_DEFAULTS.MAX_VISIBLE_PAGES
                  ).map((pageNum, index) => (
                    <PaginationItem key={index}>
                      {typeof pageNum === 'number' ? (
                        <PaginationLink
                          onClick={() => setPage(pageNum)}
                          isActive={page === pageNum}
                        >
                          {pageNum}
                        </PaginationLink>
                      ) : (
                        <PaginationEllipsis />
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                      disabled={page === pagination.totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isOccasionModalOpen} onOpenChange={setIsOccasionModalOpen}>
        <DialogContent className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-purple-600/40 text-white max-w-md shadow-2xl shadow-purple-900/40">
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
            <p className="text-xs text-slate-400">
              This occasion will appear in all Subha Sahit dropdowns and filters, and can be used while creating dates and booking Pandit Ji.
            </p>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setIsOccasionModalOpen(false)} className="border-slate-700">
              Cancel
            </Button>
            <Button onClick={handleAddOccasion} disabled={!newOccasion.trim()}>
              Add Occasion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
