/**
 * Instant Chat Request Bar
 * Displays incoming instant chat requests for astrologers
 * Shows on top of the page when a new request comes in
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback, Button } from '@jyotish/ui';
import { MessageSquare, X, Clock, Check } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { getImageUrl } from '@/utils/image.utils';
import { LoadingButton } from '@/components/ui';

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

export const InstantChatRequestBar: React.FC = () => {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const [requests, setRequests] = useState<InstantChatRequest[]>([]);
  const [accepting, setAccepting] = useState<string | null>(null);
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
        router.push(`/jyotish/chat?chatId=${data.chatId}`);
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
  };

  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-full px-4">
      <div className="space-y-3">
        {requests.map((request) => (
          <InstantChatRequestCard
            key={request.id}
            request={request}
            accepting={accepting === request.id}
            onAccept={() => handleAccept(request.id)}
            onDismiss={() => handleDismiss(request.id)}
          />
        ))}
      </div>
    </div>
  );
};

interface InstantChatRequestCardProps {
  request: InstantChatRequest;
  accepting: boolean;
  onAccept: () => void;
  onDismiss: () => void;
}

const InstantChatRequestCard: React.FC<InstantChatRequestCardProps> = ({
  request,
  accepting,
  onAccept,
  onDismiss,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const expiresAt = new Date(request.expiresAt).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        onDismiss();
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [request.expiresAt, onDismiss]);

  return (
    <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white p-4 rounded-lg shadow-2xl animate-in slide-in-from-top duration-300">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Avatar className="h-14 w-14 ring-2 ring-white/50">
          <AvatarImage
            src={getImageUrl(request.client.profilePhoto) || undefined}
            alt={request.client.name || 'Client'}
          />
          <AvatarFallback className="bg-white text-orange-600 font-bold text-lg">
            {(request.client.name || request.client.phone || 'C').charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="h-5 w-5" />
            <h4 className="font-bold text-lg">New Instant Chat Request</h4>
          </div>
          <p className="text-white/90 mb-1">
            <span className="font-semibold">{request.client.name || 'Someone'}</span> is looking for
            an astrologer
          </p>
          {request.message && (
            <p className="text-sm text-white/80 mb-2 line-clamp-2">&quot;{request.message}&quot;</p>
          )}
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Clock className="h-4 w-4" />
            <span>
              Expires in {Math.floor(timeRemaining / 60)}:
              {(timeRemaining % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <LoadingButton onClick={onAccept} isLoading={accepting} disabled={accepting} size="sm">
            <Check className="mr-1 h-4 w-4" />
            Accept
          </LoadingButton>
          <button
            onClick={onDismiss}
            disabled={accepting}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
