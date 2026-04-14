/**
 * Server → Jyotish (astrologer) app: which ring to play for incoming work.
 * Socket event: `astrologer:notificationSound` with {@link AstrologerNotificationSoundPayload}.
 */
export enum AstrologerNotificationSoundCue {
  /** Instant chat request, direct multi-question bundle (non–broadcast session), new Kundali review booking */
  DIRECT_CHAT_OR_KUNDALI_REVIEW = 'DIRECT_CHAT_OR_KUNDALI_REVIEW',
  /** Everyone-Jyotish broadcast, broadcast question batches, follow-up in a broadcast-priced chat session */
  BROADCAST_OR_QUESTIONS = 'BROADCAST_OR_QUESTIONS',
}

/** Filenames under API `Notifications_ring_bell/` (also served at `/static/notifications-ring/`). */
export const ASTROLOGER_NOTIFICATION_SOUND_FILES: Record<
  AstrologerNotificationSoundCue,
  string
> = {
  [AstrologerNotificationSoundCue.DIRECT_CHAT_OR_KUNDALI_REVIEW]: 'SMS_Direct_chat.mpeg',
  [AstrologerNotificationSoundCue.BROADCAST_OR_QUESTIONS]:
    'SMS_Broadcast_chat_kundali-review.mpeg',
};

export interface AstrologerNotificationSoundPayload {
  cue: AstrologerNotificationSoundCue;
  fileName: string;
  /** URL path relative to API origin, e.g. `/static/notifications-ring/SMS_Direct_chat.mpeg` */
  path: string;
}
