import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { nepaliDateService } from '@/services/nepali-date.service';
import { toIsoDateKeyLocal } from '@/utils/to-iso-date-key-local';

/**
 * One batched Nepali BS lookup for table rows (unique English `YYYY-MM-DD` keys).
 */
export function useNepaliDateBulkMap(values: (string | Date | null | undefined)[]) {
  const keys = useMemo(() => {
    const s = new Set<string>();
    for (const v of values) {
      const k = toIsoDateKeyLocal(v);
      if (k) s.add(k);
    }
    return [...s].sort();
  }, [values]);

  return useQuery({
    queryKey: ['admin', 'nepali-date-bulk', keys.join('|')],
    queryFn: () => nepaliDateService.convertBulk(keys),
    enabled: keys.length > 0,
    staleTime: 120_000,
  });
}
