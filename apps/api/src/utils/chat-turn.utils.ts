/**
 * Turn-based chat: auto / template astrologer messages must not unlock the client.
 */
export function isAstrologerAutoWelcomeMetadata(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== 'object') return false;
  const m = metadata as Record<string, unknown>;
  return m.broadcastAcceptance === true || m.autoReply === true;
}
