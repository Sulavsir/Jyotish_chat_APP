import { describe, it, expect } from 'vitest';
import {
  postChatChatsBodySchema,
  resolvedOtherUserIdFromPostChatBody,
} from './chat.validators';

const validUuid = '550e8400-e29b-41d4-a716-446655440000';
const otherUuid = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

describe('postChatChatsBodySchema', () => {
  it('accepts otherUserId only', () => {
    const parsed = postChatChatsBodySchema.parse({ otherUserId: validUuid });
    expect(resolvedOtherUserIdFromPostChatBody(parsed)).toBe(validUuid);
  });

  it('accepts participantId as alias', () => {
    const parsed = postChatChatsBodySchema.parse({ participantId: validUuid });
    expect(resolvedOtherUserIdFromPostChatBody(parsed)).toBe(validUuid);
  });

  it('accepts astrologerId as alias', () => {
    const parsed = postChatChatsBodySchema.parse({ astrologerId: validUuid });
    expect(resolvedOtherUserIdFromPostChatBody(parsed)).toBe(validUuid);
  });

  it('accepts same uuid on multiple keys', () => {
    const parsed = postChatChatsBodySchema.parse({
      otherUserId: validUuid,
      participantId: validUuid,
    });
    expect(resolvedOtherUserIdFromPostChatBody(parsed)).toBe(validUuid);
  });

  it('rejects empty body', () => {
    expect(() => postChatChatsBodySchema.parse({})).toThrow();
  });

  it('rejects conflicting uuids', () => {
    expect(() =>
      postChatChatsBodySchema.parse({
        otherUserId: validUuid,
        participantId: otherUuid,
      })
    ).toThrow();
  });

  it('rejects invalid uuid', () => {
    expect(() => postChatChatsBodySchema.parse({ otherUserId: 'not-a-uuid' })).toThrow();
  });

  it('rejects unknown keys (strict)', () => {
    expect(() =>
      postChatChatsBodySchema.parse({ otherUserId: validUuid, extra: 1 } as never)
    ).toThrow();
  });
});
