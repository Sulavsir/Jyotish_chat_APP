'use client';

import {
  formatGregorianDateEnShort,
  formatTimeStringAmPm,
  type NepaliDateMappingInput,
} from '@jyotish/shared';
import { Badge } from '@jyotish/ui';
import type { KundaliMatchRequest } from '@/types/kundaliMatch.types';
import { KundaliMatchPlaceBlock } from './kundali-match-place-block';
import { KundaliMatchDobLines, toYmd } from './kundali-match-dob-lines';
import { KundaliMatchPremiumTopicsBlock } from './KundaliMatchPremiumTopicsBlock';
import { Banknote, User } from 'lucide-react';

export function KundaliMatchRequestDetailPanel({
  r,
  bsMap,
  isBsLoading,
  useDevanagari,
  showUser = true,
  showTopics = true,
  showPaymentStatus = true,
}: {
  r: KundaliMatchRequest;
  bsMap: Record<string, NepaliDateMappingInput | undefined>;
  isBsLoading: boolean;
  useDevanagari: boolean;
  showUser?: boolean;
  showTopics?: boolean;
  showPaymentStatus?: boolean;
}) {
  return (
    <div className="space-y-4 text-sm min-w-0">
      {showUser && (
        <div>
          <p className="text-slate-400 font-medium mb-1">User</p>
          <div className="flex items-center gap-2 min-w-0">
            <User className="w-4 h-4 text-blue-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-white font-medium truncate">{r.user?.name ?? 'N/A'}</p>
              <p className="text-slate-400 text-xs break-all">{r.user?.phone}</p>
              {r.user?.email ? (
                <p className="text-slate-500 text-xs break-all">{r.user.email}</p>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {showTopics && (
        <div className="rounded-lg bg-slate-800/40 border border-slate-700 p-3 space-y-2 min-w-0">
          <p className="text-slate-400 font-medium text-sm">Consultation topics requested</p>
          <KundaliMatchPremiumTopicsBlock selectedIds={r.selectedConsultationQuestionIds ?? []} />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
        <div className="min-w-0">
          <p className="text-slate-400 font-medium mb-1">Boy&apos;s details</p>
          <div className="rounded-lg bg-slate-800/50 border border-slate-700 p-3 space-y-3 min-w-0">
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <KundaliMatchDobLines
                iso={r.boyDateOfBirth}
                mapEntry={bsMap[toYmd(r.boyDateOfBirth)]}
                isLoading={isBsLoading}
              />
              <div className="shrink-0">
                <p className="text-slate-500 text-xs uppercase">Time of birth</p>
                <p className="text-slate-200">{formatTimeStringAmPm(r.boyTimeOfBirth)}</p>
              </div>
            </div>
            <KundaliMatchPlaceBlock r={r} person="boy" useDevanagari={useDevanagari} />
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-slate-400 font-medium mb-1">Girl&apos;s details</p>
          <div className="rounded-lg bg-slate-800/50 border border-slate-700 p-3 space-y-3 min-w-0">
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <KundaliMatchDobLines
                iso={r.girlDateOfBirth}
                mapEntry={bsMap[toYmd(r.girlDateOfBirth)]}
                isLoading={isBsLoading}
              />
              <div className="shrink-0">
                <p className="text-slate-500 text-xs uppercase">Time of birth</p>
                <p className="text-slate-200">{formatTimeStringAmPm(r.girlTimeOfBirth)}</p>
              </div>
            </div>
            <KundaliMatchPlaceBlock r={r} person="girl" useDevanagari={useDevanagari} />
          </div>
        </div>
      </div>

      {showPaymentStatus && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Banknote className="w-4 h-4 shrink-0" />
            <span>NRs {r.coinsDeducted.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {r.status === 'REVIEWED' ? (
              <Badge className="bg-green-500/15 text-green-300 border border-green-500/30">
                Reviewed
              </Badge>
            ) : (
              <Badge className="bg-yellow-500/15 text-yellow-200 border border-yellow-500/30">
                Pending
              </Badge>
            )}
            <p className="text-slate-400 text-sm">
              Requested {formatGregorianDateEnShort(r.createdAt)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
