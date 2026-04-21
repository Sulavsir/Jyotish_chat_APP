'use client';

import React, { useEffect } from 'react';
import {
  Label,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@jyotish/ui';
import { useProvincesQuery, useDistrictsByProvinceQuery } from '@/hooks/useLocationQueries';
import type { PlaceOfBirthType, NepalGeography } from '@jyotish/shared';

const PLACE_OF_BIRTH_TYPE_OPTIONS: { value: PlaceOfBirthType; label: string }[] = [
  { value: 'NEPAL', label: 'Nepal' },
  { value: 'OUTSIDE_NEPAL', label: 'Outside Nepal' },
];

export interface PlaceOfBirthFieldValue {
  placeOfBirthType: PlaceOfBirthType | null;
  placeOfBirthPradeshId: string | null;
  placeOfBirthDistrictId: string | null;
  placeOfBirthLocation: string | null;
  placeOfBirth: string | null;
  placeOfBirthPradeshName?: string | null;
  placeOfBirthDistrictName?: string | null;
}

const defaultValue: PlaceOfBirthFieldValue = {
  placeOfBirthType: null,
  placeOfBirthPradeshId: null,
  placeOfBirthDistrictId: null,
  placeOfBirthLocation: null,
  placeOfBirth: null,
  placeOfBirthPradeshName: null,
  placeOfBirthDistrictName: null,
};

export function buildPlaceOfBirthString(value: PlaceOfBirthFieldValue): string {
  if (!value.placeOfBirthType) return '';
  if (value.placeOfBirthType === 'OUTSIDE_NEPAL') {
    return (value.placeOfBirth && value.placeOfBirth.trim()) || '';
  }
  const parts = [
    value.placeOfBirthPradeshName || '',
    value.placeOfBirthDistrictName || '',
    (value.placeOfBirthLocation && value.placeOfBirthLocation.trim()) || '',
  ].filter(Boolean);
  return parts.join(', ');
}

export interface PlaceOfBirthFieldProps {
  value: PlaceOfBirthFieldValue;
  onChange: (value: PlaceOfBirthFieldValue) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
}

export function PlaceOfBirthField({
  value,
  onChange,
  label = 'Place of birth',
  disabled = false,
  className = '',
  labelClassName = 'text-white/80 text-xs',
  inputClassName = 'bg-white/5 border-white/20 text-white mt-1',
}: PlaceOfBirthFieldProps) {
  const v = value || defaultValue;
  const isNepal = v.placeOfBirthType === 'NEPAL';

  const { data: provinces = [], isLoading: provincesLoading } = useProvincesQuery();
  const { data: districts = [], isLoading: districtsLoading } = useDistrictsByProvinceQuery(
    isNepal && v.placeOfBirthPradeshId ? v.placeOfBirthPradeshId : null
  );

  const update = (patch: Partial<PlaceOfBirthFieldValue>) => {
    onChange({ ...defaultValue, ...v, ...patch });
  };

  useEffect(() => {
    if (v.placeOfBirthType === 'OUTSIDE_NEPAL' && (v.placeOfBirthPradeshId || v.placeOfBirthDistrictId || v.placeOfBirthLocation)) {
      update({
        placeOfBirthPradeshId: null,
        placeOfBirthDistrictId: null,
        placeOfBirthLocation: null,
        placeOfBirthPradeshName: null,
        placeOfBirthDistrictName: null,
      });
    }
    if (v.placeOfBirthType === 'NEPAL' && v.placeOfBirth) {
      update({ placeOfBirth: null });
    }
  }, [v.placeOfBirthType]);

  useEffect(() => {
    if (!v.placeOfBirthPradeshId && (v.placeOfBirthDistrictId || v.placeOfBirthDistrictName)) {
      update({ placeOfBirthDistrictId: null, placeOfBirthDistrictName: null });
    }
  }, [v.placeOfBirthPradeshId]);

  const handleProvinceChange = (id: string) => {
    const province = (provinces as NepalGeography[]).find((p) => p.id === id);
    update({
      placeOfBirthPradeshId: id || null,
      placeOfBirthPradeshName: province?.nameEn ?? null,
      placeOfBirthDistrictId: null,
      placeOfBirthDistrictName: null,
    });
  };

  const handleDistrictChange = (id: string) => {
    const district = (districts as NepalGeography[]).find((d) => d.id === id);
    update({
      placeOfBirthDistrictId: id || null,
      placeOfBirthDistrictName: district?.nameEn ?? null,
    });
  };

  return (
    <div className={className}>
      <Label className={labelClassName}>{label}</Label>
      <div className={`mt-1 flex gap-2 ${disabled ? 'pointer-events-none opacity-70' : ''}`}>
        {PLACE_OF_BIRTH_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => !disabled && update({ placeOfBirthType: opt.value })}
            className={`rounded-md border px-3 py-2 text-sm transition-colors ${
              v.placeOfBirthType === opt.value
                ? 'border-purple-500 bg-purple-500/20 text-white'
                : 'border-white/20 bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isNepal && (
        <>
          <div className="mt-3">
            <Label className={labelClassName}>Pradesh</Label>
            <Select
              value={v.placeOfBirthPradeshId ?? ''}
              onValueChange={handleProvinceChange}
              disabled={disabled || provincesLoading}
            >
              <SelectTrigger className={inputClassName}>
                <SelectValue placeholder={provincesLoading ? 'Loading...' : 'Select pradesh'} />
              </SelectTrigger>
              <SelectContent>
                {(provinces as NepalGeography[]).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-3">
            <Label className={labelClassName}>District</Label>
            <Select
              value={v.placeOfBirthDistrictId ?? ''}
              onValueChange={handleDistrictChange}
              disabled={disabled || !v.placeOfBirthPradeshId || districtsLoading}
            >
              <SelectTrigger className={inputClassName}>
                <SelectValue
                  placeholder={
                    !v.placeOfBirthPradeshId
                      ? 'Select pradesh first'
                      : districtsLoading
                        ? 'Loading...'
                        : 'Select district'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {(districts as NepalGeography[]).map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-3">
            <Label className={labelClassName}>Location (e.g. ward, area)</Label>
            <Input
              value={v.placeOfBirthLocation ?? ''}
              onChange={(e) => {
                const raw = e.target.value;
                update({ placeOfBirthLocation: raw === '' ? null : raw });
              }}
              placeholder="Ward, tole, or area"
              className={inputClassName}
              disabled={disabled}
            />
          </div>
        </>
      )}

      {v.placeOfBirthType === 'OUTSIDE_NEPAL' && (
        <div className="mt-3">
          <Label className={labelClassName}>Place (city / country)</Label>
          <Input
            value={v.placeOfBirth ?? ''}
            onChange={(e) => {
              const raw = e.target.value;
              update({ placeOfBirth: raw === '' ? null : raw });
            }}
            placeholder="City or country"
            className={inputClassName}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
