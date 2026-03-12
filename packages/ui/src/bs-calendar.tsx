'use client';

import * as React from 'react';
import { cn } from './utils';

type CalendarSystem = 'AD' | 'BS';

export interface BsAdCalendarProps {
  value?: string; // ISO date yyyy-mm-dd
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  /**
   * When true, BS tab is hidden and only AD can be used.
   * Useful for date-of-birth fields where we don't have full BS coverage.
   */
  disableBs?: boolean;
  /**
   * Optional custom loader for Nepali mappings.
   * When provided, this will be used instead of the internal fetch logic.
   */
  loadNepaliMap?: (dates: string[]) => Promise<NepaliMap>;
  /**
   * Notify parent when calendar system (AD/BS) changes.
   */
  onSystemChange?: (system: CalendarSystem) => void;
  /**
   * Notify parent with extra meta (BS mapping & system) when a date is selected.
   */
  onDateMetaChange?: (value: string, meta: { system: CalendarSystem; mapping?: NepaliDateMapping }) => void;
}

interface NepaliDateMapping {
  nepaliDate: string;
  days: string;
}

type NepaliMap = Record<string, NepaliDateMapping>;

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMonthRange(date: Date): { start: Date; end: Date; days: Date[] } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const days: Date[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return { start, end, days };
}

function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return '';
  // Prefer explicit public API URL if provided (production).
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // Match backend dev port convention used in web app (hostname:4000).
  return `${window.location.protocol}//${window.location.hostname}:4000`;
}

