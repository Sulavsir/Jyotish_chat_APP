import { MessageType } from '@prisma/client';
import { extractBareChatImageUrl } from '@jyotish/shared';

/**
 * Detects file attachment metadata on client↔astrologer chat messages (socket + REST).
 */
export function hasChatFileMetadata(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== 'object' || metadata === null) return false;
  const fileUrl = (metadata as Record<string, unknown>).fileUrl;
  return typeof fileUrl === 'string' && fileUrl.trim().length > 0;
}

const CHAT_IMAGES_SEGMENT = '/uploads/chat/images/';

/**
 * Mobile clients sometimes upload an image then send `chat:send` with the full URL as `content`,
 * `type: TEXT`, and no `metadata.fileUrl`. Coerce those to IMAGE + metadata so DB and push
 * payloads match web clients that use proper attachments.
 */
export function coerceBareImageUrlMessageForStorage(input: {
  content: string;
  type?: MessageType;
  metadata?: unknown;
}): { content: string; type: MessageType; metadata?: unknown } {
  const bare = extractBareChatImageUrl(input.content);
  if (!bare) {
    return {
      content: input.content,
      type: input.type ?? MessageType.TEXT,
      metadata: input.metadata,
    };
  }

  const meta: Record<string, unknown> =
    input.metadata && typeof input.metadata === 'object' && input.metadata !== null
      ? { ...(input.metadata as Record<string, unknown>) }
      : {};

  const existingUrl = typeof meta.fileUrl === 'string' ? meta.fileUrl.trim() : '';
  if (existingUrl) {
    return {
      content: input.content,
      type: input.type ?? MessageType.TEXT,
      metadata: input.metadata,
    };
  }

  let pathname = bare;
  try {
    if (bare.startsWith('http://') || bare.startsWith('https://')) {
      pathname = new URL(bare).pathname;
    }
  } catch {
    return {
      content: input.content,
      type: input.type ?? MessageType.TEXT,
      metadata: input.metadata,
    };
  }

  if (!pathname.includes(CHAT_IMAGES_SEGMENT)) {
    return {
      content: input.content,
      type: input.type ?? MessageType.TEXT,
      metadata: input.metadata,
    };
  }

  meta.fileUrl = pathname;
  const ext = pathname.split('.').pop()?.toLowerCase() ?? '';
  const mimeByExt: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
  };
  if (!meta.mimeType && ext && mimeByExt[ext]) {
    meta.mimeType = mimeByExt[ext];
  }

  return {
    content: input.content,
    type: MessageType.IMAGE,
    metadata: meta,
  };
}
