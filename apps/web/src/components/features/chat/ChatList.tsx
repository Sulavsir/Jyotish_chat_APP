/**
 * ChatList Component
 * Displays list of conversations
 */

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback, Badge } from '@jyotish/ui';
import { MessageCircle, Search } from 'lucide-react';
import { getImageUrl } from '@/utils/image.utils';
import { UserRole } from '@/types';
import { useStore } from '@/store';
import { Chat } from '@/types/chat';

interface ChatListProps {
  chats: Chat[];
  activeChat: string | null;
  currentUserId: string;
  onSelectChat: (chatId: string, otherUserId: string) => void;
  isLoading?: boolean;
  showBroadcastChat?: boolean;
  isBroadcastChatActive?: boolean;
  onSelectBroadcastChat?: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({
  chats,
  activeChat,
  currentUserId,
  onSelectChat,
  isLoading = false,
  showBroadcastChat = false,
  isBroadcastChatActive = false,
  onSelectBroadcastChat,
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const onlineUsers = useStore((state) => state.onlineUsers);

  // Ensure chats is always an array
  const chatList = Array.isArray(chats) ? chats : [];

  // Filter chats based on search term
  const filteredChats = chatList.filter((chat) => {
    // Skip chats with missing data
    if (!chat?.clientParticipant || !chat?.astrologerParticipant) {
      return false;
    }

    // Determine other user based on current user ID
    const otherUser =
      chat.clientParticipant.id === currentUserId 
        ? chat.astrologerParticipant 
        : chat.clientParticipant;

    // If no search term, show all chats
    if (!searchTerm) {
      return true;
    }

    // Search by name, email, or phone (handle null names)
    const name = otherUser?.name || '';
    const email = otherUser?.email || '';
    const phone = otherUser?.phone || '';

    const searchLower = searchTerm.toLowerCase();

    return (
      name.toLowerCase().includes(searchLower) ||
      email.toLowerCase().includes(searchLower) ||
      phone.includes(searchTerm) // Phone search without toLowerCase
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {/* Broadcast Chat - "Everyone Jyotish" (only for clients) */}
        {showBroadcastChat && onSelectBroadcastChat && (
          <button
            onClick={onSelectBroadcastChat}
            className={`w-full p-4 flex items-start gap-3 hover:bg-white/5 transition-colors border-b border-white/10 ${
              isBroadcastChatActive ? 'bg-purple-600/20 border-l-4 border-l-purple-500' : ''
            }`}
          >
            {/* Icon instead of avatar */}
            <div className="relative flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Chat info */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-white truncate">Everyone(JYOTISH)</h3>
              </div>
              <p className="text-sm text-gray-400 truncate">
                Broadcast to all online astrologers
              </p>
            </div>
          </button>
        )}

        {filteredChats.length === 0 && !showBroadcastChat ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
            <MessageCircle className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-center text-sm">
              {searchTerm
                ? 'No conversations found'
                : 'No conversations yet.\nStart chatting with an astrologer!'}
            </p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const otherUser =
              chat.clientParticipant.id === currentUserId 
                ? chat.astrologerParticipant 
                : chat.clientParticipant;
            const isActive = activeChat === chat.id;

            return (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id, otherUser.id)}
                className={`w-full p-4 flex items-start gap-3 hover:bg-white/5 transition-colors border-b border-white/10 ${
                  isActive ? 'bg-purple-600/20 border-l-4 border-l-purple-500' : ''
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={getImageUrl(otherUser.profilePhoto) || undefined}
                      alt={otherUser.name || otherUser.phone || 'User'}
                    />
                    <AvatarFallback className="bg-purple-600 text-white font-bold">
                      {(otherUser.name || otherUser.phone || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online indicator */}
                  {onlineUsers.has(otherUser.id) && (
                    <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-gray-900" />
                  )}
                </div>

                {/* Chat info */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-white truncate">
                      {otherUser.name || otherUser.phone || 'Unknown User'}
                    </h3>
                    {chat.lastMessageAt && (
                      <span className="text-xs text-gray-400 ml-2">
                        {formatDistanceToNow(new Date(chat.lastMessageAt), {
                          addSuffix: false,
                        })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400 truncate pr-2">
                      {chat.lastMessageText || 'No messages yet'}
                    </p>
                    {chat.unreadCount && chat.unreadCount > 0 && (
                      <Badge className="bg-purple-600 text-white px-2 py-0.5 text-xs rounded-full">
                        {chat.unreadCount}
                      </Badge>
                    )}
                  </div>

                  {/* Role badge */}
                  <div className="mt-1">
                    <Badge
                      className={`text-xs px-2 py-0.5 ${
                        otherUser.role === UserRole.ASTROLOGER
                          ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                          : 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                      }`}
                    >
                      {otherUser.role === UserRole.ASTROLOGER ? 'Astrologer' : 'Client'}
                    </Badge>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
