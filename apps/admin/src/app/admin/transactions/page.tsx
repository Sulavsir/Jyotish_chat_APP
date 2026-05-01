'use client';

import { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin-api';
import {
  Button,
  Search,
  Popover,
  PopoverContent,
  PopoverTrigger,
  AdminMonthRangeFilter,
  getTodayDateRange,
} from '@jyotish/ui';
import { CreditCard, Banknote, Filter, ChevronDown, Check } from 'lucide-react';
import {
  ADMIN_QUERY_KEYS,
  PAGINATION_DEFAULTS,
  ADMIN_ROWS_PER_PAGE_OPTIONS,
  ADMIN_DATE_FILTER_DEBOUNCE_MS,
  ADMIN_SEARCH_DEBOUNCE_MS,
} from '@/constants';
import {
  AdminTable,
  AdminClearFiltersButton,
  AdminListPaginationSection,
  AdminRefreshButton,
  type AdminTableColumn,
} from '@/components/admin';
import { PaymentMethodCell, TransactionIdCell } from '@/components/transactions';
import { useDebounce, useDebouncedPageSize } from '@/hooks';
import type { AdminPaymentHistoryItem } from '@/types';

const PAYMENT_METHOD_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All methods' },
  { value: 'GETPAY', label: 'GetPay' },
  { value: 'FONEPAY_QR', label: 'Fonepay QR' },
  { value: 'FONEPAY_CARD', label: 'Fonepay Card' },
];

