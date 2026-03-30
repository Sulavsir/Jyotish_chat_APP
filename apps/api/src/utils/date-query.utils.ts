/**
 * Parse date-only query params (YYYY-MM-DD) as inclusive UTC day bounds.
 * Fixes filters like from=2026-03-30&to=2026-03-30 returning empty rows:
 * `new Date('2026-03-30')` is midnight UTC for both ends, so almost no rows match lte.
 */

export function parseEarningsDateQueryParam(
  val: string | undefined,
  boundary: 'start' | 'end'
): Date | undefined {
  if (val == null) return undefined;
  const trimmed = String(val).trim();
  if (!trimmed) return undefined;

  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (ymd) {
    const y = Number(ymd[1]);
    const mo = Number(ymd[2]) - 1;
    const d = Number(ymd[3]);
    return boundary === 'start'
      ? new Date(Date.UTC(y, mo, d, 0, 0, 0, 0))
      : new Date(Date.UTC(y, mo, d, 23, 59, 59, 999));
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}
