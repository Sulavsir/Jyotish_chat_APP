/**
 * Shared table and pagination for Jyotish pages (earnings, appointments, slots).
 * Uses @jyotish/ui Table and Pagination with consistent borders and styling.
 */

'use client';

import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
  PaginationEllipsis,
} from '@jyotish/ui';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const paginationControlClass =
  'border border-white/20 text-white/90 hover:bg-white/10 disabled:opacity-50';

/**
 * 0-based page indices with ellipsis.
 * For many pages: first two, last two, and exactly one page before + current + one after
 * (e.g. on page 4 you see … 3, 4, 5 … plus ends; only one neighbor “in front” of current).
 */
function buildPageItems(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 0) return [];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }
  const set = new Set<number>();
  set.add(0);
  set.add(1);
  set.add(totalPages - 2);
  set.add(totalPages - 1);
  for (let d = -1; d <= 1; d++) {
    const p = currentPage + d;
    if (p >= 0 && p < totalPages) set.add(p);
  }
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | 'ellipsis')[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push('ellipsis');
    out.push(sorted[i]);
  }
  return out;
}

const tableBorderClass = 'border border-white/10';
const headerCellClass = 'h-11 px-4 text-left align-middle font-medium text-white/80 border-b border-r border-white/10 last:border-r-0';
const bodyCellClass = 'px-4 py-3 align-middle text-white/90 border-b border-r border-white/10 last:border-r-0';

export const JyotishTable = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <Table
    ref={ref}
    className={cn('w-full text-sm border-collapse', tableBorderClass, className)}
    {...props}
  />
));
JyotishTable.displayName = 'JyotishTable';

export const JyotishTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <TableHeader ref={ref} className={cn('bg-white/5', className)} {...props} />
));
JyotishTableHeader.displayName = 'JyotishTableHeader';

export const JyotishTableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <TableBody ref={ref} className={cn('', className)} {...props} />
));
JyotishTableBody.displayName = 'JyotishTableBody';

export const JyotishTableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <TableRow
    ref={ref}
    className={cn('border-b border-white/10 transition-colors hover:bg-white/5', className)}
    {...props}
  />
));
JyotishTableRow.displayName = 'JyotishTableRow';

export const JyotishTableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <TableHead ref={ref} className={cn(headerCellClass, className)} {...props} />
));
JyotishTableHead.displayName = 'JyotishTableHead';

export const JyotishTableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <TableCell ref={ref} className={cn(bodyCellClass, className)} {...props} />
));
JyotishTableCell.displayName = 'JyotishTableCell';

export interface JyotishDataTableColumn<T> {
  id: string;
  header: React.ReactNode;
  /** row = data row, index = 0-based index in current page/data array (for S.N. etc.) */
  cell: (row: T, index?: number) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

export interface JyotishDataTableProps<T> {
  columns: JyotishDataTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
}

export function JyotishDataTable<T>({
  columns,
  data,
  getRowId,
}: JyotishDataTableProps<T>) {
  return (
    <JyotishTable>
      <JyotishTableHeader>
        <JyotishTableRow>
          {columns.map((col) => (
            <JyotishTableHead key={col.id} className={col.headerClassName}>
              {col.header}
            </JyotishTableHead>
          ))}
        </JyotishTableRow>
      </JyotishTableHeader>
      <JyotishTableBody>
        {data.map((row, index) => (
          <JyotishTableRow key={getRowId(row)}>
            {columns.map((col) => (
              <JyotishTableCell key={col.id} className={col.cellClassName}>
                {col.cell(row, index)}
              </JyotishTableCell>
            ))}
          </JyotishTableRow>
        ))}
      </JyotishTableBody>
    </JyotishTable>
  );
}

export interface JyotishPaginationProps {
  page: number; // 0-based
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  /** Total rows across all pages (for “Showing a–b of c”). */
  totalItems?: number;
  /** Current page size (rows per page). */
  pageSize?: number;
  /** When set with `onPageSizeChange`, shows a rows-per-page control. */
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
}

export function JyotishPagination({
  page,
  totalPages,
  onPageChange,
  className,
  totalItems,
  pageSize,
  pageSizeOptions = [10, 20, 50, 100],
  onPageSizeChange,
}: JyotishPaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const hasPrev = page > 0;
  const hasNext = page < safeTotalPages - 1;
  const pageItems = safeTotalPages > 1 ? buildPageItems(page, safeTotalPages) : [];

  const showingFrom =
    totalItems != null && pageSize != null && totalItems > 0 ? page * pageSize + 1 : null;
  const showingTo =
    totalItems != null && pageSize != null && totalItems > 0
      ? Math.min((page + 1) * pageSize, totalItems)
      : null;

  return (
    <Pagination className={cn('mt-4 pt-4 border-t border-white/10', className)}>
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm text-white/60">
          {onPageSizeChange != null && pageSize != null && (
            <label className="inline-flex items-center gap-2">
              <span className="whitespace-nowrap">Rows per page</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="rounded-lg border border-white/20 bg-black/50 px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 [color-scheme:dark]"
              >
                {pageSizeOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          )}
          <span className="whitespace-nowrap">
            Page {page + 1} of {safeTotalPages}
            {showingFrom != null && showingTo != null && (
              <span className="text-white/50">
                {' '}
                · Showing {showingFrom}–{showingTo}
                {totalItems != null ? ` of ${totalItems}` : ''}
              </span>
            )}
          </span>
        </div>

        {safeTotalPages > 1 && (
          <PaginationContent className="flex w-full flex-wrap items-center justify-center gap-1 sm:w-auto sm:justify-end">
            <PaginationItem>
              <PaginationLink
                type="button"
                aria-label="First page"
                onClick={() => onPageChange(0)}
                disabled={!hasPrev}
                className={cn('h-9 w-9 px-0', paginationControlClass)}
              >
                <ChevronsLeft className="mx-auto h-4 w-4" />
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(Math.max(0, page - 1))}
                disabled={!hasPrev}
                className={paginationControlClass}
              />
            </PaginationItem>
            {pageItems.map((item, idx) =>
              item === 'ellipsis' ? (
                <PaginationItem key={`e-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    type="button"
                    aria-label={`Page ${item + 1}`}
                    isActive={item === page}
                    onClick={() => onPageChange(item)}
                    className={cn('h-9 min-w-[2.25rem]', paginationControlClass)}
                  >
                    {item + 1}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext
                onClick={() => onPageChange(Math.min(safeTotalPages - 1, page + 1))}
                disabled={!hasNext}
                className={paginationControlClass}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink
                type="button"
                aria-label="Last page"
                onClick={() => onPageChange(safeTotalPages - 1)}
                disabled={!hasNext}
                className={cn('h-9 w-9 px-0', paginationControlClass)}
              >
                <ChevronsRight className="mx-auto h-4 w-4" />
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        )}
      </div>
    </Pagination>
  );
}
