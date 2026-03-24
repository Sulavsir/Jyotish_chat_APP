/**
 * Client Chat History Modal
 * Astrologer-only: Anonymous aggregated view of client's past conversations with any astrologer.
 * All astrologer identities are anonymized ("Anonymous Astrologer", black avatar with "A").
 * Messages grouped by date; consecutive same-sender messages share avatar/name.
 */

'use client';

import React, { useCallback, useRef, useEffect, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Avatar,
  AvatarFallback,
  Button,
  LoadingButton,
} from '@jyotish/ui';
import { History, User, X } from 'lucide-react';
import {
  getClientChatHistory,
  type ClientChatHistoryMessage,
} from '@/services/clientChatHistory.service';
import { QUERY_KEYS } from '@/constants';
import { format, isToday, isYesterday } from 'date-fns';
import { API_BASE_URL } from '@/constants';

const MESSAGE_LIMIT = 12;

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

interface ClientChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName?: string | null;
}

function MessageBubbleOnly({
  message,
  isFromClient,
  showAvatarAndName,
}: {
  message: ClientChatHistoryMessage;
  isFromClient: boolean;
  showAvatarAndName: boolean;
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
            className={`text-xs text-slate-400 mb-1 ${
              isFromClient ? 'mr-1' : 'ml-1'
            }`}
          >
            {message.senderDisplayName}
          </span>
        )}
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

export function ClientChatHistoryModal({
  isOpen,
  onClose,
  clientId,
  clientName,
}: ClientChatHistoryModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);

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
        MESSAGE_LIMIT
      );
      return result;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled: isOpen && !!clientId,
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col bg-slate-900 border-slate-700 p-0 gap-0 overflow-hidden">
        <DialogHeader className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-slate-700/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <History className="h-5 w-5 text-purple-400 flex-shrink-0" />
              <DialogTitle className="text-white text-lg font-semibold">
                Client Chat History
              </DialogTitle>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-slate-400 mt-1.5">
            Past conversations with {clientName || 'this client'} across all astrologers.
            Astrologer identities are anonymized.
          </p>
        </DialogHeader>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 min-h-[300px] max-h-[50vh] overflow-y-auto px-4 py-4"
        >
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
                  <div className="space-y-0.5">
                    {group.messages.map((msg, idx) => {
                      const isFromClient = msg.senderType === 'CLIENT';
                      const prevMsg = group.messages[idx - 1];
                      const prevSameSender = prevMsg?.senderType === msg.senderType;
                      const showAvatarAndName = !prevSameSender;

                      return (
                        <div key={msg.id} className={idx > 0 ? 'mt-1' : ''}>
                          <MessageBubbleOnly
                            message={msg}
                            isFromClient={isFromClient}
                            showAvatarAndName={showAvatarAndName}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
