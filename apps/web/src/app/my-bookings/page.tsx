/* eslint-disable react/no-unescaped-entities */
'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { QUERY_KEYS } from '@/constants';
import jyotishBookingService from '@/services/jyotishBooking.service';
import appointmentService from '@/services/appointment.service';
import { CancelAppointmentModal } from '@/components/features/appointment';
import { showErrorToast, showSuccessToast, getSuccessMessage } from '@/lib/error-handler';
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
  Search,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@jyotish/ui';
import { AstrologerCategory, JyotishBookingStatus, JyotishBookingType } from '@jyotish/shared';
import { AppointmentStatus } from '@/types/appointment.types';
import { XCircle, Coins } from 'lucide-react';

type MyBookingsResponse = Awaited<ReturnType<typeof jyotishBookingService.listMine>>;
type MyBooking = MyBookingsResponse['bookings'][number];

type MyAppointmentsResponse = Awaited<ReturnType<typeof appointmentService.listMine>>;
type MyAppointment = MyAppointmentsResponse['appointments'][number];

type Section = 'BOOKINGS' | 'APPOINTMENTS';

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
  const queryClient = useQueryClient();
  const [section, setSection] = useState<Section>('BOOKINGS');
  const [cancelModalAppointment, setCancelModalAppointment] =
    useState<MyAppointment | null>(null);

  const [search, setSearch] = useState('');
  const [type, setType] = useState<'ALL' | JyotishBookingType>('ALL');
  const [status, setStatus] = useState<'ALL' | JyotishBookingStatus>('ALL');
  const [page, setPage] = useState(1);
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

  const cancelMutation = useMutation({
    mutationFn: ({ id, cancellationNote }: { id: string; cancellationNote?: string }) =>
      appointmentService.cancelAppointment(id, cancellationNote),
    onSuccess: (response) => {
      showSuccessToast(getSuccessMessage(response) || 'Appointment cancelled successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.APPOINTMENTS.ALL });
    },
    onError: (error) => {
      showErrorToast(error);
    },
  });

  const handleCancelAppointment = (appointment: MyAppointment) => {
    setCancelModalAppointment(appointment);
  };

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
        ) : (
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
        )}

        <Card className="bg-black/40 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-white">
              {section === 'BOOKINGS' ? 'Bookings' : 'Appointments'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {section === 'BOOKINGS' ? (
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
                          <TableHead className="text-slate-200 border-r border-slate-700/60 min-w-[240px] whitespace-nowrap">
                            Admin note
                          </TableHead>
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
                            <TableCell
                              className="max-w-[260px] truncate border-r border-slate-700/40 min-w-[240px]"
                              title={b.adminNotes ?? ''}
                            >
                              {b.adminNotes || <span className="text-slate-500">—</span>}
                            </TableCell>
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
                        <TableHead className="text-slate-200 border-r border-slate-700/60">
                          Cancellation
                        </TableHead>
                        {/* Actions column removed: client cannot cancel once scheduled; only admin can cancel (status + notes updated then) */}
                        {/* <TableHead className="text-slate-200 border-r border-slate-700/60">Actions</TableHead> */}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.map((a: MyAppointment, idx) => (
                        <TableRow key={a.id}>
                          <TableCell className="whitespace-nowrap border-r border-slate-700/40 text-slate-300">
                            {(apptPagination.page - 1) * apptPagination.limit + idx + 1}
                          </TableCell>
                          <TableCell className="whitespace-nowrap border-r border-slate-700/40">
                            {a.astrologer.name}
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
                              <Coins className="h-4 w-4" />
                              {a.amount} coins
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
                          <TableCell
                            className="max-w-[320px] truncate border-r border-slate-700/40"
                            title={a.cancellationNote ?? ''}
                          >
                            {a.cancellationNote || <span className="text-slate-500">—</span>}
                          </TableCell>
                          {/* Actions: client cannot cancel once scheduled; only admin can cancel (then status + cancellation notes updated) */}
                          {/* <TableCell className="whitespace-nowrap border-r border-slate-700/40">
                            {(a.status === AppointmentStatus.PENDING ||
                              a.status === AppointmentStatus.CONFIRMED) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500/70"
                                onClick={() => handleCancelAppointment(a)}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel
                              </Button>
                            )}
                          </TableCell> */}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

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

            <CancelAppointmentModal
              isOpen={!!cancelModalAppointment}
              onClose={() => setCancelModalAppointment(null)}
              appointment={cancelModalAppointment}
              onCancelled={() => setCancelModalAppointment(null)}
              cancelFn={(id, cancellationNote) =>
                cancelMutation.mutateAsync({ id, cancellationNote })
              }
              isPending={cancelMutation.isPending}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
