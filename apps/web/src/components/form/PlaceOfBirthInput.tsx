'use client';

import React, { useEffect, useRef } from 'react';
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
import type { PlaceOfBirthType } from '@jyotish/shared';

/** Parse "Province, District, Place" into parts (trimmed). */
function parsePlaceOfBirthString(value: string): string[] {
  return value.split(',').map((p) => p.trim()).filter(Boolean);
}

const PLACE_OF_BIRTH_TYPE_OPTIONS: { value: PlaceOfBirthType; label: string }[] = [
  { value: 'NEPAL', label: 'Nepal' },
  { value: 'OUTSIDE_NEPAL', label: 'Outside Nepal' },
];

export type PlaceOfBirthFieldName =
  | 'placeOfBirthType'
  | 'placeOfBirthPradeshId'
  | 'placeOfBirthDistrictId'
  | 'placeOfBirthLocation'
  | 'placeOfBirth';

export interface PlaceOfBirthInputProps {
  setValue: (name: PlaceOfBirthFieldName, value: unknown) => void;
  watch: (name: PlaceOfBirthFieldName) => unknown;
  errors: Record<string, { message?: string } | undefined>;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  disabled?: boolean;
}

export function PlaceOfBirthInput({
  setValue,
  watch,
  errors,
  className = '',
  labelClassName = 'text-gray-300',
  inputClassName = 'mt-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500',
  disabled = false,
}: PlaceOfBirthInputProps) {
  const placeOfBirthType = watch('placeOfBirthType') as PlaceOfBirthType | null | undefined;
  const placeOfBirthPradeshId = watch('placeOfBirthPradeshId') as string | null | undefined;
  const placeOfBirthDistrictId = watch('placeOfBirthDistrictId') as string | null | undefined;
  const placeOfBirthLocation = watch('placeOfBirthLocation') as string | undefined;
  const placeOfBirth = watch('placeOfBirth') as string | undefined;

  const isNepal = placeOfBirthType === 'NEPAL';
  const prevTypeRef = useRef<PlaceOfBirthType | null | undefined>(placeOfBirthType);

  const { data: provinces = [], isLoading: provincesLoading } = useProvincesQuery();
  const { data: districts = [], isLoading: districtsLoading } = useDistrictsByProvinceQuery(
    isNepal && placeOfBirthPradeshId ? placeOfBirthPradeshId : null
  );

  // When switching to Outside Nepal, clear Nepal-specific fields; when switching to Nepal, clear placeOfBirth only if user switched (not on initial load from API)
  useEffect(() => {
    if (placeOfBirthType === 'OUTSIDE_NEPAL') {
      setValue('placeOfBirthPradeshId', null);
      setValue('placeOfBirthDistrictId', null);
      setValue('placeOfBirthLocation', null);
    }
    if (placeOfBirthType === 'NEPAL' && prevTypeRef.current === 'OUTSIDE_NEPAL') {
      setValue('placeOfBirth', null);
    }
    prevTypeRef.current = placeOfBirthType;
  }, [placeOfBirthType, setValue]);

  // When province changes, clear district
  useEffect(() => {
    if (!placeOfBirthPradeshId) {
      setValue('placeOfBirthDistrictId', null);
    }
  }, [placeOfBirthPradeshId, setValue]);

  // Parse "Province, District, Place" from API and populate dropdowns when we have the string and type NEPAL
  useEffect(() => {
    if (placeOfBirthType !== 'NEPAL' || !placeOfBirth || typeof placeOfBirth !== 'string') return;
    const parts = parsePlaceOfBirthString(placeOfBirth);
    if (parts.length < 2 || provinces.length === 0) return;

    if (!placeOfBirthPradeshId) {
      const provinceName = parts[0];
      const province = provinces.find(
        (p) => p.nameEn.toLowerCase() === provinceName.toLowerCase()
      );
      if (province) setValue('placeOfBirthPradeshId', province.id);
      return;
    }

    if (placeOfBirthDistrictId || districts.length === 0) return;
    const districtName = parts[1];
    const location = parts.slice(2).join(', ').trim() || null;
    const district = districts.find(
      (d) => d.nameEn.toLowerCase() === districtName.toLowerCase()
    );
    if (district) {
      setValue('placeOfBirthDistrictId', district.id);
      setValue('placeOfBirthLocation', location);
      setValue('placeOfBirth', null); // clear so display comes from dropdowns only
    }
  }, [
    placeOfBirthType,
    placeOfBirth,
    placeOfBirthPradeshId,
    placeOfBirthDistrictId,
    provinces,
    districts,
    setValue,
  ]);

  return (
    <div className={className}>
      <Label className={labelClassName}>Place of birth</Label>

      <div className={`mt-1 flex gap-2 ${disabled ? 'pointer-events-none opacity-70' : ''}`}>
        {PLACE_OF_BIRTH_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => !disabled && setValue('placeOfBirthType', opt.value)}
            className={`rounded-md border px-3 py-2 text-sm transition-colors ${
              placeOfBirthType === opt.value
                ? 'border-purple-500 bg-purple-500/20 text-white'
                : 'border-white/20 bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {errors.placeOfBirthType && (
        <p className="text-xs text-red-400 mt-0.5">{errors.placeOfBirthType.message}</p>
      )}

      {isNepal && (
        <>
          <div className="mt-3">
            <Label htmlFor="place-of-birth-pradesh" className={labelClassName}>
              Pradesh
            </Label>
            <Select
              value={placeOfBirthPradeshId ?? ''}
              onValueChange={(v) => setValue('placeOfBirthPradeshId', v || null)}
              disabled={disabled}
            >
              <SelectTrigger id="place-of-birth-pradesh" className={inputClassName}>
                <SelectValue placeholder={provincesLoading ? 'Loading...' : 'Select pradesh'} />
              </SelectTrigger>
              <SelectContent>
                {provinces.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.placeOfBirthPradeshId && (
              <p className="text-xs text-red-400 mt-0.5">
                {errors.placeOfBirthPradeshId.message}
              </p>
            )}
          </div>
          <div className="mt-3">
            <Label htmlFor="place-of-birth-district" className={labelClassName}>
              District
            </Label>
            <Select
              value={placeOfBirthDistrictId ?? ''}
              onValueChange={(v) => setValue('placeOfBirthDistrictId', v || null)}
              disabled={disabled || !placeOfBirthPradeshId || districtsLoading}
            >
              <SelectTrigger id="place-of-birth-district" className={inputClassName}>
                <SelectValue
                  placeholder={
                    !placeOfBirthPradeshId
                      ? 'Select pradesh first'
                      : districtsLoading
                        ? 'Loading...'
                        : 'Select district'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {districts.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.placeOfBirthDistrictId && (
              <p className="text-xs text-red-400 mt-0.5">
                {errors.placeOfBirthDistrictId.message}
              </p>
            )}
          </div>
          <div className="mt-3">
            <Label htmlFor="place-of-birth-location" className={labelClassName}>
              Location (e.g. ward, area)
            </Label>
            <Input
              id="place-of-birth-location"
              value={placeOfBirthLocation ?? ''}
              onChange={(e) => setValue('placeOfBirthLocation', e.target.value.trim() || null)}
              placeholder="Ward, tole, or area"
              className={inputClassName}
              disabled={disabled}
            />
            {errors.placeOfBirthLocation && (
              <p className="text-xs text-red-400 mt-0.5">{errors.placeOfBirthLocation.message}</p>
            )}
          </div>
        </>
      )}

      {placeOfBirthType === 'OUTSIDE_NEPAL' && (
        <div className="mt-3">
          <Label htmlFor="place-of-birth-outside" className={labelClassName}>
            Place (city / country)
          </Label>
          <Input
            id="place-of-birth-outside"
            value={placeOfBirth ?? ''}
            onChange={(e) => setValue('placeOfBirth', e.target.value.trim() || null)}
            placeholder="City or country"
            className={inputClassName}
            disabled={disabled}
          />
          {errors.placeOfBirth && (
            <p className="text-xs text-red-400 mt-0.5">{errors.placeOfBirth.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
