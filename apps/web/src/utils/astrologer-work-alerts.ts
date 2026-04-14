/**
 * Jyotish (web): sound + tab attention when server emits `astrologer:notificationSound`.
 *
 * Cues (see @jyotish/shared):
 * - DIRECT_CHAT_OR_KUNDALI_REVIEW → SMS_Direct_chat.mpeg (instant chat, direct bundle, Kundali booking)
 * - BROADCAST_OR_QUESTIONS → SMS_Broadcast_chat_kundali-review.mpeg (everyone broadcast, question batches)
 *
 * Browsers block autoplay until the user has interacted — call {@link primeAstrologerNotificationAudio} once.
 */

import {
  AstrologerNotificationSoundCue,
  ASTROLOGER_NOTIFICATION_SOUND_FILES,
  type AstrologerNotificationSoundPayload,
} from '@jyotish/shared';
import { API_BASE_URL, WS_BASE_URL } from '@/constants/api.constants';

const DEBOUNCE_MS_PER_CUE = 450;
const lastPlayAtByCue = new Map<string, number>();

let audioPrimed = false;

let baseTitle: string | null = null;
let pendingAttentionCount = 0;
let visibilityCleanupInstalled = false;

function getStaticAssetOrigin(): string {
  const raw = (API_BASE_URL || WS_BASE_URL || '').trim();
  if (!raw && typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:4000`;
  }
  return raw.replace(/\/api(?:\/v[12])?\/?$/i, '').replace(/\/$/, '');
}

function soundUrlFromPayload(payload: AstrologerNotificationSoundPayload): string {
  const origin = getStaticAssetOrigin();
  const path = payload.path.startsWith('/') ? payload.path : `/${payload.path}`;
  return `${origin}${path}`;
}

/** Preload both rings so the first real alert plays without extra delay. */
function preloadBothNotificationRings(): void {
  const origin = getStaticAssetOrigin();
  for (const fileName of Object.values(ASTROLOGER_NOTIFICATION_SOUND_FILES)) {
    const path = `/static/notifications-ring/${encodeURIComponent(fileName)}`;
    const audio = new Audio(`${origin}${path}`);
    audio.preload = 'auto';
  }
}

/**
 * Call once for Jyotish routes so the first real ring can play (autoplay policy).
 * Uses a silent data-URI clip on first click/keydown, then preloads both API sounds.
 */
export function primeAstrologerNotificationAudio(): void {
  if (typeof window === 'undefined' || audioPrimed) return;

  const tryPrime = () => {
    const silent = new Audio(
      'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQQAAAAAAA=='
    );
    silent.volume = 0;
    void silent.play().then(
      () => {
        audioPrimed = true;
        preloadBothNotificationRings();
      },
      () => {
        /* still allow later attempts */
      }
    );
  };

  window.addEventListener('pointerdown', tryPrime, { once: true, passive: true });
  window.addEventListener('keydown', tryPrime, { once: true });
}

function ensureVisibilityHandler(): void {
  if (typeof document === 'undefined' || visibilityCleanupInstalled) return;
  visibilityCleanupInstalled = true;

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    pendingAttentionCount = 0;
    if (baseTitle !== null) {
      document.title = baseTitle;
    }
    if (typeof navigator !== 'undefined' && 'clearAppBadge' in navigator) {
      try {
        void (navigator as Navigator & { clearAppBadge?: () => Promise<void> }).clearAppBadge?.();
      } catch {
        /* ignore */
      }
    }
  });
}

function copyForCue(cue: AstrologerNotificationSoundCue): { title: string; body: string } {
  switch (cue) {
    case AstrologerNotificationSoundCue.BROADCAST_OR_QUESTIONS:
      return {
        title: 'New broadcast request',
        body: 'A client sent a broadcast or question batch.',
      };
    case AstrologerNotificationSoundCue.DIRECT_CHAT_OR_KUNDALI_REVIEW:
      return {
        title: 'New direct request',
        body: 'Instant chat, direct questions, or Kundali review booking.',
      };
    default:
      return {
        title: 'Chat Jyotish',
        body: 'Open the app to respond.',
      };
  }
}

function bumpTabAttention(payload: AstrologerNotificationSoundPayload): void {
  if (typeof document === 'undefined') return;
  ensureVisibilityHandler();

  if (baseTitle === null) {
    baseTitle = document.title.replace(/^[🔔(].*?\)\s*/, '').trim() || document.title;
  }

  pendingAttentionCount += 1;

  const { title, body } = copyForCue(payload.cue);

  if (document.visibilityState === 'hidden') {
    document.title = `🔔 (${pendingAttentionCount}) ${baseTitle}`;

    if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
      try {
        void (navigator as Navigator & { setAppBadge?: (n: number) => Promise<void> }).setAppBadge?.(
          pendingAttentionCount
        );
      } catch {
        /* ignore */
      }
    }

    if (
      typeof globalThis.Notification !== 'undefined' &&
      globalThis.Notification.permission === 'granted'
    ) {
      try {
        new globalThis.Notification(title, {
          body,
          silent: true,
        });
      } catch {
        /* ignore */
      }
    }
  }
}

export function isAstrologerNotificationSoundPayload(
  p: unknown
): p is AstrologerNotificationSoundPayload {
  if (typeof p !== 'object' || p === null) return false;
  const o = p as Record<string, unknown>;
  if (typeof o.path !== 'string' || o.path.length === 0) return false;
  if (typeof o.cue !== 'string') return false;
  return (Object.values(AstrologerNotificationSoundCue) as string[]).includes(o.cue);
}

/**
 * Plays the server-selected ring (direct vs broadcast file) and updates tab / badge when backgrounded.
 * Debounce is **per cue** so a broadcast and a direct alert back-to-back both play.
 */
export function handleAstrologerNotificationSound(
  payload: AstrologerNotificationSoundPayload
): void {
  if (typeof window === 'undefined') return;

  const key = payload.cue;
  const now = Date.now();
  const last = lastPlayAtByCue.get(key) ?? 0;
  if (now - last < DEBOUNCE_MS_PER_CUE) return;
  lastPlayAtByCue.set(key, now);

  const url = soundUrlFromPayload(payload);
  const audio = new Audio(url);
  audio.volume = 0.95;

  void audio.play().catch((err) => {
    console.warn('[Jyotish] Notification sound could not play (tap the page once to enable):', err);
  });

  bumpTabAttention(payload);
}
