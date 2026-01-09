/**
 * OnlineUsers Component
 * Shows users who are currently online with quick message buttons
 */

import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@jyotish/ui';
import { useStore } from '@/store';
import { useAuthStore } from '@/store/auth-store';
import { Spinner } from '@/components/ui/Spinner';
import { DropdownMenu, DropdownItem } from '@/components/ui/DropdownMenu';
import { ChevronDown, MessageSquare, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useChat } from '@/hooks/useChat';
import { QUERY_KEYS, ROUTES } from '@/constants';
import { getImageUrl } from '@/utils/image.utils';
import { UserRole } from '@/types/user.types';
import userService, { type ChatableUser } from '@/services/user.service';

interface OnlineUsersProps {
  title?: string;
  maxHeight?: string;
}

export const OnlineUsers: React.FC<OnlineUsersProps> = ({ title, maxHeight = '400px' }) => {
  const queryClient = useQueryClient();
  const onlineUsers = useStore((state) => state.onlineUsers);
  const currentUser = useAuthStore((state) => state.user);
  const router = useRouter();
  const { startChat, isStartingChat } = useChat();

  // Fetch chatable users with TanStack Query
  const {
    data: users = [],
    isLoading,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: QUERY_KEYS.USERS.CHATABLE,
    queryFn: userService.getChatableUsers,
    staleTime: 0, // Always consider data stale for instant updates
    refetchInterval: 30000, // Refetch every 30 seconds as backup
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: 'always', // Always refetch on mount
  });

  // Filter to show ONLY online users - NO LIMIT
  // This will re-compute whenever onlineUsers Set changes (Zustand will trigger re-render)
  const onlineUsersFiltered = users.filter((user: ChatableUser) => onlineUsers.has(user.id));

  // Debug: Log when data updates
  React.useEffect(() => {
    console.log(`📊 [OnlineUsers] Data updated at:`, new Date(dataUpdatedAt).toLocaleTimeString());
    console.log(`📊 [OnlineUsers] Total users:`, users.length);
    console.log(`📊 [OnlineUsers] Online users:`, onlineUsersFiltered.length);
  }, [dataUpdatedAt, users.length, onlineUsersFiltered.length]);

  const handleChatNow = async (userId: string) => {
    await startChat(userId);
  };

  const handleVisitProfile = (userId: string) => {
    router.push(`/astrologers/${userId}`);
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <Card className="bg-black/40 backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            {title ||
              (currentUser?.role === UserRole.ASTROLOGER ? 'Active Clients' : 'Online Astrologers')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (onlineUsersFiltered.length === 0) {
    return (
      <Card className="bg-black/40 backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-500"></span>
            </span>
            {title ||
              (currentUser?.role === UserRole.ASTROLOGER ? 'Active Clients' : 'Online Astrologers')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6">
            {/* Empty State Icon */}
            <div className="relative mb-3">
              <div className="absolute inset-0 bg-purple-600/20 rounded-full blur-xl"></div>
              <div className="relative bg-gradient-to-br from-purple-900/30 to-indigo-900/30 p-4 rounded-full border border-purple-500/20">
                <svg
                  className="w-10 h-10 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {currentUser?.role === UserRole.ASTROLOGER ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  )}
                </svg>
              </div>
            </div>

            {/* Message */}
            <p className="text-white font-medium mb-1">
              {currentUser?.role === UserRole.ASTROLOGER
                ? 'No Active Clients'
                : 'All Astrologers Offline'}
            </p>
            <p className="text-gray-400 text-sm text-center mb-4">
              {currentUser?.role === UserRole.ASTROLOGER
                ? 'Check back soon!'
                : "They'll be back online soon"}
            </p>

            {/* Action Button */}
            <button
              onClick={handleRefresh}
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/40 backdrop-blur-md border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            {title ||
              (currentUser?.role === UserRole.ASTROLOGER ? 'Active Clients' : 'Online Astrologers')}
            <span className="text-sm font-normal text-gray-400">
              ({onlineUsersFiltered.length} online)
            </span>
          </CardTitle>
          <button
            onClick={handleRefresh}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium"
          >
            Refresh list
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Scrollable Grid Container */}
        <div className="overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight }}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {onlineUsersFiltered.map((user: ChatableUser) => {
              return (
                <div key={user.id} className="relative flex flex-col items-center group">
                  {/* Avatar with online indicator */}
                  <div className="relative mb-3">
                    <Avatar className="h-24 w-24 ring-2 ring-green-500/50 transition-transform group-hover:scale-105">
                      <AvatarImage
                        src={getImageUrl(user.profilePhoto) || undefined}
                        alt={user.name || 'User'}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-2xl font-bold">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-1 right-1 block h-5 w-5 rounded-full bg-green-500 ring-2 ring-black animate-pulse" />
                  </div>

                  {/* Name and Dropdown */}
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold text-center truncate max-w-[120px]">
                      {user.name || 'Anonymous'}
                    </p>
                    <DropdownMenu
                      trigger={
                        <button
                          className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                          title="Actions"
                          disabled={isStartingChat}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      }
                      align="right"
                      className="w-48 bg-gray-900 border border-purple-500/30 rounded-lg shadow-2xl overflow-hidden"
                      disabled={isStartingChat}
                    >
                      <DropdownItem
                        onClick={() => handleChatNow(user.id)}
                        disabled={isStartingChat}
                        icon={<MessageSquare className="h-4 w-4 text-purple-400" />}
                      >
                        {isStartingChat ? 'Starting...' : 'Chat Now'}
                      </DropdownItem>
                      <DropdownItem
                        onClick={() => handleVisitProfile(user.id)}
                        icon={<UserIcon className="h-4 w-4 text-purple-400" />}
                        className="border-t border-gray-800"
                      >
                        Visit Profile
                      </DropdownItem>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Scrollbar Styles */}
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(139, 92, 246, 0.5);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(139, 92, 246, 0.7);
          }
        `}</style>
      </CardContent>
    </Card>
  );
};
