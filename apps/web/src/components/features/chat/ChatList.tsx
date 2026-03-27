/**
 * ChatList Component
 * Displays list of conversations
 */

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback, Badge } from '@jyotish/ui';
import { MessageCircle, Search, User, Radio } from 'lucide-react';
import { getImageUrl } from '@/utils/image.utils';
import { useStore } from '@/store';
import { Chat } from '@/types/chat';
import { sortChatsByRecentActivity } from '@/utils/chat-sort.utils';

type StatusFilter = 'all' | 'active' | 'ended';

interface ChatListProps {
  chats: Chat[];
  activeChat: string | null;
  currentUserId: string;
  onSelectChat: (chatId: string, otherUserId: string) => void;
  isLoading?: boolean;
  showBroadcastChat?: boolean;
  isBroadcastChatActive?: boolean;
  onSelectBroadcastChat?: () => void;
  /** When 'jyotish', uses dark glass styling to match Jyotish portal */
  variant?: 'default' | 'jyotish';
  /** Show the Active/Ended filter tabs (for Jyotish portal) */
  showStatusFilter?: boolean;
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
  variant = 'default',
  showStatusFilter = false,
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const onlineUsers = useStore((state) => state.onlineUsers);
  const isJyotish = variant === 'jyotish';

  // Ensure chats is always an array
  const chatList = Array.isArray(chats) ? chats : [];

  // Filter, then order by most recent conversation (last message / updatedAt)
  const filteredChats = React.useMemo(() => {
    const filtered = chatList.filter((chat) => {
      if (!chat?.clientParticipant || !chat?.astrologerParticipant) {
        return false;
      }

      if (statusFilter === 'active' && chat.status !== 'ACTIVE') return false;
      if (statusFilter === 'ended' && chat.status !== 'ENDED') return false;

      if (!searchTerm) return true;

      const otherUser =
        chat.clientParticipant.id === currentUserId
          ? chat.astrologerParticipant
          : chat.clientParticipant;

      const name = otherUser?.name || '';
      const email = otherUser?.email || '';
      const phone = otherUser?.phone || '';
      const searchLower = searchTerm.toLowerCase();

      return (
        name.toLowerCase().includes(searchLower) ||
        email.toLowerCase().includes(searchLower) ||
        phone.includes(searchTerm)
      );
    });
    return sortChatsByRecentActivity(filtered);
  }, [chatList, currentUserId, searchTerm, statusFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div
          className={`animate-spin rounded-full h-8 w-8 border-2 border-t-transparent ${
            isJyotish ? 'border-amber-500/50' : 'border-purple-600'
          }`}
        />
      </div>
    );
  }

