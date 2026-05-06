import { AstrologerCategory } from '@jyotish/shared';
import type { AstrologerListParams } from '@/types/astrologer';

/** Stable filters for Katha Vachak astrologer picker query key + fetch. */
export const KATHA_VACHAK_BOOKING_ASTROLOGER_LIST_FILTERS: AstrologerListParams = {
  search: '',
  category: AstrologerCategory.KATHA_VACHAK,
  limit: 50,
  sortBy: 'rating',
  sortOrder: 'desc',
};
