'use client';

import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@jyotish/ui';
import { orderKundaliMatchPremiumQuestionIds, KUNDALI_MATCH_PREMIUM_CONSULTATION_TITLE_NE } from '@jyotish/shared';
import { ListOrdered } from 'lucide-react';

interface KundaliMatchSelectedTopicsSummaryProps {
  selectedIds: string[];
}

export function KundaliMatchSelectedTopicsSummary({ selectedIds }: KundaliMatchSelectedTopicsSummaryProps) {
  const [open, setOpen] = useState(false);

  if (!selectedIds?.length) {
    return <span className="text-slate-500 text-xs">—</span>;
  }

  const ordered = orderKundaliMatchPremiumQuestionIds(selectedIds);
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
            <DialogTitle className="text-white text-base leading-snug pr-6">
              {KUNDALI_MATCH_PREMIUM_CONSULTATION_TITLE_NE}
            </DialogTitle>
          </DialogHeader>
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
