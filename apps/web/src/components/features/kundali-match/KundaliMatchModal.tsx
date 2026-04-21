'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Label,
  LoadingButton,
  DateInput,
  Alert,
  AlertDescription,
} from '@jyotish/ui';
import { Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { useCoinRates } from '@/hooks/useCoinRates';
import coinService from '@/services/coin.service';
import kundaliMatchService, {
  type CreateKundaliMatchRequestBody,
} from '@/services/kundaliMatch.service';
import { QUERY_KEYS, ROUTES } from '@/constants';
import { showErrorToast } from '@/lib/error-handler';
import {
  PlaceOfBirthField,
  buildPlaceOfBirthString,
  type PlaceOfBirthFieldValue,
} from '@/components/form/PlaceOfBirthField';
import { KundaliPremiumConsultationQuestionsField } from '@/components/features/kundali-match/KundaliPremiumConsultationQuestionsField';
import { TwelveHourTimeOfBirthField } from '@/components/features/kundali-match/TwelveHourTimeOfBirthField';

interface KundaliMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const emptyPobValue: PlaceOfBirthFieldValue = {
  placeOfBirthType: null,
  placeOfBirthPradeshId: null,
  placeOfBirthDistrictId: null,
  placeOfBirthLocation: null,
  placeOfBirth: null,
  placeOfBirthPradeshName: null,
  placeOfBirthDistrictName: null,
};

const emptyForm: CreateKundaliMatchRequestBody = {
  boyDateOfBirth: '',
  boyTimeOfBirth: '',
  boyPlaceOfBirthType: 'OUTSIDE_NEPAL',
  boyPlaceOfBirthPradeshId: null,
  boyPlaceOfBirthDistrictId: null,
  boyPlaceOfBirthLocation: null,
  boyPlaceOfBirth: null,
  girlDateOfBirth: '',
  girlTimeOfBirth: '',
  girlPlaceOfBirthType: 'OUTSIDE_NEPAL',
  girlPlaceOfBirthPradeshId: null,
  girlPlaceOfBirthDistrictId: null,
  girlPlaceOfBirthLocation: null,
  girlPlaceOfBirth: null,
  consultationQuestionIds: [],
};

export function KundaliMatchModal({ isOpen, onClose, onSuccess }: KundaliMatchModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateKundaliMatchRequestBody>(emptyForm);
  const [boyPob, setBoyPob] = useState<PlaceOfBirthFieldValue>(emptyPobValue);
  const [girlPob, setGirlPob] = useState<PlaceOfBirthFieldValue>(emptyPobValue);

  const { rates } = useCoinRates(isOpen);
  const coinCost = rates?.KUNDALI_MATCH ?? 300;
  const { data: balanceData } = useQuery({
    queryKey: QUERY_KEYS.COINS.BALANCE,
    queryFn: () => coinService.getBalance(),
    enabled: isOpen,
  });
  const coinBalance = balanceData?.balance ?? 0;

  const createMutation = useMutation({
    mutationFn: (body: CreateKundaliMatchRequestBody) => kundaliMatchService.create(body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.KUNDALI_MATCH.ALL });
      toast.success(data.message);
      setForm(emptyForm);
      setBoyPob(emptyPobValue);
      setGirlPob(emptyPobValue);
      onSuccess?.();
      onClose();
    },
    onError: (err) => showErrorToast(err),
  });

  const handleSubmit = () => {
    const boyPlaceOfBirthStr = buildPlaceOfBirthString(boyPob);
    const girlPlaceOfBirthStr = buildPlaceOfBirthString(girlPob);
    if (
      !form.boyDateOfBirth ||
      !form.boyTimeOfBirth?.trim() ||
      !boyPlaceOfBirthStr?.trim() ||
      !form.girlDateOfBirth ||
      !form.girlTimeOfBirth?.trim() ||
      !girlPlaceOfBirthStr?.trim()
    ) {
      toast.error('Please fill all birth details for both boy and girl (including place of birth).');
      return;
    }
    if (form.consultationQuestionIds.length < 1) {
      toast.error('Please select at least one consultation topic from the premium list.');
      return;
    }
    if (coinCost > 0 && coinBalance < coinCost) {
      const remaining = coinCost - coinBalance;
      const safeRemaining = remaining > 0 ? remaining : coinCost;
      toast.error(
        `Insufficient balance. Redirecting to add at least ${safeRemaining} NRs to your wallet.`
      );
      if (typeof window !== 'undefined') {
        window.location.href = `${ROUTES.PAYMENT}?amount=${safeRemaining}&coins=${safeRemaining}`;
      }
      return;
    }
    const payload: CreateKundaliMatchRequestBody = {
      boyDateOfBirth: form.boyDateOfBirth,
      boyTimeOfBirth: form.boyTimeOfBirth.trim(),
      boyPlaceOfBirthType: boyPob.placeOfBirthType ?? 'OUTSIDE_NEPAL',
      boyPlaceOfBirthPradeshId: boyPob.placeOfBirthPradeshId ?? null,
      boyPlaceOfBirthDistrictId: boyPob.placeOfBirthDistrictId ?? null,
      boyPlaceOfBirthLocation: boyPob.placeOfBirthLocation ?? null,
      boyPlaceOfBirth: boyPob.placeOfBirth ?? null,
      girlDateOfBirth: form.girlDateOfBirth,
      girlTimeOfBirth: form.girlTimeOfBirth.trim(),
      girlPlaceOfBirthType: girlPob.placeOfBirthType ?? 'OUTSIDE_NEPAL',
      girlPlaceOfBirthPradeshId: girlPob.placeOfBirthPradeshId ?? null,
      girlPlaceOfBirthDistrictId: girlPob.placeOfBirthDistrictId ?? null,
      girlPlaceOfBirthLocation: girlPob.placeOfBirthLocation ?? null,
      girlPlaceOfBirth: girlPob.placeOfBirth ?? null,
      consultationQuestionIds: form.consultationQuestionIds,
    };
    createMutation.mutate(payload);
  };

  const update = (field: 'boyDateOfBirth' | 'girlDateOfBirth', value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="
          bg-slate-900/95 border-white/20 text-white
          gap-0 p-0 overflow-hidden !flex !flex-col min-h-0
          w-[min(42rem,calc(100vw-1.5rem))] max-w-2xl
          max-h-[min(90dvh,52rem)]
          rounded-xl sm:rounded-xl
        "
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="shrink-0 space-y-2 px-4 pt-5 pb-3 sm:px-6 sm:pt-6 text-left border-b border-white/10">
            <DialogTitle className="text-white text-lg sm:text-xl pr-8">Kundali Match</DialogTitle>
            <DialogDescription className="text-white/70 text-sm leading-relaxed">
              Submit birth details of the boy and girl. Choose which premium consultation topics the
              report should cover. Admin will review and send you a detailed kundali match report. This
              request costs {coinCost} NRs.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5 space-y-5">
          <Alert
            variant="info"
            className="border-amber-500/50 bg-amber-500/10 text-amber-200 [&>.shrink-0]:hidden"
          >
            <AlertDescription className="flex items-center gap-2 text-amber-200">
              <Banknote className="h-4 w-4 shrink-0 text-amber-400" />
              Cost: {coinCost} NRs · Your balance: {coinBalance} NRs
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-6 md:flex-row md:gap-6 md:items-stretch">
            {/* Boy's birth details */}
            <div className="flex-1 space-y-3 min-w-0 md:min-w-[200px]">
              <h4 className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                Boy&apos;s birth details
              </h4>
              <div className="grid gap-3">
                <div>
                  <Label className="text-white/80 text-xs">Date of birth</Label>
                  <DateInput
                    value={form.boyDateOfBirth}
                    onChange={(e) => update('boyDateOfBirth', e.target.value)}
                    className="bg-white/5 border-white/20 text-white mt-1"
                    nepaliDate
                  />
                </div>
                <TwelveHourTimeOfBirthField
                  isModalOpen={isOpen}
                  id="kundali-match-boy-tob"
                  label="Time of birth"
                  value={form.boyTimeOfBirth}
                  onChange={(v) => setForm((prev) => ({ ...prev, boyTimeOfBirth: v }))}
                  disabled={createMutation.isPending}
                />
                <PlaceOfBirthField
                  label="Place of birth"
                  value={boyPob}
                  onChange={setBoyPob}
                  inputClassName="bg-white/5 border-white/20 text-white mt-1"
                />
              </div>
            </div>

            <div
              className="hidden md:block shrink-0 w-px bg-white/20 self-stretch min-h-[1px]"
              aria-hidden
            />

            <div
              className="h-px w-full bg-white/15 md:hidden shrink-0"
              aria-hidden
            />

            {/* Girl's birth details */}
            <div className="flex-1 space-y-3 min-w-0 md:min-w-[200px]">
              <h4 className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                Girl&apos;s birth details
              </h4>
              <div className="grid gap-3">
                <div>
                  <Label className="text-white/80 text-xs">Date of birth</Label>
                  <DateInput
                    value={form.girlDateOfBirth}
                    onChange={(e) => update('girlDateOfBirth', e.target.value)}
                    className="bg-white/5 border-white/20 text-white mt-1"
                    nepaliDate
                  />
                </div>
                <TwelveHourTimeOfBirthField
                  isModalOpen={isOpen}
                  id="kundali-match-girl-tob"
                  label="Time of birth"
                  value={form.girlTimeOfBirth}
                  onChange={(v) => setForm((prev) => ({ ...prev, girlTimeOfBirth: v }))}
                  disabled={createMutation.isPending}
                />
                <PlaceOfBirthField
                  label="Place of birth"
                  value={girlPob}
                  onChange={setGirlPob}
                  inputClassName="bg-white/5 border-white/20 text-white mt-1"
                />
              </div>
            </div>
          </div>

          <KundaliPremiumConsultationQuestionsField
            selectedIds={form.consultationQuestionIds}
            onChange={(ids) => setForm((prev) => ({ ...prev, consultationQuestionIds: ids }))}
            disabled={createMutation.isPending}
          />
          </div>

          <div
            className="shrink-0 flex flex-col gap-2 border-t border-white/10 bg-slate-950/90 px-4 py-3 sm:flex-row sm:justify-end sm:px-6 sm:py-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          >
            <Button
              variant="ghost"
              className="text-white/80 w-full sm:w-auto"
              onClick={onClose}
            >
              Cancel
            </Button>
            <LoadingButton
              onClick={handleSubmit}
              loading={createMutation.isPending}
              loadingText="Matching..."
              disabled={
                createMutation.isPending ||
                form.consultationQuestionIds.length < 1 ||
                !form.boyDateOfBirth ||
                !form.boyTimeOfBirth?.trim() ||
                !buildPlaceOfBirthString(boyPob)?.trim() ||
                !form.girlDateOfBirth ||
                !form.girlTimeOfBirth?.trim() ||
                !buildPlaceOfBirthString(girlPob)?.trim()
              }
              className="bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto"
            >
              To Matchmaking
            </LoadingButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
