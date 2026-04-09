/**
 * Shared client chat history UI (modal or right sidebar).
 * Astrologer-only: anonymized past conversations across astrologers.
 */

'use client';

import React, { useCallback, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Badge, Avatar, AvatarFallback, Button, LoadingButton } from '@jyotish/ui';
import { History, User, X } from 'lucide-react';
import { getClientChatHistory, type ClientChatHistoryMessage } from '@/services/clientChatHistory.service';
import { QUERY_KEYS } from '@/constants';
import { format, isToday, isYesterday } from 'date-fns';
import { API_BASE_URL } from '@/constants';
import { userService } from '@/services/user.service';
import {
  formatBirthDetailsSingleLine,
  groupMessagesBySenderAndSameSecond,
  mergeMessageBirthDetails,
  type FallbackClientBirth,
} from '@jyotish/shared';

export const CLIENT_CHAT_HISTORY_MESSAGE_LIMIT = 12;

function formatDateHeader(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
}

type MessageGroup = {
  dateKey: string;
  dateLabel: string;
  messages: ClientChatHistoryMessage[];
};

function groupMessagesByDate(messages: ClientChatHistoryMessage[]): MessageGroup[] {
  const groups = new Map<string, { date: Date; messages: ClientChatHistoryMessage[] }>();

  for (const msg of messages) {
    const d = new Date(msg.createdAt);
    const key = format(d, 'yyyy-MM-dd');
    const existing = groups.get(key);
    if (existing) {
      existing.messages.push(msg);
    } else {
      groups.set(key, { date: d, messages: [msg] });
    }
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, { date, messages }]) => ({
      dateKey,
      dateLabel: formatDateHeader(date),
      messages,
    }));
}

