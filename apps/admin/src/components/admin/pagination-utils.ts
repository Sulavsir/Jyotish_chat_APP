/**
 * Shared helpers for admin list pagination (server- or client-side).
 */

export type AdminPaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/** Inclusive 1-based range for “Showing X to Y of Z”. */
export function getPaginationShowingRange(p: {
  page: number;
  limit: number;
  total: number;
}): { from: number; to: number } {
  if (p.total <= 0) {
    return { from: 0, to: 0 };
  }
  return {
    from: (p.page - 1) * p.limit + 1,
    to: Math.min(p.page * p.limit, p.total),
  };
}