async function fetchNepaliMappings(dates: Date[]): Promise<NepaliMap> {
  if (dates.length === 0) return {};
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) return {};
  const keys = dates.map(toDateKey);
  try {
    const res = await fetch(`${baseUrl}/api/v1/public/nepali-date/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dates: keys }),
    });
    if (!res.ok) return {};
    const raw = (await res.json()) as unknown;
    // API response shape: { success: boolean, data: { map: Record<string, { nepaliDate, days }> } }
    // Fallback to direct { map } if ever changed.
    const anyRaw = raw as {
      success?: boolean;
      data?: { map?: NepaliMap };
      map?: NepaliMap;
    };
    const map = anyRaw?.data?.map ?? anyRaw?.map;
    return map ?? {};
  } catch {
    return {};
  }
}

function getBsMonthLabel(mapping?: NepaliDateMapping | null): string {
  if (!mapping?.nepaliDate) return '';
  const [yearStr, monthStr] = mapping.nepaliDate.split('-');
  const year = yearStr ?? '';
  const monthNum = Number.parseInt(monthStr ?? '', 10);
  const monthNames = [
    '',
    'Baisakh',
    'Jestha',
    'Ashadh',
    'Shrawan',
    'Bhadra',
    'Ashwin',
    'Kartik',
    'Mangsir',
    'Poush',
    'Magh',
    'Falgun',
    'Chaitra',
  ] as const;
  const monthName = Number.isFinite(monthNum) ? monthNames[monthNum] ?? monthStr : monthStr;
  return monthName ? `${monthName} ${year}` : mapping.nepaliDate;
}

export const BsAdCalendar: React.FC<BsAdCalendarProps> = ({
  value,
  onChange,
  min,
  max,
  disableBs,
  loadNepaliMap,
  onSystemChange,
  onDateMetaChange,
}) => {
  const [system, setSystem] = React.useState<CalendarSystem>(disableBs ? 'AD' : 'BS');
  const initialDate = value ? new Date(value) : new Date();
  const [visibleMonth, setVisibleMonth] = React.useState<Date>(
    Number.isNaN(initialDate.getTime()) ? new Date() : initialDate
  );
  const [nepaliMap, setNepaliMap] = React.useState<NepaliMap>({});
  const [isLoadingBs, setIsLoadingBs] = React.useState(false);
  const monthCache = React.useRef<Record<string, NepaliMap>>({});

  const { days, start } = React.useMemo(() => getMonthRange(visibleMonth), [visibleMonth]);
  const monthKey = React.useMemo(() => toDateKey(start), [start]);

  const selectedKey = React.useMemo(() => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return toDateKey(d);
  }, [value]);

  const minDate = min ? new Date(min) : undefined;
  const maxDate = max ? new Date(max) : undefined;

  React.useEffect(() => {
    let ignore = false;
    if (system !== 'BS') return;
    setIsLoadingBs(true);
    const cached = monthCache.current[monthKey];
    if (cached) {
      setNepaliMap(cached);
      setIsLoadingBs(false);
      return () => {
        ignore = true;
      };
    }
    const run = async () => {
      const dateKeys = days.map(toDateKey);
      const map = loadNepaliMap ? await loadNepaliMap(dateKeys) : await fetchNepaliMappings(days);
      if (!ignore) {
        monthCache.current[monthKey] = map;
        setNepaliMap(map);
      }
    };
    run()
      .finally(() => {
        if (!ignore) setIsLoadingBs(false);
      });
    return () => {
      ignore = true;
    };
  }, [days, system]);

  const handleSelect = (date: Date) => {
    if (minDate && date < minDate) return;
    if (maxDate && date > maxDate) return;
    const key = toDateKey(date);
    onChange(key);
    const mapping = nepaliMap[key];
    onDateMetaChange?.(key, { system, mapping });
  };

  const navigateMonth = (delta: number) => {
    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const firstWeekday = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay();
  const leadingEmpty = Array.from({ length: firstWeekday }).map((_, i) => i);

  const adMonthLabel = visibleMonth.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const bsMonthLabel = React.useMemo(() => {
    if (system !== 'BS') return '';
    const firstKey = days.length > 0 ? toDateKey(days[0]) : '';
    const mapping = firstKey ? nepaliMap[firstKey] : undefined;
    return getBsMonthLabel(mapping);
  }, [days, nepaliMap, system]);

  return (
    <div className="w-full text-xs text-slate-900 dark:text-slate-50">
      <div className="flex items-center justify-between mb-2">
        <div className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-900/60 p-0.5 border border-slate-200/60 dark:border-slate-700/80">
          <button
            type="button"
            className={cn(
              'px-2 py-1 rounded-full text-[11px] font-medium transition-colors',
              system === 'AD'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-100'
                : 'text-slate-500 dark:text-slate-300'
            )}
            onClick={() => {
              setSystem('AD');
              onSystemChange?.('AD');
            }}
          >
            AD
          </button>
          {!disableBs && (
            <button
              type="button"
              className={cn(
                'px-2 py-1 rounded-full text-[11px] font-medium transition-colors',
                system === 'BS'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-100'
                  : 'text-slate-500 dark:text-slate-300'
              )}
              onClick={() => {
                setSystem('BS');
                onSystemChange?.('BS');
              }}
            >
              BS
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 text-[11px] font-medium">
          <button
            type="button"
            className="h-6 w-6 inline-flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => navigateMonth(-1)}
          >
            ‹
          </button>
          <span className="min-w-[120px] text-center truncate">
            {system === 'BS' && bsMonthLabel ? bsMonthLabel : adMonthLabel}
          </span>
          <button
            type="button"
            className="h-6 w-6 inline-flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => navigateMonth(1)}
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
        {weekdayLabels.map((label) => (
          <div key={label} className="text-center">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {leadingEmpty.map((i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((date) => {
          const key = toDateKey(date);
          const isSelected = key === selectedKey;
          const isTodayKey = toDateKey(new Date()) === key;
          const disabled =
            (minDate && date < minDate) || (maxDate && date > maxDate) || isLoadingBs === true;
          const mapping = nepaliMap[key];

          const adLabel = date.getDate();
          const rawBsDay =
            mapping?.nepaliDate?.split('-')?.[2] ??
            undefined;
          const bsLabel = rawBsDay
            ? Number.parseInt(rawBsDay, 10) || rawBsDay
            : null;

          const showTopLabel =
            system === 'BS' ? (bsLabel ?? adLabel) : adLabel;
          const showBottomLabel =
            system === 'BS' ? adLabel : bsLabel;

          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => handleSelect(date)}
              className={cn(
                'relative h-8 rounded-md border text-[11px] flex flex-col items-center justify-center transition-colors',
                'border-slate-200 bg-white hover:bg-slate-50 text-slate-900',
                'dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-50',
                disabled &&
                  'opacity-40 cursor-not-allowed hover:bg-white dark:hover:bg-slate-900 dark:hover:bg-none',
                isSelected &&
                  'border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-200 dark:border-purple-400',
                !isSelected &&
                  isTodayKey &&
                  'border-emerald-500/70 bg-emerald-500/5 dark:border-emerald-500/70'
              )}
            >
              <span className="leading-none text-[11px]">
                {showTopLabel}
              </span>
              {showBottomLabel != null && (
                <span className="leading-none text-[9px] text-slate-500 dark:text-slate-400">
                  {showBottomLabel}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {system === 'BS' && Object.keys(nepaliMap).length === 0 && (
        <p className="mt-2 text-[10px] text-amber-600 dark:text-amber-400">
          Nepali date conversion not available for this month. Please switch to AD.
        </p>
      )}
    </div>
  );
};

