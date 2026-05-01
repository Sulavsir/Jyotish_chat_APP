/**
 * Instant Chat Request Bar
 * Displays incoming instant chat requests for astrologers
 * Shows on top of the page when a new request comes in
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@jyotish/ui';
import { Check, User } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { ProgressBar } from '@/components/features/broadcast-chat/ProgressBar';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { getImageUrl } from '@/utils/image.utils';
import { LoadingButton } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ROUTE_BUILDERS } from '@/constants';

interface InstantChatRequest {
  id: string;
  clientId: string;
  clientName: string | null;
  clientPhoto: string | null;
  message: string | null;
  status: string;
  expiresAt: string;
  createdAt: string;
  client: {
    id: string;
    name: string | null;
    profilePhoto: string | null;
    phone: string;
  };
}

export interface InstantChatRequestBarProps {
  /** Fires when this queue has items (for unified empty state in layout). */
  onHasItemsChange?: (hasItems: boolean) => void;
}

export const InstantChatRequestBar: React.FC<InstantChatRequestBarProps> = ({
  onHasItemsChange,
}) => {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const [requests, setRequests] = useState<InstantChatRequest[]>([]);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [requestIdToDiscard, setRequestIdToDiscard] = useState<string | null>(null);
  const [autoRemoveTimers, setAutoRemoveTimers] = useState<Map<string, NodeJS.Timeout>>(new Map());

  // Listen for socket events
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('Socket not ready yet');
      return;
    }

    // Get pending requests when connected
    socket.emit('instantChat:getPending');

    // New request received
    socket.on('instantChat:newRequest', (data) => {
      setRequests((prev) => {
        // Check if request already exists
        if (prev.some((r) => r.id === data.request.id)) {
          return prev;
        }
        return [data.request, ...prev];
      });
      toast.info('New instant chat request!', {
        description: `${data.request.clientName || 'Someone'} is looking for an astrologer`,
      });
    });

    // Receive pending list
    socket.on('instantChat:pendingList', (data) => {
      if (data.success) {
        setRequests(data.requests || []);
      }
    });

    // Request accepted (by you)
    socket.on('instantChat:accepted', (data) => {
      if (data.success) {
        setAccepting(null);
        toast.success('Request accepted! Starting chat...');

        // Schedule auto-removal after 40 seconds
        const timer = setTimeout(() => {
          setRequests((prev) => prev.filter((r) => r.id !== data.request.id));
        }, 40000);

        setAutoRemoveTimers((prev) => {
          const newMap = new Map(prev);
          newMap.set(data.request.id, timer);
          return newMap;
        });

        // Navigate to chat
        router.push(ROUTE_BUILDERS.JYOTISH_CHAT_WITH_ID(data.chatId));
      }
    });

    // Request taken by another astrologer
    socket.on('instantChat:requestTaken', (data) => {
      setRequests((prev) => prev.filter((r) => r.id !== data.requestId));
      setAccepting(null);
    });

    // Request cancelled by client
    socket.on('instantChat:requestCancelled', (data) => {
      setRequests((prev) => prev.filter((r) => r.id !== data.requestId));
      setAccepting(null);
    });

    // Requests expired
    socket.on('instantChat:requestsExpired', () => {
      // Refresh pending requests
      socket.emit('instantChat:getPending');
    });

    // Auto-remove request bar
    socket.on('instantChat:removeRequestBar', (data) => {
      setRequests((prev) => prev.filter((r) => r.id !== data.requestId));
      // Clear timer if exists
      const timer = autoRemoveTimers.get(data.requestId);
      if (timer) {
        clearTimeout(timer);
        setAutoRemoveTimers((prev) => {
          const newMap = new Map(prev);
          newMap.delete(data.requestId);
          return newMap;
        });
      }
    });

    // Error occurred
    socket.on('instantChat:error', (data) => {
      setAccepting(null);
      toast.error(data.message || 'An error occurred');
    });

    return () => {
      socket.off('instantChat:newRequest');
      socket.off('instantChat:pendingList');
      socket.off('instantChat:accepted');
      socket.off('instantChat:requestTaken');
      socket.off('instantChat:requestCancelled');
      socket.off('instantChat:requestsExpired');
      socket.off('instantChat:removeRequestBar');
      socket.off('instantChat:error');

      // Clear all timers
      autoRemoveTimers.forEach((timer) => clearTimeout(timer));
    };
  }, [socket, router, autoRemoveTimers, isConnected]);

  useEffect(() => {
    onHasItemsChange?.(requests.length > 0);
  }, [requests.length, onHasItemsChange]);

  const handleAccept = (requestId: string) => {
    if (!socket || !isConnected) {
      toast.error('Connection not ready. Please wait and try again.');
      return;
    }

    setAccepting(requestId);
    socket.emit('instantChat:accept', { requestId });
  };

  const handleDismiss = (requestId: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    setRequestIdToDiscard(null);
  };

  const handleConfirmDiscard = () => {
    if (requestIdToDiscard) {
      handleDismiss(requestIdToDiscard);
    }
  };

  if (requests.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-2">
        {requests.map((request) => (
          <InstantChatRequestCard
            key={request.id}
            request={request}
            accepting={accepting === request.id}
            onAccept={() => handleAccept(request.id)}
            onDismissClick={() => setRequestIdToDiscard(request.id)}
            onExpire={() => handleDismiss(request.id)}
          />
        ))}
      </div>

      <ConfirmDialog
        isOpen={requestIdToDiscard !== null}
        onClose={() => setRequestIdToDiscard(null)}
        onConfirm={handleConfirmDiscard}
        title="Discard this request?"
        description="Are you sure you want to discard this request? The client will need to send a new request to connect with an astrologer."
        confirmText="Yes, discard"
        cancelText="Cancel"
        isDestructive={true}
      />
    </>
  );
};

