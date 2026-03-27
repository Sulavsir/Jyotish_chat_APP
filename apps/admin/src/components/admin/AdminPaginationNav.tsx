'use client';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@jyotish/ui';
import { generatePageNumbers } from '@/utils/helpers';
import { PAGINATION_DEFAULTS } from '@/constants';

export interface AdminPaginationNavProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
  /** Extra classes on the root Pagination (default: scroll + full width) */
  className?: string;
}

/**
 * Page number links + prev/next with shared responsive styling for all admin tables.
 */
export function AdminPaginationNav({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = PAGINATION_DEFAULTS.MAX_VISIBLE_PAGES,
  className = 'w-full overflow-x-auto',
}: AdminPaginationNavProps) {
  const isEmpty = totalPages < 1;
  const effectiveTotalPages = isEmpty ? 1 : totalPages;
  const pageForNav = isEmpty ? 1 : currentPage;

  const pageNumbers = generatePageNumbers(
    pageForNav,
    effectiveTotalPages,
    maxVisiblePages
  );

  return (
    <Pagination className={className}>
      <PaginationContent className="flex-wrap justify-center gap-1 sm:justify-end">
        <PaginationItem>
          <PaginationPrevious
            onClick={() =>
              !isEmpty && onPageChange(Math.max(1, currentPage - 1))
            }
            disabled={isEmpty || currentPage === 1}
          />
        </PaginationItem>

        {pageNumbers.map((page, index) => (
          <PaginationItem key={index}>
            {typeof page === 'number' ? (
              <PaginationLink
                onClick={() => !isEmpty && onPageChange(page)}
                isActive={pageForNav === page}
              >
                {page}
              </PaginationLink>
            ) : (
              <PaginationEllipsis />
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            onClick={() =>
              !isEmpty && onPageChange(Math.min(effectiveTotalPages, currentPage + 1))
            }
            disabled={isEmpty || currentPage === effectiveTotalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
