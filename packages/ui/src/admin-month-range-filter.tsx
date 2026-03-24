'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from './utils';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { DateInput } from './date-input';
import { Label } from './label';
import { CalendarDaysIcon } from './icons';

function formatYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(base: Date, delta: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + delta);
  return d;
}

/** Default filter: today (local calendar). */
export function getTodayDateRange(): { from: string; to: string } {
  const t = formatYMD(new Date());
  return { from: t, to: t };
}

export type AdminDatePresetId =
  | 'all'
  | 'today'
  | 'yesterday'
  | '3days'
  | 'week'
  | 'month'
  | 'year'
  | 'custom';

function buildPresetRanges(): Record<
  Exclude<AdminDatePresetId, 'custom'>,
  { from: string; to: string }
> {
  const now = new Date();
  const today = formatYMD(now);
  const yesterday = formatYMD(addDays(now, -1));
  const threeStart = formatYMD(addDays(now, -2));
  const weekStart = formatYMD(addDays(now, -6));
  const monthStart = formatYMD(new Date(now.getFullYear(), now.getMonth(), 1));
  const monthEnd = formatYMD(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const y = now.getFullYear();
  return {
    all: { from: '', to: '' },
    today: { from: today, to: today },
    yesterday: { from: yesterday, to: yesterday },
    '3days': { from: threeStart, to: today },
    week: { from: weekStart, to: today },
    month: { from: monthStart, to: monthEnd },
    year: { from: `${y}-01-01`, to: `${y}-12-31` },
  };
}

function detectPreset(from: string, to: string): AdminDatePresetId {
  if (!from && !to) return 'all';
  const presets = buildPresetRanges();
  for (const id of Object.keys(presets) as Exclude<AdminDatePresetId, 'custom'>[]) {
    const r = presets[id];
    if (r.from === from && r.to === to) return id;
  }
  return 'custom';
}

const PRESET_ROWS: { id: Exclude<AdminDatePresetId, 'custom'>; label: string }[] = [
  { id: 'all', label: 'All time' },
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '3days', label: '3 days' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
];

function presetTriggerLabel(from: string, to: string): string {
  const id = detectPreset(from, to);
  if (id === 'custom') {
    if (from && to) return from === to ? from : `${from} – ${to}`;
    if (from) return `From ${from}`;
    if (to) return `Until ${to}`;
    return 'Custom';
  }
  return PRESET_ROWS.find((r) => r.id === id)?.label ?? 'Custom';
}

export interface AdminMonthRangeFilterProps {
  fromValue: string;
  toValue: string;
  onRangeChange: (from: string, to: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Filter: **DateInput**-style trigger + popover (presets + custom range).
 * Pair with {@link getTodayDateRange} for default **Today** in parent state.
 */
export function AdminMonthRangeFilter({
  fromValue,
  toValue,
  onRangeChange,
  disabled,
  className,
}: AdminMonthRangeFilterProps) {
  const [open, setOpen] = React.useState(false);
  const [customFrom, setCustomFrom] = React.useState(fromValue);
  const [customTo, setCustomTo] = React.useState(toValue);

  React.useEffect(() => {
    setCustomFrom(fromValue);
    setCustomTo(toValue);
  }, [fromValue, toValue]);

  const presets = React.useMemo(() => buildPresetRanges(), []);

  const applyPreset = (id: Exclude<AdminDatePresetId, 'custom'>) => {
    const r = presets[id];
    onRangeChange(r.from, r.to);
    setOpen(false);
  };

  const applyCustom = () => {
    const from = customFrom.trim();
    const to = customTo.trim();
    if (from && to && from > to) {
      onRangeChange(to, from);
    } else {
      onRangeChange(from, to);
    }
    setOpen(false);
  };

  const activeId = detectPreset(fromValue, toValue);
  const triggerLabel = presetTriggerLabel(fromValue, toValue);

  const dateInputClass =
    'w-full bg-slate-900/40 border-2 border-purple-500/20 text-white rounded-lg py-2.5 px-3 text-sm focus:border-purple-500/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20 [color-scheme:dark]';

  const triggerClass = cn(
    'inline-flex h-10 min-w-[220px] max-w-full items-center justify-between gap-2 rounded-lg border-2 border-purple-500/20',
    'bg-slate-900/40 px-3 py-2 text-left text-sm text-white shadow-sm transition-colors',
    'hover:border-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-500/30',
    'disabled:opacity-50 [color-scheme:dark]'
  );

  return (
    <span className={cn('inline-flex shrink-0 items-center gap-2', className)}>
      <span className="whitespace-nowrap text-sm font-medium text-slate-400">Filter:</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" disabled={disabled} className={triggerClass}>
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <CalendarDaysIcon className="h-4 w-4 shrink-0 text-yellow-500" />
              <span className="truncate font-medium">{triggerLabel}</span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-[min(100vw-2rem,320px)] border-slate-700 bg-slate-950 p-0 shadow-xl"
        >
          <div className="border-b border-slate-800 p-2">
            <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Quick range
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESET_ROWS.map(({ id, label }) => {
                const selected = activeId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    className={cn(
                      'rounded-lg px-3 py-2 text-left text-sm transition-colors',
                      selected
                        ? 'bg-purple-600/30 text-purple-100 ring-1 ring-purple-500/40'
                        : 'bg-slate-900/50 text-slate-200 hover:bg-slate-800 hover:text-white'
                    )}
                    onClick={() => applyPreset(id)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-3 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Custom
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">From</Label>
                <DateInput
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className={dateInputClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">To</Label>
                <DateInput
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  min={customFrom || undefined}
                  className={dateInputClass}
                />
              </div>
            </div>
            <Button type="button" size="sm" color="secondary" className="w-full" onClick={applyCustom}>
              Apply custom range
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </span>
  );
}
