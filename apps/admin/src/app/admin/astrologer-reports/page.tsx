'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Search,
  StarIcon,
  AdminMonthRangeFilter,
  getTodayDateRange,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
} from '@jyotish/ui';
import { useDebounce, useDebouncedPageSize } from '@/hooks';
import { adminApi } from '@/lib/admin-api';
import {
  AdminTable,
  AdminClearFiltersButton,
  AdminListPaginationSection,
  AdminRefreshButton,
  type AdminTableColumn,
} from '@/components/admin';
import {
  ADMIN_QUERY_KEYS,
  ADMIN_ROUTES,
  PAGINATION_DEFAULTS,
  ADMIN_ROWS_PER_PAGE_OPTIONS,
  ADMIN_DATE_FILTER_DEBOUNCE_MS,
  ADMIN_SEARCH_DEBOUNCE_MS,
} from '@/constants';
import type { AstrologerChatAcceptanceReportRow } from '@/types';
import { AstrologerCategory } from '@jyotish/shared';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function AstrologerReportsPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState(() => getTodayDateRange());
  const debouncedFrom = useDebounce(dateRange.from, ADMIN_DATE_FILTER_DEBOUNCE_MS);
  const debouncedTo = useDebounce(dateRange.to, ADMIN_DATE_FILTER_DEBOUNCE_MS);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm.trim(), ADMIN_SEARCH_DEBOUNCE_MS);

  const [sortBy, setSortBy] = useState<
    'broadcastAcceptedCount' | 'directChatAcceptedCount' | 'totalAcceptances' | 'name'
  >('totalAcceptances');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [currentPage, setCurrentPage] = useState(1);
  const {
    pageSize: rowsPerPage,
    setPageSize: setRowsPerPage,
    debouncedPageSize: debouncedRowsPerPage,
  } = useDebouncedPageSize(PAGINATION_DEFAULTS.LIMIT);

  const queryParams = useMemo(
    () => ({
      page: currentPage,
      limit: debouncedRowsPerPage,
      from: debouncedFrom || undefined,
      to: debouncedTo || undefined,
      search: debouncedSearch || undefined,
      sortBy,
      sortOrder,
    }),
    [
      currentPage,
      debouncedRowsPerPage,
      debouncedFrom,
      debouncedTo,
      debouncedSearch,
      sortBy,
      sortOrder,
    ]
  );

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.ASTROLOGER_REPORTS.BROADCAST_ACCEPTANCES(queryParams),
    queryFn: () => adminApi.reports.listAstrologerChatAcceptances(queryParams),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  }, [debouncedFrom, debouncedTo, debouncedSearch, debouncedRowsPerPage, sortBy, sortOrder]);

  const handlePageSizeChange = (size: number) => {
    if (size === rowsPerPage) return;
    setRowsPerPage(size);
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  };

  const todayRange = getTodayDateRange();
  const isDefaultDateRange =
    dateRange.from === todayRange.from && dateRange.to === todayRange.to;
  const isDefaultSort =
    sortBy === 'totalAcceptances' && sortOrder === 'desc' && isDefaultDateRange && !debouncedSearch;

  const hasActiveFilters = !isDefaultSort || Boolean(debouncedSearch) || !isDefaultDateRange;

  const clearFilters = () => {
    setSearchTerm('');
    setDateRange(getTodayDateRange());
    setSortBy('totalAcceptances');
    setSortOrder('desc');
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  };

  const rows = data?.rows ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    limit: debouncedRowsPerPage,
    total: 0,
    totalPages: 0,
  };
  const periodBroadcast = data?.periodTotals.broadcastAccepted ?? 0;
  const periodDirect = data?.periodTotals.directChatAccepted ?? 0;

  const columns: AdminTableColumn<AstrologerChatAcceptanceReportRow>[] = useMemo(
    () => [
      {
        header: 'Astrologer',
        accessor: (row) => {
          const isUnknown = row.name.startsWith('Unknown');
          return (
            <span className={`font-medium ${isUnknown ? 'text-slate-400' : 'text-white'}`}>
              {row.name}
            </span>
          );
        },
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
          if (row.category === '—') return <span className="text-slate-500">—</span>;
          const cat = row.category as AstrologerCategory;
          return <span className="text-slate-300 text-sm">{cat}</span>;
        },
      },
      {
        header: 'Broadcast count',
        accessor: (row) => (
          <span className="tabular-nums font-semibold text-cyan-200">
            {row.broadcastAcceptedCount}
          </span>
        ),
        className: 'text-right',
      },
      {
        header: 'Direct chat count',
        accessor: (row) => (
          <span className="tabular-nums font-semibold text-violet-200">
            {row.directChatAcceptedCount}
          </span>
        ),
        className: 'text-right',
      },
    ],
    []
  );

  const handleRowClick = (row: AstrologerChatAcceptanceReportRow) => {
    if (row.name.startsWith('Unknown')) return;
    if (!UUID_RE.test(row.astrologerId)) return;
    router.push(`${ADMIN_ROUTES.CHATS}?astrologerId=${encodeURIComponent(row.astrologerId)}`);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="space-y-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 pr-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white break-words">
              Astrologer Reports
            </h1>
            <p className="text-sm sm:text-base text-slate-400 mt-1 max-w-3xl">
              Everyone Jyotish (broadcast) and direct (instant) chat acceptances per astrologer.
              Dates use acceptance time (UTC). Click a row to open Chat Monitor filtered to that
              jyotish.
            </p>
          </div>
          <AdminRefreshButton
            onClick={() => refetch()}
            loading={isLoading || isFetching}
            className="shrink-0 self-start"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex w-full min-w-0 items-center gap-2 sm:gap-3 min-[1100px]:hidden">
          <div className="min-w-0 flex-1">
            <AdminMonthRangeFilter
              fromValue={dateRange.from}
              toValue={dateRange.to}
              onRangeChange={(from, to) => setDateRange({ from, to })}
              disabled={isLoading || isFetching}
              className="w-full min-w-0"
              showInlineFilterPrefix={false}
            />
          </div>
          <AdminClearFiltersButton
            show={hasActiveFilters}
            onClear={clearFilters}
            disabled={isLoading || isFetching}
          />
        </div>

        <div className="flex w-full min-w-0 flex-col gap-3 lg:flex-row lg:items-end lg:gap-4">
          <div className="flex-1 min-w-0 space-y-1">
            <Label className="text-slate-400 text-xs block">Search</Label>
            <Search
              containerClassName="w-full"
              placeholder="Name, email, or phone..."
              value={searchTerm}
              onSearch={(v) => {
                setSearchTerm(v);
                setCurrentPage(PAGINATION_DEFAULTS.PAGE);
              }}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-[420px] shrink-0">
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs block">Sort by</Label>
              <Select
                value={sortBy}
                onValueChange={(v) =>
                  setSortBy(
                    v === 'name'
                      ? 'name'
                      : v === 'directChatAcceptedCount'
                        ? 'directChatAcceptedCount'
                        : v === 'broadcastAcceptedCount'
                          ? 'broadcastAcceptedCount'
                          : 'totalAcceptances'
                  )
                }
                disabled={isLoading || isFetching}
              >
                <SelectTrigger className="border-slate-700 bg-slate-900 text-white w-full h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="totalAcceptances">Total acceptances</SelectItem>
                  <SelectItem value="broadcastAcceptedCount">Broadcast count</SelectItem>
                  <SelectItem value="directChatAcceptedCount">Direct chat count</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs block">Order</Label>
              <Select
                value={sortOrder}
                onValueChange={(v) => setSortOrder(v === 'asc' ? 'asc' : 'desc')}
                disabled={isLoading || isFetching}
              >
                <SelectTrigger className="border-slate-700 bg-slate-900 text-white w-full h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="hidden min-[1100px]:flex items-end gap-2 shrink-0">
            <div className="space-y-1 min-w-[220px]">
              <Label className="text-slate-400 text-xs block">Filter by date</Label>
              <AdminMonthRangeFilter
                fromValue={dateRange.from}
                toValue={dateRange.to}
                onRangeChange={(from, to) => setDateRange({ from, to })}
                disabled={isLoading || isFetching}
                showInlineFilterPrefix={false}
              />
            </div>
            <AdminClearFiltersButton
              show={hasActiveFilters}
              onClear={clearFilters}
              disabled={isLoading || isFetching}
              className="mb-0.5"
            />
          </div>
        </div>
      </div>

      <div className="cosmic-card rounded-xl overflow-hidden">
        <AdminTable
          data={rows}
          columns={columns}
          loading={isLoading}
          keyExtractor={(row) => row.astrologerId}
          showSerialNumber
          currentPage={pagination.page}
          itemsPerPage={pagination.limit}
          onRowClick={handleRowClick}
          emptyState={{
            icon: <StarIcon className="w-16 h-16 text-slate-600" />,
            title: 'No astrologers in this range',
            description:
              'Adjust the date filter or search. Rows appear when an astrologer has accepted at least one broadcast or direct chat in the selected period.',
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
          onPageChange={setCurrentPage}
          pageSize={rowsPerPage}
          pageSizeOptions={ADMIN_ROWS_PER_PAGE_OPTIONS}
          onPageSizeChange={handlePageSizeChange}
          disabled={isFetching}
        />
      )}
    </div>
  );
}
