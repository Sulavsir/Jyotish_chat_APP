'use client';

import { KundaliMatchConsultationCatalogueSection } from '@/components/kundali-match/KundaliMatchConsultationCatalogueSection';

export default function KundaliMatchQuestionsPage() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="space-y-1">
        <h1 className="min-w-0 pr-1 text-2xl sm:text-3xl font-bold leading-tight cosmic-text break-words">
          Kundali Match Questions
        </h1>
      </div>
      <KundaliMatchConsultationCatalogueSection />
    </div>
  );
}
