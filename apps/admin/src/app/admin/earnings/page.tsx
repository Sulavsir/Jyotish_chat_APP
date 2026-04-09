'use client';

import { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useDebounce, useDebouncedPageSize } from '@/hooks';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import { Search, MoneyIcon, StarIcon, AdminMonthRangeFilter, getAllTimeDateRange } from '@jyotish/ui';
import {
  AdminTable,
  AdminClearFiltersButton,
  AdminListPaginationSection,
  AdminRefreshButton,
  type AdminTableColumn,
} from '@/components/admin';
import {
  ADMIN_QUERY_KEYS,
  PAGINATION_DEFAULTS,
  ADMIN_ROWS_PER_PAGE_OPTIONS,
  ADMIN_DATE_FILTER_DEBOUNCE_MS,
  ADMIN_SEARCH_DEBOUNCE_MS,
} from '@/constants';
import type { AstrologerWithCoinEarning } from '@/types';
import { AstrologerCategory } from '@jyotish/shared';

export default function EarningsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm.trim(), ADMIN_SEARCH_DEBOUNCE_MS);
  const [currentPage, setCurrentPage] = useState(1);
  const [earningRange, setEarningRange] = useState(getAllTimeDateRange);
  const debouncedFrom = useDebounce(earningRange.from, ADMIN_DATE_FILTER_DEBOUNCE_MS);
  const debouncedTo = useDebounce(earningRange.to, ADMIN_DATE_FILTER_DEBOUNCE_MS);
  const {
    pageSize: rowsPerPage,
    setPageSize: setRowsPerPage,
    debouncedPageSize: debouncedRowsPerPage,
  } = useDebouncedPageSize(PAGINATION_DEFAULTS.LIMIT);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.EARNINGS.ASTROLOGERS_WITH_COINS({
      page: currentPage,
      limit: debouncedRowsPerPage,
      search: debouncedSearch || undefined,
      from: debouncedFrom || undefined,
      to: debouncedTo || undefined,
    }),
    queryFn: () =>
      adminApi.earnings.listAstrologersWithCoins({
        page: currentPage,
        limit: debouncedRowsPerPage,
        search: debouncedSearch || undefined,
        from: debouncedFrom || undefined,
        to: debouncedTo || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const handlePageSizeChange = (size: number) => {
    if (size === rowsPerPage) return;
    setRowsPerPage(size);
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, debouncedFrom, debouncedTo, debouncedRowsPerPage]);

  const allTime = getAllTimeDateRange();
  const hasActiveFilters =
    Boolean(debouncedSearch) || debouncedFrom !== allTime.from || debouncedTo !== allTime.to;

  const clearFilters = () => {
    setSearchTerm('');
    setEarningRange(getAllTimeDateRange());
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  };

  const astrologers = data?.astrologers ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    limit: debouncedRowsPerPage,
    total: 0,
    totalPages: 0,
  };

  const columns: AdminTableColumn<AstrologerWithCoinEarning>[] = [
    {
      header: 'Name',
      accessor: (row) => <span className="font-medium text-white">{row.name}</span>,
    },
    {
      header: 'Email',
      accessor: (row) => <span className="text-slate-300">{row.email ?? '—'}</span>,
    },
    {
      header: 'Phone',
      accessor: (row) => <span className="text-slate-300">{row.phone}</span>,
    },
    {
      header: 'Category',
      accessor: (row) => {
        const category = row.category as AstrologerCategory;
        const isPremium = category === AstrologerCategory.PREMIUM;
        const isProfessional = category === AstrologerCategory.PROFESSIONAL;
        const isKathaVachak = category === AstrologerCategory.KATHA_VACHAK;
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${
              isPremium
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : isProfessional
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
            }`}
          >
            {isPremium ? (
              <>👑 Premium</>
            ) : isProfessional ? (
              <>💎 Professional</>
            ) : isKathaVachak ? (
              <>📖 Katha Vachak</>
            ) : (
              <>⭐ Ordinary</>
            )}
          </span>
        );
      },
    },
    {
      header: 'Rating',
      accessor: (row) => (
        <div className="flex items-center gap-1">
          <StarIcon className="w-4 h-4 text-orange-400 shrink-0" />
          <span className="text-slate-300">{row.rating != null ? row.rating.toFixed(1) : '—'}</span>
        </div>
      ),
    },
    {
      header: 'Commission %',
      accessor: (row) => (
        <div className="text-[10px] leading-tight text-slate-400 max-w-[200px]">
          <span className="text-slate-500">Chat </span>
          <span className="text-slate-200">{row.chatMessageCommissionPercent}%</span>
          <span className="text-slate-600"> · </span>
          <span className="text-slate-500">Br </span>
          <span className="text-slate-200">{row.broadcastMessageCommissionPercent}%</span>
          <span className="text-slate-600"> · </span>
          <span className="text-slate-500">1st </span>
          <span className="text-slate-200">{row.firstBroadcastCommissionPercent}%</span>
          <br />
          <span className="text-slate-500">Kundali </span>
          <span className="text-slate-200">{row.kundaliReviewCommissionPercent}%</span>
          <span className="text-slate-600"> · </span>
          <span className="text-slate-500">Appt </span>
          <span className="text-slate-200">{row.appointmentCommissionPercent}%</span>
        </div>
      ),
    },
    {
      header: 'Balance (NRs)',
      accessor: (row) => (
        <span className="font-semibold text-emerald-400">
          NRs {row.totalCoinEarnings.toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-5 sm:space-y-6">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-3">
            <h1 className="min-w-0 flex-1 pr-1 text-2xl sm:text-3xl font-bold cosmic-text break-words">
              Earnings
            </h1>
            <AdminRefreshButton
              loading={isLoading}
              onClick={() => refetch()}
              className="shrink-0 self-start"
            />
          </div>
          <p className="text-sm sm:text-base text-slate-400">
            Astrologer list with balance earnings (from chat, broadcast, appointment)
          </p>
        </div>

        <div className="w-full">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="w-full md:max-w-md">
              <Search
                placeholder="Search by name, email or phone..."
                value={searchTerm}
                onSearch={(value) => {
                  setSearchTerm(value);
                  setCurrentPage(PAGINATION_DEFAULTS.PAGE);
                }}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-auto flex items-center justify-end gap-2">
              <AdminMonthRangeFilter
                fromValue={earningRange.from}
                toValue={earningRange.to}
                onRangeChange={(from, to) => setEarningRange({ from, to })}
                disabled={isLoading || isFetching}
              />
              <AdminClearFiltersButton
                show={hasActiveFilters}
                onClear={clearFilters}
                disabled={isLoading || isFetching}
              />
            </div>
          </div>
        </div>

        <div className="cosmic-card rounded-xl overflow-hidden">
          <AdminTable
            data={astrologers}
            columns={columns}
            loading={isLoading}
            keyExtractor={(row) => row.id}
            emptyState={{
              icon: <MoneyIcon className="w-20 h-20 text-slate-600" />,
              title: debouncedSearch ? 'No astrologers found' : 'No astrologers',
              description: debouncedSearch
                ? 'Try adjusting your search'
                : 'Astrologer earnings will appear here',
            }}
          />
        </div>

        {!isLoading && pagination.totalPages > 0 && (
          <AdminListPaginationSection
            pagination={{
              page: pagination.page,
              limit: pagination.limit,
              total: pagination.total,
              totalPages: pagination.totalPages,
            }}
            onPageChange={setCurrentPage}
            pageSize={rowsPerPage}
            pageSizeOptions={ADMIN_ROWS_PER_PAGE_OPTIONS}
            onPageSizeChange={handlePageSizeChange}
            disabled={isFetching}
          />
        )}
      </div>
    </AdminLayout>
  );
}
