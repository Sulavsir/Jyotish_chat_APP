'use client';

import {
  formatGregorianDateEnShort,
  formatNepaliBsDateLine,
  type NepaliDateMappingInput,
} from '@jyotish/shared';
import { AdminDualCalendarDateCell } from '@/components/admin/AdminDualCalendarDateCell';
import type { AdminTableCalendarPrimary } from '@/utils/admin-table-calendar-primary';

export function toYmd(iso: string) {
  return iso?.includes('T') ? iso.slice(0, 10) : (iso?.slice(0, 10) ?? '');
}

export function KundaliMatchDobLines({
  iso,
  mapEntry,
  isLoading,
  layout = 'labeled',
  localePrimary = 'english',
}: {
  iso: string;
  mapEntry: NepaliDateMappingInput | undefined;
  isLoading: boolean;
  /** `locale-split`: bold primary calendar per admin locale (tables only). Default: labeled BS/AD blocks for modals. */
  layout?: 'labeled' | 'locale-split';
  localePrimary?: AdminTableCalendarPrimary;
}) {
  if (layout === 'locale-split') {
    return (
      <AdminDualCalendarDateCell
        value={iso}
        bsMapping={mapEntry}
        primary={localePrimary}
        isLoading={isLoading}
      />
    );
  }

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
