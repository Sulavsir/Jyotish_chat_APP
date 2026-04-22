'use client';

import {
  formatGregorianDateEnShort,
  formatNepaliBsDateLine,
  type NepaliDateMappingInput,
} from '@jyotish/shared';

export function toYmd(iso: string) {
  return iso?.includes('T') ? iso.slice(0, 10) : iso?.slice(0, 10) ?? '';
}

export function KundaliMatchDobLines({
  iso,
  mapEntry,
  isLoading,
}: {
  iso: string;
  mapEntry: NepaliDateMappingInput | undefined;
  isLoading: boolean;
}) {
  const ad = toYmd(iso);
  const adDisplay = ad ? formatGregorianDateEnShort(ad) : '';
  return (
    <div className="space-y-0.5 text-left min-w-[118px]">
      <p className="text-slate-500 text-[10px] uppercase">Bikram Sambat</p>
      <p className="text-slate-200 text-xs leading-tight">
        {isLoading ? '…' : mapEntry ? formatNepaliBsDateLine(mapEntry) : '—'}
      </p>
      <p className="text-slate-500 text-[10px] uppercase pt-1">AD</p>
      <p className="text-slate-400 text-[11px]">{adDisplay || '—'}</p>
    </div>
  );
}
