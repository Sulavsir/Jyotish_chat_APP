'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants';
import { locationService } from '@/services/location.service';

export function useProvincesQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUERY_KEYS.LOCATION.PROVINCES,
    queryFn: () => locationService.getProvinces(),
    staleTime: 1000 * 60 * 60,
    enabled: options?.enabled ?? true,
  });
}

export function useDistrictsByProvinceQuery(
  provinceId: string | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: QUERY_KEYS.LOCATION.DISTRICTS(provinceId ?? ''),
    queryFn: () => locationService.getDistricts(provinceId!),
    enabled: !!provinceId && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 60,
  });
}
