'use client';

import { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import {
  Button,
  Search,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Popover,
  PopoverContent,
  PopoverTrigger,
  AdminMonthRangeFilter,
  AdminPaginationBar,
  getAllTimeDateRange,
} from '@jyotish/ui';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { RefreshCw, CreditCard, Banknote, Filter, ChevronDown, Check } from 'lucide-react';
import {
  ADMIN_QUERY_KEYS,
  PAGINATION_DEFAULTS,
  ADMIN_DATE_FILTER_DEBOUNCE_MS,
  ADMIN_SEARCH_DEBOUNCE_MS,
} from '@/constants';
import { AdminTable, AdminClearFiltersButton, type AdminTableColumn } from '@/components/admin';
import { PaymentMethodCell, TransactionIdCell } from '@/components/transactions';
import { useDebounce } from '@/hooks';
import { generatePageNumbers } from '@/utils/helpers';
import type { AdminPaymentHistoryItem } from '@/types';

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;

const PAYMENT_METHOD_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All methods' },
  { value: 'GETPAY', label: 'GetPay' },
  { value: 'FONEPAY_QR', label: 'Fonepay QR' },
  { value: 'FONEPAY_CARD', label: 'Fonepay Card' },
];

export default function PaymentHistoryPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, ADMIN_SEARCH_DEBOUNCE_MS);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [paymentRange, setPaymentRange] = useState(getAllTimeDateRange);
  const debouncedFrom = useDebounce(paymentRange.from, ADMIN_DATE_FILTER_DEBOUNCE_MS);
  const debouncedTo = useDebounce(paymentRange.to, ADMIN_DATE_FILTER_DEBOUNCE_MS);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, paymentMethod, debouncedFrom, debouncedTo]);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const {
    data: response,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.PAYMENT_HISTORY.LIST({
      page: currentPage,
      limit: itemsPerPage,
      search: debouncedSearch || undefined,
      paymentMethod: paymentMethod || undefined,
      paymentDateFrom: debouncedFrom || undefined,
      paymentDateTo: debouncedTo || undefined,
    }),
    queryFn: () =>
      adminApi.paymentHistory.list({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch || undefined,
        paymentMethod: paymentMethod || undefined,
        paymentDateFrom: debouncedFrom || undefined,
        paymentDateTo: debouncedTo || undefined,
      }),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

  const transactions = response?.transactions ?? [];
  const pagination = response?.pagination ?? {
    page: 1,
    limit: itemsPerPage,
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

  const paymentMethodLabel =
    PAYMENT_METHOD_OPTIONS.find((o) => o.value === paymentMethod)?.label ?? 'All methods';

  const showingFrom = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const showingTo = Math.min(pagination.page * pagination.limit, pagination.total);

  const allTime = getAllTimeDateRange();
  const isDefaultView =
    !debouncedSearch &&
    !paymentMethod &&
    debouncedFrom === allTime.from &&
    debouncedTo === allTime.to;

  const hasPaymentFilters =
    Boolean(debouncedSearch) ||
    Boolean(paymentMethod) ||
    debouncedFrom !== allTime.from ||
    debouncedTo !== allTime.to;

  const clearPaymentFilters = () => {
    setSearchTerm('');
    setPaymentMethod('');
    setPaymentRange(getAllTimeDateRange());
    setCurrentPage(1);
  };

  return (
    <AdminLayout>
      <div className="space-y-5 sm:space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-3 sm:items-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-white break-words">
                Payment History
              </h2>
              <LoadingButton
                onClick={() => refetch()}
                variant="outline"
                size="sm"
                isLoading={isLoading || isFetching}
                loadingText="Refreshing"
                className="border-slate-700 text-white hover:bg-slate-800 w-auto lg:hidden"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </LoadingButton>
            </div>
            <p className="text-sm sm:text-base text-slate-400 mt-1">
              Successful payments only – GetPay, Fonepay QR, Fonepay Card
            </p>
          </div>

          <LoadingButton
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            isLoading={isLoading || isFetching}
            loadingText="Refreshing"
            className="border-slate-700 text-white hover:bg-slate-800 hidden lg:inline-flex"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </LoadingButton>
        </div>

        <div className="flex flex-col gap-3">
          <div className="w-full min-w-0">
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

          {/* Date filter + Payment Method in the same row on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <AdminMonthRangeFilter
              fromValue={paymentRange.from}
              toValue={paymentRange.to}
              onRangeChange={(from, to) => setPaymentRange({ from, to })}
              disabled={isLoading}
              className="w-full"
            />

            <div className="w-full flex justify-end">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-white hover:bg-slate-800 gap-2 h-9 w-full justify-between"
                  >
                    <Filter className="w-4 h-4" />
                    <span className="truncate max-w-[160px]">{paymentMethodLabel}</span>
                    <ChevronDown className="w-4 h-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[180px] p-1 bg-slate-900 border-slate-700">
                  <div className="flex flex-col">
                    {PAYMENT_METHOD_OPTIONS.map((opt) => (
                      <button
                        key={opt.value || 'all'}
                        type="button"
                        onClick={() => setPaymentMethod(opt.value)}
                        className={`flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                          paymentMethod === opt.value
                            ? 'text-purple-300 bg-purple-600/15'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {paymentMethod === opt.value && (
                          <Check className="w-4 h-4 text-purple-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-end">
            <AdminClearFiltersButton
              show={hasPaymentFilters}
              onClear={clearPaymentFilters}
              disabled={isLoading || isFetching}
            />
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
            totalItems={pagination.total}
            totalPages={pagination.totalPages}
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
          <div className="rounded-xl p-4">
            <AdminPaginationBar
              showingFrom={showingFrom}
              showingTo={showingTo}
              totalItems={pagination.total}
              pageSize={itemsPerPage}
              pageSizeOptions={ROWS_PER_PAGE_OPTIONS}
              onPageSizeChange={setItemsPerPage}
              disabled={isFetching}
              pagination={
                pagination.totalPages > 0 ? (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        />
                      </PaginationItem>

                      {generatePageNumbers(
                        currentPage,
                        pagination.totalPages,
                        PAGINATION_DEFAULTS.MAX_VISIBLE_PAGES
                      ).map((page, index) => (
                        <PaginationItem key={index}>
                          {typeof page === 'number' ? (
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          ) : (
                            <PaginationEllipsis />
                          )}
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))
                          }
                          disabled={currentPage === pagination.totalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                ) : null
              }
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
