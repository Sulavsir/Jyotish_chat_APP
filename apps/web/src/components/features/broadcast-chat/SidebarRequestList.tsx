'use client';

import React from 'react';
import type { BroadcastMessage } from '@/types';
import { RequestItem } from './RequestItem';
import {
  batchHasFirstBroadcastOffer,
  getBatchPreviewText,
  getBatchTotalNr,
  sortBroadcastGroupsNewestFirst,
} from './broadcast-request.utils';

export type BroadcastRequestGroup = {
  key: string;
  messages: BroadcastMessage[];
};

export interface SidebarRequestListProps {
  groups: BroadcastRequestGroup[];
  activeKey: string;
  onSelectGroup: (key: string) => void;
  acceptingMessageId: string | null;
  onAccept: (firstMessageId: string) => void;
  onReject: (firstMessageId: string) => void;
  className?: string;
  /** Narrow column: vertical stack only (no horizontal scroll) */
  stacked?: boolean;
  /** Hide the "Broadcasts (n)" label */
  hideHeader?: boolean;
}

export function SidebarRequestList({
  groups,
  activeKey,
  onSelectGroup,
  acceptingMessageId,
  onAccept,
  onReject,
  className,
  stacked = false,
  hideHeader = false,
}: SidebarRequestListProps) {
  const sorted = sortBroadcastGroupsNewestFirst(groups);
  const maxNr = Math.max(0, ...sorted.map((g) => getBatchTotalNr(g.messages)));

  const listClass = stacked
    ? 'flex flex-col gap-2'
    : 'flex md:flex-col gap-2 max-md:overflow-x-auto max-md:pb-1 max-md:snap-x max-md:snap-mandatory';

  return (
    <div className={className}>
      {!hideHeader && (
        <p className="mb-2 px-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Broadcasts ({sorted.length})
        </p>
      )}
      <div className={listClass}>
        {sorted.map((group) => {
          const first = group.messages[0];
          const totalNr = getBatchTotalNr(group.messages);
          const isFirstBroadcastOfferBatch = batchHasFirstBroadcastOffer(group.messages);
          const preview = getBatchPreviewText(group.messages);
          const client = first.client;
          const name = client?.name?.trim() || 'Client';
          const cid = client?.id ?? '';
          const idShort =
            cid.length > 10 ? `${cid.slice(0, 6)}…${cid.slice(-4)}` : cid || '—';

          return (
            <div
              key={group.key}
              className={
                stacked ? '' : 'max-md:min-w-[260px] max-md:snap-start max-md:flex-shrink-0'
              }
            >
              <RequestItem
                clientLabel={name}
                clientIdShort={idShort}
                preview={preview}
                createdAt={first.createdAt}
                expiresAt={first.expiresAt}
                totalNr={totalNr}
                maxNrAmongList={maxNr}
                isActive={activeKey === group.key}
                accepting={acceptingMessageId === first.id}
                variant={isFirstBroadcastOfferBatch ? 'first-broadcast-offer' : 'default'}
                onSelect={() => onSelectGroup(group.key)}
                onAccept={() => onAccept(first.id)}
                onReject={() => onReject(first.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
