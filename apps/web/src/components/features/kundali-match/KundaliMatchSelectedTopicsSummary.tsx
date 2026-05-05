'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@jyotish/ui';
import {
  orderSelectedKundaliConsultationQuestions,
  orderKundaliMatchPremiumQuestionIds,
  KUNDALI_MATCH_PREMIUM_CONSULTATION_TITLE_NE,
} from '@jyotish/shared';
import kundaliMatchService from '@/services/kundaliMatch.service';
import { QUERY_KEYS } from '@/constants';
import { ListOrdered } from 'lucide-react';

interface KundaliMatchSelectedTopicsSummaryProps {
  selectedIds: string[];
}

export function KundaliMatchSelectedTopicsSummary({ selectedIds }: KundaliMatchSelectedTopicsSummaryProps) {
  const [open, setOpen] = useState(false);

  const { data: catalogue } = useQuery({
    queryKey: QUERY_KEYS.KUNDALI_MATCH.PREMIUM_CONSULTATION_QUESTIONS,
    queryFn: () => kundaliMatchService.getPremiumConsultationCatalogue(),
    staleTime: 1000 * 60 * 60,
  });

  if (!selectedIds?.length) {
    return <span className="text-slate-500 text-xs">—</span>;
  }

  const titleNe = catalogue?.titleNe?.trim() || KUNDALI_MATCH_PREMIUM_CONSULTATION_TITLE_NE;

  const ordered = catalogue?.questions?.length
    ? orderSelectedKundaliConsultationQuestions(catalogue.questions, selectedIds)
    : orderKundaliMatchPremiumQuestionIds(selectedIds);

  const count = selectedIds.length;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-auto py-1 px-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
        onClick={() => setOpen(true)}
      >
        <ListOrdered className="h-4 w-4 mr-1 shrink-0" />
        {count} topic{count === 1 ? '' : 's'}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-slate-950 border-white/15 text-slate-100 max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-base leading-snug pr-6">{titleNe}</DialogTitle>
          </DialogHeader>
          {!catalogue?.questions?.length && (
            <p className="text-xs text-slate-500 pb-2">
              Topics list is loading from the server; showing any locally known labels when available.
            </p>
          )}
          <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300 leading-relaxed pl-1">
            {ordered.map((q) => (
              <li key={q.id}>{q.textNe}</li>
            ))}
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}
