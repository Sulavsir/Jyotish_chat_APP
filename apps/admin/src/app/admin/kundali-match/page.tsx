'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin-api';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Label,
  Textarea,
  LoadingButton,
  AdminMonthRangeFilter,
  getAllTimeDateRange,
} from '@jyotish/ui';
import { nepaliDateService } from '@/services/nepali-date.service';
import { KundaliMatchPlaceBlock } from '@/components/kundali-match/kundali-match-place-block';
import { KundaliMatchDobLines, toYmd } from '@/components/kundali-match/kundali-match-dob-lines';
import { KundaliMatchRequestDetailPanel } from '@/components/kundali-match/kundali-match-request-detail-panel';
import {
  AdminTable,
  AdminListPaginationSection,
  AdminRefreshButton,
  AdminClearFiltersButton,
  type AdminTableColumn,
  KUNDALI_MATCH_STATUS_OPTIONS,
  type KundaliMatchFilterValue,
} from '@/components/admin';
import {
  ADMIN_QUERY_KEYS,
  PAGINATION_DEFAULTS,
  ADMIN_ROWS_PER_PAGE_OPTIONS,
  ADMIN_DATE_FILTER_DEBOUNCE_MS,
} from '@/constants';
import { formatGregorianDateEnShort, formatTimeStringAmPm } from '@jyotish/shared';
import type { KundaliMatchRequest } from '@/types/kundaliMatch.types';
import { toast } from 'sonner';
import { Banknote, User, Eye } from 'lucide-react';
import { useDebouncedPageSize, useDebounce } from '@/hooks';
const LOCALE_STORAGE_KEY = 'admin-kundali-match-display-locale';
export type KundaliAdminDisplayLocale = 'en' | 'ne' | 'hi';

