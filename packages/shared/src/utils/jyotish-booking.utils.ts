import type { JyotishBookingRequest } from '../types';

export function buildJyotishBookingLocationSummary(input: {
  province: string;
  district: string;
  wardNo: string;
  place: string;
  tole?: string | null;
  nearestLandmark?: string | null;
}): string {
  const parts = [
    input.province.trim(),
    input.district.trim(),
    `Ward ${input.wardNo.trim()}`,
    input.place.trim(),
    input.tole?.trim(),
    input.nearestLandmark?.trim(),
  ].filter((p): p is string => Boolean(p));
  return parts.join(', ');
}

export function hasStructuredJyotishVenue(
  b: Pick<JyotishBookingRequest, 'province' | 'district' | 'wardNo' | 'place'>
): boolean {
  return Boolean(
    b.province?.trim() && b.district?.trim() && b.wardNo?.trim() && b.place?.trim()
  );
}

export function jyotishBookingVenueTitle(b: JyotishBookingRequest): string {
  if (hasStructuredJyotishVenue(b)) {
    const lines = [
      [b.province, b.district].filter(Boolean).join(', '),
      `Ward ${b.wardNo}, ${b.place}`,
      b.tole?.trim() || null,
      b.nearestLandmark?.trim() || null,
      b.googleMapLink?.trim() || null,
      typeof b.pujariCount === 'number' && b.pujariCount > 0
        ? `Pujari required: ${b.pujariCount}`
        : null,
      b.contactPhone?.trim() ? `Contact: ${b.contactPhone.trim()}` : null,
      b.contactPhoneAlt?.trim() ? `Alt contact: ${b.contactPhoneAlt.trim()}` : null,
    ];
    return lines.filter(Boolean).join('\n');
  }
  return (b.location ?? '').trim() || '—';
}

export function jyotishBookingVenuePrimaryLine(b: JyotishBookingRequest): string {
  if (hasStructuredJyotishVenue(b)) {
    return `${b.province}, ${b.district}`;
  }
  const loc = (b.location ?? '').trim();
  return loc || '—';
}

export function jyotishBookingVenueSecondaryLine(b: JyotishBookingRequest): string {
  if (hasStructuredJyotishVenue(b)) {
    return `Ward ${b.wardNo} · ${b.place}`;
  }
  return '';
}
