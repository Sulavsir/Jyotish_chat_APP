/**
 * Birth details utilities
 * Build API-ready birth details from user or client profile for chat/broadcast
 */

import type { User, ClientProfile } from '@jyotish/shared';

export interface BirthDetailsPayload {
  dateOfBirth?: string;
  timeOfBirth?: string;
  placeOfBirth?: string;
  gender?: string;
}

/**
 * Build birth details payload for API (broadcast/direct chat) from selected profile.
 * Returns undefined if selected profile has insufficient birth data.
 */
export function getBirthDetailsForProfile(
  user: User | null,
  clientProfiles: ClientProfile[],
  selectedProfileId: string
): BirthDetailsPayload | undefined {
  if (selectedProfileId === 'me') {
    const hasNepalStructured =
      user?.placeOfBirthType === 'NEPAL' &&
      user?.placeOfBirthPradeshId &&
      user?.placeOfBirthDistrictId;
    const hasPlace =
      !!(user?.placeOfBirth && String(user.placeOfBirth).trim()) ||
      (hasNepalStructured && !!(user?.placeOfBirthLocation && String(user.placeOfBirthLocation).trim()));
    if (!user?.dateOfBirth || !user?.timeOfBirth || !hasPlace) return undefined;
    const dateVal =
      user.dateOfBirth instanceof Date ? user.dateOfBirth : new Date(user.dateOfBirth);
    const pob =
      (user.placeOfBirth && user.placeOfBirth.trim()) ||
      (user.placeOfBirthLocation && user.placeOfBirthLocation.trim()) ||
      undefined;
    return {
      dateOfBirth: dateVal.toISOString().split('T')[0],
      timeOfBirth: user.timeOfBirth ?? undefined,
      placeOfBirth: pob,
      gender: user.gender ?? undefined,
    };
  }
  const profile = clientProfiles.find((p) => p.id === selectedProfileId);
  if (!profile) return undefined;
  const hasNepalStructured =
    profile.placeOfBirthType === 'NEPAL' &&
    profile.placeOfBirthPradeshId &&
    profile.placeOfBirthDistrictId;
  const hasPlace =
    !!(profile.placeOfBirth && String(profile.placeOfBirth).trim()) ||
    (hasNepalStructured && !!(profile.placeOfBirthLocation && String(profile.placeOfBirthLocation).trim()));
  if (!profile.dateOfBirth && !profile.timeOfBirth && !hasPlace) return undefined;
  const dateVal = profile.dateOfBirth
    ? profile.dateOfBirth instanceof Date
      ? profile.dateOfBirth
      : new Date(profile.dateOfBirth)
    : null;
  const pob =
    (profile.placeOfBirth && profile.placeOfBirth.trim()) ||
    (profile.placeOfBirthLocation && profile.placeOfBirthLocation.trim()) ||
    undefined;
  return {
    dateOfBirth: dateVal ? dateVal.toISOString().split('T')[0] : undefined,
    timeOfBirth: profile.timeOfBirth ?? undefined,
    placeOfBirth: pob,
    gender: profile.gender ?? undefined,
  };
}

/**
 * Format birth summary string for display (e.g. "1/15/1990 • 09:30 • Kathmandu")
 */
export function formatBirthSummary(
  profile: {
    dateOfBirth?: Date | string | null;
    timeOfBirth?: string | null;
    placeOfBirth?: string | null;
  } | null
): string {
  if (!profile) return '—';
  const parts: string[] = [];
  if (profile.dateOfBirth) {
    const d =
      typeof profile.dateOfBirth === 'string' ? new Date(profile.dateOfBirth) : profile.dateOfBirth;
    parts.push(d.toLocaleDateString());
  }
  if (profile.timeOfBirth) parts.push(profile.timeOfBirth);
  if (profile.placeOfBirth) parts.push(profile.placeOfBirth);
  return parts.length ? parts.join(' • ') : '—';
}
