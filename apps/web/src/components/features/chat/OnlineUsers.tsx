/**
 * OnlineUsers Component
 * Shows users who are currently online with quick message buttons
 */

import React, { useState } from 'react';
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
import { ChevronDown, MessageSquare, User as UserIcon, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useChat } from '@/hooks/useChat';
import { QUERY_KEYS, ROUTES } from '@/constants';
import { getImageUrl } from '@/utils/image.utils';
import { UserRole } from '@/types/user.types';
import { USER_ROLES } from '@/constants/role.constants';
import userService, { type ChatableUser } from '@/services/user.service';
import { ProfileIncompleteDialog } from '@/components/ui/ProfileIncompleteDialog';
import { checkClientProfileCompletion } from '@/utils/profile-completion';
import { ASTROLOGER_CATEGORY } from '@/constants/appointment.constants';
import { CoinPurchaseModalWrapper } from '@/hooks/useChat';

interface OnlineUsersProps {
  title?: string;
  maxHeight?: string;
}

export const OnlineUsers: React.FC<OnlineUsersProps> = ({ title, maxHeight = '400px' }) => {
  const queryClient = useQueryClient();
  const onlineUsers = useStore((state) => state.onlineUsers);
  const currentUser = useAuthStore((state) => state.user);
  const router = useRouter();
  const {
    startChat,
    isStartingChat,
    showCoinPurchaseModal,
    requiredCoins,
    retryChat,
    setShowCoinPurchaseModal,
  } = useChat();
  const [showProfileIncompleteDialog, setShowProfileIncompleteDialog] = useState(false);
  const [missingProfileFields, setMissingProfileFields] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch chatable users with TanStack Query
  const {
    data: users = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.USERS.CHATABLE,
    queryFn: userService.getChatableUsers,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    placeholderData: (prev) => prev,
  });

  // Filter to show ONLY online users - NO LIMIT
  // Exclude PREMIUM astrologers from Chat Now (they are appointment-only)
  // This will re-compute whenever onlineUsers Set changes (Zustand will trigger re-render)
  const onlineUsersFiltered = users.filter(
    (user: ChatableUser) =>
      onlineUsers.has(user.id) &&
      // For clients viewing astrologers: exclude PREMIUM category (they only accept appointments)
      (currentUser?.role !== UserRole.CLIENT ||
        user.role !== USER_ROLES.ASTROLOGER ||
        user.category !== ASTROLOGER_CATEGORY.PREMIUM)
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const onlineUsersSearched =
    normalizedSearch.length === 0
      ? onlineUsersFiltered
      : onlineUsersFiltered.filter((u: ChatableUser) => {
          const name = (u.name || '').toLowerCase();
          const category = (u.category || '').toLowerCase();
          const zodiac = (u.zodiacSign || '').toLowerCase();
          return name.includes(normalizedSearch) || category.includes(normalizedSearch) || zodiac.includes(normalizedSearch);
        });

  const handleChatNow = async (userId: string) => {
    // Check if client profile is complete before starting chat
    if (currentUser?.role === UserRole.CLIENT) {
      const profileCheck = checkClientProfileCompletion(currentUser);
      if (!profileCheck.isComplete) {
        setMissingProfileFields(profileCheck.missingFields);
        setShowProfileIncompleteDialog(true);
        return;
      }
    }

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
      <Card className="relative overflow-hidden bg-black/40 backdrop-blur-md border-white/10">
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
    <Card className="relative overflow-hidden bg-black/40 backdrop-blur-md border-white/10">
      {/* Subtle gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-transparent" />
      <CardHeader>
        <div className="relative flex flex-col gap-3">
          <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            {title ||
              (currentUser?.role === UserRole.ASTROLOGER ? 'Active Clients' : 'Online Astrologers')}
            <span className="text-sm font-normal text-gray-400">
              ({onlineUsersSearched.length} online)
            </span>
          </CardTitle>
          <button
            onClick={handleRefresh}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium"
          >
            Refresh list
          </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                currentUser?.role === UserRole.ASTROLOGER
                  ? 'Search clients...'
                  : 'Search astrologers by name or expertise...'
              }
              className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/30"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search empty state */}
        {onlineUsersFiltered.length > 0 && onlineUsersSearched.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-purple-600/20 rounded-full blur-xl" />
              <div className="relative bg-gradient-to-br from-purple-900/30 to-indigo-900/30 p-4 rounded-full border border-purple-500/20">
                <Search className="h-8 w-8 text-purple-300" />
              </div>
            </div>
            <p className="text-white font-semibold">
              {currentUser?.role === UserRole.ASTROLOGER
                ? 'No active client matches your search'
                : 'No astrologer with this name is active'}
            </p>
            <p className="text-sm text-gray-400 mt-1 max-w-md">
              Try a different name, category, or zodiac sign. You can also clear the search to see all
              active users.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => setSearchTerm('')}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
              >
                Clear search
              </button>
              <button
                onClick={handleRefresh}
                className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-sm text-purple-200 hover:bg-purple-500/15 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight }}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {onlineUsersSearched.map((user: ChatableUser) => {
                const showClientIconFallback =
                  user.role === USER_ROLES.CLIENT && !user.profilePhoto && !user.name;
                return (
                  <div
                    key={user.id}
                    className="relative flex flex-col items-center rounded-xl border border-white/5 bg-white/0 p-3 group transition-all hover:bg-white/5 hover:border-purple-500/30 hover:shadow-[0_0_32px_rgba(168,85,247,0.12)]"
                  >
                    {/* Avatar with online indicator */}
                    <div className="relative mb-3">
                      <Avatar className="h-24 w-24 ring-2 ring-green-500/50 transition-transform group-hover:scale-[1.06]">
                        <AvatarImage
                          src={getImageUrl(user.profilePhoto) || undefined}
                          alt={user.name || 'User'}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-2xl font-bold">
                          {showClientIconFallback ? (
                            <UserIcon className="h-10 w-10 text-white/90" />
                          ) : (
                            user.name?.charAt(0)?.toUpperCase() || 'U'
                          )}
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
        )}

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

      {/* Profile Incomplete Dialog */}
      <ProfileIncompleteDialog
        isOpen={showProfileIncompleteDialog}
        onClose={() => setShowProfileIncompleteDialog(false)}
        missingFields={missingProfileFields}
      />
      {/* Coin Purchase Modal */}
      <CoinPurchaseModalWrapper
        isOpen={showCoinPurchaseModal}
        onClose={() => setShowCoinPurchaseModal(false)}
        requiredCoins={requiredCoins}
        onPurchaseSuccess={retryChat}
      />
    </Card>
  );
};
