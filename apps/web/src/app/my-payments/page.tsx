/* eslint-disable react/no-unescaped-entities */
'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { QUERY_KEYS } from '@/constants';
import { paymentService } from '@/services/payment.service';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@jyotish/ui';
import { Banknote } from 'lucide-react';

function getRecordValue(meta: unknown, key: string): unknown | undefined {
  if (!meta || typeof meta !== 'object') return undefined;
  const record = meta as Record<string, unknown>;
  return key in record ? record[key] : undefined;
}

function extractOptionalNumber(meta: unknown, key: string): number | null {
  const v = getRecordValue(meta, key);
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function extractOptionalString(meta: unknown, key: string): string | null {
  const v = getRecordValue(meta, key);
  if (typeof v === 'string') return v;
  return null;
}

export default function MyPaymentsPage() {
  const limit = 10;
  const [page, setPage] = useState(1);

  const params = useMemo(() => ({ page, limit }), [page]);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.PAYMENTS.MY_SUCCESSFUL(params),
    queryFn: () => paymentService.getMyPayments(params),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });

  const payments = data?.payments ?? [];
  const pagination = data?.pagination ?? { page: 1, limit, total: 0, totalPages: 1 };

  const pages = useMemo(() => {
    const totalPages = pagination.totalPages ?? 1;
    const current = pagination.page ?? 1;
    const window = 2;
    const start = Math.max(1, current - window);
    const end = Math.min(totalPages, current + window);
    const out: number[] = [];
    for (let i = start; i <= end; i += 1) out.push(i);
    return out;
  }, [pagination.page, pagination.totalPages]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <Card className="bg-black/40 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Banknote className="h-5 w-5 text-purple-400" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-300">No successful payments found.</p>
                <p className="text-sm text-gray-500 mt-1">
                  Only payments confirmed by the payment gateway are shown.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <Table className="bg-black/20">
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-purple-900/60 via-indigo-950/60 to-slate-900/60 hover:bg-gradient-to-r hover:from-purple-900/60 hover:via-indigo-950/60 hover:to-slate-900/60">
                        <TableHead className="text-slate-200 border-r border-slate-700/60 w-[72px]">S.N.</TableHead>
                        <TableHead className="text-slate-200 border-r border-slate-700/60 min-w-[190px]">Date</TableHead>
                        <TableHead className="text-slate-200 border-r border-slate-700/60">Amount</TableHead>
                        <TableHead className="text-slate-200 border-r border-slate-700/60">Method</TableHead>
                        <TableHead className="text-slate-200 border-r border-slate-700/60 min-w-[220px]">Details</TableHead>
                        <TableHead className="text-slate-200 min-w-[200px]">Transaction</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((p, idx) => {
                        const coins = extractOptionalNumber(p.metadata, 'coins');
                        const planId = extractOptionalString(p.metadata, 'planId');

                        const details = coins != null ? `${coins} coins` : planId ? `Plan: ${planId}` : '-';

                        return (
                          <TableRow key={p.id}>
                            <TableCell className="whitespace-nowrap border-r border-slate-700/40 text-slate-300">
                              {(pagination.page - 1) * pagination.limit + idx + 1}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-slate-200 border-r border-slate-700/40">
                              {p.createdAt ? new Date(p.createdAt).toLocaleString() : '-'}
                            </TableCell>
                            <TableCell className="whitespace-nowrap border-r border-slate-700/40 text-slate-200">
                              <div className="inline-flex items-center gap-2">
                                <span className="text-purple-200 font-semibold">NRs {p.amount.toLocaleString()}</span>
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap border-r border-slate-700/40 text-slate-200">
                              {p.paymentMethod || '-'}
                            </TableCell>
                            <TableCell className="border-r border-slate-700/40 text-sm text-slate-200">
                              <div className="flex items-center gap-3">
                                <Badge className="bg-emerald-500/15 text-emerald-200 border border-emerald-500/30">
                                  Success
                                </Badge>
                                <span className="truncate" title={details}>{details}</span>
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-slate-300">
                              {p.transactionId ?? '-'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          disabled={(pagination.page ?? 1) <= 1}
                          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        />
                      </PaginationItem>

                      {pages.map((p) => (
                        <PaginationItem key={p}>
                          <PaginationLink
                            isActive={p === (pagination.page ?? 1)}
                            onClick={() => setPage(p)}
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          disabled={(pagination.page ?? 1) >= (pagination.totalPages ?? 1)}
                          onClick={() => setPage((prev) => Math.min(pagination.totalPages ?? 1, prev + 1))}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  <div className="text-sm text-slate-400 mt-2">
                    Showing page <span className="text-slate-200 font-semibold">{pagination.page}</span> of{' '}
                    <span className="text-slate-200 font-semibold">{pagination.totalPages}</span> •{' '}
                    <span className="text-purple-300 font-semibold">{pagination.total}</span> total
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

