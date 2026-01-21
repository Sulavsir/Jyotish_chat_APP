/**
 * Helper Utility Functions
 */

import { API_BASE_URL, ACTION_COLORS, STATUS_COLORS } from '@/constants';

/**
 * Get full image URL from relative or absolute path
 */
export function getImageUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url}`;
}

/**
 * Format action string (replace underscores with spaces)
 */
export function formatAction(action: string): string {
  return action.replace(/_/g, ' ');
}

/**
 * Get color class for action type
 */
export function getActionColor(action: string): string {
  const upperAction = action.toUpperCase();
  
  if (upperAction.includes('CREATE') || upperAction.includes('REGISTER')) {
    return ACTION_COLORS.CREATE;
  }
  if (upperAction.includes('UPDATE')) {
    return ACTION_COLORS.UPDATE;
  }
  if (upperAction.includes('DELETE')) {
    return ACTION_COLORS.DELETE;
  }
  if (upperAction.includes('LOGIN')) {
    return ACTION_COLORS.LOGIN;
  }
  if (upperAction.includes('LOGOUT')) {
    return ACTION_COLORS.LOGOUT;
  }
  if (upperAction.includes('REQUEST')) {
    return ACTION_COLORS.REQUEST;
  }
  if (upperAction.includes('ACCEPT')) {
    return ACTION_COLORS.ACCEPT;
  }
  if (upperAction.includes('EXPIRE') || upperAction.includes('CANCEL')) {
    return ACTION_COLORS.EXPIRE;
  }
  
  return ACTION_COLORS.DEFAULT;
}

/**
 * Get color class for status
 */
export function getStatusColor(status: string): string {
  const upperStatus = status.toUpperCase();
  
  if (upperStatus === 'PENDING') return STATUS_COLORS.PENDING;
  if (upperStatus === 'ACCEPTED') return STATUS_COLORS.ACCEPTED;
  if (upperStatus === 'EXPIRED') return STATUS_COLORS.EXPIRED;
  if (upperStatus === 'ACTIVE') return STATUS_COLORS.ACTIVE;
  if (upperStatus === 'COMPLETED') return STATUS_COLORS.COMPLETED;
  if (upperStatus === 'CANCELLED') return STATUS_COLORS.CANCELLED;
  
  return ACTION_COLORS.DEFAULT;
}

/**
 * Get initials from name or phone
 */
export function getInitials(name?: string | null, phone?: string | null, fallback = 'U'): string {
  if (name) {
    return name.charAt(0).toUpperCase();
  }
  if (phone) {
    return phone.charAt(0);
  }
  return fallback;
}

/**
 * Generate page numbers for pagination
 */
export function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisiblePages: number = 5
): (number | 'ellipsis-start' | 'ellipsis-end')[] {
  const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];

  if (totalPages <= maxVisiblePages) {
    // Show all pages if total is less than max
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);

    if (currentPage > 3) {
      pages.push('ellipsis-start');
    }

    // Show pages around current page
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis-end');
    }

    // Always show last page
    pages.push(totalPages);
  }

  return pages;
}

/**
 * Format date to locale string
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleString();
}

function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  const mod10 = n % 10;
  if (mod10 === 1) return `${n}st`;
  if (mod10 === 2) return `${n}nd`;
  if (mod10 === 3) return `${n}rd`;
  return `${n}th`;
}

/**
 * Format date like "4th December, 2026"
 */
export function formatAdminDate(date: string | Date): string {
  const d = new Date(date);
  const day = d.getDate();
  const month = d.toLocaleString('en-US', { month: 'long' });
  const year = d.getFullYear();
  return `${ordinal(day)} ${month}, ${year}`;
}

/**
 * Format date-time like "4th December, 2026, 2:38 PM"
 */
export function formatAdminDateTime(date: string | Date): string {
  const d = new Date(date);
  const datePart = formatAdminDate(d);
  const timePart = d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${datePart}, ${timePart}`;
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength)}...`;
}