export default function KundaliMatchPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const {
    pageSize: rowsPerPage,
    setPageSize: setRowsPerPage,
    debouncedPageSize: debouncedRowsPerPage,
  } = useDebouncedPageSize(PAGINATION_DEFAULTS.LIMIT);
  const [statusFilter, setStatusFilter] = useState<KundaliMatchFilterValue>('ALL');
  const [requestDateRange, setRequestDateRange] = useState(getAllTimeDateRange);
  const debouncedRequestFrom = useDebounce(requestDateRange.from, ADMIN_DATE_FILTER_DEBOUNCE_MS);
  const debouncedRequestTo = useDebounce(requestDateRange.to, ADMIN_DATE_FILTER_DEBOUNCE_MS);
  const [displayLocale, setDisplayLocale] = useState<KundaliAdminDisplayLocale>('en');
  const [reviewModalRequest, setReviewModalRequest] = useState<KundaliMatchRequest | null>(null);
  const [viewModalRequest, setViewModalRequest] = useState<KundaliMatchRequest | null>(null);
  const [reviewMessage, setReviewMessage] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    try {
      const v = localStorage.getItem(LOCALE_STORAGE_KEY) as KundaliAdminDisplayLocale | null;
      if (v === 'en' || v === 'ne' || v === 'hi') setDisplayLocale(v);
    } catch {
      /* ignore */
    }
  }, []);

  const setLocalePersist = useCallback((loc: KundaliAdminDisplayLocale) => {
    setDisplayLocale(loc);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, loc);
    } catch {
      /* ignore */
    }
  }, []);

  const useDevanagari = displayLocale === 'ne' || displayLocale === 'hi';

  const allTimeRange = getAllTimeDateRange();
  const hasKundaliListFilters =
    statusFilter !== 'ALL' ||
    debouncedRequestFrom !== allTimeRange.from ||
    debouncedRequestTo !== allTimeRange.to;

  const clearKundaliListFilters = () => {
    setStatusFilter('ALL');
    setRequestDateRange(getAllTimeDateRange());
    setCurrentPage(1);
  };

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [
      ...ADMIN_QUERY_KEYS.KUNDALI_MATCH.LIST(),
      currentPage,
      statusFilter,
      debouncedRowsPerPage,
      debouncedRequestFrom,
      debouncedRequestTo,
    ],
    queryFn: () =>
      adminApi.kundaliMatch.list({
        page: currentPage,
        limit: debouncedRowsPerPage,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        ...(debouncedRequestFrom?.trim() && { dateFrom: debouncedRequestFrom.trim() }),
        ...(debouncedRequestTo?.trim() && { dateTo: debouncedRequestTo.trim() }),
      }),
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

  const handlePageSizeChange = (size: number) => {
    if (size === rowsPerPage) return;
    setRowsPerPage(size);
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, debouncedRowsPerPage, debouncedRequestFrom, debouncedRequestTo]);

  const requests = data?.requests ?? [];
  const dobKeys = useMemo(() => {
    const keys = new Set<string>();
    const addReq = (r: KundaliMatchRequest) => {
      const b = toYmd(r.boyDateOfBirth);
      const g = toYmd(r.girlDateOfBirth);
      if (b) keys.add(b);
      if (g) keys.add(g);
    };
    for (const r of requests) addReq(r);
    if (viewModalRequest) addReq(viewModalRequest);
    if (reviewModalRequest) addReq(reviewModalRequest);
    return [...keys].sort();
  }, [requests, viewModalRequest, reviewModalRequest]);

  const { data: bsMap = {}, isLoading: isBsLoading } = useQuery({
    queryKey: ['admin', 'kundali-match', 'bs', dobKeys.join(',')],
    queryFn: () => nepaliDateService.convertBulk(dobKeys),
    enabled: dobKeys.length > 0,
    staleTime: 1000 * 60 * 60,
  });

  const submitReviewMutation = useMutation({
    mutationFn: ({ id, adminReviewMessage }: { id: string; adminReviewMessage: string }) =>
      adminApi.kundaliMatch.submitReview(id, { adminReviewMessage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.KUNDALI_MATCH.ALL });
      setReviewModalRequest(null);
      setReviewMessage('');
      toast.success('Review submitted');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to submit review'),
  });

  const pagination = data?.pagination ?? {
    page: 1,
    limit: debouncedRowsPerPage,
    total: 0,
    totalPages: 0,
  };
  const columns: AdminTableColumn<KundaliMatchRequest>[] = [
    {
      header: 'User',
      accessor: (r) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-blue-400" />
          <div>
            <div className="text-sm font-medium text-white">{r.user?.name ?? 'N/A'}</div>
            <div className="text-xs text-slate-400">{r.user?.phone}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Date of Issue',
      accessor: (r) => (
        <span className="text-sm text-slate-400">{formatGregorianDateEnShort(r.createdAt)}</span>
      ),
    },
    {
      header: 'Boy (DOB, time, place)',
      accessor: (r) => (
        <div className="flex flex-col xl:flex-row gap-3 text-xs text-slate-300">
          <KundaliMatchDobLines
            iso={r.boyDateOfBirth}
            mapEntry={bsMap[toYmd(r.boyDateOfBirth)]}
            isLoading={isBsLoading}
          />
          <div className="shrink-0">
            <p className="text-slate-500 text-[10px] uppercase">Time of birth</p>
            <p className="text-slate-200">{formatTimeStringAmPm(r.boyTimeOfBirth)}</p>
          </div>
          <KundaliMatchPlaceBlock r={r} person="boy" useDevanagari={useDevanagari} />
        </div>
      ),
    },
    {
      header: 'Girl (DOB, time, place)',
      accessor: (r) => (
        <div className="flex flex-col xl:flex-row gap-3 text-xs text-slate-300">
          <KundaliMatchDobLines
            iso={r.girlDateOfBirth}
            mapEntry={bsMap[toYmd(r.girlDateOfBirth)]}
            isLoading={isBsLoading}
          />
          <div className="shrink-0">
            <p className="text-slate-500 text-[10px] uppercase">Time of birth</p>
            <p className="text-slate-200">{formatTimeStringAmPm(r.girlTimeOfBirth)}</p>
          </div>
          <KundaliMatchPlaceBlock r={r} person="girl" useDevanagari={useDevanagari} />
        </div>
      ),
    },
    {
      header: 'Topics',
      accessor: (r) => (
        <div className="max-w-[140px]">
          {r.selectedConsultationQuestionIds?.length ? (
            <span className="text-xs text-slate-300">
              {r.selectedConsultationQuestionIds.length} selected
            </span>
          ) : (
            <span className="text-xs text-slate-500">—</span>
          )}
        </div>
      ),
    },
    {
      header: 'Amount (NRs)',
      accessor: (r) => (
        <div className="flex items-center gap-1 text-emerald-400">
          <Banknote className="w-4 h-4" />
          <span>NRs {r.coinsDeducted.toLocaleString()}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (r) =>
        r.status === 'REVIEWED' ? (
          <Badge className="bg-green-500/15 text-green-300 border border-green-500/30">
            Reviewed
          </Badge>
        ) : (
          <Badge className="bg-yellow-500/15 text-yellow-200 border border-yellow-500/30">
            Pending
          </Badge>
        ),
    },
    {
      header: 'Actions',
      accessor: (r) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
            onClick={() => setViewModalRequest(r)}
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          {r.status === 'PENDING' && (
            <Button
              size="sm"
              variant="outline"
              className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
              onClick={() => {
                setReviewModalRequest(r);
                setReviewMessage('');
              }}
            >
              Send review
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleSubmitReview = () => {
    if (!reviewModalRequest || reviewMessage.trim().length < 10) {
      toast.error('Review message must be at least 10 characters');
      return;
    }
    submitReviewMutation.mutate({
      id: reviewModalRequest.id,
      adminReviewMessage: reviewMessage.trim(),
    });
  };

  return (
    <>
      <div className="space-y-5 sm:space-y-6">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <h1 className="min-w-0 flex-1 pr-1 text-2xl sm:text-3xl font-bold leading-tight cosmic-text break-words">
              Kundali Match
            </h1>
            <div className="flex shrink-0 flex-row flex-wrap items-center justify-end gap-2">
              <AdminRefreshButton
                onClick={() => refetch()}
                loading={isFetching}
                className="shrink-0"
              />
            </div>
          </div>
          <p className="text-sm sm:text-base text-slate-400">
            Review requests and send the kundali match report (text) to the user. Use Filter to
            narrow by request date (when the user submitted), same as Payment History.
          </p>
        </div>

        <div className="cosmic-card p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:flex-nowrap lg:items-end lg:gap-4">
            <div className="min-w-0 flex-1 basis-0 space-y-2">
              <Label className="text-white font-medium text-sm block">Status</Label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as KundaliMatchFilterValue)}
                disabled={isLoading || isFetching}
                className="h-11 w-full rounded-md border-2 border-purple-500/30 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none disabled:opacity-50"
              >
                {KUNDALI_MATCH_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0 flex-1 basis-0 space-y-2">
              <Label className="text-white font-medium text-sm block">Request date</Label>
              <AdminMonthRangeFilter
                fromValue={requestDateRange.from}
                toValue={requestDateRange.to}
                onRangeChange={(from, to) => setRequestDateRange({ from, to })}
                disabled={isLoading || isFetching}
                showInlineFilterPrefix={false}
                className="w-full min-w-0"
              />
            </div>
            <div className="min-w-0 flex-1 basis-0 space-y-2">
              <Label className="text-white font-medium text-sm block">
                Place names (province & district)
              </Label>
              <select
                value={displayLocale}
                onChange={(e) => setLocalePersist(e.target.value as KundaliAdminDisplayLocale)}
                disabled={isLoading || isFetching}
                className="h-11 w-full rounded-md border-2 border-purple-500/30 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none disabled:opacity-50"
              >
                <option value="en">English (Latin script)</option>
                <option value="ne">नेपाली (Devanagari)</option>
                <option value="hi">हिन्दी (Devanagari for Nepal places)</option>
              </select>
            </div>
            <AdminClearFiltersButton
              show={hasKundaliListFilters}
              onClear={clearKundaliListFilters}
              disabled={isLoading || isFetching}
              className="w-full shrink-0 self-end lg:w-auto"
            />
          </div>
          <p className="mt-3 text-[11px] text-slate-500 leading-snug border-t border-slate-700/60 pt-3">
            DOB is always shown in both BS and AD. Province and district use Devanagari when Nepali
            or Hindi is selected.
          </p>
        </div>

        <div className="cosmic-card border border-slate-700 overflow-hidden">
          {isLoading && <p className="p-6 text-slate-400">Loading...</p>}
          {error && (
            <p className="p-6 text-red-400">
              {error instanceof Error ? error.message : 'Failed to load'}
            </p>
          )}
          {!isLoading && !error && (
            <div className="overflow-x-auto min-w-0">
              <AdminTable
                columns={columns}
                data={requests}
                keyExtractor={(r) => r.id}
                emptyState={{
                  icon: <span className="text-4xl">🔮</span>,
                  title: hasKundaliListFilters
                    ? 'No kundali match requests in this range'
                    : 'No kundali match requests',
                  description: hasKundaliListFilters
                    ? 'Try adjusting the date range or status filter.'
                    : 'Requests will appear here when users submit from the dashboard.',
                }}
              />
            </div>
          )}
        </div>

        {!isLoading && !error && (
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

      {/* View detail modal */}
      <Dialog open={!!viewModalRequest} onOpenChange={(open) => !open && setViewModalRequest(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white w-[calc(100vw-1rem)] max-w-2xl max-h-[min(92dvh,900px)] flex flex-col overflow-hidden p-4 sm:p-6 sm:w-full">
          <DialogHeader className="shrink-0 pr-8">
            <DialogTitle>Kundali Match Request</DialogTitle>
          </DialogHeader>
          {viewModalRequest && (
            <div className="overflow-y-auto min-h-0 flex-1 -mr-1 pr-1 space-y-4 text-sm">
              <KundaliMatchRequestDetailPanel
                r={viewModalRequest}
                bsMap={bsMap}
                isBsLoading={isBsLoading}
                useDevanagari={useDevanagari}
              />
              {viewModalRequest.status === 'REVIEWED' && viewModalRequest.adminReviewMessage && (
                <div>
                  <p className="text-slate-400 font-medium mb-1">Admin review</p>
                  <div className="rounded-lg bg-slate-800/50 border border-slate-700 p-3 whitespace-pre-wrap text-slate-300 text-sm">
                    {viewModalRequest.adminReviewMessage}
                  </div>
                  {viewModalRequest.reviewedAt && (
                    <p className="text-slate-500 text-xs mt-1">
                      Reviewed {formatGregorianDateEnShort(viewModalRequest.reviewedAt)}
                    </p>
                  )}
                </div>
              )}
              {viewModalRequest.status === 'PENDING' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 w-full shrink-0"
                  onClick={() => {
                    setViewModalRequest(null);
                    setReviewModalRequest(viewModalRequest);
                    setReviewMessage('');
                  }}
                >
                  Send review
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!reviewModalRequest}
        onOpenChange={(open) => !open && setReviewModalRequest(null)}
      >
        <DialogContent className="bg-slate-900 border-slate-700 text-white w-[calc(100vw-1rem)] max-w-2xl max-h-[min(92dvh,900px)] flex flex-col overflow-hidden p-4 sm:p-6 sm:w-full gap-0">
          <DialogHeader className="shrink-0 pr-8 space-y-3 text-left">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <DialogTitle className="leading-tight">Send Kundali Match Review</DialogTitle>
              {reviewModalRequest ? (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm sm:justify-end sm:text-right">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <Banknote className="w-4 h-4 shrink-0" />
                    <span>NRs {reviewModalRequest.coinsDeducted.toLocaleString()}</span>
                  </div>
                  {reviewModalRequest.status === 'REVIEWED' ? (
                    <Badge className="bg-green-500/15 text-green-300 border border-green-500/30">
                      Reviewed
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-500/15 text-yellow-200 border border-yellow-500/30">
                      Pending
                    </Badge>
                  )}
                  <span className="text-slate-400">
                    Requested {formatGregorianDateEnShort(reviewModalRequest.createdAt)}
                  </span>
                </div>
              ) : null}
            </div>
            <p className="text-sm text-slate-400 font-normal">
              Full request details below. Write the kundali match report (text only); the user will
              see it in My Bookings.
            </p>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto -mr-1 pr-1 space-y-4 border-y border-slate-700/80 py-4 my-3">
            {reviewModalRequest ? (
              <KundaliMatchRequestDetailPanel
                r={reviewModalRequest}
                bsMap={bsMap}
                isBsLoading={isBsLoading}
                useDevanagari={useDevanagari}
                showUser={false}
                showPaymentStatus={false}
              />
            ) : null}
          </div>

          <div className="space-y-2 shrink-0 min-h-0">
            <Label className="text-slate-300">Review message (min 10 characters)</Label>
            <Textarea
              value={reviewMessage}
              onChange={(e) => setReviewMessage(e.target.value)}
              placeholder="Enter the detailed kundali match report..."
              rows={6}
              className="bg-slate-800 border-slate-600 text-white min-h-[140px] sm:min-h-[160px] max-h-[28vh] sm:max-h-[32vh] overflow-y-auto resize-y w-full"
            />
          </div>

          <DialogFooter className="shrink-0 pt-4 flex-col-reverse gap-2 sm:flex-row sm:justify-end border-0">
            <Button
              variant="ghost"
              className="text-slate-400 w-full sm:w-auto"
              onClick={() => setReviewModalRequest(null)}
              disabled={submitReviewMutation.isPending}
            >
              Cancel
            </Button>
            <LoadingButton
              onClick={handleSubmitReview}
              loading={submitReviewMutation.isPending}
              loadingText="Sending..."
              disabled={reviewMessage.trim().length < 10}
              className="bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto"
            >
              Send review
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
