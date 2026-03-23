'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const MAX_VISIBLE_CHARS = 20;

interface TransactionIdCellProps {
  transactionId: string | null;
  fallback?: string | null;
}

export function TransactionIdCell({ transactionId, fallback }: TransactionIdCellProps) {
  const [copied, setCopied] = useState(false);

  const value = transactionId ?? fallback ?? null;
  const displayText = value
    ? value.length > MAX_VISIBLE_CHARS
      ? `${value.slice(0, MAX_VISIBLE_CHARS)}…`
      : value
    : '—';
  const fullValue = value ?? '';

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!fullValue || fullValue === '—') return;
    try {
      await navigator.clipboard.writeText(fullValue);
      setCopied(true);
      toast.success('Transaction ID copied');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="flex items-center gap-1.5 min-w-0 max-w-[200px]">
      <span className="font-mono text-sm text-slate-300 truncate" title={fullValue || undefined}>
        {displayText}
      </span>
      {fullValue ? (
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 p-1 rounded hover:bg-slate-700/80 text-slate-400 hover:text-white transition-colors"
          aria-label="Copy transaction ID"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      ) : null}
    </div>
  );
}
