'use client';

import type { ReactNode } from 'react';
import {
  hasStructuredJyotishVenue,
  type AstrologerCategory,
  type JyotishBookingRequest,
} from '@jyotish/shared';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@jyotish/ui';
import { formatAdminDate, formatAdminDateTime, getImageUrl } from '@/utils/helpers';

export type JyotishBookingAdminRow = JyotishBookingRequest & {
  client: {
    id: string;
    phone: string;
    name: string | null;
    email: string | null;
    profilePhoto: string | null;
  };
  preferredAstrologer?: {
    id: string;
    name: string;
    category: AstrologerCategory;
    specialization: string[];
    profilePhoto: string | null;
  } | null;
};

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[minmax(140px,180px)_1fr] sm:gap-3 py-2 border-b border-slate-700/60 last:border-0">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-sm text-slate-100 min-w-0 break-words">{children}</div>
    </div>
  );
}

type Props = {
  booking: JyotishBookingAdminRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** e.g. Pujari Ji, Vaastu Shastri, Katha Vachak */
  serviceLabel: string;
  /** Column header for category, e.g. Puja Category */
  categoryLabel: string;
};

export function JyotishBookingDetailDialog({
  booking,
  open,
  onOpenChange,
  serviceLabel,
  categoryLabel,
}: Props) {
  if (!booking) return null;

  const b = booking;
  const structured = hasStructuredJyotishVenue(b);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] w-[calc(100vw-2rem)] flex-col overflow-hidden border-slate-700 bg-slate-900 text-white sm:max-w-xl">
        <DialogHeader className="flex-shrink-0 pr-8">
          <DialogTitle className="text-white">Booking details</DialogTitle>
          <p className="text-sm text-slate-400">
            {serviceLabel} · {b.status}
          </p>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1 space-y-1">
          <DetailRow label="Booking ID">{b.id}</DetailRow>
          <DetailRow label="Service">{serviceLabel}</DetailRow>
          <DetailRow label="Status">{b.status}</DetailRow>
          <DetailRow label="Service date">{formatAdminDate(b.bookingDate)}</DetailRow>
          <DetailRow label="Date of issue">{formatAdminDateTime(b.createdAt)}</DetailRow>
          <DetailRow label={categoryLabel}>{b.category}</DetailRow>

          <DetailRow label="Client name">{b.client?.name ?? '—'}</DetailRow>
          <DetailRow label="Client account phone">{b.client?.phone ?? '—'}</DetailRow>
          <DetailRow label="Client email">{b.client?.email ?? '—'}</DetailRow>
          <DetailRow label="Booking contact">{b.contactPhone ?? '—'}</DetailRow>
          <DetailRow label="Alt. contact">{b.contactPhoneAlt ?? '—'}</DetailRow>

          {b.preferredAstrologer ? (
            <DetailRow label="Preferred Jyotish">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={getImageUrl(b.preferredAstrologer.profilePhoto) || undefined}
                    alt=""
                  />
                  <AvatarFallback className="bg-purple-600 text-white text-xs">
                    {(b.preferredAstrologer.name || 'A').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{b.preferredAstrologer.name}</span>
              </div>
            </DetailRow>
          ) : null}

          <DetailRow label="Pujari needed">
            {b.pujariCount != null ? String(b.pujariCount) : '—'}
          </DetailRow>

          {structured ? (
            <>
              <DetailRow label="Province">{b.province ?? '—'}</DetailRow>
              <DetailRow label="District">{b.district ?? '—'}</DetailRow>
              <DetailRow label="Ward no.">{b.wardNo ?? '—'}</DetailRow>
              <DetailRow label="Place">{b.place ?? '—'}</DetailRow>
              <DetailRow label="Tole">{b.tole ?? '—'}</DetailRow>
              <DetailRow label="Nearest landmark">{b.nearestLandmark ?? '—'}</DetailRow>
            </>
          ) : null}
          <DetailRow label="Location summary">{b.location || '—'}</DetailRow>
          <DetailRow label="Google Maps">
            {b.googleMapLink?.trim() ? (
              <a
                href={b.googleMapLink.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-300 underline hover:text-purple-200 break-all"
              >
                {b.googleMapLink.trim()}
              </a>
            ) : (
              '—'
            )}
          </DetailRow>

          <DetailRow label="Remarks / details">{b.details?.trim() ? b.details : '—'}</DetailRow>
          <DetailRow label="Admin notes">{b.adminNotes?.trim() ? b.adminNotes : '—'}</DetailRow>
          {b.decidedAt ? (
            <DetailRow label="Decided at">{formatAdminDateTime(b.decidedAt)}</DetailRow>
          ) : null}
        </div>

        <div className="flex-shrink-0 pt-2">
          <Button
            variant="outline"
            className="w-full border-slate-600"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
