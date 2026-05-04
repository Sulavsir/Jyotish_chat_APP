'use client';

import {
  formatGregorianDateEnShort,
  formatNepaliBsDateLine,
  type NepaliDateMappingInput,
} from '@jyotish/shared';
import { toIsoDateKeyLocal } from '@/utils/to-iso-date-key-local';
import type { AdminTableCalendarPrimary } from '@/utils/admin-table-calendar-primary';

export function AdminDualCalendarDateCell({
  value,
  bsMapping,
  primary,
  isLoading,
}: {
  value: string | Date | null | undefined;
  bsMapping?: NepaliDateMappingInput | null;
  primary: AdminTableCalendarPrimary;
  isLoading?: boolean;
}) {
  const ymd = toIsoDateKeyLocal(value);
  const enLine = ymd ? formatGregorianDateEnShort(ymd) : '';

  let bsLine: string;
  if (isLoading) {
    bsLine = '…';
  } else if (bsMapping) {
    bsLine = formatNepaliBsDateLine(bsMapping);
  } else if (ymd) {
    bsLine = '—';
  } else {
    bsLine = '—';
  }

  if (!ymd && !isLoading) {
    return <span className="text-slate-500">—</span>;
  }

  const englishFirst = primary === 'english';
  const primaryLine = englishFirst ? enLine || '—' : bsLine;
  const secondaryLine = englishFirst ? bsLine : enLine || '—';

  return (
    <div className="space-y-0.5 text-left min-w-[7.5rem]">
      <p className="font-semibold text-slate-200 text-sm leading-snug">{primaryLine}</p>
      <p className="text-sm text-slate-400 leading-snug">{secondaryLine}</p>
    </div>
  );
}
