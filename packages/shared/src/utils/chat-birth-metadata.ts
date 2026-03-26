/**
 * Birth details on chat messages: metadata.birthDetails reflects the selected profile
 * (e.g. self vs family). Merge with account defaults when metadata is missing.
 */

export type FallbackClientBirth = {
  dateOfBirth?: string | null;
  timeOfBirth?: string | null;
  placeOfBirth?: string | null;
};

export type MergedBirthDetails = {
  dateOfBirth?: string | Date | null;
  timeOfBirth?: string | null;
  placeOfBirth?: string | null;
  profileName?: string | null;
};

function hasAnyBirth(b: MergedBirthDetails): boolean {
  return !!(
    b.dateOfBirth ||
    (b.timeOfBirth && String(b.timeOfBirth).trim()) ||
    (b.placeOfBirth && String(b.placeOfBirth).trim())
  );
}

function coalesceDate(
  v: unknown,
  fallback: string | Date | null | undefined
): string | Date | null | undefined {
  if (v == null || v === '') return fallback ?? null;
  if (v instanceof Date) return v;
  if (typeof v === 'string') return v;
  return fallback ?? null;
}

/**
 * Merge `metadata.birthDetails` with account-level birth fields for CLIENT messages.
 * Returns null if there is nothing to show.
 */
export function mergeMessageBirthDetails(
  metadata: unknown,
  senderType: 'CLIENT' | 'ASTROLOGER',
  fallback: FallbackClientBirth | null | undefined
): MergedBirthDetails | null {
  if (senderType !== 'CLIENT') return null;

  const meta = metadata as Record<string, unknown> | null | undefined;
  const bd = meta?.birthDetails as Record<string, unknown> | undefined;

  const base: MergedBirthDetails = {
    dateOfBirth: fallback?.dateOfBirth ?? null,
    timeOfBirth: fallback?.timeOfBirth ?? null,
    placeOfBirth: fallback?.placeOfBirth ?? null,
    profileName:
      typeof meta?.profileName === 'string'
        ? meta.profileName
        : typeof bd?.profileName === 'string'
          ? (bd.profileName as string)
          : typeof bd?.name === 'string'
            ? (bd.name as string)
            : null,
  };

  if (!bd || typeof bd !== 'object') {
    return hasAnyBirth(base) ? base : null;
  }

  const merged: MergedBirthDetails = {
    dateOfBirth: coalesceDate(bd.dateOfBirth, base.dateOfBirth),
    timeOfBirth:
      typeof bd.timeOfBirth === 'string' && bd.timeOfBirth.trim()
        ? bd.timeOfBirth
        : base.timeOfBirth,
    placeOfBirth:
      typeof bd.placeOfBirth === 'string' && bd.placeOfBirth.trim()
        ? bd.placeOfBirth
        : base.placeOfBirth,
    profileName: base.profileName,
  };

  if (typeof bd.profileName === 'string' && bd.profileName.trim()) {
    merged.profileName = bd.profileName;
  } else if (typeof bd.name === 'string' && bd.name.trim()) {
    merged.profileName = bd.name;
  }

  return hasAnyBirth(merged) ? merged : null;
}

function formatDobForLine(d: string | Date): string {
  try {
    const date = typeof d === 'string' ? new Date(d) : d;
    if (Number.isNaN(date.getTime())) return String(d);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return String(d);
  }
}

/**
 * Single-line birth summary for compact UIs (admin monitor, chat history modal).
 */
export function formatBirthDetailsSingleLine(details: MergedBirthDetails): string {
  const parts: string[] = [];
  if (details.profileName?.trim()) {
    parts.push(`Profile: ${details.profileName.trim()}`);
  }
  if (details.dateOfBirth) {
    parts.push(`DOB ${formatDobForLine(details.dateOfBirth)}`);
  }
  if (details.timeOfBirth?.trim()) {
    parts.push(`TOB ${details.timeOfBirth.trim()}`);
  }
  if (details.placeOfBirth?.trim()) {
    parts.push(`POB ${details.placeOfBirth.trim()}`);
  }
  return parts.join(' · ');
}

export type MessageWithSenderAndTime = {
  senderType: string;
  createdAt: string;
};

/**
 * Group consecutive messages from the same sender sent in the same wall-clock second
 * (typical burst / double-send). Order must be chronological (oldest first).
 */
export function groupMessagesBySenderAndSameSecond<T extends MessageWithSenderAndTime>(
  messages: T[]
): T[][] {
  if (messages.length === 0) return [];

  const groups: T[][] = [];
  let current: T[] = [];
  let lastKey = '';

  for (const m of messages) {
    const sec = Math.floor(new Date(m.createdAt).getTime() / 1000);
    const key = `${m.senderType}:${sec}`;

    if (current.length === 0) {
      current.push(m);
      lastKey = key;
      continue;
    }

    if (key !== lastKey) {
      groups.push(current);
      current = [m];
      lastKey = key;
    } else {
      current.push(m);
    }
  }

  if (current.length > 0) {
    groups.push(current);
  }

  return groups;
}
