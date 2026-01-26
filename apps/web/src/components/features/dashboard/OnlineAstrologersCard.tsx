/**
 * Online Astrologers Card Component
 * Shows online astrologers count with gradient card and avatars
 */

'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Circle, MessageSquare } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback, Skeleton } from '@jyotish/ui';
import { useStore } from '@/store';
import { QUERY_KEYS } from '@/constants';
import { getImageUrl } from '@/utils/image.utils';
import userService from '@/services/user.service';
import { USER_ROLES } from '@/constants/role.constants';
import { ASTROLOGER_CATEGORY } from '@/constants/appointment.constants';
import { SimpleRequestChatButton } from './SimpleRequestChatButton';

export function OnlineAstrologersCard() {
  const onlineUsers = useStore((state) => state.onlineUsers);

  // Fetch chatable users
  const { data: users = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.USERS.CHATABLE,
    queryFn: userService.getChatableUsers,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Filter to show ONLY online astrologers (exclude PREMIUM)
  const onlineAstrologers = users.filter(
    (user) =>
      onlineUsers.has(user.id) &&
      user.role === USER_ROLES.ASTROLOGER &&
      user.category !== ASTROLOGER_CATEGORY.PREMIUM
  );

  const onlineCount = onlineAstrologers.length;
  const displayAstrologers = onlineAstrologers.slice(0, 4); // Show max 4 avatars

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Gradient Card with Yellowish Gradient */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#d8287c] via-[#ff6b35] via-[#f7931e] to-[#fbbf24] shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-orange-500/10 to-transparent" />
        <div className="relative p-6">
          {/* Top Section */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Circle className="h-3 w-3 text-green-400 fill-green-400" />
              </div>
              <span className="text-white font-semibold text-base">
                {isLoading ? (
                  <Skeleton className="h-5 w-40 bg-white/20" />
                ) : (
                  `${onlineCount} Astrologers Online Now`
                )}
              </span>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center">
            <SimpleRequestChatButton />
          </div>
        </div>
      </div>

      {/* Additional Info Card */}
      <div className="rounded-xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 via-orange-500/5 to-transparent p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
            <MessageSquare className="h-4 w-4 text-yellow-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white mb-1">Instant Connection</p>
            <p className="text-xs text-gray-400">
              Get instant answers from verified Jyotish. Start chatting now!
            </p>
          </div>
        </div>
      </div>

      {/* Astrologer Avatars Section */}
      {displayAstrologers.length > 0 ? (
        <div className="flex flex-col gap-3 mt-5">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="text-xs text-gray-400 font-medium">Available Now</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
          <div className="flex items-center justify-center gap-4">
            {displayAstrologers.map((astrologer) => (
              <div key={astrologer.id} className="relative group">
                <Avatar className="h-16 w-16 border-2 border-yellow-500/40 group-hover:border-yellow-500/70 transition-all cursor-pointer shadow-lg">
                  <AvatarImage
                    src={getImageUrl(astrologer.profilePhoto) || undefined}
                    alt={astrologer.name || 'Astrologer'}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-yellow-600/80 via-orange-600/80 to-red-600/80 text-white text-base font-semibold">
                    {(astrologer.name || 'A').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-900 shadow-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-8 rounded-xl border border-white/10 bg-gradient-to-br from-yellow-500/5 via-orange-500/5 to-transparent">
          <Circle className="h-8 w-8 text-gray-500" />
          <p className="text-sm text-gray-400 text-center">No astrologers online at the moment</p>
          <p className="text-xs text-gray-500 text-center">Check back soon!</p>
        </div>
      )}
    </div>
  );
}