  const STATUS_TABS: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'ended', label: 'Ended' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div
        className={
          isJyotish
            ? 'p-3 border-b border-white/[0.06] space-y-2'
            : 'p-4 border-b border-white/10 space-y-2'
        }
      >
        <div className="relative">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
              isJyotish ? 'text-[#78716c]' : 'text-gray-400'
            }`}
          />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={
              isJyotish
                ? 'w-full pl-10 pr-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 text-[#fafaf9] placeholder:text-[#78716c] text-sm'
                : 'w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder:text-gray-400'
            }
          />
        </div>
        {/* Status filter tabs */}
        {showStatusFilter && (
          <div className="flex gap-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`flex-1 text-xs py-1 rounded-md font-medium transition-colors ${
                  statusFilter === tab.key
                    ? isJyotish
                      ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                      : 'bg-purple-600/40 text-purple-200 border border-purple-500/50'
                    : isJyotish
                      ? 'text-white/50 hover:text-white/70 hover:bg-white/[0.04]'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                {tab.label}
                {tab.key !== 'all' && (
                  <span className="ml-1 opacity-70">
                    (
                    {
                      chatList.filter((c) =>
                        tab.key === 'active' ? c.status === 'ACTIVE' : c.status === 'ENDED'
                      ).length
                    }
                    )
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {/* Broadcast Chat - "Channel Jyotish" (only for clients) */}
        {showBroadcastChat && onSelectBroadcastChat && (
          <button
            onClick={onSelectBroadcastChat}
            className={`w-full p-4 flex items-start gap-3 transition-colors border-b ${
              isJyotish
                ? `border-white/[0.06] hover:bg-white/[0.04] ${isBroadcastChatActive ? 'bg-amber-500/15 border-l-4 border-l-amber-500/60' : ''}`
                : `border-white/10 hover:bg-white/5 ${isBroadcastChatActive ? 'bg-purple-600/20 border-l-4 border-l-purple-500' : ''}`
            }`}
          >
            <div className="relative flex-shrink-0">
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center ${
                  isJyotish ? 'bg-amber-500/20' : 'bg-gradient-to-r from-purple-600 to-indigo-600'
                }`}
              >
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

            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between mb-1">
                <h3
                  className={
                    isJyotish
                      ? 'font-semibold text-[#fafaf9] truncate'
                      : 'font-semibold text-white truncate'
                  }
                >
                  Channel Jyotish
                </h3>
              </div>
              <p className={`text-sm truncate ${isJyotish ? 'text-[#78716c]' : 'text-gray-400'}`}>
                Request Message to all online astrologers
              </p>
            </div>
          </button>
        )}

        {filteredChats.length === 0 && !showBroadcastChat ? (
          <div
            className={`flex flex-col items-center justify-center h-full p-8 ${
              isJyotish ? 'text-[#78716c]' : 'text-gray-400'
            }`}
          >
            <MessageCircle className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-center text-sm whitespace-pre-line">
              {searchTerm
                ? 'No conversations found'
                : 'No conversations yet.\nStart chatting with an astrologer!'}
            </p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const viewerIsClient = chat.clientParticipant.id === currentUserId;
            const otherUser = viewerIsClient ? chat.astrologerParticipant : chat.clientParticipant;
            const isOtherPartyJyotish = viewerIsClient;
            const isActive = activeChat === chat.id;
            const showClientIconFallback =
              !isOtherPartyJyotish && !otherUser.profilePhoto && !otherUser.name;

            return (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id, otherUser.id)}
                className={`w-full p-3 flex items-start gap-3 transition-colors border-b ${
                  isJyotish
                    ? `border-white/[0.06] hover:bg-white/[0.04] ${isActive ? 'bg-amber-500/15 border-l-4 border-l-amber-500/60' : ''}`
                    : `border-white/10 hover:bg-white/5 ${isActive ? 'bg-purple-600/20 border-l-4 border-l-purple-500' : ''}`
                }`}
              >
                <div className="relative flex-shrink-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={getImageUrl(otherUser.profilePhoto) || undefined}
                      alt={otherUser.name || otherUser.phone || 'User'}
                    />
                    <AvatarFallback
                      className={
                        isJyotish
                          ? 'bg-amber-500/30 text-amber-200 font-bold'
                          : 'bg-purple-600 text-white font-bold'
                      }
                    >
                      {showClientIconFallback ? (
                        <User className="h-5 w-5" />
                      ) : (
                        (otherUser.name || otherUser.phone || 'U').charAt(0).toUpperCase()
                      )}
                    </AvatarFallback>
                  </Avatar>
                  {onlineUsers.has(otherUser.id) && (
                    <span
                      className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-emerald-500 ${
                        isJyotish ? 'ring-2 ring-[#0f0e14]' : 'ring-2 ring-gray-900'
                      }`}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <h3
                      className={
                        isJyotish
                          ? 'font-medium text-[#fafaf9] truncate'
                          : 'font-medium text-white truncate'
                      }
                    >
                      {otherUser.name || otherUser.phone || 'Unknown User'}
                    </h3>
                    {chat.lastMessageAt && (
                      <span
                        className={`text-xs ml-2 ${isJyotish ? 'text-[#78716c]' : 'text-gray-400'}`}
                      >
                        {formatDistanceToNow(new Date(chat.lastMessageAt), {
                          addSuffix: false,
                        })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p
                      className={`text-sm truncate pr-2 ${
                        isJyotish ? 'text-[#78716c]' : 'text-gray-400'
                      }`}
                    >
                      {chat.lastMessageText || 'No messages yet'}
                    </p>
                    {chat.unreadCount && chat.unreadCount > 0 && (
                      <Badge
                        className={
                          isJyotish
                            ? 'bg-amber-500/80 text-[#0f0e14] px-2 py-0.5 text-xs rounded-full font-medium'
                            : 'bg-purple-600 text-white px-2 py-0.5 text-xs rounded-full'
                        }
                      >
                        {chat.unreadCount}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-1 flex items-center gap-1 flex-wrap">
                    <Badge
                      className={`text-xs px-2 py-0.5 ${
                        isJyotish
                          ? isOtherPartyJyotish
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          : isOtherPartyJyotish
                            ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                            : 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                      }`}
                    >
                      {isOtherPartyJyotish ? 'Jyotish' : 'Client'}
                    </Badge>
                    {/* Broadcast vs Direct badge */}
                    {chat.chatSource === 'BROADCAST' ||
                    chat.isBroadcastChat ||
                    chat.isInstantChat ? (
                      <Badge className="text-xs px-1.5 py-0.5 bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1">
                        <Radio className="h-2.5 w-2.5" />
                        Broadcast
                      </Badge>
                    ) : (
                      <Badge className="text-xs px-1.5 py-0.5 bg-sky-500/15 text-sky-400 border border-sky-500/25">
                        Direct
                      </Badge>
                    )}
                    {/* Ended badge */}
                    {chat.status === 'ENDED' && (
                      <Badge className="text-xs px-1.5 py-0.5 bg-red-500/15 text-red-400 border border-red-500/25">
                        Ended
                      </Badge>
                    )}
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
