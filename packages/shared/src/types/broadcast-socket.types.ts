/** Emitted with `broadcast:messageExpired` (client + astrologers). */
export type BroadcastMessageExpiredSoundCue = 'timer_end';

export interface BroadcastMessageExpiredPayload {
  messageId: string;
  refundAmount: number;
  /** Hint for clients to play end-of-timer feedback (optional for older servers). */
  soundCue?: BroadcastMessageExpiredSoundCue;
}
