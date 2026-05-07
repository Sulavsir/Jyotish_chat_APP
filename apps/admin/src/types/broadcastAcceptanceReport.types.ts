/**
 * Admin: astrologer chat acceptance report (broadcast + direct / instant)
 */

import type { AstrologerChatAcceptanceReportSortBy } from '@jyotish/shared';

export type {
  AstrologerChatAcceptanceReportSortBy,
  AstrologerChatAcceptanceReportSortOption,
} from '@jyotish/shared';
export { ASTROLOGER_CHAT_ACCEPTANCE_REPORT_SORT_OPTIONS } from '@jyotish/shared';

export type AstrologerChatAcceptanceReportRow = {
  astrologerId: string;
  name: string;
  email: string | null;
  phone: string;
  category: string;
  /** Standard broadcast accepts (excludes first-broadcast promo tier). */
  broadcastAcceptedCount: number;
  /** First-broadcast promo accepts (`isFirstBroadcastDiscount`); not included in broadcast count. */
  firstBroadcastAcceptedCount: number;
  directChatAcceptedCount: number;
};

export type AstrologerChatAcceptanceReportListResponse = {
  rows: AstrologerChatAcceptanceReportRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  periodTotals: {
    broadcastAccepted: number;
    firstBroadcastAccepted: number;
    directChatAccepted: number;
  };
};

export type ListAstrologerChatAcceptanceReportParams = {
  page: number;
  limit: number;
  from?: string;
  to?: string;
  search?: string;
  sortBy: AstrologerChatAcceptanceReportSortBy;
  sortOrder: 'asc' | 'desc';
};
