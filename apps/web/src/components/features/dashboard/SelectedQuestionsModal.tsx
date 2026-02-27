import React from 'react';
import { Eye, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@jyotish/ui';

export interface SelectedQuestionDetailed {
  id: string;
  text: string;
  categoryName: string;
  emoji?: string | null;
}

interface SelectedQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: SelectedQuestionDetailed[];
}

export function SelectedQuestionsModal({ isOpen, onClose, questions }: SelectedQuestionsModalProps) {
  if (!questions.length) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="bg-slate-950 border border-amber-500/40 text-white max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-amber-300" />
            <DialogTitle className="text-sm font-semibold text-white">
              Selected questions ({questions.length})
            </DialogTitle>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </DialogHeader>
        <div className="mt-2 max-h-64 overflow-y-auto space-y-2">
          <ul className="text-xs sm:text-sm text-slate-100 space-y-1.5">
            {questions.map((item) => (
              <li key={item.id} className="flex flex-col">
                <span className="text-[11px] text-amber-300/80">
                  {item.emoji ? `${item.emoji} ` : ''}
                  {item.categoryName}
                </span>
                <span className="text-slate-50">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}