interface InstantChatRequestCardProps {
  request: InstantChatRequest;
  accepting: boolean;
  onAccept: () => void;
  onDismissClick: () => void;
  onExpire: () => void;
}

const InstantChatRequestCard: React.FC<InstantChatRequestCardProps> = ({
  request,
  accepting,
  onAccept,
  onDismissClick,
  onExpire,
}) => {
  const [expired, setExpired] = useState(false);

  const created = new Date(request.createdAt).getTime();
  const ends = new Date(request.expiresAt).getTime();
  const windowMs = Math.max(60_000, ends - created);

  return (
    <div className="rounded-xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/90 p-3 text-white shadow-lg ring-1 ring-amber-500/30 transition-shadow animate-in slide-in-from-top duration-300 hover:ring-amber-400/50">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <Avatar className="h-12 w-12 ring-2 ring-amber-400/40 shrink-0">
            <AvatarImage
              src={getImageUrl(request.client.profilePhoto) || undefined}
              alt={request.client.name || 'Client'}
            />
            <AvatarFallback className="bg-amber-600 text-white font-bold text-lg">
              {!request.client.profilePhoto && !request.client.name ? (
                <User className="h-6 w-6 text-white" />
              ) : (
                (request.client.name?.trim() || 'C').charAt(0).toUpperCase()
              )}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-bold text-base leading-tight truncate">
              {request.client.name?.trim() || 'Client'}
            </p>
            <p className="text-[11px] text-white/50 font-mono truncate mt-0.5">
              {request.clientId.length > 12
                ? `${request.clientId.slice(0, 6)}…${request.clientId.slice(-4)}`
                : request.clientId}
            </p>
            <p className="text-[11px] text-amber-200/90 mt-1">
              {formatDistanceToNowStrict(new Date(request.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <span className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-200 text-xs font-bold border border-amber-400/30">
          Instant
        </span>
      </div>

      {request.message && (
        <p className="text-sm text-white/85 line-clamp-2 mb-3 leading-snug border-l-2 border-amber-500/60 pl-2">
          {request.message}
        </p>
      )}

      <div className="mb-3" onClick={(e) => e.stopPropagation()}>
        <ProgressBar
          key={request.id}
          createdAt={request.createdAt}
          expiresAt={request.expiresAt}
          expiryMs={windowMs}
          variant="prominent"
          onExpire={() => {
            setExpired(true);
            onExpire();
          }}
        />
      </div>

      <div className="flex gap-2">
        <LoadingButton
          onClick={onAccept}
          isLoading={accepting}
          disabled={accepting || expired}
          className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold shadow-lg"
        >
          <Check className="mr-1 h-4 w-4" />
          Accept
        </LoadingButton>
        <button
          type="button"
          onClick={onDismissClick}
          disabled={accepting || expired}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </div>
  );
};
