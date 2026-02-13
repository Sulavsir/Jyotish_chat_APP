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
} from '@jyotish/ui';
import { cn } from '@/lib/utils';

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
}

export function JyotishPagination({
  page,
  totalPages,
  onPageChange,
  className,
}: JyotishPaginationProps) {
  const hasPrev = page > 0;
  const hasNext = page < totalPages - 1;
  return (
    <Pagination className={cn('mt-4 pt-4 border-t border-white/10', className)}>
      <PaginationContent className="flex flex-wrap items-center justify-between w-full gap-2">
        <span className="text-sm text-white/60">
          Page {page + 1} of {Math.max(1, totalPages)}
        </span>
        <div className="flex items-center gap-1">
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(Math.max(0, page - 1))}
              disabled={!hasPrev}
              className="border border-white/20 text-white/90 hover:bg-white/10 disabled:opacity-50"
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
              disabled={!hasNext}
              className="border border-white/20 text-white/90 hover:bg-white/10 disabled:opacity-50"
            />
          </PaginationItem>
        </div>
      </PaginationContent>
    </Pagination>
  );
}
