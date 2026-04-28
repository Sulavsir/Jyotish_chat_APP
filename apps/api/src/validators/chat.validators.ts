import { z } from 'zod';

const uuidField = z.string().uuid('Must be a valid UUID');

/**
 * POST /chat/chats — open or create a direct client↔astrologer chat.
 * Accepts common client field aliases so callers are not forced to use only `otherUserId`.
 */
export const postChatChatsBodySchema = z
  .object({
    otherUserId: uuidField.optional(),
    participantId: uuidField.optional(),
    /** Alias; when the caller is CLIENT this must be the astrologer's user row id (Astrologer.id). */
    astrologerId: uuidField.optional(),
    consultationId: uuidField.optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const raw = [data.otherUserId, data.participantId, data.astrologerId].filter(
      (v): v is string => typeof v === 'string' && v.length > 0
    );
    const distinct = [...new Set(raw)];
    if (raw.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Provide the other party id as otherUserId, participantId, or astrologerId (UUID).',
        path: ['otherUserId'],
      });
    }
    if (distinct.length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Conflicting values: otherUserId, participantId, and astrologerId must be the same UUID.',
        path: ['otherUserId'],
      });
    }
  });

export type PostChatChatsBody = z.infer<typeof postChatChatsBodySchema>;

export function resolvedOtherUserIdFromPostChatBody(body: PostChatChatsBody): string {
  return (body.otherUserId ?? body.participantId ?? body.astrologerId) as string;
}
