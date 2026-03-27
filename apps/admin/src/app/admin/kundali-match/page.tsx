'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
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
} from '@jyotish/ui';
import {
  AdminTable,
  AdminListPaginationSection,
  AdminRefreshButton,
  type AdminTableColumn,
  KundaliMatchStatusFilter,
  type KundaliMatchFilterValue,
} from '@/components/admin';
import { ADMIN_QUERY_KEYS, PAGINATION_DEFAULTS, ADMIN_ROWS_PER_PAGE_OPTIONS } from '@/constants';
import type { KundaliMatchRequest } from '@/types/kundaliMatch.types';
import { toast } from 'sonner';
import { Banknote, User, Eye } from 'lucide-react';

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateShort(dateString: string) {
  return new Date(dateString).toISOString().slice(0, 10);
}

export default function KundaliMatchPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(PAGINATION_DEFAULTS.LIMIT);
  const [statusFilter, setStatusFilter] = useState<KundaliMatchFilterValue>('ALL');
  const [reviewModalRequest, setReviewModalRequest] = useState<KundaliMatchRequest | null>(null);
  const [viewModalRequest, setViewModalRequest] = useState<KundaliMatchRequest | null>(null);
  const [reviewMessage, setReviewMessage] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.KUNDALI_MATCH.LIST(), currentPage, statusFilter, rowsPerPage],
    queryFn: () =>
      adminApi.kundaliMatch.list({
        page: currentPage,
        limit: rowsPerPage,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }),
    staleTime: 0,
  });

  const handlePageSizeChange = (size: number) => {
    if (size === rowsPerPage) {
      void refetch();
      return;
    }
    setRowsPerPage(size);
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, rowsPerPage]);

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

  const requests = data?.requests ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    limit: rowsPerPage,
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
      accessor: (r) => <span className="text-sm text-slate-400">{formatDate(r.createdAt)}</span>,
    },
    {
      header: 'Boy(Date, Time, Place)',
      accessor: (r) => (
        <div className="text-xs text-slate-300">
          <div>{formatDateShort(r.boyDateOfBirth)}</div>
          <div>{r.boyTimeOfBirth}</div>
          <div className="truncate max-w-[120px]" title={r.boyPlaceOfBirth}>
            {r.boyPlaceOfBirth}
          </div>
        </div>
      ),
    },
    {
      header: 'Girl(Date, Time, Place)',
      accessor: (r) => (
        <div className="text-xs text-slate-300">
          <div>{formatDateShort(r.girlDateOfBirth)}</div>
          <div>{r.girlTimeOfBirth}</div>
          <div className="truncate max-w-[120px]" title={r.girlPlaceOfBirth}>
            {r.girlPlaceOfBirth}
          </div>
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
    <AdminLayout>
      <div className="space-y-5 sm:space-y-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h1 className="min-w-0 flex-1 pr-1 text-2xl sm:text-3xl font-bold cosmic-text break-words">
              Kundali Match
            </h1>
            <AdminRefreshButton
              onClick={() => refetch()}
              loading={isFetching}
              className="shrink-0 self-start"
            />
          </div>
          <p className="text-sm sm:text-base text-slate-400">
            Review requests and send the kundali match report (text) to the user.
          </p>
          <div className="w-full [&_button]:w-full sm:w-auto sm:[&_button]:w-auto">
            <KundaliMatchStatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="cosmic-card border border-slate-700 overflow-hidden">
          {isLoading && <p className="p-6 text-slate-400">Loading...</p>}
          {error && (
            <p className="p-6 text-red-400">
              {error instanceof Error ? error.message : 'Failed to load'}
            </p>
          )}
          {!isLoading && !error && (
            <AdminTable
              columns={columns}
              data={requests}
              keyExtractor={(r) => r.id}
              emptyState={{
                icon: <span className="text-4xl">🔮</span>,
                title: 'No kundali match requests',
                description: 'Requests will appear here when users submit from the dashboard.',
              }}
            />
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
        <DialogContent className="bg-slate-900 border-slate-700 text-white w-[calc(100vw-2rem)] max-w-lg max-h-[90vh] overflow-y-auto sm:w-full">
          <DialogHeader>
            <DialogTitle>Kundali Match Request</DialogTitle>
          </DialogHeader>
          {viewModalRequest && (
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-slate-400 font-medium mb-1">User</p>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <p className="text-white font-medium">{viewModalRequest.user?.name ?? 'N/A'}</p>
                    <p className="text-slate-400">{viewModalRequest.user?.phone}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 font-medium mb-1">Boy&apos;s details</p>
                  <div className="rounded-lg bg-slate-800/50 border border-slate-700 p-3 space-y-1">
                    <p>DOB: {formatDateShort(viewModalRequest.boyDateOfBirth)}</p>
                    <p>Time: {viewModalRequest.boyTimeOfBirth}</p>
                    <p className="truncate" title={viewModalRequest.boyPlaceOfBirth}>
                      Place: {viewModalRequest.boyPlaceOfBirth}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 font-medium mb-1">Girl&apos;s details</p>
                  <div className="rounded-lg bg-slate-800/50 border border-slate-700 p-3 space-y-1">
                    <p>DOB: {formatDateShort(viewModalRequest.girlDateOfBirth)}</p>
                    <p>Time: {viewModalRequest.girlTimeOfBirth}</p>
                    <p className="truncate" title={viewModalRequest.girlPlaceOfBirth}>
                      Place: {viewModalRequest.girlPlaceOfBirth}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Banknote className="w-4 h-4" />
                  <span>NRs {viewModalRequest.coinsDeducted.toLocaleString()}</span>
                </div>
                <div>
                  {viewModalRequest.status === 'REVIEWED' ? (
                    <Badge className="bg-green-500/15 text-green-300 border border-green-500/30">
                      Reviewed
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-500/15 text-yellow-200 border border-yellow-500/30">
                      Pending
                    </Badge>
                  )}
                </div>
                <p className="text-slate-400">Requested {formatDate(viewModalRequest.createdAt)}</p>
              </div>
              {viewModalRequest.status === 'REVIEWED' && viewModalRequest.adminReviewMessage && (
                <div>
                  <p className="text-slate-400 font-medium mb-1">Admin review</p>
                  <div className="rounded-lg bg-slate-800/50 border border-slate-700 p-3 whitespace-pre-wrap text-slate-300">
                    {viewModalRequest.adminReviewMessage}
                  </div>
                  {viewModalRequest.reviewedAt && (
                    <p className="text-slate-500 text-xs mt-1">
                      Reviewed {formatDate(viewModalRequest.reviewedAt)}
                    </p>
                  )}
                </div>
              )}
              {viewModalRequest.status === 'PENDING' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 w-full"
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
        <DialogContent className="bg-slate-900 border-slate-700 text-white w-[calc(100vw-2rem)] max-w-lg max-h-[90vh] flex flex-col overflow-hidden sm:w-full">
          <DialogHeader className="shrink-0">
            <DialogTitle>Send Kundali Match Review</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-400 shrink-0">
            Write the kundali match report (text only). The user will see this in My Bookings.
          </p>
          <div className="space-y-2 min-h-0 flex flex-col flex-1">
            <Label className="text-slate-300 shrink-0">Review message (min 10 characters)</Label>
            <Textarea
              value={reviewMessage}
              onChange={(e) => setReviewMessage(e.target.value)}
              placeholder="Enter the detailed kundali match report..."
              rows={10}
              className="bg-slate-800 border-slate-600 text-white min-h-[200px] max-h-[50vh] !overflow-y-auto resize-y block"
            />
          </div>
          <DialogFooter className="shrink-0 border-t border-slate-700 pt-4 mt-4 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              className="text-slate-400 w-full sm:w-auto"
              onClick={() => setReviewModalRequest(null)}
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
    </AdminLayout>
  );
}
