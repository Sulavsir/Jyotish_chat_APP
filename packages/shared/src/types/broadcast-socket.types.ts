/** Emitted with `broadcast:messageExpired` (client + astrologers). */
export type BroadcastMessageExpiredSoundCue = 'timer_end';

export interface BroadcastMessageExpiredPayload {
  messageId: string;
  refundAmount: number;
  /** Hint for clients to play end-of-timer feedback (optional for older servers). */
  soundCue?: BroadcastMessageExpiredSoundCue;
}

/** Payload for `broadcast:yourMessageAccepted` (client). */
export interface BroadcastYourMessageAcceptedPayload {
  message: unknown;
  chat: { id: string };
  astrologer?: { name?: string | null };
  initialMessages?: unknown[];
  autoAssignedFromTimer?: boolean;
  assignedByAdmin?: boolean;
}
