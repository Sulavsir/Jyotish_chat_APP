/**
 * OTP shared utilities
 * Matches backend OTP expiry (5 minutes).
 */

/** OTP validity in seconds (5 min), same as backend OTP_CONFIG.OTP_EXPIRY_MINUTES */
export const OTP_EXPIRY_SECONDS = 5 * 60;

/**
 * Format seconds as M:SS for OTP countdown display.
 */
export function formatOtpCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