function MessageBubbleOnly({
  message,
  isFromClient,
  showAvatarAndName,
  accountBirthFallback,
}: {
  message: ClientChatHistoryMessage;
  isFromClient: boolean;
  showAvatarAndName: boolean;
  accountBirthFallback: FallbackClientBirth | null;
}) {
  const metadata = message.metadata as Record<string, unknown> | undefined;
  const hasFile = !!metadata?.fileUrl;
  const mimeType = typeof metadata?.mimeType === 'string' ? metadata.mimeType : '';
  const isImage = message.type === 'IMAGE' || mimeType.startsWith('image/');
  const fileUrl =
    hasFile && typeof metadata?.fileUrl === 'string' ? `${API_BASE_URL}${metadata.fileUrl}` : null;

  return (
    <div className={`flex ${isFromClient ? 'justify-end' : 'justify-start'} items-end gap-2`}>
      {!isFromClient && (
        <div className="w-8 flex-shrink-0 flex justify-center">
          {showAvatarAndName ? (
            <Avatar className="h-8 w-8 bg-black border border-slate-700">
              <AvatarFallback className="bg-black text-white font-bold text-sm">
                {message.senderAvatarLetter}
              </AvatarFallback>
            </Avatar>
          ) : (
            <span className="w-2" />
          )}
        </div>
      )}
      <div
        className={`flex flex-col max-w-[78%] ${isFromClient ? 'items-end' : 'items-start'} min-w-0`}
      >
        {showAvatarAndName && (
          <span
            className={`text-xs text-slate-400 mb-1 ${isFromClient ? 'mr-1' : 'ml-1'}`}
          >
            {message.senderDisplayName}
          </span>
        )}
        <div className={`flex w-full mb-1 ${isFromClient ? 'justify-end' : 'justify-start'}`}>
          <Badge
            variant="outline"
            className="text-[10px] font-normal border-slate-600 text-slate-300 bg-slate-800/80"
          >
            {new Date(message.createdAt).toLocaleString()}
          </Badge>
        </div>
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isFromClient
              ? 'bg-purple-600 text-white rounded-br-md'
              : 'bg-slate-700/90 text-slate-100 rounded-bl-md'
          }`}
        >
          {message.content ? (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          ) : hasFile && fileUrl ? (
            isImage ? (
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                <img
                  src={fileUrl}
                  alt="Attachment"
                  className="max-w-full max-h-48 rounded-lg object-contain"
                />
              </a>
            ) : (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-purple-300 hover:underline"
              >
                📎 Open file
              </a>
            )
          ) : (
            <p className="text-sm text-slate-400 italic">Attachment</p>
          )}
        </div>
        {isFromClient &&
          accountBirthFallback &&
          (() => {
            const merged = mergeMessageBirthDetails(
              message.metadata,
              'CLIENT',
              accountBirthFallback
            );
            const line = merged ? formatBirthDetailsSingleLine(merged) : null;
            return line ? (
              <div className={`flex w-full mt-1.5 ${isFromClient ? 'justify-end' : 'justify-start'}`}>
                <Badge
                  variant="outline"
                  className="text-[11px] font-normal whitespace-normal text-right max-w-full border-purple-500/35 bg-purple-950/30 text-slate-200 leading-snug"
                  title={line}
                >
                  {line}
                </Badge>
              </div>
            ) : null;
          })()}
      </div>
      {isFromClient && (
        <div className="w-8 flex-shrink-0 flex justify-center">
          {showAvatarAndName ? (
            <Avatar className="h-8 w-8 bg-purple-600">
              <AvatarFallback className="bg-purple-600 text-white">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          ) : (
            <span className="w-2" />
          )}
        </div>
      )}
    </div>
  );
}

export interface ClientChatHistoryPanelProps {
  isActive: boolean;
  onClose: () => void;
  clientId: string;
  clientName?: string | null;
  /** Modal uses a shorter scroll viewport; sidebar fills remaining height */
  layout?: 'modal' | 'sidebar';
}

export function ClientChatHistoryPanel({
  isActive,
  onClose,
  clientId,
  clientName,
  layout = 'modal',
}: ClientChatHistoryPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const didScrollToRecentRef = useRef(false);

  const { data: clientDetailsResponse, isLoading: isLoadingClientProfile } = useQuery({
    queryKey: QUERY_KEYS.USERS.CLIENT_DETAILS(clientId),
    queryFn: () => userService.getClientDetails(clientId),
    enabled: isActive && !!clientId,
    staleTime: 30_000,
  });
  const clientProfile = clientDetailsResponse?.client;

  const accountBirthFallback = useMemo((): FallbackClientBirth | null => {
    if (!clientProfile) return null;
    const dob = clientProfile.dateOfBirth;
    return {
      dateOfBirth:
        dob == null ? null : typeof dob === 'string' ? dob : (dob as Date).toISOString(),
      timeOfBirth: clientProfile.timeOfBirth,
      placeOfBirth: clientProfile.placeOfBirth,
    };
  }, [clientProfile]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: QUERY_KEYS.CLIENT_CHAT_HISTORY.LIST(clientId),
    queryFn: async ({ pageParam }) => {
      const result = await getClientChatHistory(
        clientId,
        pageParam as string | undefined,
        CLIENT_CHAT_HISTORY_MESSAGE_LIMIT
      );
      return result;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled: isActive && !!clientId,
  });

  const allMessages = data?.pages?.flatMap((p) => p.messages) ?? [];
  const displayedMessages = useMemo(
    () =>
      [...allMessages].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    [allMessages]
  );

  const groupedMessages = useMemo(
    () => groupMessagesByDate(displayedMessages),
    [displayedMessages]
  );

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    const { scrollTop } = el;
    if (scrollTop < 100) {
      prevScrollHeightRef.current = el.scrollHeight;
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (isFetchingNextPage && scrollRef.current) {
      prevScrollHeightRef.current = scrollRef.current.scrollHeight;
    }
  }, [isFetchingNextPage]);

  useEffect(() => {
    if (data?.pages && scrollRef.current && prevScrollHeightRef.current > 0) {
      const el = scrollRef.current;
      const newHeight = el.scrollHeight;
      el.scrollTop = newHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = 0;
    }
  }, [data?.pages?.length]);

  useEffect(() => {
    if (!isActive) {
      didScrollToRecentRef.current = false;
    }
  }, [isActive]);

  useEffect(() => {
    didScrollToRecentRef.current = false;
  }, [clientId]);

  /** Open scrolled to the most recent messages (bottom); API returns newest-first pages. */
  useLayoutEffect(() => {
    if (!isActive || isLoading || displayedMessages.length === 0) return;
    if (didScrollToRecentRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
      didScrollToRecentRef.current = true;
    });
  }, [isActive, isLoading, displayedMessages.length]);

  const scrollClassName =
    layout === 'sidebar'
      ? 'flex-1 min-h-0 overflow-y-auto px-4 py-4'
      : 'flex-1 min-h-[300px] max-h-[50vh] overflow-y-auto px-4 py-4';

  return (
    <div
      className={
        layout === 'sidebar'
          ? 'flex h-full min-h-0 flex-col bg-slate-900'
          : 'flex h-full min-h-0 flex-col'
      }
    >
      <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-slate-700/50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <History className="h-5 w-5 text-purple-400 flex-shrink-0" />
            <h2 className="text-white text-lg font-semibold">Client Chat History</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-slate-400 mt-1.5">
          Past conversations with {clientName || 'this client'} across all astrologers. Astrologer
          identities are anonymized.
        </p>
        {isLoadingClientProfile && (
          <p className="text-xs text-slate-500 mt-3">Loading birth details…</p>
        )}
        {clientProfile && (
          <Badge
            variant="outline"
            className="mt-3 text-xs font-normal whitespace-normal text-left max-w-full border-slate-600 bg-slate-800/70 text-slate-200 leading-relaxed"
          >
            <span className="text-slate-500 font-medium mr-1">Account default ·</span>
            {(() => {
              const dob = clientProfile.dateOfBirth;
              const m = mergeMessageBirthDetails({}, 'CLIENT', {
                dateOfBirth:
                  dob == null ? null : typeof dob === 'string' ? dob : (dob as Date).toISOString(),
                timeOfBirth: clientProfile.timeOfBirth,
                placeOfBirth: clientProfile.placeOfBirth,
              });
              return m ? formatBirthDetailsSingleLine(m) : 'Birth details not on file';
            })()}
          </Badge>
        )}
      </div>

      <div ref={scrollRef} onScroll={handleScroll} className={scrollClassName}>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingButton loading>Loading...</LoadingButton>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <p>Failed to load chat history.</p>
            <Button variant="outline" size="sm" onClick={() => fetchNextPage()} className="mt-2">
              Retry
            </Button>
          </div>
        ) : displayedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <History className="h-12 w-12 mb-2 opacity-50" />
            <p>No chat history yet.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {isFetchingNextPage && (
              <div className="flex justify-center py-2">
                <LoadingButton loading size="sm">
                  Loading older messages...
                </LoadingButton>
              </div>
            )}
            {!hasNextPage && displayedMessages.length > 0 && (
              <div className="flex justify-center py-1">
                <span className="text-xs text-slate-500">Beginning of history</span>
              </div>
            )}

            {groupedMessages.map((group) => (
              <div key={group.dateKey} className="space-y-1">
                <div className="flex justify-center py-2">
                  <span className="text-xs font-medium text-slate-500 bg-slate-800/80 px-3 py-1 rounded-full">
                    {group.dateLabel}
                  </span>
                </div>
                <div className="space-y-2">
                  {groupMessagesBySenderAndSameSecond(group.messages).map((subGroup) => (
                    <div key={subGroup[0].id} className="space-y-1">
                      {subGroup.map((msg, idx) => {
                        const isFromClient = msg.senderType === 'CLIENT';
                        return (
                          <div key={msg.id} className={idx > 0 ? 'mt-0.5' : ''}>
                            <MessageBubbleOnly
                              message={msg}
                              isFromClient={isFromClient}
                              showAvatarAndName={idx === 0}
                              accountBirthFallback={accountBirthFallback}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
