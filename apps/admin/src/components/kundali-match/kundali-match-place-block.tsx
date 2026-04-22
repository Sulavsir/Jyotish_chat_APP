'use client';

import { getNepalGeographyDisplayName } from '@jyotish/shared';
import type { KundaliMatchRequest } from '@/types/kundaliMatch.types';

type Person = 'boy' | 'girl';

export function KundaliMatchPlaceBlock({
  r,
  person,
  useDevanagari,
}: {
  r: KundaliMatchRequest;
  person: Person;
  useDevanagari: boolean;
}) {
  const type = person === 'boy' ? r.boyPlaceOfBirthType : r.girlPlaceOfBirthType;
  const pradesh = person === 'boy' ? r.boyPlaceOfBirthPradesh : r.girlPlaceOfBirthPradesh;
  const district = person === 'boy' ? r.boyPlaceOfBirthDistrict : r.girlPlaceOfBirthDistrict;
  const loc = person === 'boy' ? r.boyPlaceOfBirthLocation : r.girlPlaceOfBirthLocation;
  const combined = person === 'boy' ? r.boyPlaceOfBirth : r.girlPlaceOfBirth;

  if (type === 'OUTSIDE_NEPAL') {
    return (
      <div className="space-y-0.5 text-left min-w-[120px] max-w-[min(100%,220px)]">
        <p className="text-slate-500 text-[10px] uppercase tracking-wide">Region</p>
        <p className="text-slate-200 text-xs">(Outside Nepal)</p>
        <p className="text-slate-500 text-[10px] uppercase tracking-wide pt-1">Place</p>
        <p className="text-slate-300 text-xs break-words" title={combined ?? undefined}>
          {combined?.trim() || '—'}
        </p>
      </div>
    );
  }

  if (type === 'NEPAL' && (pradesh?.nameEn || district?.nameEn || loc)) {
    return (
      <div className="space-y-0.5 text-left min-w-[140px]">
        <p className="text-slate-500 text-[10px] uppercase tracking-wide">Province</p>
        <p className="text-slate-200">
          {pradesh?.nameEn
            ? getNepalGeographyDisplayName(pradesh.nameEn, useDevanagari)
            : '—'}
        </p>
        <p className="text-slate-500 text-[10px] uppercase tracking-wide pt-1">District</p>
        <p className="text-slate-200">
          {district?.nameEn
            ? getNepalGeographyDisplayName(district.nameEn, useDevanagari)
            : '—'}
        </p>
        <p className="text-slate-500 text-[10px] uppercase tracking-wide pt-1">Birthplace</p>
        <p className="text-slate-300 break-words">{loc?.trim() || '—'}</p>
      </div>
    );
  }

  return (
    <div className="text-xs text-slate-300 min-w-[120px] max-w-[200px]">
      <p className="text-slate-500 text-[10px] uppercase tracking-wide mb-0.5">Place</p>
      <p className="break-words" title={combined}>
        {combined || '—'}
      </p>
    </div>
  );
}
