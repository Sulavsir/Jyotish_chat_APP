'use client';

import { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants';
import { subhaSahitService } from '@/services/subha-sahit.service';
import { DateInput, Label } from '@jyotish/ui';

function getMonthRange(date: Date): { from: string; to: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: toIso(start), to: toIso(end) };
}

function formatDay(dateStr: string): string {
  if (!dateStr || typeof dateStr !== 'string') return '';

  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) {
    // Fallback to raw string if parsing fails
    return dateStr;
  }

  const day = d.getDate();
  const monthName = d.toLocaleString('en-US', { month: 'long' });
  const year = d.getFullYear();

  const getSuffix = (n: number) => {
    if (n >= 11 && n <= 13) return 'th';
    const last = n % 10;
    if (last === 1) return 'st';
    if (last === 2) return 'nd';
    if (last === 3) return 'rd';
    return 'th';
  };

  return `${day}${getSuffix(day)} ${monthName} ${year}`;
}

export function SubhaSahitSection() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 7);
  });
  const [occasionFilter, setOccasionFilter] = useState('');

  const selectedMonthDate = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return new Date(year, month - 1, 1);
  }, [selectedMonth]);

  const { from, to } = useMemo(() => getMonthRange(selectedMonthDate), [selectedMonthDate]);

  const { data: occasionsData } = useQuery({
    queryKey: QUERY_KEYS.SUBHA_SAHIT.AVAILABLE(),
    queryFn: () => subhaSahitService.getOccasions(),
  });

  const occasions = occasionsData?.occasions ?? [];

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.SUBHA_SAHIT.AVAILABLE({ 
      dateFrom: from, 
      dateTo: to,
      occasion: occasionFilter || undefined,
    }),
    queryFn: () => subhaSahitService.getAvailableDates({ 
      dateFrom: from, 
      dateTo: to,
      occasion: occasionFilter || undefined,
    }),
  });

  const dates = data?.dates ?? [];

  const handleMonthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      setSelectedMonth(value);
    }
  }, []);

  return (
    <section className="relative py-16 lg:py-20 bg-gradient-to-b from-black via-slate-950 to-black overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-32 -left-32 h-72 w-72 rounded-full bg-purple-600/30 blur-3xl" />
        <div className="absolute top-10 right-0 h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-purple-300 ring-1 ring-purple-500/40">
              Subha Sahit • Auspicious Dates
            </p>
            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
              Auspicious days
            </h2>
            <p className="mt-2 max-w-2xl text-sm sm:text-base text-slate-300">
              Plan your important puja and ceremonies on Subha Sahit (auspicious) dates curated by our Jyotish team.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
            <div className="flex-1 rounded-2xl border border-purple-500/30 bg-slate-950/70 p-3 shadow-[0_0_40px_rgba(129,140,248,0.25)] backdrop-blur">
              <Label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-300">
                Select Month
              </Label>
              <input
                type="month"
                value={selectedMonth}
                onChange={handleMonthChange}
                className="w-full bg-slate-900/70 border border-purple-500/40 rounded-md px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none [color-scheme:dark]"
              />
            </div>
            {occasions.length > 0 && (
              <div className="flex-1 rounded-2xl border border-purple-500/30 bg-slate-950/70 p-3 shadow-[0_0_40px_rgba(129,140,248,0.25)] backdrop-blur">
                <Label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-300">
                  Filter by Occasion
                </Label>
                <select
                  value={occasionFilter}
                  onChange={(e) => setOccasionFilter(e.target.value)}
                  className="w-full bg-slate-900/70 border border-purple-500/40 rounded-md px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none [color-scheme:dark]"
                >
                  <option value="">All occasions</option>
                  {occasions.map((occ) => (
                    <option key={occ} value={occ}>
                      {occ}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4 sm:p-6 shadow-xl shadow-purple-900/30">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-slate-300 text-sm">
              Loading auspicious dates for this month...
            </div>
          ) : dates.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <p className="text-base font-medium text-slate-200">No Subha Sahit dates added for this month yet.</p>
              <p className="max-w-md text-sm text-slate-400">
                Our team is continuously updating auspicious timings. Please check again later or explore yearly
                horoscopes for guidance.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dates.map((item) => (
                <div
                  key={item.id}
                  className="group relative overflow-hidden rounded-xl border border-purple-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/40 p-4 hover:border-purple-400/70 hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300">
                    <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-purple-500/30 blur-2xl" />
                  </div>
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-purple-300/80">
                        {item.occasion}
                      </span>
                      <span className="text-lg font-semibold text-white">
                        {formatDay(item.date)}
                      </span>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300 border border-emerald-500/30">
                      Subha Sahit
                    </span>
                  </div>
                  {item.description && (
                    <p className="relative mt-3 line-clamp-3 text-xs text-slate-300">
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="mt-4 text-[11px] text-slate-500">
            Booking Pandit Ji through Jyotish is only possible on these Subha Sahit dates, ensuring your rituals are
            performed at the most auspicious times.
          </p>
        </div>
      </div>
    </section>
  );
}

