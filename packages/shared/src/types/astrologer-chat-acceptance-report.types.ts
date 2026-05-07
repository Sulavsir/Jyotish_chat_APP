/**
 * Admin astrologer chat acceptance report (broadcast + direct) — shared sort keys for API + admin UI.
 */

export type AstrologerChatAcceptanceReportSortBy =
  | 'broadcastAcceptedCount'
  | 'firstBroadcastAcceptedCount'
  | 'directChatAcceptedCount'
  | 'totalAcceptances'
  | 'name';

export type AstrologerChatAcceptanceReportSortOption = {
  value: AstrologerChatAcceptanceReportSortBy;
  label: string;
};

export const ASTROLOGER_CHAT_ACCEPTANCE_REPORT_SORT_OPTIONS: AstrologerChatAcceptanceReportSortOption[] =
  [
    { value: 'totalAcceptances', label: 'Total acceptances' },
    { value: 'broadcastAcceptedCount', label: 'Broadcast count' },
    { value: 'firstBroadcastAcceptedCount', label: 'First broadcast count' },
    { value: 'directChatAcceptedCount', label: 'Direct chat count' },
    { value: 'name', label: 'Name' },
  ];
