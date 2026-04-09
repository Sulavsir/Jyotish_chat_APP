/**
 * AdminTable Component - Reusable table component for admin pages
 * Features: Indigo header, vertical separators, optional S.N. column.
 * Pagination lives outside the table — use {@link AdminListPaginationSection} below the card.
 */

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
  EmptyState,
} from '@jyotish/ui';

export interface AdminTableColumn<T> {
  header: string;
  accessor: (item: T, index: number) => React.ReactNode;
  className?: string;
  width?: string;
}

export interface AdminTableProps<T> {
  data: T[];
  columns: AdminTableColumn<T>[];
  loading?: boolean;
  emptyState?: {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  keyExtractor: (item: T, index: number) => string;
  showSerialNumber?: boolean;
  /** Used with {@link itemsPerPage} for correct S.N. when data is a page slice (default page 1, size 10). */
  currentPage?: number;
  itemsPerPage?: number;
  onRowClick?: (item: T) => void;
}

export function AdminTable<T>({
  data,
  columns,
  loading = false,
  emptyState,
  keyExtractor,
  showSerialNumber = true,
  currentPage = 1,
  itemsPerPage = 10,
  onRowClick,
}: AdminTableProps<T>) {
  const colCount = columns.length + (showSerialNumber ? 1 : 0);

  if (loading) {
    return <TableSkeleton rows={5} columns={colCount} />;
  }

  const getSerialNumber = (index: number) => {
    return (currentPage - 1) * itemsPerPage + index + 1;
  };

  const tableHeader = (
    <TableHeader>
      <TableRow>
        {showSerialNumber && (
          <TableHead className="border-r border-slate-700 bg-indigo-900 w-16 shrink-0">S.N.</TableHead>
        )}
        {columns.map((column, index) => (
          <TableHead
            key={index}
            className={`border-r border-slate-700 bg-indigo-900 whitespace-nowrap ${column.className || ''} ${
              index === columns.length - 1 ? 'border-r-0' : ''
            }`}
            style={column.width ? { width: column.width } : undefined}
          >
            {column.header}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );

  if (data.length === 0 && emptyState) {
    return (
      <div className="w-full max-w-full min-w-0">
        <div className="overflow-x-auto w-full">
          <Table className="w-max min-w-full">
            {tableHeader}
            <TableBody>
              <TableRow>
                <TableCell colSpan={colCount} className="border-0 p-0 align-top">
                  <EmptyState
                    icon={emptyState.icon}
                    title={emptyState.title}
                    description={emptyState.description}
                    action={emptyState.action}
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full min-w-0">
      <div className="overflow-x-auto w-full">
        <Table className="w-max min-w-full">
          {tableHeader}
          <TableBody>
            {data.map((item, index) => (
              <TableRow
                key={keyExtractor(item, index)}
                onClick={() => onRowClick?.(item)}
                className={onRowClick ? 'cursor-pointer hover:bg-slate-800/50 transition-colors' : ''}
              >
                {showSerialNumber && (
                  <TableCell className="border-r border-slate-700/50 text-slate-400 font-medium shrink-0">
                    {getSerialNumber(index)}
                  </TableCell>
                )}
                {columns.map((column, colIndex) => (
                  <TableCell
                    key={colIndex}
                    className={`border-r border-slate-700/50 whitespace-nowrap ${column.className || ''} ${
                      colIndex === columns.length - 1 ? 'border-r-0' : ''
                    }`}
                    style={column.width ? { width: column.width } : undefined}
                  >
                    {column.accessor(item, index)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
