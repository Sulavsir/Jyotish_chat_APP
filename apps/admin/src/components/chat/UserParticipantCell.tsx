'use client';

/**
 * Compact name + phone + email for admin chat tables.
 */

export interface UserParticipantCellProps {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  /** Shown as subtle label above name when useful (e.g. Client / Jyotish). */
  label?: string;
}

export function UserParticipantCell({ name, phone, email, label }: UserParticipantCellProps) {
  const displayName = name?.trim() || 'Unknown';

  return (
    <div className="flex flex-col gap-0.5 text-left max-w-xs">
      {label ? (
        <span className="text-[10px] uppercase tracking-wide text-slate-500 font-medium">{label}</span>
      ) : null}
      <span className="font-medium text-white">{displayName}</span>
      {phone ? <span className="text-xs text-slate-400 break-all">{phone}</span> : null}
      {email ? <span className="text-xs text-slate-500 break-all">{email}</span> : null}
    </div>
  );
}
