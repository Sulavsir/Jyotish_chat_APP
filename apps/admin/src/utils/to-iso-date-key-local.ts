/**
 * Normalize to English calendar `YYYY-MM-DD` for nepali-date bulk lookup (local date components).
 */
export function toIsoDateKeyLocal(input: string | Date | null | undefined): string {
  if (input == null) return '';
  if (typeof input === 'string') {
    const t = input.trim();
    if (!t) return '';
    const head = t.includes('T') ? t.slice(0, 10) : t.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(head)) return head;
    const d = new Date(t);
    if (Number.isNaN(d.getTime())) return '';
    return formatLocalYmd(d);
  }
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return '';
    return formatLocalYmd(input);
  }
  return '';
}

function formatLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
