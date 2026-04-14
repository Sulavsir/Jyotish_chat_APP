import { Server } from 'socket.io';
import {
  AstrologerNotificationSoundCue,
  ASTROLOGER_NOTIFICATION_SOUND_FILES,
  type AstrologerNotificationSoundPayload,
} from '@jyotish/shared';

const STATIC_PREFIX = '/static/notifications-ring';

export function buildAstrologerNotificationSoundPayload(
  cue: AstrologerNotificationSoundCue
): AstrologerNotificationSoundPayload {
  const fileName = ASTROLOGER_NOTIFICATION_SOUND_FILES[cue];
  return {
    cue,
    fileName,
    path: `${STATIC_PREFIX}/${encodeURIComponent(fileName)}`,
  };
}

/** One Jyotish user room (`user:{id}`). */
export function emitAstrologerNotificationSoundToUser(
  io: Server,
  astrologerId: string,
  cue: AstrologerNotificationSoundCue
): void {
  io.to(`user:${astrologerId}`).emit(
    'astrologer:notificationSound',
    buildAstrologerNotificationSoundPayload(cue)
  );
}

/** All sockets that joined the `astrologers` room. */
export function emitAstrologerNotificationSoundToAstrologersRoom(
  io: Server,
  cue: AstrologerNotificationSoundCue
): void {
  io.to('astrologers').emit(
    'astrologer:notificationSound',
    buildAstrologerNotificationSoundPayload(cue)
  );
}
