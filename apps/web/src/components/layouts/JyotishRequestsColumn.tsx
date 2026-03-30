/**
 * Left column: incoming client requests (inDrive-style).
 * No separate "Instant" / Broadcast" labels — unified list + empty state.
 */

'use client';

import React, { useState, useCallback } from 'react';
import { MessageSquare } from 'lucide-react';

import { InstantChatRequestBar } from '@/components/features/instant-chat/InstantChatRequestBar';
import { BroadcastMessageBar } from '@/components/features/broadcast-chat/BroadcastMessageBar';

export function JyotishRequestsColumn() {
  const [hasInstant, setHasInstant] = useState(false);
  const [hasBroadcast, setHasBroadcast] = useState(false);

  const onInstantChange = useCallback((v: boolean) => setHasInstant(v), []);
  const onBroadcastChange = useCallback((v: boolean) => setHasBroadcast(v), []);

  const isEmpty = !hasInstant && !hasBroadcast;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0f0e14]/90 pt-11 backdrop-blur-xl md:pt-0">
      <div className="shrink-0 border-b border-white/[0.06] px-3 py-3">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-amber-400/95">
          Incoming requests
        </h2>
        <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
          Newest first. Tap a broadcast to open the full request panel.
        </p>
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-3">
        {isEmpty && (
          <div className="mb-4 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.03] px-3 py-6 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/10 text-amber-400/90">
              <MessageSquare className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium leading-relaxed text-slate-300">
              No one has sent a request yet.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              When a client broadcasts a question or requests instant chat, it will show up here so you
              can accept or decline quickly.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <InstantChatRequestBar onHasItemsChange={onInstantChange} />
          <BroadcastMessageBar onHasItemsChange={onBroadcastChange} />
        </div>
      </div>
    </div>
  );
}
