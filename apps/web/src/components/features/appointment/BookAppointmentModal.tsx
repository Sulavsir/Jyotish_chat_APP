/**
 * Book Appointment Modal
 * Allows clients to book appointments with professional/premium astrologers
 */

'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Clock, Loader2, CalendarDays } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Search,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@jyotish/ui';
import { LoadingButton } from '@/components/ui';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import appointmentService from '@/services/appointment.service';
import type { Astrologer, AstrologerSlot, BookingType } from '@/types/appointment.types';
import { AstrologerCategory } from '@/types/appointment.types';
import { ASTROLOGER_CATEGORY, QUERY_KEYS } from '@/constants';
import { useCoinRates } from '@/hooks/useCoinRates';
import coinService from '@/services/coin.service';

interface AstrologerListResponse {
  data?: Astrologer[];
  astrologers?: Astrologer[];
}
import { getImageUrl } from '@/utils/image.utils';
import { showErrorToast, getSuccessMessage } from '@/lib/error-handler';

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** APPOINTMENT = normal appointment; KUNDALI_REVIEW = Full Kundali Review (different rate & label) */
  mode?: 'APPOINTMENT' | 'KUNDALI_REVIEW';
}

const BOOKING_MODE = {
  APPOINTMENT: {
    slotType: 'APPOINTMENT' as BookingType,
    rateKey: 'APPOINTMENT' as const,
    title: 'Book an Appointment',
    description: 'Schedule a cosmic consultation with our expert astrologers',
  },
  KUNDALI_REVIEW: {
    slotType: 'KUNDALI_REVIEW' as BookingType,
    rateKey: 'KUNDALI_REVIEW' as const,
    title: 'Full Kundali Review',
    description: 'Book a detailed kundali review session with our expert astrologers',
  },
};

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode = 'APPOINTMENT',
}) => {
  const queryClient = useQueryClient();
  const [selectedAstrologer, setSelectedAstrologer] = useState<Astrologer | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AstrologerSlot | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [step, setStep] = useState<'select-astrologer' | 'select-datetime'>('select-astrologer');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDateKey, setSelectedDateKey] = useState<string>('');
  const [bookingSlotId, setBookingSlotId] = useState<string | null>(null);

  const bookingMode = BOOKING_MODE[mode];
  const { rates } = useCoinRates(isOpen);
  const appointmentCoinCost = rates?.[bookingMode.rateKey];
  const { data: balanceData } = useQuery({
    queryKey: QUERY_KEYS.COINS.BALANCE,
    queryFn: () => coinService.getBalance(),
    enabled: isOpen,
  });
  const coinBalance = balanceData?.balance ?? 0;

  // Fetch astrologers with TanStack Query
  const { data: rawAstrologers, isLoading: isLoadingAstrologers } = useQuery({
    queryKey: QUERY_KEYS.APPOINTMENTS.ASTROLOGERS_FOR_APPOINTMENT,
    queryFn: appointmentService.getAstrologersForAppointment,
    enabled: isOpen,
  });

  // Process astrologers: filter and sort
  const astrologers = useMemo(() => {
    // Handle different response formats - ensure we have an array
    let astrologersArray: Astrologer[] = [];
    if (Array.isArray(rawAstrologers)) {
      astrologersArray = rawAstrologers;
    } else if (rawAstrologers && typeof rawAstrologers === 'object') {
      // Handle wrapped responses like { data: [...] } or { astrologers: [...] }
      const wrappedResponse = rawAstrologers as AstrologerListResponse;
      astrologersArray = wrappedResponse.data || wrappedResponse.astrologers || [];
    }

    // Filter to only PROFESSIONAL and PREMIUM (ORDINARY should not appear here)
    const eligible = astrologersArray.filter(
      (a) =>
        a.category === ASTROLOGER_CATEGORY.PROFESSIONAL ||
        a.category === ASTROLOGER_CATEGORY.PREMIUM
    );

    // Sort: Online first, then by rank (Premium > Professional)
    return eligible.sort((a, b) => {
      // 1. Online status (online first)
      if (a.isOnline !== b.isOnline) {
        return a.isOnline ? -1 : 1;
      }

      // 2. Category rank (Premium > Professional)
      const rankOrder = {
        [ASTROLOGER_CATEGORY.PREMIUM]: 1,
        [ASTROLOGER_CATEGORY.PROFESSIONAL]: 2,
      };
      const rankA = rankOrder[a.category as keyof typeof rankOrder] || 999;
      const rankB = rankOrder[b.category as keyof typeof rankOrder] || 999;

      if (rankA !== rankB) {
        return rankA - rankB;
      }

      // 3. Name alphabetically
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [rawAstrologers]);

  // Fetch available slots (astrologer-defined) for booking
  const { data: slotsData, isLoading: isLoadingSlots } = useQuery({
    queryKey: QUERY_KEYS.APPOINTMENTS.SLOTS(selectedAstrologer?.id ?? '', bookingMode.slotType),
    queryFn: () =>
      appointmentService.listAvailableSlots(selectedAstrologer!.id, {
        slotType: bookingMode.slotType,
      }),
    enabled: !!selectedAstrologer && step === 'select-datetime',
  });
  const availableSlots = slotsData?.slots ?? [];

  const { dateOptions, slotsByDate } = useMemo(() => {
    const slots = slotsData?.slots ?? [];
    const byDate = new Map<string, AstrologerSlot[]>();
    for (const slot of slots) {
      const key = new Date(slot.startAt).toISOString().slice(0, 10);
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(slot);
    }
    for (const arr of byDate.values()) {
      arr.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
    }
    const dates = [...byDate.keys()].sort();
    const dateOptions = dates.map((key) => ({
      value: key,
      label: new Date(key + 'T12:00:00').toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    }));
    return { dateOptions, slotsByDate: byDate };
  }, [slotsData?.slots]);

  const slotsForSelectedDate = selectedDateKey ? (slotsByDate.get(selectedDateKey) ?? []) : [];

  // Filter astrologers based on search query
  const filteredAstrologers = useMemo(() => {
    if (!searchQuery.trim()) return astrologers;

    const query = searchQuery.toLowerCase();
    return astrologers.filter(
      (a) =>
        a.name?.toLowerCase().includes(query) ||
        a.specialization?.some((s: string) => s.toLowerCase().includes(query))
    );
  }, [astrologers, searchQuery]);

  const handleSelectAstrologer = (astrologer: Astrologer) => {
    setSelectedAstrologer(astrologer);
    setSearchQuery('');
  };

  // Book appointment mutation (slot-based: deducts coins on book, status CONFIRMED)
  const bookAppointmentMutation = useMutation({
    mutationFn: (data: {
      astrologerId: string;
      slotId: string;
      bookingType?: 'APPOINTMENT' | 'KUNDALI_REVIEW';
      notes?: string;
    }) => appointmentService.createAppointment(data),
    onSuccess: (response) => {
      const message = getSuccessMessage(response) || 'Booking confirmed successfully!';
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.APPOINTMENTS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.APPOINTMENTS.LIST() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
      setBookingSlotId(null);
      onSuccess?.();
      handleClose();
    },
    onError: (error) => {
      showErrorToast(error, 'Failed to book');
      setBookingSlotId(null);
    },
  });

  const handleSelectSlot = (slot: AstrologerSlot) => {
    setSelectedSlot(selectedSlot?.id === slot.id ? null : slot);
  };

  const handleConfirmBooking = () => {
    if (!selectedAstrologer || !selectedSlot) return;
    if (
      appointmentCoinCost != null &&
      appointmentCoinCost > 0 &&
      coinBalance < appointmentCoinCost
    ) {
      toast.error(
        `Insufficient coins. You need ${appointmentCoinCost} coin${appointmentCoinCost === 1 ? '' : 's'}. Your balance: ${coinBalance}. Please top up.`
      );
      return;
    }
    setBookingSlotId(selectedSlot.id);
    bookAppointmentMutation.mutate({
      astrologerId: selectedAstrologer.id,
      slotId: selectedSlot.id,
      bookingType: bookingMode.slotType,
      notes: notes.trim() || undefined,
    });
  };

  const formatSlotTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  const handleClose = () => {
    setSelectedAstrologer(null);
    setSelectedSlot(null);
    setNotes('');
    setSearchQuery('');
    setStep('select-astrologer');
    setSelectedDateKey('');
    setBookingSlotId(null);
    onClose();
  };

  const isConfirmDisabled =
    !selectedSlot ||
    bookAppointmentMutation.isPending ||
    (appointmentCoinCost != null && appointmentCoinCost > 0 && coinBalance < appointmentCoinCost);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] p-0 bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 border border-purple-500/30 shadow-2xl shadow-purple-900/50 overflow-hidden rounded-2xl flex flex-col">
        {/* Animated background effect */}
        <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden rounded-2xl">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" />
          <div
            className="absolute top-0 -right-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"
            style={{ animationDelay: '2s' }}
          />
          <div
            className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"
            style={{ animationDelay: '4s' }}
          />
        </div>

        {/* Content wrapper */}
        <div className="relative flex flex-col h-full min-h-0">
          {/* Header with DialogTitle for accessibility */}
          <DialogHeader className="flex-shrink-0 p-6 border-b border-purple-500 bg-gradient-to-r from-purple-900/40 to-indigo-900 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2 mb-1">
                  <CalendarDays className="h-6 w-6 text-purple-400" />
                  {bookingMode.title}
                </DialogTitle>
                <DialogDescription className="text-sm text-purple-200/90">
                  {bookingMode.description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Info Banner – only for Appointment mode, not for Full Kundali Review */}
          {step === 'select-astrologer' && mode === 'APPOINTMENT' && (
            <div className="flex-shrink-0 border-b border-purple-500/30 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 backdrop-blur-sm p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-purple-100 mb-1">
                    ✨ About Appointment Bookings
                  </h3>
                  <p className="text-sm text-purple-200/90 leading-relaxed">
                    <span className="text-purple-300 font-semibold">Professional</span> and{' '}
                    <span className="text-indigo-300 font-semibold">Premium</span> astrologers are
                    available for scheduled appointments. Professional astrologers offer competitive
                    rates with chat + appointments, while Premium astrologers provide exclusive
                    appointment-only consultations with time-limited chat during your session.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div
            className="flex-1 min-h-0 p-6 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 border border-purple-500/30 shadow-2xl shadow-purple-900/50 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-800/50 [&::-webkit-scrollbar-thumb]:bg-purple-500/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-purple-500/70"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#a855f7 #1e293b',
            }}
          >
            {/* Step 1: Select Astrologer */}
            {step === 'select-astrologer' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Select an Astrologer</h3>

                  {isLoadingAstrologers ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                    </div>
                  ) : astrologers.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 mb-4">
                        <CalendarDays className="h-10 w-10 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        No Astrologers Available
                      </h3>
                      <p className="text-purple-200/80 max-w-md mx-auto mb-6 leading-relaxed">
                        Currently, there are no professional or premium astrologers available for
                        appointments. Please check back later or try our instant chat feature
                        instead.
                      </p>
                      <Button onClick={handleClose} variant="ghost" className="border">
                        Close
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Search Input */}
                      <Search
                        placeholder="Search astrologers..."
                        value={searchQuery}
                        onSearch={setSearchQuery}
                        containerClassName="p-0 bg-transparent border-0 rounded-none"
                      />

                      {/* Selected Astrologer Display or Dropdown Trigger */}
                      {selectedAstrologer ? (
                        <div className="p-3 bg-gradient-to-br from-slate-800/80 to-purple-900/40 border border-purple-400 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 relative">
                              {selectedAstrologer.profilePhoto ? (
                                <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-purple-400">
                                  <Image
                                    src={getImageUrl(selectedAstrologer.profilePhoto)!}
                                    alt={selectedAstrologer.name || 'Astrologer'}
                                    width={48}
                                    height={48}
                                    className="object-cover w-full h-full"
                                  />
                                  {selectedAstrologer.isOnline && (
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-800 rounded-full" />
                                  )}
                                </div>
                              ) : (
                                <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold ring-2 ring-purple-400">
                                  {selectedAstrologer.name?.charAt(0) || 'A'}
                                  {selectedAstrologer.isOnline && (
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-800 rounded-full" />
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-white truncate">
                                  {selectedAstrologer.name}
                                </h4>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                                    selectedAstrologer.category === AstrologerCategory.PREMIUM
                                      ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border border-purple-500/30'
                                      : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30'
                                  }`}
                                >
                                  {selectedAstrologer.category === AstrologerCategory.PREMIUM
                                    ? '👑 Premium'
                                    : '💎 Professional'}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <p className="text-purple-300/80">
                                  {selectedAstrologer.experience
                                    ? `⭐ ${selectedAstrologer.experience} years`
                                    : '⭐ Experienced'}
                                </p>
                                {appointmentCoinCost != null && appointmentCoinCost > 0 ? (
                                  <span className="text-sm font-bold inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
                                    {appointmentCoinCost} coin{appointmentCoinCost === 1 ? '' : 's'}
                                  </span>
                                ) : appointmentCoinCost === undefined ? (
                                  <span className="text-sm text-purple-400">…</span>
                                ) : null}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedAstrologer(null)}
                              className="text-purple-300 hover:text-white hover:bg-purple-500/20 flex-shrink-0"
                            >
                              Change
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Astrologer List */}
                          <div className="space-y-2">
                            {filteredAstrologers.length === 0 ? (
                              <div className="text-center py-8">
                                <p className="text-purple-300/80">
                                  No astrologers found matching your search.
                                </p>
                              </div>
                            ) : (
                              filteredAstrologers.map((astrologer) => (
                                <button
                                  key={astrologer.id}
                                  onClick={() => handleSelectAstrologer(astrologer)}
                                  className="w-full flex items-center gap-3 p-3 bg-gradient-to-br from-slate-800/50 to-purple-900/20 border border-purple-500/30 rounded-lg hover:border-purple-400 hover:from-slate-800/80 hover:to-purple-900/40 transition-all text-left group backdrop-blur-sm"
                                >
                                  <div className="flex-shrink-0 relative">
                                    {astrologer.profilePhoto ? (
                                      <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-purple-500/50 group-hover:ring-purple-400 transition-all">
                                        <Image
                                          src={getImageUrl(astrologer.profilePhoto)!}
                                          alt={astrologer.name || 'Astrologer'}
                                          width={48}
                                          height={48}
                                          className="object-cover w-full h-full"
                                        />
                                        {astrologer.isOnline && (
                                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-800 rounded-full" />
                                        )}
                                      </div>
                                    ) : (
                                      <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-base font-bold ring-2 ring-purple-500/50 group-hover:ring-purple-400 transition-all">
                                        {astrologer.name?.charAt(0) || 'A'}
                                        {astrologer.isOnline && (
                                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-800 rounded-full" />
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <h4 className="font-semibold text-white group-hover:text-purple-200 transition-colors truncate">
                                          {astrologer.name}
                                        </h4>
                                        <span
                                          className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                                            astrologer.category === AstrologerCategory.PREMIUM
                                              ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border border-purple-500/30'
                                              : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30'
                                          }`}
                                        >
                                          {astrologer.category === AstrologerCategory.PREMIUM
                                            ? '👑 Premium'
                                            : '💎 Professional'}
                                        </span>
                                      </div>
                                      {astrologer.isOnline && (
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                      <p className="text-purple-300/80">
                                        {astrologer.experience
                                          ? `⭐ ${astrologer.experience} years`
                                          : '⭐ Experienced'}
                                      </p>
                                      {appointmentCoinCost != null && appointmentCoinCost > 0 ? (
                                        <span className="text-sm font-bold inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
                                          {appointmentCoinCost} coin
                                          {appointmentCoinCost === 1 ? '' : 's'}
                                        </span>
                                      ) : appointmentCoinCost === undefined ? (
                                        <span className="text-sm text-purple-400">…</span>
                                      ) : null}
                                    </div>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Continue Button */}
                {selectedAstrologer && (
                  <div className="flex justify-end pt-4 border-t border-purple-500/20">
                    <Button
                      onClick={() => setStep('select-datetime')}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8"
                    >
                      Continue to Date & Time
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Select Date & Time */}
            {step === 'select-datetime' && selectedAstrologer && (
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep('select-astrologer')}
                  className="mb-4 text-purple-400 hover:text-purple-300 transition-colors"
                >
                  ← Back to astrologers
                </Button>

                <div className="mb-6 p-4 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/30 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    {selectedAstrologer.profilePhoto ? (
                      <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-purple-500/50">
                        <Image
                          src={selectedAstrologer.profilePhoto}
                          alt={selectedAstrologer.name || 'Astrologer'}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold ring-2 ring-purple-500/50">
                        {selectedAstrologer.name?.charAt(0) || 'A'}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-white">{selectedAstrologer.name}</h4>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            selectedAstrologer.category === AstrologerCategory.PREMIUM
                              ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {selectedAstrologer.category === AstrologerCategory.PREMIUM
                            ? '👑 Premium'
                            : '💎 Professional'}
                        </span>
                      </div>
                      <p className="text-sm text-purple-300">
                        {appointmentCoinCost != null && appointmentCoinCost > 0 ? (
                          <>
                            <span className="font-semibold text-amber-300">
                              {appointmentCoinCost} coin{appointmentCoinCost === 1 ? '' : 's'}
                            </span>
                            {' per session. Deducted when you book.'}
                          </>
                        ) : appointmentCoinCost === undefined ? (
                          '… coins per session'
                        ) : (
                          'Per session'
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 1. Date dropdown */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-white mb-2">Select date</label>
                  <Select
                    value={selectedDateKey}
                    onValueChange={setSelectedDateKey}
                    disabled={isLoadingSlots || availableSlots.length === 0}
                  >
                    <SelectTrigger className="w-full bg-slate-800/50 border-white/20 text-white">
                      <SelectValue
                        placeholder={
                          isLoadingSlots
                            ? 'Loading...'
                            : availableSlots.length === 0
                              ? 'No slots available'
                              : 'Choose a date'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {dateOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 2. Time slot buttons – select one; booking happens on Confirm */}
                {selectedDateKey && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-white mb-2">
                      Available times
                    </label>
                    {slotsForSelectedDate.length === 0 ? (
                      <p className="text-sm text-purple-300/80">No slots for this date.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {slotsForSelectedDate.map((slot) => {
                          const isSelected = selectedSlot?.id === slot.id;
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => handleSelectSlot(slot)}
                              className={
                                isSelected
                                  ? 'inline-flex items-center gap-1.5 rounded-md border-2 border-purple-400 bg-purple-500 text-white px-3 py-2 text-sm font-medium transition-all active:scale-[0.98] active:ring-2 active:ring-purple-400/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900'
                                  : 'inline-flex items-center gap-1.5 rounded-md border-2 border-white/30 bg-white/5 text-white px-3 py-2 text-sm font-medium hover:bg-white/10 hover:border-white/50 transition-all active:scale-[0.98] active:border-purple-400 active:bg-white/15 active:ring-2 active:ring-purple-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900'
                              }
                            >
                              <Clock className="h-4 w-4 shrink-0" />
                              {formatSlotTime(slot.startAt)} – {formatSlotTime(slot.endAt)}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-xs text-purple-300/70 mt-2">
                      Select one time. Add notes below if you like, then click Confirm to book. No
                      approval needed from the astrologer.
                    </p>
                  </div>
                )}

                {/* Notes (optional) */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Notes (optional)
                  </label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any specific concerns or questions you'd like to discuss..."
                    className="w-full bg-slate-800/50 text-white border-purple-500/30 resize-none placeholder:text-purple-400/50"
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-purple-300/70 mt-1">{notes.length}/500 characters</p>
                </div>

                {/* Insufficient coins message */}
                {appointmentCoinCost != null &&
                  appointmentCoinCost > 0 &&
                  coinBalance < appointmentCoinCost && (
                    <div className="mt-4 p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-200 text-sm">
                      You need at least {appointmentCoinCost} coin
                      {appointmentCoinCost === 1 ? '' : 's'}. Your balance: {coinBalance}. Please
                      top up to book.
                    </div>
                  )}

                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    onClick={handleClose}
                    variant="outline"
                    className="border-white/20 text-white/80 hover:bg-white/10"
                    disabled={bookAppointmentMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <LoadingButton
                    onClick={handleConfirmBooking}
                    disabled={isConfirmDisabled}
                    isLoading={bookAppointmentMutation.isPending}
                    loadingText="Booking..."
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                  >
                    Confirm booking
                  </LoadingButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
