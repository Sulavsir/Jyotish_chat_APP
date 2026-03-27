/**
 * Detects file attachment metadata on client↔astrologer chat messages (socket + REST).
 */
export function hasChatFileMetadata(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== 'object' || metadata === null) return false;
  const fileUrl = (metadata as Record<string, unknown>).fileUrl;
  return typeof fileUrl === 'string' && fileUrl.trim().length > 0;
}
