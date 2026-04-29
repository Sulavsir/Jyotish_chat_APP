/**
 * Detects when a chat message body is only a hosted image URL/path (common when mobile
 * clients paste the upload URL as message text instead of sending IMAGE + metadata.fileUrl).
 */

const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|bmp|svg)(\?[^#]*)?(#.*)?$/i;

/** Server-relative chat image uploads (see API static /uploads/chat/images/). */
const CHAT_IMAGES_SEGMENT = '/uploads/chat/images/';

function lineLooksLikeImageUrl(line: string): boolean {
  const s = line.trim();
  if (!s) return false;
  if (!s.startsWith('http://') && !s.startsWith('https://') && !s.startsWith('/')) {
    return false;
  }
  if (s.includes(CHAT_IMAGES_SEGMENT)) return true;
  return IMAGE_EXT_RE.test(s);
}

/**
 * If `content` is only whitespace and/or a single line that looks like a chat image URL,
 * returns that line (trimmed). Otherwise null.
 */
export function extractBareChatImageUrl(content: string | null | undefined): string | null {
  if (content == null || typeof content !== 'string') return null;
  const trimmed = content.trim();
  if (!trimmed) return null;
  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length !== 1) return null;
  return lineLooksLikeImageUrl(lines[0]) ? lines[0] : null;
}

export function isBareChatImageMessageContent(content: string | null | undefined): boolean {
  return extractBareChatImageUrl(content) != null;
}
