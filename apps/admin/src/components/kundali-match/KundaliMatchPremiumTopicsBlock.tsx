import { orderSelectedKundaliConsultationQuestions, orderKundaliMatchPremiumQuestionIds, KUNDALI_MATCH_PREMIUM_CONSULTATION_TITLE_NE } from '@jyotish/shared';
import type { KundaliConsultationCatalogueAdminResponse } from '@/types/kundaliMatchConsultationCatalogue.types';

interface KundaliMatchPremiumTopicsBlockProps {
  selectedIds: string[];
  /** Includes inactive rows so archived selections still resolve client-side when possible. */
  consultationCatalogue: KundaliConsultationCatalogueAdminResponse | undefined | null;
}

/**
 * Renders the Nepali premium consultation topics chosen by the client (admin / detail views).
 */
export function KundaliMatchPremiumTopicsBlock({
  selectedIds,
  consultationCatalogue,
}: KundaliMatchPremiumTopicsBlockProps) {
  if (!selectedIds?.length) {
    return (
      <p className="text-xs text-slate-500">
        No consultation topics on file (submitted before this feature or empty selection).
      </p>
    );
  }

  const titleNe =
    consultationCatalogue?.titleNe?.trim() || KUNDALI_MATCH_PREMIUM_CONSULTATION_TITLE_NE;

  const ordered = consultationCatalogue?.questions?.length
    ? orderSelectedKundaliConsultationQuestions(consultationCatalogue.questions, selectedIds)
    : orderKundaliMatchPremiumQuestionIds(selectedIds);

  return (
    <div className="space-y-2">
      <p className="text-slate-400 font-medium text-sm leading-snug">{titleNe}</p>
      {!consultationCatalogue?.questions?.length && (
        <p className="text-[11px] text-slate-500">
          Showing built-in catalogue preview until admin data finishes loading or if the catalogue
          is unavailable.
        </p>
      )}
      <ol className="list-decimal list-inside space-y-2 text-slate-300 text-sm leading-relaxed pl-1">
        {ordered.map((q) => (
          <li key={q.id}>{q.textNe}</li>
        ))}
      </ol>
    </div>
  );
}
