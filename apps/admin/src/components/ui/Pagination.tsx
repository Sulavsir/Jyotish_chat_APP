/**
 * Pagination Component
 * Modern, accessible pagination with page numbers
 */

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = '',
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const pages: (number | string)[] = [];
    
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || // Always show first page
        i === totalPages || // Always show last page
        (i >= currentPage - delta && i <= currentPage + delta) // Show pages near current
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    
    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex items-center justify-between border-t border-slate-700/50 bg-slate-900/50 px-6 py-4 ${className}`}>
      {/* Showing info */}
      <div className="flex-1 text-sm text-slate-400">
        Showing <span className="font-medium text-white">{startItem}</span> to{' '}
        <span className="font-medium text-white">{endItem}</span> of{' '}
        <span className="font-medium text-white">{totalItems}</span> results
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`
            inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg
            transition-all duration-200
            ${
              currentPage === 1
                ? 'text-slate-500 cursor-not-allowed bg-slate-800/50'
                : 'text-white bg-slate-800 hover:bg-slate-700 hover:scale-105'
            }
          `}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Page numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-3 py-2 text-slate-500">
                  ...
                </span>
              );
            }

            const pageNumber = page as number;
            const isActive = pageNumber === currentPage;

            return (
              <button
                key={pageNumber}
                onClick={() => onPageChange(pageNumber)}
                className={`
                  px-3 py-2 text-sm font-medium rounded-lg
                  transition-all duration-200
                  ${
                    isActive
                      ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-500/50'
                      : 'text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white hover:scale-105'
                  }
                `}
                aria-label={`Go to page ${pageNumber}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>

        {/* Mobile page indicator */}
        <div className="sm:hidden text-sm text-slate-400">
          Page <span className="font-medium text-white">{currentPage}</span> of{' '}
          <span className="font-medium text-white">{totalPages}</span>
        </div>

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`
            inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg
            transition-all duration-200
            ${
              currentPage === totalPages
                ? 'text-slate-500 cursor-not-allowed bg-slate-800/50'
                : 'text-white bg-slate-800 hover:bg-slate-700 hover:scale-105'
            }
          `}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

