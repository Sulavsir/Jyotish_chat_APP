'use client';

import { useQuery } from '@tanstack/react-query';
import { Label, Alert, AlertDescription } from '@jyotish/ui';
import kundaliMatchService from '@/services/kundaliMatch.service';
import { QUERY_KEYS } from '@/constants';

interface KundaliPremiumConsultationQuestionsFieldProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function KundaliPremiumConsultationQuestionsField({
  selectedIds,
  onChange,
  disabled,
}: KundaliPremiumConsultationQuestionsFieldProps) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: QUERY_KEYS.KUNDALI_MATCH.PREMIUM_CONSULTATION_QUESTIONS,
    queryFn: () => kundaliMatchService.getPremiumConsultationCatalogue(),
    staleTime: 1000 * 60 * 60,
  });

  const toggle = (id: string) => {
    if (disabled) return;
    onChange(
      selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-3 animate-pulse">
        <div className="h-4 max-w-md rounded bg-white/10" />
        <div className="h-10 w-full rounded bg-white/10" />
        <div className="h-10 w-full rounded bg-white/10" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Alert variant="destructive" className="border-red-500/40 bg-red-500/10">
        <AlertDescription className="text-red-200">
          {error instanceof Error ? error.message : 'Could not load consultation topics.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
      <div>
        <Label className="text-white/90 text-sm font-semibold">
          {data.titleNe}
        </Label>
        <p className="text-xs text-white/60 mt-1">
          Select one or more topics you want the report to address (required).
        </p>
      </div>
      <ul className="space-y-2 pr-0.5">
        {data.questions.map((q) => {
          const checked = selectedIds.includes(q.id);
          return (
            <li key={q.id}>
              <label
                className={`flex gap-3 cursor-pointer items-start rounded-md p-2 transition-colors ${
                  checked ? 'bg-amber-500/15 border border-amber-500/40' : 'hover:bg-white/5 border border-transparent'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0 rounded border-white/30 bg-white/10 text-amber-600 focus:ring-amber-500"
                  checked={checked}
                  onChange={() => toggle(q.id)}
                  disabled={disabled}
                />
                <span className="text-sm text-white/90 leading-snug">{q.textNe}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
