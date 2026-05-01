/**
 * Admin: astrologer chat acceptance report (broadcast + direct / instant)
 */

export type AstrologerChatAcceptanceReportRow = {
  astrologerId: string;
  name: string;
  email: string | null;
  phone: string;
  category: string;
  broadcastAcceptedCount: number;
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
    directChatAccepted: number;
  };
};

export type ListAstrologerChatAcceptanceReportParams = {
  page: number;
  limit: number;
  from?: string;
  to?: string;
  search?: string;
  sortBy:
    | 'broadcastAcceptedCount'
    | 'directChatAcceptedCount'
    | 'totalAcceptances'
    | 'name';
  sortOrder: 'asc' | 'desc';
};
