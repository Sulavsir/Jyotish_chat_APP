/**
 * Request Instant Chat Button
 * Allows clients to request instant chat with any available astrologer
 * Works like ride-sharing apps - broadcast to all online astrologers
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@jyotish/ui';
import { MessageSquare, X, Clock, Loader2 } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { LoadingButton } from '@/components/ui';
import { ROUTE_BUILDERS } from '@/constants';

export const RequestInstantChatButton: React.FC = () => {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Listen for socket events
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('Socket not ready yet');
      return;
    }

    // Request created successfully
    socket.on('instantChat:created', (data) => {
      if (data.success) {
        setActiveRequest(data.request);
        setIsRequesting(false);
        setIsModalOpen(false);
        toast.success('Looking for available astrologers...');
      }
    });

    // Request accepted by astrologer
    socket.on('instantChat:requestAccepted', (data) => {
      setActiveRequest(null);
      toast.success(`${data.astrologer?.name || 'An astrologer'} accepted your request!`);
      // Navigate to chat
      router.push(ROUTE_BUILDERS.CHAT_WITH_ID(data.chatId));
    });

    // Error occurred
    socket.on('instantChat:error', (data) => {
      setIsRequesting(false);
      toast.error(data.message || 'Failed to create request');
    });

    // Request expired
    socket.on('instantChat:requestsExpired', () => {
      if (activeRequest) {
        setActiveRequest(null);
        toast.error('No astrologers available right now. Please try again.');
      }
    });

    return () => {
      socket.off('instantChat:created');
      socket.off('instantChat:requestAccepted');
      socket.off('instantChat:error');
      socket.off('instantChat:requestsExpired');
    };
  }, [socket, isConnected, router, activeRequest]);

  // Update time remaining
  useEffect(() => {
    if (!activeRequest) return;

    const calculateTimeRemaining = () => {
      const expiresAt = new Date(activeRequest.expiresAt).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        setActiveRequest(null);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [activeRequest]);

  const handleRequestChat = () => {
    if (!socket || !isConnected) {
      toast.error('Connection not ready. Please wait and try again.');
      return;
    }

    setIsRequesting(true);
    socket.emit('instantChat:create', { message: message.trim() || undefined });
  };

  const handleCancelRequest = () => {
    if (!socket || !isConnected || !activeRequest) {
      return;
    }

    socket.emit('instantChat:cancel', { requestId: activeRequest.id });
    setActiveRequest(null);
    toast.info('Request cancelled');
  };

  // If there's an active request, show waiting status
  if (activeRequest) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-lg shadow-2xl max-w-sm animate-pulse">
          <div className="flex items-start gap-3">
            <div className="relative">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1">Looking for Astrologers...</h4>
              <p className="text-sm text-white/80 mb-2">
                Waiting for an astrologer to accept your request
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>
                  {Math.floor(timeRemaining / 60)}:
                  {(timeRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
            <button
              onClick={handleCancelRequest}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Button */}
      <Button
        onClick={() => setIsModalOpen(true)}
        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg"
        size="lg"
      >
        <MessageSquare className="mr-2 h-5 w-5" />
        Request Instant Chat
      </Button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Request Instant Chat</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Your request will be sent to all online astrologers. The first one to accept will chat
              with you!
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Optional Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Briefly describe what you'd like to discuss..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">{message.length}/200 characters</p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setIsModalOpen(false)}
                variant="outline"
                className="flex-1"
                disabled={isRequesting}
              >
                Cancel
              </Button>
              <LoadingButton
                onClick={handleRequestChat}
                isLoading={isRequesting}
                disabled={isRequesting}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                Send Request
              </LoadingButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
