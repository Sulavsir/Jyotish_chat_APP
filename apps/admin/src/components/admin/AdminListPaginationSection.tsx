'use client';

import { AdminPaginationBar } from '@jyotish/ui';
import { AdminPaginationNav } from './AdminPaginationNav';
import { getPaginationShowingRange } from './pagination-utils';
import type { AdminPaginationMeta } from './pagination-utils';
import { PAGINATION_DEFAULTS } from '@/constants';

export interface AdminListPaginationSectionProps {
  pagination: AdminPaginationMeta;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
  disabled?: boolean;
  className?: string;
  /** When all set, shows rows-per-page using {@link AdminPaginationBar} from UI */
  pageSize?: number;
  pageSizeOptions?: readonly number[];
  onPageSizeChange?: (size: number) => void;
  rowsPerPageLabel?: string;
  /** Label after counts (default: “entries”) */
  countNoun?: string;
}

/**
 * Shared footer for admin lists: “Showing X–Y of Z” + {@link AdminPaginationNav},
 * optionally rows-per-page (same layout as Payment History / Users).
 */
export function AdminListPaginationSection({
  pagination,
  onPageChange,
  maxVisiblePages = PAGINATION_DEFAULTS.MAX_VISIBLE_PAGES,
  disabled,
  className,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  rowsPerPageLabel = 'Rows per page',
  countNoun = 'entries',
}: AdminListPaginationSectionProps) {
  const { from, to } = getPaginationShowingRange({
    page: pagination.page,
    limit: pagination.limit,
    total: pagination.total,
  });

  const nav = (
    <AdminPaginationNav
      currentPage={pagination.page}
      totalPages={pagination.totalPages}
      onPageChange={onPageChange}
      maxVisiblePages={maxVisiblePages}
    />
  );

  const hasPageSize =
    pageSize != null && pageSizeOptions != null && pageSizeOptions.length > 0 && onPageSizeChange != null;

  if (hasPageSize) {
    return (
      <div className={`rounded-xl p-4 ${className ?? ''}`}>
        <AdminPaginationBar
          showingFrom={from}
          showingTo={to}
          totalItems={pagination.total}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          onPageSizeChange={onPageSizeChange}
          rowsPerPageLabel={rowsPerPageLabel}
          disabled={disabled}
          pagination={nav}
        />
      </div>
    );
  }

  return (
    <div className={`rounded-xl p-4 ${className ?? ''}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="text-sm text-white font-medium text-center sm:text-left">
          Showing{' '}
          <span className="text-purple-400">{from}</span> to{' '}
          <span className="text-purple-400">{to}</span> of{' '}
          <span className="text-purple-400">{pagination.total}</span> {countNoun}
        </div>
        {nav}
      </div>
    </div>
  );
}
