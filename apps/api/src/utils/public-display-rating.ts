export function toPublicDisplayRating(rating: number | null | undefined): number {
  if (rating == null || Number.isNaN(Number(rating))) {
    return 4.0;
  }
  const r = Number(rating);
  if (r <= 0) {
    return 4.0;
  }
  if (r < 2) {
    return 3.0;
  }
  if (r < 3) {
    return 3.3;
  }
  return Math.min(5, Math.round(r * 10) / 10);
}
