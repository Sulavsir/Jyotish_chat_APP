/* eslint-disable react/no-unescaped-entities */
'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { QUERY_KEYS } from '@/constants';
import jyotishBookingService from '@/services/jyotishBooking.service';
import appointmentService from '@/services/appointment.service';
import kundaliMatchService, {
  type KundaliMatchRequest,
  type KundaliMatchStatus,
} from '@/services/kundaliMatch.service';
import { KundaliMatchSelectedTopicsSummary } from '@/components/features/kundali-match/KundaliMatchSelectedTopicsSummary';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Search,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@jyotish/ui';
import { AstrologerCategory, JyotishBookingStatus, JyotishBookingType } from '@jyotish/shared';
import { AppointmentStatus } from '@/types/appointment.types';
import { Banknote, Eye } from 'lucide-react';

type MyBookingsResponse = Awaited<ReturnType<typeof jyotishBookingService.listMine>>;
type MyBooking = MyBookingsResponse['bookings'][number];

type MyAppointmentsResponse = Awaited<ReturnType<typeof appointmentService.listMine>>;
type MyAppointment = MyAppointmentsResponse['appointments'][number];

type Section = 'BOOKINGS' | 'APPOINTMENTS' | 'KUNDALI_MATCH';

function typeLabel(t: JyotishBookingType) {
  if (t === JyotishBookingType.PANDIT) return 'Pandit Ji';
  if (t === JyotishBookingType.VAASTU) return 'Vaastu Shastri';
  if (t === JyotishBookingType.KATHA_VACHAK) return 'Katha Vachak';
  return t;
}

function categoryLabel(c: AstrologerCategory) {
  if (c === AstrologerCategory.ORDINARY) return 'Ordinary';
  if (c === AstrologerCategory.PROFESSIONAL) return 'Professional';
  if (c === AstrologerCategory.PREMIUM) return 'Premium';
  if (c === AstrologerCategory.KATHA_VACHAK) return 'Katha Vachak';
  return c;
}

function statusBadge(status: JyotishBookingStatus) {
  if (status === JyotishBookingStatus.APPROVED) {
    return (
      <Badge className="bg-green-500/15 text-green-300 border border-green-500/30">Approved</Badge>
    );
  }
  if (status === JyotishBookingStatus.REJECTED) {
    return <Badge className="bg-red-500/15 text-red-300 border border-red-500/30">Rejected</Badge>;
  }
  return (
    <Badge className="bg-yellow-500/15 text-yellow-200 border border-yellow-500/30">Pending</Badge>
  );
}

function appointmentStatusBadge(status: AppointmentStatus) {
  if (status === AppointmentStatus.CONFIRMED) {
    return (
      <Badge className="bg-green-500/15 text-green-300 border border-green-500/30">Confirmed</Badge>
    );
  }
  if (status === AppointmentStatus.CANCELLED) {
    return <Badge className="bg-red-500/15 text-red-300 border border-red-500/30">Cancelled</Badge>;
  }
  if (status === AppointmentStatus.COMPLETED) {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
        Completed
      </Badge>
    );
  }
  if (status === AppointmentStatus.IN_PROGRESS) {
    return (
      <Badge className="bg-purple-500/15 text-purple-200 border border-purple-500/30">
        In progress
      </Badge>
    );
  }
  if (status === AppointmentStatus.NO_SHOW) {
    return (
      <Badge className="bg-slate-500/15 text-slate-200 border border-slate-500/30">No show</Badge>
    );
  }
  return (
    <Badge className="bg-yellow-500/15 text-yellow-200 border border-yellow-500/30">Pending</Badge>
  );
}

