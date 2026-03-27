/**
 * Tracks socket connections per user (multi-tab safe).
 * Astrologer `isOnline` in the DB is **not** updated here — only login, logout, and the toggle API.
 */

import { UserRole } from '@jyotish/shared';

const socketsByUser = new Map<string, Set<string>>();
const astrologerIdsWithOpenSockets = new Set<string>();

function ensureSet(userId: string): Set<string> {
  let s = socketsByUser.get(userId);
  if (!s) {
    s = new Set();
    socketsByUser.set(userId, s);
  }
  return s;
}

export function getSocketCount(userId: string): number {
  return socketsByUser.get(userId)?.size ?? 0;
}

export function registerSocket(userId: string, socketId: string, role: string): void {
  const set = ensureSet(userId);
  const wasEmpty = set.size === 0;
  set.add(socketId);
  if (role === UserRole.ASTROLOGER && wasEmpty) {
    astrologerIdsWithOpenSockets.add(userId);
  }
}

/** @returns true if this was the user's last socket (fully disconnected from this server). */
export function unregisterSocket(userId: string, socketId: string, role: string): boolean {
  const set = socketsByUser.get(userId);
  if (!set) return false;
  set.delete(socketId);
  if (set.size > 0) return false;
  socketsByUser.delete(userId);
  if (role === UserRole.ASTROLOGER) {
    astrologerIdsWithOpenSockets.delete(userId);
  }
  return true;
}

export function getOnlineUserIds(): string[] {
  return [...socketsByUser.keys()];
}

export function getOnlineAstrologerIds(): string[] {
  return [...astrologerIdsWithOpenSockets];
}

export function getOnlineAstrologersCount(): number {
  return astrologerIdsWithOpenSockets.size;
}
