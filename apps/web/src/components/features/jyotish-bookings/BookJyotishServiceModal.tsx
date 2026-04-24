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
import { subhaSahitService } from '@/services/subha-sahit.service';
import { useQuestionnaireLanguageStore } from '@/store/questionnaire-language.store';
import { useNepaliDateConvert } from '@/hooks/useNepaliDateConvert';
import { toApiLanguageCode } from '@jyotish/shared';
import { useAuthStore } from '@/store/auth-store';
import { useProvincesQuery, useDistrictsByProvinceQuery } from '@/hooks/useLocationQueries';
import type { NepalGeography } from '@jyotish/shared';

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
  const user = useAuthStore((s) => s.user);
  const [bookingDate, setBookingDate] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  const [provinceId, setProvinceId] = useState<string>('');
  const [districtId, setDistrictId] = useState<string>('');
  const [wardNo, setWardNo] = useState<string>('');
  const [place, setPlace] = useState<string>('');
  const [tole, setTole] = useState<string>('');
  const [nearestLandmark, setNearestLandmark] = useState<string>('');
  const [googleMapLink, setGoogleMapLink] = useState<string>('');
  const [pujariCount, setPujariCount] = useState<number>(1);
  const [contactPhone, setContactPhone] = useState<string>('');
  const [contactPhoneAlt, setContactPhoneAlt] = useState<string>('');
  const [preferredAstrologerId, setPreferredAstrologerId] = useState<string | undefined>(undefined);
  const [dateError, setDateError] = useState<string>('');

  const wardNoIsValidNumber =
    wardNo.trim().length > 0 && /^\d+$/.test(wardNo.trim()) && parseInt(wardNo.trim(), 10) >= 1;

  const needsAstrologerSelection = type === JyotishBookingType.KATHA_VACHAK;
  const needsSubhaSahit = type === JyotishBookingType.PANDIT;

  const astrologerSearch = '';

  // Get language from store and convert to API format
  const questionnaireLanguage = useQuestionnaireLanguageStore((s) => s.language);
  const apiLanguage = toApiLanguageCode(questionnaireLanguage);

  // Subha Sahit occasions (Book Pujari Ji) — filtered by language
  const { data: subhaOccasionsResp } = useQuery({
    queryKey: QUERY_KEYS.SUBHA_SAHIT.OCCASIONS(apiLanguage),
    queryFn: () => subhaSahitService.getOccasions(apiLanguage),
    enabled: type === JyotishBookingType.PANDIT,
  });

  const panditOccasionDetails = useMemo(
    () => subhaOccasionsResp?.occasions ?? [],
    [subhaOccasionsResp?.occasions]
  );

  const selectedPujariOccasion = useMemo(
    () => panditOccasionDetails.find((o) => o.occasion === category),
    [panditOccasionDetails, category]
  );

  const categories = useMemo(() => {
    if (type === JyotishBookingType.PANDIT) {
      return panditOccasionDetails.length
        ? panditOccasionDetails.map((o) => o.occasion)
        : [...PANDIT_BOOKING_CATEGORIES];
    }
    if (type === JyotishBookingType.VAASTU) return [...VAASTU_BOOKING_CATEGORIES];
    return [...KATHA_VACHAK_BOOKING_CATEGORIES];
  }, [type, panditOccasionDetails]);

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

  // Fetch Subha Sahit dates filtered by selected occasion/category and language
  const { data: subhaSahitResp } = useQuery({
    queryKey: QUERY_KEYS.SUBHA_SAHIT.AVAILABLE({
      dateFrom: todayISO(),
      occasion: needsSubhaSahit && category ? category : undefined,
      language: apiLanguage,
    }),
    queryFn: () =>
      subhaSahitService.getAvailableDates({
        dateFrom: todayISO(),
        occasion: needsSubhaSahit && category ? category : undefined,
        language: apiLanguage,
      }),
    enabled: isOpen && needsSubhaSahit,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const availableDates = useMemo<string[]>(() => {
    const today = todayISO();
    const dates = (subhaSahitResp?.dates ?? [])
      .map((d) => d.date.split('T')[0])
      .filter((dateStr) => {
        return dateStr >= today;
      })
      .sort();
    return dates;
  }, [subhaSahitResp?.dates]);

  const { getDisplayDate: getDateDisplay } = useNepaliDateConvert(
    availableDates,
    questionnaireLanguage
  );

  const { data: provinces = [], isLoading: provincesLoading } = useProvincesQuery({
    enabled: isOpen,
  });
  const { data: districts = [], isLoading: districtsLoading } = useDistrictsByProvinceQuery(
    provinceId || null,
    { enabled: isOpen }
  );

  // Reset form when modal opens or language changes
  useEffect(() => {
    if (!isOpen) return;
    setCategory(categories[0] ?? '');
    setDetails('');
    setProvinceId('');
    setDistrictId('');
    setWardNo('');
    setPlace('');
    setTole('');
    setNearestLandmark('');
    setGoogleMapLink('');
    setPujariCount(1);
    setContactPhone((user?.phone || user?.phoneNumber || '').trim());
    setContactPhoneAlt('');
    setPreferredAstrologerId(undefined);
    setDateError('');
    // Don't set bookingDate here - let the category/date effect handle it
    if (!needsSubhaSahit) {
      setBookingDate(todayISO());
    } else {
      setBookingDate(''); // Will be set when dates load
    }
  }, [isOpen, categories, needsSubhaSahit, apiLanguage, user?.phone, user?.phoneNumber]);

  // When category or available dates change, update selected date
  useEffect(() => {
    if (!isOpen) return;
    if (!needsSubhaSahit) return;

    // If no category selected yet, don't set a date
    if (!category) {
      setBookingDate('');
      setDateError('');
      return;
    }

    // If no dates available for this occasion, clear date
    if (!availableDates.length) {
      setBookingDate('');
      setDateError('');
      return;
    }

    // If current selected date is not in available dates for this occasion, reset to first available
    setBookingDate((prev) => {
      if (prev && availableDates.includes(prev)) {
        return prev; // Keep current date if it's still valid for this occasion
      }
      return availableDates[0]; // Otherwise select first available date
    });
    setDateError('');
  }, [isOpen, needsSubhaSahit, availableDates, category]);

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
      if (!bookingDate) {
        throw new Error('Booking date is required');
      }
      // Validate date is not in the past
      const selectedDate = new Date(bookingDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        throw new Error(
          'Booking date cannot be in the past. Please select today or a future date.'
        );
      }

      // For PANDIT bookings, validate that the date is a Subha Sahit date
      if (needsSubhaSahit && availableDates.length > 0 && !availableDates.includes(bookingDate)) {
        throw new Error(
          'Please select a Subha Sahit (auspicious) date. Only dates listed by admin are available for Pandit Ji bookings.'
        );
      }

      if (needsSubhaSahit && availableDates.length === 0) {
        throw new Error(
          'No Subha Sahit dates are available. Please contact admin to add auspicious dates.'
        );
      }
      if (!category) {
        throw new Error('Category is required');
      }
      const provinceRow = (provinces as NepalGeography[]).find((p) => p.id === provinceId);
      const districtRow = (districts as NepalGeography[]).find((d) => d.id === districtId);
      if (!provinceRow || !districtRow) {
        throw new Error('Please select province and district');
      }
      const parsed = createJyotishBookingRequestSchema.parse({
        type,
        preferredAstrologerId:
          type === JyotishBookingType.KATHA_VACHAK ? preferredAstrologerId || undefined : undefined,
        bookingDate,
        category,
        details: details.trim() ? details.trim() : undefined,
        province: provinceRow.nameEn,
        district: districtRow.nameEn,
        wardNo: wardNo.trim(),
        place: place.trim(),
        tole: tole.trim() ? tole.trim() : undefined,
        nearestLandmark: nearestLandmark.trim() ? nearestLandmark.trim() : undefined,
        googleMapLink: googleMapLink.trim() || undefined,
        pujariCount,
        contactPhone: contactPhone.trim(),
        contactPhoneAlt: contactPhoneAlt.trim() ? contactPhoneAlt.trim() : undefined,
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
      <DialogContent className="w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-w-4xl md:max-w-5xl lg:max-w-6xl max-h-[68dvh] sm:max-h-[72dvh] p-0 gap-0 bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 border border-purple-500/30 shadow-2xl shadow-purple-900/50 overflow-hidden rounded-xl sm:rounded-2xl flex flex-col">
        {/* Animated background — toned down on small screens */}
        <div className="absolute inset-0 opacity-15 sm:opacity-20 pointer-events-none overflow-hidden rounded-xl sm:rounded-2xl hidden sm:block">
          <div className="absolute top-0 -left-4 w-48 sm:w-72 h-48 sm:h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" />
          <div
            className="absolute top-0 -right-4 w-48 sm:w-72 h-48 sm:h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"
            style={{ animationDelay: '2s' }}
          />
          <div
            className="absolute -bottom-8 left-20 w-48 sm:w-72 h-48 sm:h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"
            style={{ animationDelay: '4s' }}
          />
        </div>

        <div className="relative flex flex-col h-full min-h-0 max-h-[inherit]">
          <DialogHeader className="flex-shrink-0 px-4 py-4 sm:p-6 border-b border-purple-500 bg-gradient-to-r from-purple-900/40 to-indigo-900 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg sm:text-2xl font-bold text-white flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                  <span className="min-w-0 break-words">{title}</span>
                  <Badge className="bg-white/10 text-slate-200 border border-white/10 w-fit shrink-0">
                    {type === JyotishBookingType.PANDIT
                      ? 'Pujari Ji'
                      : type === JyotishBookingType.VAASTU
                        ? 'Vaastu Shastri'
                        : 'Katha Vachak'}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-purple-200/90">
                  {needsSubhaSahit
                    ? 'Select your puja category and Subha Sahit date. Admin will review your request.'
                    : 'Select your preferred date and category. Admin will review and approve/reject your request.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div
            className="flex-1 min-h-0 min-w-0 px-4 py-4 sm:p-6 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 border-0 sm:border sm:border-purple-500/30 shadow-none sm:shadow-2xl sm:shadow-purple-900/50 overflow-y-auto overflow-x-hidden overscroll-contain [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-800/50 [&::-webkit-scrollbar-thumb]:bg-purple-500/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-purple-500/70"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#a855f7 #1e293b',
            }}
          >
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex flex-col gap-2">
                  <Label className="text-white">
                    {needsSubhaSahit ? (
                      <>
                        Puja Category <span className="text-red-400">*</span>
                      </>
                    ) : type === JyotishBookingType.VAASTU ? (
                      <>
                        Service category <span className="text-red-400">*</span>
                      </>
                    ) : (
                      <>
                        Booking category <span className="text-red-400">*</span>
                      </>
                    )}
                  </Label>
                  <Select
                    value={category}
                    onValueChange={(value) => {
                      setCategory(value);
                      // Reset date when category changes - dates will be filtered by new occasion
                      if (needsSubhaSahit) {
                        setBookingDate('');
                        setDateError('');
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          needsSubhaSahit ? 'Select a puja category...' : 'Select a category...'
                        }
                      />
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

                  {needsSubhaSahit ? (
                    <>
                      {!category ? (
                        <div className="text-sm text-amber-300/80 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                          Please select a puja category first to see available Subha Sahit dates.
                        </div>
                      ) : availableDates.length > 0 ? (
                        <Select
                          value={bookingDate}
                          onValueChange={(value) => {
                            setBookingDate(value);
                            setDateError('');
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={`Select a Subha Sahit date for ${category}...`}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {availableDates.map((d) => {
                              const dateObj = subhaSahitResp?.dates.find(
                                (sd) => sd.date.split('T')[0] === d
                              );
                              return (
                                <SelectItem key={d} value={d}>
                                  {getDateDisplay(d)}
                                  {dateObj?.description && (
                                    <span className="text-xs text-gray-400 ml-2">
                                      ({dateObj.description})
                                    </span>
                                  )}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="text-sm text-red-300/90 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                          No Subha Sahit dates are available for &quot;{category}&quot;. Please
                          select a different occasion or contact admin to add dates for this
                          occasion.
                        </div>
                      )}
                    </>
                  ) : (
                    <DateInput
                      min={todayISO()}
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      required
                      nepaliDate
                    />
                  )}

                  {dateError && <p className="text-sm text-red-400 mt-1">{dateError}</p>}
                </div>
              </div>

              {needsSubhaSahit && category ? (
                <div className="rounded-xl border border-purple-500/25 bg-slate-950/40 p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-300/90">
                    About this occasion
                  </p>
                  <p className="text-sm text-slate-200">
                    <span className="text-slate-400">Puja name: </span>
                    <span className="text-white font-medium">
                      {selectedPujariOccasion?.occasion ?? category}
                    </span>
                  </p>
                  {selectedPujariOccasion?.estimatedTime ? (
                    <p className="text-sm text-slate-200">
                      <span className="text-slate-400">Estimated time: </span>
                      {selectedPujariOccasion.estimatedTime}
                    </p>
                  ) : null}
                  {selectedPujariOccasion?.pujaItems ? (
                    <div>
                      <p className="text-xs text-slate-400 mb-2">Puja items (arrange as needed)</p>
                      <ul className="flex flex-wrap gap-2">
                        {selectedPujariOccasion.pujaItems
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .map((item, idx) => (
                            <li
                              key={`${item}-${idx}`}
                              className="inline-flex items-center rounded-full border border-purple-500/35 bg-purple-500/10 px-3 py-1 text-xs text-purple-100"
                            >
                              {item}
                            </li>
                          ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {needsAstrologerSelection ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-white">Select Katha Vachak</Label>
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
                                  <AvatarImage
                                    src={getImageUrl(a.profilePhoto) || undefined}
                                    alt={a.name || 'Jyotish'}
                                  />
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

              <div className="space-y-3 rounded-xl border border-purple-500/25 bg-slate-950/40 p-3 sm:p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-300/90">
                  Venue details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-white">
                      Province <span className="text-red-400">*</span>
                    </Label>
                    <Select
                      value={provinceId}
                      onValueChange={(id) => {
                        setProvinceId(id);
                        setDistrictId('');
                      }}
                      disabled={provincesLoading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            provincesLoading ? 'Loading provinces...' : 'Select province'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent position="popper" className="max-h-[min(50dvh,16rem)]">
                        {(provinces as NepalGeography[]).map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nameEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-white">
                      District <span className="text-red-400">*</span>
                    </Label>
                    <Select
                      value={districtId}
                      onValueChange={setDistrictId}
                      disabled={!provinceId || districtsLoading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            !provinceId
                              ? 'Select province first'
                              : districtsLoading
                                ? 'Loading districts...'
                                : 'Select district'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent position="popper" className="max-h-[min(50dvh,16rem)]">
                        {(districts as NepalGeography[]).map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.nameEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-white">
                      Ward no. <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={wardNo}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 30);
                        setWardNo(digits);
                      }}
                      placeholder="e.g. 5"
                      maxLength={30}
                      required
                    />
                    <p className="text-xs text-slate-400">Whole number only (e.g. 1, 2, 12).</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-white">
                      Place <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      value={place}
                      onChange={(e) => setPlace(e.target.value.slice(0, 200))}
                      placeholder="Municipality / city / area"
                      maxLength={200}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-white">Tole</Label>
                    <Input
                      value={tole}
                      onChange={(e) => setTole(e.target.value.slice(0, 200))}
                      placeholder="Tole (optional)"
                      maxLength={200}
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label className="text-white">Nearest landmark</Label>
                    <Input
                      value={nearestLandmark}
                      onChange={(e) => setNearestLandmark(e.target.value.slice(0, 300))}
                      placeholder="Optional"
                      maxLength={300}
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label className="text-white">Google Maps link</Label>
                    <Input
                      type="url"
                      value={googleMapLink}
                      onChange={(e) => setGoogleMapLink(e.target.value)}
                      placeholder="https://maps.google.com/..."
                      maxLength={2048}
                    />
                    <p className="text-xs text-slate-400">
                      Optional. If provided, must be a full URL (same as server validation).
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-purple-500/25 bg-slate-950/40 p-3 sm:p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-300/90">
                  Contact
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-white">
                      Your contact number <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      maxLength={22}
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="Required for this booking"
                      required
                    />
                    <p className="text-xs text-slate-400">
                      Pre-filled from your profile when available. Add your number if you signed up
                      with email only. Use 9–15 digits; optional leading +.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-white">Alternative contact number</Label>
                    <Input
                      type="tel"
                      inputMode="tel"
                      maxLength={22}
                      value={contactPhoneAlt}
                      onChange={(e) => setContactPhoneAlt(e.target.value)}
                      placeholder="Optional"
                    />
                    <p className="text-xs text-slate-400">
                      Same format as primary; must differ if set.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-purple-500/25 bg-slate-950/40 p-3 sm:p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-300/90">
                  Booking requirements
                </p>
                <div className="flex flex-col gap-2 max-w-xs">
                  <Label className="text-white">
                    Number of Pujari required <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={pujariCount < 1 ? '' : String(pujariCount)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      if (raw === '') {
                        setPujariCount(0);
                        return;
                      }
                      const n = parseInt(raw, 10);
                      if (!Number.isFinite(n)) return;
                      if (n < 1) setPujariCount(0);
                      else if (n > 50) setPujariCount(50);
                      else setPujariCount(n);
                    }}
                    required
                  />
                  <p className="text-xs text-slate-400">
                    Whole number from 1 to 50. Required for every booking type.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-white">
                  {needsSubhaSahit
                    ? 'Additional notes (optional)'
                    : 'Booking details / remarks (optional)'}
                </Label>
                <Textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Preferred time, special requests, etc."
                  rows={4}
                  maxLength={2000}
                />
                <p className="text-xs text-slate-500 text-right">{details.length}/2000</p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-1">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-white/10 text-white w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <LoadingButton
                  onClick={() => createMutation.mutate()}
                  loading={createMutation.isPending}
                  loadingText="Submitting..."
                  disabled={
                    !bookingDate ||
                    !category ||
                    !provinceId ||
                    !districtId ||
                    !wardNoIsValidNumber ||
                    !place.trim() ||
                    !contactPhone.trim() ||
                    pujariCount < 1 ||
                    pujariCount > 50 ||
                    !!dateError
                  }
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-90 shadow-[0_0_40px_rgba(168,85,247,0.35)]"
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
