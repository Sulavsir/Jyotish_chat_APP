/**
 * Coins credited to astrologer from a client deduction, using a commission %.
 */
export function astrologerCoinsFromClientDeduction(
  clientCoinsDeducted: number,
  commissionPercent: number
): number {
  if (clientCoinsDeducted <= 0 || commissionPercent <= 0) {
    return 0;
  }
  return Math.floor((clientCoinsDeducted * commissionPercent) / 100);
}
