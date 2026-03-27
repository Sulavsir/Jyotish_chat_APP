'use client';

import { useState } from 'react';
import { useDebounce } from './useDebounce';
import { PAGINATION_DEFAULTS, ADMIN_PAGE_SIZE_DEBOUNCE_MS } from '@/constants';

/**
 * Immediate page size for the rows-per-page control + debounced value for query keys / API params
 * so rapid changes only produce one backend request after the user settles.
 */
export function useDebouncedPageSize(initial: number = PAGINATION_DEFAULTS.LIMIT) {
  const [pageSize, setPageSize] = useState(initial);
  const debouncedPageSize = useDebounce(pageSize, ADMIN_PAGE_SIZE_DEBOUNCE_MS);
  return { pageSize, setPageSize, debouncedPageSize };
}