export default function MyBookingsPage() {
  const [section, setSection] = useState<Section>('BOOKINGS');
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'ALL' | JyotishBookingType>('ALL');
  const [status, setStatus] = useState<'ALL' | JyotishBookingStatus>('ALL');
  const [page, setPage] = useState(1);
  const [viewReviewText, setViewReviewText] = useState<string | null>(null);
  const limit = 10;

  const params = useMemo(
    () => ({
      page,
      limit,
      search: search.trim() ? search.trim() : undefined,
      type: type === 'ALL' ? undefined : type,
      status: status === 'ALL' ? undefined : status,
    }),
    [page, search, status, type]
  );

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.JYOTISH_BOOKINGS.MY_LIST(params),
    queryFn: () => jyotishBookingService.listMine(params),
    placeholderData: (prev) => prev,
    enabled: section === 'BOOKINGS',
  });

  const bookings = data?.bookings ?? [];
  const pagination = data?.pagination ?? { page: 1, limit, total: 0, totalPages: 1 };

  const pages = useMemo(() => {
    const total = pagination.totalPages;
    const current = pagination.page;
    const window = 2;
    const start = Math.max(1, current - window);
    const end = Math.min(total, current + window);
    const out: number[] = [];
    for (let i = start; i <= end; i++) out.push(i);
    return out;
  }, [pagination.page, pagination.totalPages]);

  const [apptSearch, setApptSearch] = useState('');
  const [apptStatus, setApptStatus] = useState<'ALL' | AppointmentStatus>('ALL');
  const [apptPage, setApptPage] = useState(1);
  const apptLimit = 10;

  const apptParams = useMemo(
    () => ({
      page: apptPage,
      limit: apptLimit,
      search: apptSearch.trim() ? apptSearch.trim() : undefined,
      status: apptStatus === 'ALL' ? undefined : apptStatus,
    }),
    [apptPage, apptSearch, apptStatus]
  );

  const { data: apptData, isLoading: isApptLoading } = useQuery({
    queryKey: QUERY_KEYS.APPOINTMENTS.MY_LIST({
      page: apptParams.page,
      limit: apptParams.limit,
      search: apptParams.search,
      status: apptParams.status,
    }),
    queryFn: () => appointmentService.listMine(apptParams),
    placeholderData: (prev) => prev,
    enabled: section === 'APPOINTMENTS',
  });

  const appointments = apptData?.appointments ?? [];
  const apptPagination = apptData?.pagination ?? {
    page: 1,
    limit: apptLimit,
    total: 0,
    totalPages: 1,
  };

  const apptPages = useMemo(() => {
    const total = apptPagination.totalPages;
    const current = apptPagination.page;
    const window = 2;
    const start = Math.max(1, current - window);
    const end = Math.min(total, current + window);
    const out: number[] = [];
    for (let i = start; i <= end; i++) out.push(i);
    return out;
  }, [apptPagination.page, apptPagination.totalPages]);

  const [kmPage, setKmPage] = useState(1);
  const kmLimit = 10;
  const kmParams = useMemo(
    () => ({ page: kmPage, limit: kmLimit }),
    [kmPage]
  );
  const { data: kmData, isLoading: isKmLoading } = useQuery({
    queryKey: QUERY_KEYS.KUNDALI_MATCH.MY_LIST(kmParams),
    queryFn: () => kundaliMatchService.listMine(kmParams),
    placeholderData: (prev) => prev,
    enabled: section === 'KUNDALI_MATCH',
  });
  const kundaliMatchRequests = kmData?.requests ?? [];
  const kmPagination = kmData?.pagination ?? { page: 1, limit: kmLimit, total: 0, totalPages: 1 };
  const kmPages = useMemo(() => {
    const total = kmPagination.totalPages;
    const current = kmPagination.page;
    const window = 2;
    const start = Math.max(1, current - window);
    const end = Math.min(total, current + window);
    const out: number[] = [];
    for (let i = start; i <= end; i++) out.push(i);
    return out;
  }, [kmPagination.page, kmPagination.totalPages]);

  function kundaliMatchStatusBadge(s: KundaliMatchStatus) {
    if (s === 'REVIEWED') {
      return (
        <Badge className="bg-green-500/15 text-green-300 border border-green-500/30">Reviewed</Badge>
      );
    }
    return (
      <Badge className="bg-yellow-500/15 text-yellow-200 border border-yellow-500/30">Pending</Badge>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-3">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            📝 Bookings & Appointments
          </h1>
          <p className="text-gray-400">
            Track approval/rejection of bookings (admin) and appointment acceptance (Jyotish).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant={section === 'BOOKINGS' ? 'default' : 'outline'}
            className={
              section === 'BOOKINGS'
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'border-white/20 text-white hover:bg-white/10'
            }
            onClick={() => setSection('BOOKINGS')}
          >
            Bookings
          </Button>
          <Button
            variant={section === 'APPOINTMENTS' ? 'default' : 'outline'}
            className={
              section === 'APPOINTMENTS'
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'border-white/20 text-white hover:bg-white/10'
            }
            onClick={() => setSection('APPOINTMENTS')}
          >
            Appointments
          </Button>
          <Button
            variant={section === 'KUNDALI_MATCH' ? 'default' : 'outline'}
            className={
              section === 'KUNDALI_MATCH'
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'border-white/20 text-white hover:bg-white/10'
            }
            onClick={() => setSection('KUNDALI_MATCH')}
          >
            Kundali Match
          </Button>
        </div>

        {section === 'BOOKINGS' ? (
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="md:flex-1 md:min-w-[520px]">
              <Search
                placeholder="Search by reason, remarks, admin note..."
                value={search}
                className="m-0"
                onSearch={(v) => {
                  setSearch(v);
                  setPage(1);
                }}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                containerClassName="w-full m-0 px-0"
              />
            </div>

            <div className="cosmic-card rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3 md:ml-auto">
              <div className="md:w-48">
                <Select
                  value={type}
                  onValueChange={(v) => {
                    setType(v as typeof type);
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <span className={type === 'ALL' ? 'text-slate-400' : ''}>
                      {type === 'ALL' ? 'Filter by booking type' : typeLabel(type)}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value={JyotishBookingType.PANDIT}>Pandit Ji</SelectItem>
                    <SelectItem value={JyotishBookingType.VAASTU}>Vaastu Shastri</SelectItem>
                    <SelectItem value={JyotishBookingType.KATHA_VACHAK}>Katha Vachak</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:w-48">
                <Select
                  value={status}
                  onValueChange={(v) => {
                    setStatus(v as typeof status);
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <span className={status === 'ALL' ? 'text-slate-400' : ''}>
                      {status === 'ALL' ? 'Filter by status' : status}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value={JyotishBookingStatus.PENDING}>Pending</SelectItem>
                    <SelectItem value={JyotishBookingStatus.APPROVED}>Approved</SelectItem>
                    <SelectItem value={JyotishBookingStatus.REJECTED}>Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ) : section === 'APPOINTMENTS' ? (
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="md:flex-1 md:min-w-[520px]">
              <Search
                placeholder="Search by Jyotish name or notes..."
                value={apptSearch}
                onSearch={(v) => {
                  setApptSearch(v);
                  setApptPage(1);
                }}
                onChange={(e) => {
                  setApptSearch(e.target.value);
                  setApptPage(1);
                }}
                containerClassName="w-full m-0 px-0"
              />
            </div>

            <div className="cosmic-card rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3 md:ml-auto">
              <div className="md:w-48">
                <Select
                  value={apptStatus}
                  onValueChange={(v) => {
                    setApptStatus(v as typeof apptStatus);
                    setApptPage(1);
                  }}
                >
                  <SelectTrigger>
                    <span className={apptStatus === 'ALL' ? 'text-slate-400' : ''}>
                      {apptStatus === 'ALL' ? 'Filter by status' : apptStatus}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value={AppointmentStatus.PENDING}>Pending</SelectItem>
                    <SelectItem value={AppointmentStatus.CONFIRMED}>Confirmed</SelectItem>
                    <SelectItem value={AppointmentStatus.IN_PROGRESS}>In progress</SelectItem>
                    <SelectItem value={AppointmentStatus.COMPLETED}>Completed</SelectItem>
                    <SelectItem value={AppointmentStatus.CANCELLED}>Cancelled</SelectItem>
                    <SelectItem value={AppointmentStatus.NO_SHOW}>No show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ) : null}

        <Card className="bg-black/40 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-white">
              {section === 'BOOKINGS'
                ? 'Bookings'
                : section === 'APPOINTMENTS'
                  ? 'Appointments'
                  : 'Kundali Match'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {section === 'KUNDALI_MATCH' ? (
              isKmLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : kundaliMatchRequests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">🔮</div>
                  <p className="text-gray-300 mb-2">No kundali match requests yet</p>
                  <p className="text-sm text-gray-500">
                    Submit a request from the dashboard Services section (Kundali Match).
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <Table className="bg-black/20">
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-purple-900/60 via-indigo-950/60 to-slate-900/60 hover:bg-gradient-to-r hover:from-purple-900/60 hover:via-indigo-950/60 hover:to-slate-900/60">
                          <TableHead className="text-slate-200 border-r border-slate-700/60 w-[72px]">
                            S.N.
                          </TableHead>
                          <TableHead className="text-slate-200 border-r border-slate-700/60">
                            Requested
                          </TableHead>
                          <TableHead className="text-slate-200 border-r border-slate-700/60 min-w-[140px]">
                            Boy (DOB, TOB, POB)
                          </TableHead>
                          <TableHead className="text-slate-200 border-r border-slate-700/60 min-w-[140px]">
                            Girl (DOB, TOB, POB)
                          </TableHead>
                          <TableHead className="text-slate-200 border-r border-slate-700/60 min-w-[100px]">
                            Topics
                          </TableHead>
                          <TableHead className="text-slate-200 border-r border-slate-700/60">
                            Amount
                          </TableHead>
                          <TableHead className="text-slate-200 border-r border-slate-700/60">
                            Status
                          </TableHead>
                          <TableHead className="text-slate-200 border-r border-slate-700/60 min-w-[240px]">
                            Review
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {kundaliMatchRequests.map((r: KundaliMatchRequest, idx: number) => (
                          <TableRow key={r.id}>
                            <TableCell className="whitespace-nowrap border-r border-slate-700/40 text-slate-300">
                              {(kmPagination.page - 1) * kmPagination.limit + idx + 1}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-slate-200 border-r border-slate-700/40">
                              {new Date(r.createdAt).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </TableCell>
                            <TableCell className="border-r border-slate-700/40 text-sm text-slate-200">
                              <div className="min-w-0">
                                <div>
                                  {typeof r.boyDateOfBirth === 'string'
                                    ? r.boyDateOfBirth.slice(0, 10)
                                    : new Date(r.boyDateOfBirth).toISOString().slice(0, 10)}
                                </div>
                                <div className="text-xs text-slate-400">{r.boyTimeOfBirth}</div>
                                <div className="text-xs truncate" title={r.boyPlaceOfBirth}>
                                  {r.boyPlaceOfBirth}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="border-r border-slate-700/40 text-sm text-slate-200">
                              <div className="min-w-0">
                                <div>
                                  {typeof r.girlDateOfBirth === 'string'
                                    ? r.girlDateOfBirth.slice(0, 10)
                                    : new Date(r.girlDateOfBirth).toISOString().slice(0, 10)}
                                </div>
                                <div className="text-xs text-slate-400">{r.girlTimeOfBirth}</div>
                                <div className="text-xs truncate" title={r.girlPlaceOfBirth}>
                                  {r.girlPlaceOfBirth}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="border-r border-slate-700/40 align-top">
                              <KundaliMatchSelectedTopicsSummary
                                selectedIds={r.selectedConsultationQuestionIds ?? []}
                              />
                            </TableCell>
                            <TableCell className="whitespace-nowrap border-r border-slate-700/40">
                              <span className="inline-flex items-center gap-1 text-amber-400">
                                <Banknote className="h-4 w-4" />
                                {r.coinsDeducted} NRs
                              </span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap border-r border-slate-700/40">
                              {kundaliMatchStatusBadge(r.status)}
                            </TableCell>
                            <TableCell className="border-r border-slate-700/40 max-w-[320px]">
                              {r.adminReviewMessage ? (
                                <div
                                  className="group relative inline-flex items-start gap-2 w-full min-w-0 cursor-pointer"
                                  onClick={() => setViewReviewText(r.adminReviewMessage ?? null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      setViewReviewText(r.adminReviewMessage ?? null);
                                    }
                                  }}
                                  role="button"
                                  tabIndex={0}
                                  title="View full review"
                                >
                                  <p className="text-sm text-white/90 whitespace-pre-wrap line-clamp-3 flex-1 min-w-0">
                                    {r.adminReviewMessage}
                                  </p>
                                  <span className="flex shrink-0 items-center justify-center w-7 h-7 rounded-md bg-white/10 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Eye className="h-4 w-4" />
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-500">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {kmPagination.total > 0 ? (
                    <div className="pt-6">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              disabled={kmPagination.page <= 1}
                              onClick={() => setKmPage((p) => Math.max(1, p - 1))}
                            />
                          </PaginationItem>
                          {kmPages.map((p) => (
                            <PaginationItem key={p}>
                              <PaginationLink
                                isActive={p === kmPagination.page}
                                onClick={() => setKmPage(p)}
                              >
                                {p}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext
                              disabled={kmPagination.page >= kmPagination.totalPages}
                              onClick={() =>
                                setKmPage((p) => Math.min(kmPagination.totalPages, p + 1))
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                      <div className="text-center text-xs text-slate-400 mt-2">
                        Showing page {kmPagination.page} of {kmPagination.totalPages} •{' '}
                        {kmPagination.total} total
                      </div>
                    </div>
                  ) : null}
                </>
              )
            ) : section === 'BOOKINGS' ? (
              isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">📄</div>
                  <p className="text-gray-300 mb-2">No bookings found</p>
                  <p className="text-sm text-gray-500">
                    Create a booking from your dashboard services section.
                  </p>
                </div>
              ) : (
                <>
                  {(() => {
                    const showAdminNote = bookings.some((b: MyBooking) =>
                      (b.adminNotes ?? '').trim()
                    );
                    return (
                      <div className="overflow-x-auto rounded-xl border border-white/10">
                        <Table className="bg-black/20">
                          <TableHeader>
                            <TableRow className="bg-gradient-to-r from-purple-900/60 via-indigo-950/60 to-slate-900/60 hover:bg-gradient-to-r hover:from-purple-900/60 hover:via-indigo-950/60 hover:to-slate-900/60">
                              <TableHead className="text-slate-200 border-r border-slate-700/60 w-[72px]">
                                S.N.
                              </TableHead>
                              <TableHead className="text-slate-200 border-r border-slate-700/60">
                                Type
                              </TableHead>
                              <TableHead className="text-slate-200 border-r border-slate-700/60 min-w-[220px]">
                                Date
                              </TableHead>
                              <TableHead className="text-slate-200 border-r border-slate-700/60">
                                Reason
                              </TableHead>
                              <TableHead className="text-slate-200 border-r border-slate-700/60">
                                Remarks
                              </TableHead>
                              {showAdminNote && (
                                <TableHead className="text-slate-200 border-r border-slate-700/60 min-w-[240px] whitespace-nowrap">
                                  Admin note
                                </TableHead>
                              )}
                              <TableHead className="text-slate-200 border-r border-slate-700/60">
                                Status
                              </TableHead>
                              <TableHead className="text-slate-200 border-r border-slate-700/60">
                                Submitted
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bookings.map((b: MyBooking, idx) => (
                              <TableRow key={b.id}>
                                <TableCell className="whitespace-nowrap border-r border-slate-700/40 text-slate-300">
                                  {(pagination.page - 1) * pagination.limit + idx + 1}
                                </TableCell>
                                <TableCell className="border-r border-slate-700/40">
                                  <div className="min-w-0">
                                    <div className="text-white whitespace-nowrap">
                                      {typeLabel(b.type)}
                                    </div>
                                    {b.type === JyotishBookingType.KATHA_VACHAK &&
                                    b.preferredAstrologer ? (
                                      <div
                                        className="text-xs text-slate-300 truncate"
                                        title={b.preferredAstrologer.name}
                                      >
                                        Jyotish: {b.preferredAstrologer.name}
                                      </div>
                                    ) : null}
                                  </div>
                                </TableCell>
                                <TableCell
                                  className="whitespace-nowrap text-slate-200 border-r border-slate-700/40 min-w-[220px]"
                                  title={new Date(b.bookingDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                >
                                  {new Date(b.bookingDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </TableCell>
                                <TableCell
                                  className="max-w-[260px] truncate border-r border-slate-700/40"
                                  title={b.category}
                                >
                                  {b.category}
                                </TableCell>
                                <TableCell
                                  className="max-w-[320px] truncate border-r border-slate-700/40"
                                  title={b.details ?? ''}
                                >
                                  {b.details || <span className="text-slate-500">—</span>}
                                </TableCell>
                                {showAdminNote && (
                                  <TableCell
                                    className="max-w-[260px] truncate border-r border-slate-700/40 min-w-[240px]"
                                    title={b.adminNotes ?? ''}
                                  >
                                    {b.adminNotes || <span className="text-slate-500">—</span>}
                                  </TableCell>
                                )}
                                <TableCell className="whitespace-nowrap border-r border-slate-700/40">
                                  {statusBadge(b.status)}
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-slate-300">
                                  {new Date(b.createdAt).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    );
                  })()}

                  {pagination.total > 0 ? (
                    <div className="pt-6">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              disabled={pagination.page <= 1}
                              onClick={() => setPage((p) => Math.max(1, p - 1))}
                            />
                          </PaginationItem>
                          {pages.map((p) => (
                            <PaginationItem key={p}>
                              <PaginationLink
                                isActive={p === pagination.page}
                                onClick={() => setPage(p)}
                              >
                                {p}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext
                              disabled={pagination.page >= pagination.totalPages}
                              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                      <div className="text-center text-xs text-slate-400 mt-2">
                        Showing page {pagination.page} of {pagination.totalPages} •{' '}
                        {pagination.total} total
                      </div>
                    </div>
                  ) : null}
                </>
              )
            ) : isApptLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📄</div>
                <p className="text-gray-300 mb-2">No appointments found</p>
                <p className="text-sm text-gray-500">
                  Book an appointment from an astrologer profile.
                </p>
              </div>
            ) : (
              <>
                {(() => {
                  const showCancellationReason = appointments.some(
                    (a: MyAppointment) =>
                      a.status === AppointmentStatus.CANCELLED && (a.cancellationNote ?? '').trim()
                  );
                  return (
                    <div className="overflow-x-auto rounded-xl border border-white/10">
                      <Table className="bg-black/20">
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-purple-900/60 via-indigo-950/60 to-slate-900/60 hover:bg-gradient-to-r hover:from-purple-900/60 hover:via-indigo-950/60 hover:to-slate-900/60">
                            <TableHead className="text-slate-200 border-r border-slate-700/60 w-[72px]">
                              S.N.
                            </TableHead>
                            <TableHead className="text-slate-200 border-r border-slate-700/60">
                              Jyotish
                            </TableHead>
                            <TableHead className="text-slate-200 border-r border-slate-700/60">
                              Scheduled
                            </TableHead>
                            <TableHead className="text-slate-200 border-r border-slate-700/60">
                              Duration
                            </TableHead>
                            <TableHead className="text-slate-200 border-r border-slate-700/60">
                              Amount
                            </TableHead>
                            <TableHead className="text-slate-200 border-r border-slate-700/60">
                              Status
                            </TableHead>
                            <TableHead className="text-slate-200 border-r border-slate-700/60">
                              Requested
                            </TableHead>
                            <TableHead className="text-slate-200 border-r border-slate-700/60">
                              Notes
                            </TableHead>
                            {showCancellationReason && (
                              <TableHead className="text-slate-200 border-r border-slate-700/60">
                                Cancellation reason
                              </TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {appointments.map((a: MyAppointment, idx) => (
                            <TableRow key={a.id}>
                              <TableCell className="whitespace-nowrap border-r border-slate-700/40 text-slate-300">
                                {(apptPagination.page - 1) * apptPagination.limit + idx + 1}
                              </TableCell>
                              <TableCell className="border-r border-slate-700/40">
                                <div>
                                  <p className="text-white font-medium">{a.astrologer.name}</p>
                                  {a.bookingType && (
                                    <span className="mt-1 inline-block text-xs px-1.5 py-0.5 rounded font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                      Appointment for Full Kundali Review
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-slate-200 border-r border-slate-700/40">
                                {new Date(a.scheduledAt).toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </TableCell>
                              <TableCell className="whitespace-nowrap border-r border-slate-700/40">
                                {a.duration} min
                              </TableCell>
                              <TableCell className="whitespace-nowrap border-r border-slate-700/40">
                                <span className="inline-flex items-center gap-1.5 text-amber-400 font-medium">
                                  <Banknote className="h-4 w-4" />
                                  {a.amount} NRs
                                </span>
                              </TableCell>
                              <TableCell className="whitespace-nowrap border-r border-slate-700/40">
                                {appointmentStatusBadge(a.status)}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-slate-300">
                                {new Date(a.createdAt).toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </TableCell>
                              <TableCell
                                className="max-w-[320px] truncate border-r border-slate-700/40"
                                title={a.notes ?? ''}
                              >
                                {a.notes || <span className="text-slate-500">—</span>}
                              </TableCell>
                              {showCancellationReason && (
                                <TableCell
                                  className="max-w-[320px] truncate border-r border-slate-700/40"
                                  title={
                                    a.status === AppointmentStatus.CANCELLED
                                      ? (a.cancellationNote ?? '') || '—'
                                      : ''
                                  }
                                >
                                  {a.status === AppointmentStatus.CANCELLED ? (
                                    a.cancellationNote || <span className="text-slate-500">—</span>
                                  ) : (
                                    <span className="text-slate-500">—</span>
                                  )}
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })()}

                {apptPagination.total > 0 ? (
                  <div className="pt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            disabled={apptPagination.page <= 1}
                            onClick={() => setApptPage((p) => Math.max(1, p - 1))}
                          />
                        </PaginationItem>
                        {apptPages.map((p) => (
                          <PaginationItem key={p}>
                            <PaginationLink
                              isActive={p === apptPagination.page}
                              onClick={() => setApptPage(p)}
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            disabled={apptPagination.page >= apptPagination.totalPages}
                            onClick={() =>
                              setApptPage((p) => Math.min(apptPagination.totalPages, p + 1))
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                    <div className="text-center text-xs text-slate-400 mt-2">
                      Showing page {apptPagination.page} of {apptPagination.totalPages} •{' '}
                      {apptPagination.total} total
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!viewReviewText} onOpenChange={(open) => !open && setViewReviewText(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white">Kundali Match Review</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto rounded-lg bg-slate-800/50 border border-slate-700 p-4">
            <p className="text-sm text-white/90 whitespace-pre-wrap">{viewReviewText ?? ''}</p>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              className="border-slate-600 text-slate-300"
              onClick={() => setViewReviewText(null)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