function PaymentMethodFilterPopover({
  value,
  onChange,
  disabled,
  fullWidth,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  fullWidth?: boolean;
}) {
  const label = PAYMENT_METHOD_OPTIONS.find((o) => o.value === value)?.label ?? 'All methods';
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className={
            fullWidth
              ? 'border-slate-700 text-white hover:bg-slate-800 gap-2 h-9 w-full min-w-0 max-w-none justify-between shrink-0'
              : 'border-slate-700 text-white hover:bg-slate-800 gap-2 h-9 min-w-[160px] max-w-[220px] justify-between shrink-0'
          }
        >
          <Filter className="w-4 h-4 shrink-0" />
          <span className="truncate">{label}</span>
          <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[180px] p-1 bg-slate-900 border-slate-700">
        <div className="flex flex-col">
          {PAYMENT_METHOD_OPTIONS.map((opt) => (
            <button
              key={opt.value || 'all'}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                value === opt.value
                  ? 'text-purple-300 bg-purple-600/15'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{opt.label}</span>
              {value === opt.value && <Check className="w-4 h-4 text-purple-400" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function PaymentHistoryPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, ADMIN_SEARCH_DEBOUNCE_MS);
  const [paymentMethod, setPaymentMethod] = useState('');
  const {
    pageSize: itemsPerPage,
    setPageSize: setItemsPerPage,
    debouncedPageSize: debouncedItemsPerPage,
  } = useDebouncedPageSize(20);
  const [paymentRange, setPaymentRange] = useState(getTodayDateRange);
  const debouncedFrom = useDebounce(paymentRange.from, ADMIN_DATE_FILTER_DEBOUNCE_MS);
  const debouncedTo = useDebounce(paymentRange.to, ADMIN_DATE_FILTER_DEBOUNCE_MS);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, paymentMethod, debouncedFrom, debouncedTo]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedItemsPerPage]);

  const {
    data: response,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.PAYMENT_HISTORY.LIST({
      page: currentPage,
      limit: debouncedItemsPerPage,
      search: debouncedSearch || undefined,
      paymentMethod: paymentMethod || undefined,
      paymentDateFrom: debouncedFrom || undefined,
      paymentDateTo: debouncedTo || undefined,
    }),
    queryFn: () =>
      adminApi.paymentHistory.list({
        page: currentPage,
        limit: debouncedItemsPerPage,
        search: debouncedSearch || undefined,
        paymentMethod: paymentMethod || undefined,
        paymentDateFrom: debouncedFrom || undefined,
        paymentDateTo: debouncedTo || undefined,
      }),
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

  const handlePageSizeChange = (size: number) => {
    if (size === itemsPerPage) return;
    setItemsPerPage(size);
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  };

  const transactions = response?.transactions ?? [];
  const pagination = response?.pagination ?? {
    page: 1,
    limit: debouncedItemsPerPage,
    total: 0,
    totalPages: 1,
  };

  const columns: AdminTableColumn<AdminPaymentHistoryItem>[] = [
    {
      header: 'Transaction ID',
      accessor: (tx) => (
        <TransactionIdCell
          transactionId={tx.transactionId}
          fallback={tx.paymentId ?? tx.id.slice(0, 8)}
        />
      ),
      className: 'min-w-[140px]',
    },
    {
      header: 'User',
      accessor: (tx) => (
        <div className="flex flex-col">
          <span className="font-medium text-white">
            {tx.user?.name || tx.user?.phone || 'Unknown'}
          </span>
          <span className="text-xs text-slate-400">{tx.user?.email || tx.user?.phone}</span>
        </div>
      ),
      className: 'min-w-[160px]',
    },
    {
      header: 'Amount (NRs.)',
      accessor: (tx) => (
        <div className="flex items-center gap-2">
          <Banknote className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="text-emerald-400 font-semibold">
            NRs {Number(tx.amount ?? 0).toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      header: 'Payment Method',
      accessor: (tx) => <PaymentMethodCell paymentMethod={tx.paymentMethod} />,
    },
    {
      header: 'Balance (Before → After)',
      accessor: (tx) => (
        <span className="text-slate-300">
          {Number(tx.balanceBefore ?? 0).toLocaleString()} →{' '}
          {Number(tx.balanceAfter ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Payment Date',
      accessor: (tx) => (
        <span className="text-slate-300">{new Date(tx.createdAt).toLocaleString()}</span>
      ),
    },
  ];

  const showingFrom = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const showingTo = Math.min(pagination.page * pagination.limit, pagination.total);

  const defaultPaymentRange = getTodayDateRange();
  const isDefaultView =
    !debouncedSearch &&
    !paymentMethod &&
    debouncedFrom === defaultPaymentRange.from &&
    debouncedTo === defaultPaymentRange.to;

  const hasPaymentFilters =
    Boolean(debouncedSearch) ||
    Boolean(paymentMethod) ||
    debouncedFrom !== defaultPaymentRange.from ||
    debouncedTo !== defaultPaymentRange.to;

  const clearPaymentFilters = () => {
    setSearchTerm('');
    setPaymentMethod('');
    setPaymentRange(getTodayDateRange());
    setCurrentPage(1);
  };

  return (
    <>
      <div className="space-y-5 sm:space-y-6">
        <div className="space-y-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="min-w-0 flex-1 pr-1 text-2xl sm:text-3xl font-bold text-white break-words">
              Payment History
            </h2>
            <div className="flex items-center gap-2 shrink-0 self-start flex-wrap justify-end">
              <AdminRefreshButton
                onClick={() => refetch()}
                loading={isLoading || isFetching}
                className="shrink-0"
              />
              <div className="hidden sm:block">
                <PaymentMethodFilterPopover
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  disabled={isLoading || isFetching}
                />
              </div>
            </div>
          </div>
          <p className="text-sm sm:text-base text-slate-400">
            Successful payments only – GetPay, Fonepay QR, Fonepay Card
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="sm:hidden w-full">
            <PaymentMethodFilterPopover
              value={paymentMethod}
              onChange={setPaymentMethod}
              disabled={isLoading || isFetching}
              fullWidth
            />
          </div>
          <div className="flex w-full min-w-0 items-center gap-2 sm:gap-3 min-[1145px]:hidden">
            <div className="min-w-0 flex-1">
              <AdminMonthRangeFilter
                fromValue={paymentRange.from}
                toValue={paymentRange.to}
                onRangeChange={(from, to) => setPaymentRange({ from, to })}
                disabled={isLoading || isFetching}
                className="w-full min-w-0"
              />
            </div>
            <AdminClearFiltersButton
              show={hasPaymentFilters}
              onClear={clearPaymentFilters}
              disabled={isLoading || isFetching}
            />
          </div>

          <div className="flex w-full min-w-0 flex-row items-center gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <Search
                containerClassName="w-full"
                placeholder="Search by name, email, phone or transaction ID..."
                value={searchTerm}
                onSearch={(value) => {
                  setSearchTerm(value);
                  setCurrentPage(1);
                }}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="hidden min-[1145px]:block shrink-0">
              <AdminMonthRangeFilter
                fromValue={paymentRange.from}
                toValue={paymentRange.to}
                onRangeChange={(from, to) => setPaymentRange({ from, to })}
                disabled={isLoading || isFetching}
              />
            </div>
            <div className="hidden min-[1145px]:block shrink-0">
              <AdminClearFiltersButton
                show={hasPaymentFilters}
                onClear={clearPaymentFilters}
                disabled={isLoading || isFetching}
              />
            </div>
          </div>
        </div>

        <div className="cosmic-card rounded-xl overflow-hidden">
          <AdminTable
            data={transactions}
            columns={columns}
            loading={isLoading}
            keyExtractor={(tx) => tx.id}
            showSerialNumber
            currentPage={pagination.page}
            itemsPerPage={pagination.limit}
            emptyState={{
              icon: <CreditCard className="w-16 h-16 text-slate-600" />,
              title: isDefaultView ? 'No payments yet' : 'No payments found',
              description: isDefaultView
                ? 'Successful payments will appear here once users start topping up their balance.'
                : 'Try adjusting search, payment method, or date filter.',
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
            pageSize={itemsPerPage}
            pageSizeOptions={ADMIN_ROWS_PER_PAGE_OPTIONS}
            onPageSizeChange={handlePageSizeChange}
            disabled={isFetching}
          />
        )}
      </div>
    </>
  );
}
