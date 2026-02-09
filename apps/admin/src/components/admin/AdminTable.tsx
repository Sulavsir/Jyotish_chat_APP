/**
 * AdminTable Component - Reusable table component for admin pages
 * Features: Indigo header, vertical separators, automatic S.N. column, pagination
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
import { Pagination } from '../ui/Pagination';

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
  currentPage?: number;
  itemsPerPage?: number;
  totalItems?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
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
  totalItems,
  totalPages,
  onPageChange,
  onRowClick,
}: AdminTableProps<T>) {
  if (loading) {
    return <TableSkeleton rows={5} columns={columns.length + (showSerialNumber ? 1 : 0)} />;
  }

  if (data.length === 0 && emptyState) {
    return (
      <EmptyState
        icon={emptyState.icon}
        title={emptyState.title}
        description={emptyState.description}
        action={emptyState.action}
      />
    );
  }

  const getSerialNumber = (index: number) => {
    return (currentPage - 1) * itemsPerPage + index + 1;
  };

  return (
    <div className="w-full max-w-full min-w-0">
      <div className="overflow-x-auto w-full">
        <Table className="w-max min-w-full">
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

      {/* Pagination */}
      {onPageChange && totalItems && totalPages && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
