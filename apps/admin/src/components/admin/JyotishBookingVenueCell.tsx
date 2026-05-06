'use client';

import {
  jyotishBookingVenuePrimaryLine,
  jyotishBookingVenueSecondaryLine,
  jyotishBookingVenueTitle,
  type JyotishBookingRequest,
} from '@jyotish/shared';

export function JyotishBookingVenueCell({ booking }: { booking: JyotishBookingRequest }) {
  const title = jyotishBookingVenueTitle(booking);
  const line1 = jyotishBookingVenuePrimaryLine(booking);
  const line2 = jyotishBookingVenueSecondaryLine(booking);
  return (
    <div className="max-w-[240px] space-y-0.5" title={title}>
      <div className="text-slate-200 text-sm truncate">{line1}</div>
      {line2 ? <div className="text-slate-400 text-xs truncate">{line2}</div> : null}
    </div>
  );
}
