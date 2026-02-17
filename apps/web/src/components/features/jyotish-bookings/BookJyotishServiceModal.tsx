'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { showErrorToast } from '@/lib/error-handler';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input,
  Label,
  Textarea,
  Badge,
  LoadingButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Avatar,
  AvatarFallback,
  AvatarImage,
  DateInput,
} from '@jyotish/ui';
import {
  JyotishBookingType,
  createJyotishBookingRequestSchema,
  KATHA_VACHAK_BOOKING_CATEGORIES,
  PANDIT_BOOKING_CATEGORIES,
  VAASTU_BOOKING_CATEGORIES,
  AstrologerCategory,
} from '@jyotish/shared';
import jyotishBookingService from '@/services/jyotishBooking.service';
import { QUERY_KEYS } from '@/constants';
import type { PublicAstrologerProfile } from '@/types/astrologer';
import astrologerService from '@/services/astrologer.service';
import { getImageUrl } from '@/utils/image.utils';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  type: JyotishBookingType;
  title: string;
};

function todayISO(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

function astrologerMeta(a: PublicAstrologerProfile): string | null {
  const spec = (a.specialization ?? []).filter(Boolean).slice(0, 2).join(', ');
  const langs = (a.languages ?? []).filter(Boolean).slice(0, 2).join(', ');
  const parts = [spec, langs].filter(Boolean);
  return parts.length ? parts.join(' • ') : null;
}

export function BookJyotishServiceModal({ isOpen, onClose, type, title }: Props) {
  const categories = useMemo(() => {
    if (type === JyotishBookingType.PANDIT) return [...PANDIT_BOOKING_CATEGORIES];
    if (type === JyotishBookingType.VAASTU) return [...VAASTU_BOOKING_CATEGORIES];
    return [...KATHA_VACHAK_BOOKING_CATEGORIES];
  }, [type]);

  const [bookingDate, setBookingDate] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [preferredAstrologerId, setPreferredAstrologerId] = useState<string | undefined>(undefined);

  const needsAstrologerSelection = type === JyotishBookingType.KATHA_VACHAK;

  const astrologerSearch = '';

  const { data: astrologersResp, isLoading: isAstrologersLoading } = useQuery({
    queryKey: QUERY_KEYS.ASTROLOGERS.LIST({
      search: astrologerSearch,
      category: AstrologerCategory.KATHA_VACHAK,
      limit: 50,
      sortBy: 'rating',
      sortOrder: 'desc',
    }),
    queryFn: () =>
      astrologerService.listAstrologers({
        search: astrologerSearch,
        category: AstrologerCategory.KATHA_VACHAK,
        limit: 50,
        sortBy: 'rating',
        sortOrder: 'desc',
      }),
    enabled: isOpen && needsAstrologerSelection,
  });

  const eligibleAstrologers = useMemo<PublicAstrologerProfile[]>(
    () => astrologersResp?.astrologers ?? [],
    [astrologersResp?.astrologers]
  );

  const selectedAstrologer = useMemo(
    () => eligibleAstrologers.find((a) => a.id === preferredAstrologerId),
    [eligibleAstrologers, preferredAstrologerId]
  );

  useEffect(() => {
    if (!isOpen) return;
    setBookingDate(todayISO());
    setCategory(categories[0] ?? '');
    setDetails('');
    setLocation('');
    setPreferredAstrologerId(undefined);
  }, [isOpen, categories]);

  useEffect(() => {
    if (!isOpen) return;
    if (!needsAstrologerSelection) return;
    if (preferredAstrologerId) return;
    const first = eligibleAstrologers[0]?.id;
    if (first) setPreferredAstrologerId(first);
  }, [eligibleAstrologers, isOpen, needsAstrologerSelection, preferredAstrologerId]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (type === JyotishBookingType.KATHA_VACHAK && !preferredAstrologerId) {
        throw new Error('Please select a Jyotish');
      }
      if (!location.trim()) {
        throw new Error('Location is required');
      }
      if (!bookingDate) {
        throw new Error('Booking date is required');
      }
      if (!category) {
        throw new Error('Category is required');
      }
      const parsed = createJyotishBookingRequestSchema.parse({
        type,
        preferredAstrologerId: type === JyotishBookingType.KATHA_VACHAK ? (preferredAstrologerId || undefined) : undefined,
        bookingDate,
        category,
        details: details.trim() ? details.trim() : undefined,
        location: location.trim(),
      });
      return jyotishBookingService.create(parsed);
    },
    onSuccess: () => {
      toast.success('Booking request submitted. Admin will review it soon.');
      onClose();
    },
    onError: (e) => showErrorToast(e),
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] p-0 bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 border border-purple-500/30 shadow-2xl shadow-purple-900/50 overflow-hidden rounded-2xl flex flex-col">
        {/* Animated background effect (same as BookAppointmentModal) */}
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

        {/* Content wrapper (same layout as BookAppointmentModal) */}
        <div className="relative flex flex-col h-full min-h-0">
          <DialogHeader className="flex-shrink-0 p-6 border-b border-purple-500 bg-gradient-to-r from-purple-900/40 to-indigo-900 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2 mb-1">
                  {title}
                  <Badge className="bg-white/10 text-slate-200 border border-white/10">
                    {type === JyotishBookingType.PANDIT
                      ? 'Pandit Ji'
                      : type === JyotishBookingType.VAASTU
                        ? 'Vaastu Shastri'
                        : 'Katha Vachak'}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-sm text-purple-200/90">
                  Select your preferred date and reason. Admin will review and approve/reject your request.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div
            className="flex-1 min-h-0 p-6 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 border border-purple-500/30 shadow-2xl shadow-purple-900/50 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-800/50 [&::-webkit-scrollbar-thumb]:bg-purple-500/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-purple-500/70"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#a855f7 #1e293b',
            }}
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-white">
              Reason / Category <span className="text-red-400">*</span>
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-white">
              Select date <span className="text-red-400">*</span>
            </Label>
            <DateInput
              min={todayISO()}
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              required
            />
          </div>

               
              </div>

          {needsAstrologerSelection ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label className="text-white">
                  Select Katha Vachak
                </Label>
                <Select value={preferredAstrologerId} onValueChange={setPreferredAstrologerId}>
                  <SelectTrigger>
                    {selectedAstrologer ? (
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-8 w-8 ring-1 ring-white/10">
                          <AvatarImage
                            src={getImageUrl(selectedAstrologer.profilePhoto) || undefined}
                            alt={selectedAstrologer.name || 'Jyotish'}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold text-xs">
                            {(selectedAstrologer.name || 'A').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-white font-medium">
                          {selectedAstrologer.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">
                        {isAstrologersLoading
                          ? 'Loading...'
                          : eligibleAstrologers.length
                            ? 'Select Katha Vachak'
                            : 'No eligible Jyotish found'}
                      </span>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleAstrologers.map((a) => {
                      const meta = astrologerMeta(a);
                      return (
                      <SelectItem key={a.id} value={a.id}>
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-8 w-8 ring-1 ring-white/10">
                            <AvatarImage src={getImageUrl(a.profilePhoto) || undefined} alt={a.name || 'Jyotish'} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold text-xs">
                              {(a.name || 'A').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1 flex flex-col">
                            <span className="text-white font-medium truncate">{a.name}</span>
                            {meta ? (
                              <span className="text-slate-400 text-xs truncate">{meta}</span>
                            ) : (
                              <span className="text-slate-500 text-xs truncate">—</span>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400">
                  {eligibleAstrologers.length === 0
                    ? 'No eligible Jyotish found.'
                    : 'Pick your preferred Jyotish. Admin will confirm availability.'}
                </p>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label className="text-white">
              Location <span className="text-red-400">*</span>
            </Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location/address..."
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-white">Booking reason / details (optional)</Label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Write Short remarks(preferred time, specific puja, etc.)"
              rows={4}
            />
          </div>

              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={onClose} className="border-white/10 text-white">
                  Cancel
                </Button>
                <LoadingButton
                  onClick={() => createMutation.mutate()}
                  loading={createMutation.isPending}
                  loadingText="Submitting..."
                  className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-90 shadow-[0_0_40px_rgba(168,85,247,0.35)]"
                >
                  Submit request
                </LoadingButton>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

