/**
 * ChatWindow Component
 * Main chat interface showing messages and input
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Avatar, AvatarImage, AvatarFallback, Button } from '@jyotish/ui';
import { ArrowLeft, MoreVertical, PhoneOff, MessageCircle } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { Tooltip } from '@/components/ui/Tooltip';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { getImageUrl } from '@/utils/image.utils';
import { UserRole } from '@/types';
import { useStore } from '@/store';
import { endChat as endChatService, getOrCreateChat } from '@/services/chat.service';
import { toast } from 'sonner';
import { Chat, Message } from '@/types/chat';
import { useAuthStore } from '@/store/auth-store';

interface ChatWindowProps {
  chat: (Chat & { status?: 'ACTIVE' | 'ENDED'; isLocked?: boolean }) | null;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
  onInputFocus?: () => void;
  onLoadMore?: () => void;
  onBack?: () => void;
  onChatEnded?: () => void;
  isTyping?: boolean;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  isConnected?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  chat,
  messages,
  currentUserId,
  onSendMessage,
  onTyping,
  onInputFocus,
  onLoadMore,
  onBack,
  onChatEnded,
  isTyping = false,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  isConnected = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isEndingChat, setIsEndingChat] = useState(false);
  const [showEndChatConfirm, setShowEndChatConfirm] = useState(false);
  const [isReopeningChat, setIsReopeningChat] = useState(false);
  const onlineUsers = useStore((state) => state.onlineUsers);
  const user = useAuthStore((state) => state.user);
  const previousScrollHeight = useRef<number>(0);
  const isLoadingMoreRef = useRef(false);
  const previousChatId = useRef<string | null>(null);

  // Deduplicate messages to prevent React key warnings
  const uniqueMessages = useMemo(() => {
    const seen = new Set<string>();
    return messages.filter((message) => {
      if (seen.has(message.id)) {
        console.warn('⚠️ Duplicate message detected and removed:', message.id);
        return false;
      }
      seen.add(message.id);
      return true;
    });
  }, [messages]);

  // Force scroll to bottom when switching to a new chat
  useEffect(() => {
    const currentChatId = chat?.id || null;

    // Only trigger on actual chat change (not initial mount with null)
    if (currentChatId !== previousChatId.current && currentChatId !== null) {
      console.log('📍 New chat selected, scrolling to bottom...');

      // Reset auto-scroll to true for new conversation
      setAutoScroll(true);

      // Force immediate scroll to bottom
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
        }
      }, 100);
    }

    previousChatId.current = currentChatId;
  }, [chat?.id]);

  // Auto-scroll to bottom when new messages arrive (only if user is at bottom)
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [uniqueMessages, autoScroll]);

  // Preserve scroll position when loading more messages
  useEffect(() => {
    if (isLoadingMoreRef.current && messagesContainerRef.current) {
      const currentScrollHeight = messagesContainerRef.current.scrollHeight;
      const scrollDiff = currentScrollHeight - previousScrollHeight.current;
      messagesContainerRef.current.scrollTop += scrollDiff;
      isLoadingMoreRef.current = false;
    }
  }, [uniqueMessages]);

  // Detect scroll position and trigger load more
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    const isAtTop = scrollTop < 100;

    setAutoScroll(isAtBottom);

    // Load more messages when scrolling near the top
    if (isAtTop && hasMore && !isLoadingMore && onLoadMore) {
      console.log('📜 Loading more messages...');
      previousScrollHeight.current = scrollHeight;
      isLoadingMoreRef.current = true;
      onLoadMore();
    }
  };

  // Handle showing end chat confirmation
  const handleEndChat = () => {
    setShowEndChatConfirm(true);
  };

  // Handle actual chat ending after confirmation
  const handleConfirmEndChat = async () => {
    if (!chat || isEndingChat) return;

    setIsEndingChat(true);
    try {
      await endChatService(chat.id);
      setShowEndChatConfirm(false);
      toast.success('Chat ended successfully');
      if (onChatEnded) {
        onChatEnded();
      }
    } catch (error: any) {
      console.error('Error ending chat:', error);
      toast.error(error.message || 'Failed to end chat');
    } finally {
      setIsEndingChat(false);
    }
  };

  // Handle reopening locked chat (only for clients)
  const handleReopenChat = async () => {
    if (!chat || !user || isReopeningChat) return;

    // Determine the other user ID
    const otherUserId =
      chat.clientParticipant.id === currentUserId
        ? chat.astrologerParticipant.id
        : chat.clientParticipant.id;

    setIsReopeningChat(true);
    try {
      // Call getOrCreateChat - this will unlock the locked chat
      await getOrCreateChat({ otherUserId });
      toast.success('Chat reopened! You can now send messages.');

      // Socket event 'chat:reopened' will update the state automatically
      // No need to reload the page
    } catch (error: any) {
      console.error('Error reopening chat:', error);
      toast.error(error.message || 'Failed to reopen chat');
    } finally {
      setIsReopeningChat(false);
    }
  };

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-900/20 to-blue-900/20">
        <div className="text-center space-y-4 p-8">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold text-white">Select a conversation</h3>
          <p className="text-gray-400 max-w-md">
            Choose a conversation from the list or start a new chat with an astrologer
          </p>
        </div>
      </div>
    );
  }

  // Determine other user based on current user ID
  const otherUser =
    chat.clientParticipant.id === currentUserId
      ? chat.astrologerParticipant
      : chat.clientParticipant;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}

          <Avatar className="h-10 w-10">
            <AvatarImage
              src={getImageUrl(otherUser.profilePhoto) || undefined}
              alt={otherUser.name || otherUser.phone || 'User'}
            />
            <AvatarFallback className="font-bold">
              {(otherUser.name || otherUser.phone || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div>
            <h2 className="font-semibold text-gray-900">
              {otherUser.name || otherUser.phone || 'Unknown User'}
            </h2>
            <p className="text-xs text-gray-500">
              {isTyping ? (
                <span className="text-indigo-600">typing...</span>
              ) : onlineUsers.has(otherUser.id) ? (
                <span className="text-green-600">● Online</span>
              ) : (
                <span className="text-gray-400">Offline</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* End Chat button - only show if chat is active and not locked */}
          {chat?.status === 'ACTIVE' && !chat?.isLocked && (
            <Tooltip content="End chat session">
              <button
                onClick={handleEndChat}
                disabled={isEndingChat}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PhoneOff className="h-5 w-5" />
              </button>
            </Tooltip>
          )}

          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreVertical className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 bg-gray-50"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner />
          </div>
        ) : uniqueMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4 p-8">
            <div className="text-6xl mb-2">👋</div>
            <p className="text-xl font-semibold text-gray-700">
              Say hello to {otherUser.name || otherUser.phone || 'Unknown User'}!
            </p>
            <p className="text-sm text-gray-500 text-center max-w-md">
              Start your conversation by sending a greeting.{' '}
              {otherUser.role === UserRole.ASTROLOGER
                ? 'Ask about your cosmic journey!'
                : 'Respond to their query!'}
            </p>
            <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-700">
                💡 <strong>Tip:</strong> Be polite and clear in your communication
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Loading More Indicator */}
            {isLoadingMore && (
              <div className="flex justify-center py-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Spinner />
                  <span>Loading older messages...</span>
                </div>
              </div>
            )}

            {/* End of messages indicator */}
            {!hasMore && uniqueMessages.length > 0 && (
              <div className="flex justify-center py-3 mb-2">
                <div className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                  🎉 Beginning of conversation
                </div>
              </div>
            )}

            {uniqueMessages.map((message, index) => {
              const isOwn = message.senderId === currentUserId;

              // Show avatar for opposite party only on last message in consecutive group
              const showAvatar =
                index === uniqueMessages.length - 1 ||
                uniqueMessages[index + 1]?.senderId !== message.senderId;

              // Show timestamp if:
              // 1. It's the last message OR
              // 2. More than 5 minutes have passed since this message OR
              // 3. Next message is from a different sender
              let showTimestamp = false;
              if (index === uniqueMessages.length - 1) {
                // Always show timestamp on last message
                showTimestamp = true;
              } else {
                const currentTime = new Date(message.createdAt).getTime();
                const nextTime = new Date(uniqueMessages[index + 1].createdAt).getTime();
                const timeDiffMinutes = (nextTime - currentTime) / (1000 * 60);

                // Show if more than 5 minutes apart or different sender
                showTimestamp =
                  timeDiffMinutes > 5 || uniqueMessages[index + 1]?.senderId !== message.senderId;
              }

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  showTimestamp={showTimestamp}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input or Blocked Message */}
      {chat?.isLocked ? (
        <div className="px-4 py-6 bg-gray-100 border-t border-gray-200">
          <div className="flex flex-col items-center justify-center gap-4 text-gray-600">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100">
              <PhoneOff className="h-6 w-6 text-red-600" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900">Chat Session Ended</p>
              <p className="text-sm text-gray-600 mt-1">You can no longer message this person</p>
            </div>

            {/* Reopen button - only show for clients */}
            {user?.role === UserRole.CLIENT && (
              <Button
                onClick={handleReopenChat}
                disabled={isReopeningChat}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReopeningChat ? (
                  <>
                    <Spinner />
                    <span>Opening Chat...</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-5 w-5" />
                    <span>Open Chat</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <ChatInput
          onSendMessage={onSendMessage}
          onTyping={onTyping}
          onFocus={onInputFocus}
          disabled={!isConnected}
          placeholder={isConnected ? 'Type a message...' : 'Connecting to chat server...'}
        />
      )}

      {/* End Chat Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showEndChatConfirm}
        onClose={() => setShowEndChatConfirm(false)}
        onConfirm={handleConfirmEndChat}
        title="End Chat Session"
        description="Are you sure you want to end this conversation? This action cannot be undone."
        confirmText="End Chat"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isEndingChat}
      />
    </div>
  );
};
