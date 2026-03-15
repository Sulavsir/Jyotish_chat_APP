'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from './utils';
import { useNepaliDateApi } from './nepali-date-api-context';
import { NEPALI_WEEKDAY_LABELS } from './nepali-weekdays';

type CalendarSystem = 'AD' | 'BS';

const AD_YEAR_MIN = 1944;
const AD_YEAR_MAX = 2030;
const BS_YEAR_MIN = 1970;
const BS_YEAR_MAX = 2090;

/** Fallback path when app does not provide getBsMonth via NepaliDateApiProvider */
const BS_MONTH_API_PATH = '/api/v1/public/nepali-date/bs-month';

const BS_MONTH_NAMES = [
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

export interface BsAdCalendarProps {
  value?: string; // ISO date yyyy-mm-dd (always English date)
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  disableBs?: boolean;
  /**
   * @deprecated Use AD/BS month APIs instead. Kept for backward compat; ignored when using new month APIs.
   */
  loadNepaliMap?: (dates: string[]) => Promise<Record<string, { nepaliDate: string; days: string }>>;
  onSystemChange?: (system: CalendarSystem) => void;
  onDateMetaChange?: (
    value: string,
    meta: { system: CalendarSystem; mapping?: { nepaliDate: string; days: string } }
  ) => void;
}

interface AdMonthDay {
  date: string;
  day: number;
}

interface BsMonthDay {
  nepaliDate: string;
  englishDate: string;
  day: number;
}

interface AdMonthResponse {
  year: number;
  month: number;
  days: AdMonthDay[];
}

interface BsMonthResponse {
  year: number;
  month: number;
  days: BsMonthDay[];
}

function getAdMonthDays(year: number, month: number): AdMonthDay[] {
  const days: AdMonthDay[] = [];
  const lastDay = new Date(year, month, 0).getDate();
  for (let d = 1; d <= lastDay; d++) {
    const m = String(month).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    days.push({ date: `${year}-${m}-${dayStr}`, day: d });
  }
  return days;
}

function getBsMonthName(month: number): string {
  return BS_MONTH_NAMES[month] ?? String(month);
}

export const BsAdCalendar: React.FC<BsAdCalendarProps> = ({
  value,
  onChange,
  min,
  max,
  disableBs,
  onSystemChange,
  onDateMetaChange,
}) => {
  const { getBsMonth } = useNepaliDateApi();
  const today = new Date();
  const initialDate = value ? new Date(value) : today;
  const validInitial = Number.isNaN(initialDate.getTime()) ? today : initialDate;

  const [system, setSystem] = React.useState<CalendarSystem>(disableBs ? 'AD' : 'BS');
  const [adYear, setAdYear] = React.useState(validInitial.getFullYear());
  const [adMonth, setAdMonth] = React.useState(validInitial.getMonth() + 1);
  const [bsYear, setBsYear] = React.useState(2080);
  const [bsMonth, setBsMonth] = React.useState(11);

  const useQueryForBs = Boolean(system === 'BS' && getBsMonth);

  const { data: bsMonthData, isLoading: isLoadingBsQuery } = useQuery({
    queryKey: ['nepali-date', 'bs-month', bsYear, bsMonth],
    queryFn: () => getBsMonth!(bsYear, bsMonth),
    enabled: useQueryForBs,
    staleTime: 1000 * 60 * 60,
  });

  const [bsDaysFallback, setBsDaysFallback] = React.useState<BsMonthDay[]>([]);
  const [isLoadingBsFallback, setIsLoadingBsFallback] = React.useState(false);
  const bsCache = React.useRef<Record<string, BsMonthDay[]>>({});

  React.useEffect(() => {
    if (system !== 'BS' || getBsMonth) return;
    const cacheKey = `${bsYear}-${bsMonth}`;
    const cached = bsCache.current[cacheKey];
    if (cached) {
      setBsDaysFallback(cached);
      return;
    }
    setIsLoadingBsFallback(true);
    const url = `${BS_MONTH_API_PATH}?year=${bsYear}&month=${bsMonth}`;
    fetch(url)
      .then((res) => (res.ok ? res.json() : { data: null }))
      .then((raw: { success?: boolean; data?: BsMonthResponse }) => {
        const data = raw?.data;
        const days = data?.days && Array.isArray(data.days) ? data.days : [];
        bsCache.current[cacheKey] = days;
        setBsDaysFallback(days);
      })
      .catch(() => setBsDaysFallback([]))
      .finally(() => setIsLoadingBsFallback(false));
  }, [system, bsYear, bsMonth, getBsMonth]);

  const bsDays = useQueryForBs ? (bsMonthData?.days ?? []) : bsDaysFallback;
  const isLoadingBs = useQueryForBs ? isLoadingBsQuery : isLoadingBsFallback;

  const minDate = min ? new Date(min) : undefined;
  const maxDate = max ? new Date(max) : undefined;

  const selectedKey = React.useMemo(() => {
    if (!value) return '';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '' : value.slice(0, 10);
  }, [value]);

  const adDays = React.useMemo(
    () => getAdMonthDays(adYear, adMonth),
    [adYear, adMonth]
  );

  const adFirstWeekday = React.useMemo(
    () => new Date(adYear, adMonth - 1, 1).getDay(),
    [adYear, adMonth]
  );

  const handleSelectAd = (dateStr: string) => {
    if (min != null && dateStr < min) return;
    if (max != null && dateStr > max) return;
    onChange(dateStr);
    onDateMetaChange?.(dateStr, { system: 'AD' });
  };

  const handleSelectBs = (day: BsMonthDay) => {
    if (min != null && day.englishDate < min) return;
    if (max != null && day.englishDate > max) return;
    onChange(day.englishDate);
    onDateMetaChange?.(day.englishDate, {
      system: 'BS',
      mapping: { nepaliDate: day.nepaliDate, days: '' },
    });
  };

  const navigateAdMonth = (delta: number) => {
    let y = adYear;
    let m = adMonth + delta;
    if (m > 12) {
      m = 1;
      y += 1;
    } else if (m < 1) {
      m = 12;
      y -= 1;
    }
    setAdMonth(m);
    setAdYear(y);
  };

  const navigateBsMonth = (delta: number) => {
    let y = bsYear;
    let m = bsMonth + delta;
    if (m > 12) {
      m = 1;
      y += 1;
    } else if (m < 1) {
      m = 12;
      y -= 1;
    }
    setBsMonth(m);
    setBsYear(y);
  };

  const adYearOptions = React.useMemo(() => {
    const opts: number[] = [];
    for (let y = AD_YEAR_MAX; y >= AD_YEAR_MIN; y--) opts.push(y);
    return opts;
  }, []);

  const bsYearOptions = React.useMemo(() => {
    const opts: number[] = [];
    for (let y = BS_YEAR_MAX; y >= BS_YEAR_MIN; y--) opts.push(y);
    return opts;
  }, []);

  const bsFirstWeekday = React.useMemo(() => {
    if (bsDays.length === 0) return 0;
    const firstDate = new Date(bsDays[0].englishDate);
    return firstDate.getDay();
  }, [bsDays]);

  const weekdayLabelsAd = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const weekdayLabels = system === 'BS' ? [...NEPALI_WEEKDAY_LABELS] : weekdayLabelsAd;

  const adMonthLabel = React.useMemo(
    () => new Date(adYear, adMonth - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    [adYear, adMonth]
  );

  const bsMonthLabel = `${getBsMonthName(bsMonth)} ${bsYear}`;

  return (
    <div className="w-full text-xs text-slate-900 dark:text-slate-50">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-900/60 p-0.5 border border-slate-200/60 dark:border-slate-700/80">
          <button
            type="button"
            className={cn(
              'px-2 py-1 rounded-full text-[11px] font-medium transition-colors',
              system === 'AD' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-100' : 'text-slate-500 dark:text-slate-300'
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
                system === 'BS' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-100' : 'text-slate-500 dark:text-slate-300'
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
          {system === 'AD' ? (
            <>
              <select
                value={adYear}
                onChange={(e) => setAdYear(Number(e.target.value))}
                className="h-7 px-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                aria-label="Select year (AD)"
              >
                {adYearOptions.map((y) => (
                  <option key={y} value={y}>{y} AD</option>
                ))}
              </select>
              <button type="button" className="h-6 w-6 inline-flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => navigateAdMonth(-1)}>‹</button>
              <span className="min-w-[100px] text-center truncate">{adMonthLabel}</span>
              <button type="button" className="h-6 w-6 inline-flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => navigateAdMonth(1)}>›</button>
            </>
          ) : (
            <>
              <select
                value={bsYear}
                onChange={(e) => setBsYear(Number(e.target.value))}
                className="h-7 px-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                aria-label="Select year (BS)"
              >
                {bsYearOptions.map((y) => (
                  <option key={y} value={y}>{y} BS</option>
                ))}
              </select>
              <button type="button" className="h-6 w-6 inline-flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => navigateBsMonth(-1)}>‹</button>
              <span className="min-w-[100px] text-center truncate">{bsMonthLabel}</span>
              <button type="button" className="h-6 w-6 inline-flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => navigateBsMonth(1)}>›</button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
        {weekdayLabels.map((label) => (
          <div key={label} className="text-center truncate" title={label}>{label}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {system === 'AD' ? (
          <>
            {Array.from({ length: adFirstWeekday }).map((_, i) => (
              <div key={`ad-empty-${i}`} />
            ))}
            {adDays.map(({ date, day }) => {
              const isSelected = date === selectedKey;
              const isToday = date === today.toISOString().slice(0, 10);
              const disabled =
                (min != null && date < min) ||
                (max != null && date > max);
              return (
                <button
                  key={date}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelectAd(date)}
                  className={cn(
                    'relative h-8 rounded-md border text-[11px] flex items-center justify-center transition-colors',
                    'border-slate-200 bg-white hover:bg-slate-50 text-slate-900',
                    'dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-50',
                    disabled && 'opacity-40 cursor-not-allowed',
                    isSelected && 'border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-200 dark:border-purple-400',
                    !isSelected && isToday && 'border-emerald-500/70 bg-emerald-500/5 dark:border-emerald-500/70'
                  )}
                >
                  {day}
                </button>
              );
            })}
          </>
        ) : (
          <>
            {Array.from({ length: bsFirstWeekday }).map((_, i) => (
              <div key={`bs-empty-${i}`} />
            ))}
            {bsDays.map((day) => {
              const isSelected = day.englishDate === selectedKey;
              const isToday = day.englishDate === today.toISOString().slice(0, 10);
              const disabled =
                isLoadingBs ||
                (min != null && day.englishDate < min) ||
                (max != null && day.englishDate > max);
              return (
                <button
                  key={day.nepaliDate}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelectBs(day)}
                  className={cn(
                    'relative h-8 rounded-md border text-[11px] flex items-center justify-center transition-colors',
                    'border-slate-200 bg-white hover:bg-slate-50 text-slate-900',
                    'dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-50',
                    disabled && 'opacity-40 cursor-not-allowed',
                    isSelected && 'border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-200 dark:border-purple-400',
                    !isSelected && isToday && 'border-emerald-500/70 bg-emerald-500/5 dark:border-emerald-500/70'
                  )}
                >
                  {day.day}
                </button>
              );
            })}
          </>
        )}
      </div>

      {system === 'BS' && isLoadingBs && (
        <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">Loading month…</p>
      )}
      {system === 'BS' && !isLoadingBs && bsDays.length === 0 && (
        <p className="mt-2 text-[10px] text-amber-600 dark:text-amber-400">
          No data for this BS month. Try another month or switch to AD.
        </p>
      )}
    </div>
  );
};
