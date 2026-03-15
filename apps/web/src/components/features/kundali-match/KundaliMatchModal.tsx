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
  TimeInput,
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
import { QUERY_KEYS } from '@/constants';
import { showErrorToast } from '@/lib/error-handler';
import {
  PlaceOfBirthField,
  buildPlaceOfBirthString,
  type PlaceOfBirthFieldValue,
} from '@/components/form/PlaceOfBirthField';

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
    if (coinCost > 0 && coinBalance < coinCost) {
      toast.error(
        `Insufficient balance. Required: ${coinCost} NRs, Available: ${coinBalance} NRs. Please top up.`
      );
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
    };
    createMutation.mutate(payload);
  };

  const update = (field: 'boyDateOfBirth' | 'boyTimeOfBirth' | 'girlDateOfBirth' | 'girlTimeOfBirth', value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-slate-900/95 border-white/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col p-6 pt-6 pb-4">
        <DialogHeader>
          <DialogTitle className="text-white">Kundali Match</DialogTitle>
          <DialogDescription className="text-white/70">
            Submit birth details of the boy and girl. Admin will review and send you a detailed
            kundali match report. This request costs {coinCost} NRs.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 pt-4 pb-0 flex-1 overflow-y-auto">
          <Alert
            variant="info"
            className="border-amber-500/50 bg-amber-500/10 text-amber-200 [&>.shrink-0]:hidden"
          >
            <AlertDescription className="flex items-center gap-2 text-amber-200">
              <Banknote className="h-4 w-4 shrink-0 text-amber-400" />
              Cost: {coinCost} NRs · Your balance: {coinBalance} NRs
            </AlertDescription>
          </Alert>

          <div className="flex flex-row gap-4">
            {/* Boy's birth details */}
            <div className="flex-1 space-y-3 min-w-0">
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
                <div>
                  <Label className="text-white/80 text-xs">Time of birth</Label>
                  <TimeInput
                    value={form.boyTimeOfBirth}
                    onChange={(e) => update('boyTimeOfBirth', e.target.value)}
                    className="bg-white/5 border-white/20 text-white mt-1"
                  />
                </div>
                <PlaceOfBirthField
                  label="Place of birth"
                  value={boyPob}
                  onChange={setBoyPob}
                  inputClassName="bg-white/5 border-white/20 text-white mt-1"
                />
              </div>
            </div>

            <div className="shrink-0 w-px bg-white/20 self-stretch" aria-hidden />

            {/* Girl's birth details */}
            <div className="flex-1 space-y-3 min-w-0">
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
                <div>
                  <Label className="text-white/80 text-xs">Time of birth</Label>
                  <TimeInput
                    value={form.girlTimeOfBirth}
                    onChange={(e) => update('girlTimeOfBirth', e.target.value)}
                    className="bg-white/5 border-white/20 text-white mt-1"
                  />
                </div>
                <PlaceOfBirthField
                  label="Place of birth"
                  value={girlPob}
                  onChange={setGirlPob}
                  inputClassName="bg-white/5 border-white/20 text-white mt-1"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 pb-0 border-t border-white/10 mt-4 flex-shrink-0">
            <Button variant="ghost" className="text-white/80" onClick={onClose}>
              Cancel
            </Button>
            <LoadingButton
              onClick={handleSubmit}
              loading={createMutation.isPending}
              loadingText="Matching..."
              disabled={
                createMutation.isPending ||
                (coinCost > 0 && coinBalance < coinCost) ||
                !form.boyDateOfBirth ||
                !form.boyTimeOfBirth?.trim() ||
                !buildPlaceOfBirthString(boyPob)?.trim() ||
                !form.girlDateOfBirth ||
                !form.girlTimeOfBirth?.trim() ||
                !buildPlaceOfBirthString(girlPob)?.trim()
              }
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              To Matchmaking
            </LoadingButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
