'use client';

import React from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { LoadingButton } from '@/components/ui';
import { cn } from '@/lib/utils';
import { ProgressBar } from './ProgressBar';
import {
  BROADCAST_MESSAGE_EXPIRY_MS,
  BROADCAST_POST_EXPIRY_GRACE_MS,
} from '@/constants/broadcastMessage.constants';
export interface RequestItemProps {
  clientLabel: string;
  clientIdShort: string;
  preview: string;
  createdAt: Date | string;
  expiresAt?: Date | string;
  totalNr: number;
  maxNrAmongList: number;
  isActive: boolean;
  accepting: boolean;
  /** Amber/gold styling when the batch includes the first-broadcast discount offer. */
  variant?: 'default' | 'first-broadcast-offer';
  onSelect: () => void;
  onAccept: () => void;
  onReject: () => void;
  className?: string;
}

/** Astrologer-facing: no rupee amounts — only Paid vs Free. */
function paidOrFreeLabel(totalNr: number): 'Paid' | 'Free' {
  return totalNr > 0 ? 'Paid' : 'Free';
}

export function RequestItem({
  clientLabel,
  clientIdShort,
  preview,
  createdAt,
  expiresAt,
  totalNr,
  maxNrAmongList,
  isActive,
  accepting,
  variant = 'default',
  onSelect,
  onAccept,
  onReject,
  className,
}: RequestItemProps) {
  const highValue = maxNrAmongList > 0 && totalNr / maxNrAmongList >= 0.85;
  const isOffer = variant === 'first-broadcast-offer';

  return (
    <div
      role="button"
      tabIndex={0}
      aria-selected={isActive}
      aria-label={isActive ? `${clientLabel}, selected request` : `${clientLabel}, request`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        'group relative rounded-2xl border bg-white transition-all duration-200 dark:bg-slate-900/95',
        'shadow-[0_4px_24px_-4px_rgba(0,0,0,0.12)]',
        'animate-in slide-in-from-top-2 fade-in duration-300',
        // First-broadcast offer: amber fill when this batch includes the discount question
        isOffer &&
          'bg-gradient-to-b from-amber-50/90 to-white dark:from-amber-950/40 dark:to-slate-900/95',
        !isActive &&
          isOffer &&
          'border-2 border-amber-400/85 shadow-[0_0_0_1px_rgba(251,191,36,0.35),0_8px_24px_-8px_rgba(251,191,36,0.2)] dark:border-amber-500/70',
        !isActive && !isOffer && 'border border-slate-200/90 dark:border-slate-600/60',
        // Selected: teal border (in addition to the Active tag)
        isActive &&
          'border-2 border-teal-500 shadow-[0_0_0_1px_rgba(20,184,166,0.35),0_8px_28px_-8px_rgba(20,184,166,0.22)] dark:border-teal-400/85',
        !isOffer && 'hover:shadow-[0_8px_28px_-8px_rgba(0,0,0,0.08)] hover:ring-1 hover:ring-slate-300/60',
        isOffer &&
          !isActive &&
          'hover:shadow-[0_8px_32px_-6px_rgba(251,191,36,0.28)] hover:ring-1 hover:ring-amber-400/45',
        !isOffer && !isActive && highValue && 'ring-1 ring-emerald-400/40',
        className
      )}
    >
      <div className="p-3">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p className="truncate text-sm font-bold leading-tight text-slate-900 dark:text-slate-50">
                {clientLabel}
              </p>
              {isActive && (
                <span className="shrink-0 rounded-md bg-teal-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
                  Active
                </span>
              )}
            </div>
            <p className="truncate font-mono text-[10px] text-slate-500">{clientIdShort}</p>
          </div>
          <span
            className={cn(
              'flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide shadow-sm',
              totalNr > 0
                ? highValue
                  ? 'bg-emerald-500 text-white'
                  : 'bg-emerald-600 text-white'
                : isOffer
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-500 text-white'
            )}
          >
            {paidOrFreeLabel(totalNr)}
          </span>
        </div>

        <p className="mb-2 line-clamp-2 text-xs leading-snug text-slate-600 dark:text-slate-300">
          {preview || '—'}
        </p>

        <div className="mb-2 text-[10px] text-slate-500">
          {formatDistanceToNowStrict(new Date(createdAt), { addSuffix: true })}
        </div>

        <div onClick={(e) => e.stopPropagation()} className="mb-3">
          <ProgressBar
            createdAt={createdAt}
            expiresAt={expiresAt}
            expiryMs={BROADCAST_MESSAGE_EXPIRY_MS}
            postExpiryGraceMs={BROADCAST_POST_EXPIRY_GRACE_MS}
            variant="compact"
          />
        </div>

        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <LoadingButton
            type="button"
            size="sm"
            className="h-9 flex-1 rounded-xl bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-600 text-xs font-bold text-white shadow-md hover:brightness-110"
            isLoading={accepting}
            disabled={accepting}
            onClick={onAccept}
          >
            Accept
          </LoadingButton>
          <button
            type="button"
            disabled={accepting}
            onClick={onReject}
            className="h-9 flex-1 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
