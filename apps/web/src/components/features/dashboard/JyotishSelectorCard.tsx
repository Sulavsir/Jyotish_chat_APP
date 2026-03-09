/**
 * Jyotish Selector Card Component
 * Displays detailed astrologer information in a card format
 */

'use client';

import React from 'react';
import { Star, ExternalLink } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback, Badge, Button } from '@jyotish/ui';
import { getImageUrl } from '@/utils/image.utils';
import type { PublicAstrologerProfile } from '@/types/astrologer';
import { ASTROLOGER_CATEGORY_LABELS, AstrologerCategory } from '@/types/astrologer';
import { ROUTE_BUILDERS } from '@/constants';
import { useRouter } from 'next/navigation';
import { useCoinRates } from '@/hooks/useCoinRates';

interface JyotishSelectorCardProps {
  astrologer: PublicAstrologerProfile;
  isSelected?: boolean;
}

export function JyotishSelectorCard({ astrologer, isSelected = false }: JyotishSelectorCardProps) {
  const router = useRouter();
  const { rates } = useCoinRates(true);
  const isAppointmentOnly =
    astrologer.category === AstrologerCategory.PREMIUM ||
    astrologer.category === AstrologerCategory.KATHA_VACHAK;
  const perMessageFeeNr = astrologer.chatMessageFee ?? null;
  const chatCoinCost = isAppointmentOnly
    ? 0
    : perMessageFeeNr != null && rates?.COINS_PER_NPR
      ? perMessageFeeNr * rates.COINS_PER_NPR
      : rates?.CHAT_PER_MESSAGE ?? null;

  const handleViewProfilePointerDown = (e: React.PointerEvent) => {
    // Completely bypass Radix Select's item selection by cancelling the pointer event
    e.preventDefault();
    e.stopPropagation();
    router.push(ROUTE_BUILDERS.ASTROLOGER_PROFILE(astrologer.id));
  };

  const initials = astrologer.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const categoryLabel = ASTROLOGER_CATEGORY_LABELS[astrologer.category];
  const isPremium = astrologer.category === AstrologerCategory.PREMIUM;
  const isFree = chatCoinCost === 0;
  const rating = astrologer.rating ?? 0;
  const ratingCount = astrologer.totalConsultations ?? 0;

  // Determine gradient based on category
  const getGradient = () => {
    if (isPremium) {
      return 'from-orange-500/20 to-amber-500/20 border-orange-500/40';
    }
    return 'from-purple-500/20 to-pink-500/20 border-purple-500/40';
  };

  const getButtonGradient = () => {
    if (isPremium) {
      return 'from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700';
    }
    return 'from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700';
  };

  return (
    <div
      className={`w-full min-w-full p-3 rounded-lg bg-gradient-to-br ${getGradient()} transition-all duration-300 hover:scale-[1.01] hover:shadow-lg ${
        isSelected ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-gray-900' : ''
      }`}
    >
      <div className="flex gap-3 items-start">
        {/* Profile Picture with Glowing Border */}
        <div className="relative flex-shrink-0">
          <div
            className={`absolute inset-0 rounded-full ${
              isPremium
                ? 'bg-gradient-to-r from-orange-400 to-amber-400 blur-md opacity-60'
                : 'bg-gradient-to-r from-purple-400 to-pink-400 blur-md opacity-60'
            }`}
          />
          <Avatar className="relative h-14 w-14 border-2 border-white/20">
            <AvatarImage
              src={getImageUrl(astrologer.profilePhoto) || undefined}
              alt={astrologer.name}
            />
            <AvatarFallback
              className={`${
                isPremium
                  ? 'bg-gradient-to-br from-orange-500 to-amber-600'
                  : 'bg-gradient-to-br from-purple-500 to-pink-600'
              } text-white font-bold`}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          {astrologer.isOnline && (
            <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-400 rounded-full border-2 border-gray-900" />
          )}
        </div>

        {/* Content - Compact Layout */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {/* Name, Category, and Premium Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-bold text-base truncate">{astrologer.name}</h3>
            {isPremium && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs px-1.5 py-0.5">
                Premium
              </Badge>
            )}
            <Badge
              variant="outline"
              className="text-xs text-cyan-200 border-gray-600 bg-gray-800/50 px-1.5 py-0.5"
            >
              {categoryLabel}
            </Badge>
          </div>

          {/* Rating, Experience, and Fee */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-2.5 w-2.5 ${
                    star <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'
                  }`}
                />
              ))}
              <span className="text-xs text-gray-400 ml-1">
                {rating.toFixed(1)} ({ratingCount})
              </span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {astrologer.experience && (
                <span className="text-xs text-white">{astrologer.experience} years experience</span>
              )}
              {isAppointmentOnly ? (
                <span className="text-xs text-amber-300">Appointment only</span>
              ) : perMessageFeeNr != null && perMessageFeeNr > 0 && chatCoinCost != null ? (
                <span className="text-xs text-amber-300">
                  {perMessageFeeNr} NRs/message
                </span>
              ) : chatCoinCost != null ? (
                <span className="text-xs text-amber-300">
                  {Math.round(chatCoinCost / (rates?.COINS_PER_NPR ?? 1))} NRs/message
                </span>
              ) : (
                <span className="text-xs text-red-300">Instant chat fee not set</span>
              )}
            </div>
          </div>

          {/* Specialization Tags */}
          {astrologer.specialization && astrologer.specialization.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {astrologer.specialization.slice(0, 2).map((spec, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs text-yellow-300 border-gray-600 bg-gray-800/50 px-1.5 py-0.5"
                >
                  {spec}
                </Badge>
              ))}
            </div>
          )}

          {/* Description/Bio - Compact */}
          {astrologer.bio && <p className="text-xs text-gray-400 line-clamp-1">{astrologer.bio}</p>}
        </div>

        {/* View Profile Button - On the Right, Vertically Centered */}
        <div className="flex-shrink-0 self-center">
          <Button
            onPointerDown={handleViewProfilePointerDown}
            className={`bg-gradient-to-r ${getButtonGradient()} text-white text-xs py-1.5 px-3 h-auto shadow-lg`}
            size="sm"
          >
            <ExternalLink className="h-3 w-3 mr-1.5" />
            View Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
