import {
  KUNDALI_MATCH_PREMIUM_CONSULTATION_TITLE_NE,
  orderKundaliMatchPremiumQuestionIds,
} from '@jyotish/shared';

interface KundaliMatchPremiumTopicsBlockProps {
  selectedIds: string[];
}

/**
 * Renders the Nepali premium consultation topics chosen by the client (admin / detail views).
 */
export function KundaliMatchPremiumTopicsBlock({ selectedIds }: KundaliMatchPremiumTopicsBlockProps) {
  if (!selectedIds?.length) {
    return (
      <p className="text-xs text-slate-500">
        No consultation topics on file (submitted before this feature or empty selection).
      </p>
    );
  }

  const ordered = orderKundaliMatchPremiumQuestionIds(selectedIds);

  return (
    <div className="space-y-2">
      <p className="text-slate-400 font-medium text-sm leading-snug">
        {KUNDALI_MATCH_PREMIUM_CONSULTATION_TITLE_NE}
      </p>
      <ol className="list-decimal list-inside space-y-2 text-slate-300 text-sm leading-relaxed pl-1">
        {ordered.map((q) => (
          <li key={q.id}>{q.textNe}</li>
        ))}
      </ol>
    </div>
  );
}
