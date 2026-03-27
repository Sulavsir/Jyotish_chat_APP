'use client';

import * as React from 'react';
import { cn } from './utils';

export interface AdminPaginationBarProps {
  className?: string;
  /** Inclusive start index (1-based display, e.g. 1) */
  showingFrom: number;
  /** Inclusive end index */
  showingTo: number;
  totalItems: number;
  pageSize: number;
  pageSizeOptions: readonly number[];
  onPageSizeChange: (size: number) => void;
  /** Shown before the rows select (default: "Rows per page") */
  rowsPerPageLabel?: string;
  disabled?: boolean;
  /** Page numbers + prev/next — pass the same markup as `Pagination` + `PaginationContent` children */
  pagination: React.ReactNode;
}

/**
 * Admin list footer: rows-per-page control + "Showing X–Y of Z" + pagination controls.
 * Keeps page size with the pager instead of a separate toolbar button.
 */
export function AdminPaginationBar({
  className,
  showingFrom,
  showingTo,
  totalItems,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  rowsPerPageLabel = 'Rows per page',
  disabled,
  pagination,
}: AdminPaginationBarProps) {
  return (
    <div
      className={cn(
        'flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4',
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-slate-200 sm:justify-start">
        <label className="flex items-center gap-2 text-slate-400">
          <span className="whitespace-nowrap">{rowsPerPageLabel}</span>
          <select
            value={pageSize}
            disabled={disabled}
            onChange={(e) => onPageSizeChange(Number(e.target.value) || pageSize)}
            className="min-h-9 rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <span className="text-center text-white sm:text-left">
          Showing{' '}
          <span className="font-medium text-purple-400">{showingFrom}</span>
          {' – '}
          <span className="font-medium text-purple-400">{showingTo}</span>
          {' of '}
          <span className="font-medium text-purple-400">{totalItems}</span>
        </span>
      </div>
      <div className="flex w-full min-w-0 justify-center overflow-x-auto sm:justify-end">
        {pagination}
      </div>
    </div>
  );
}
