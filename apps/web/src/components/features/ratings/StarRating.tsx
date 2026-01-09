'use client';

/**
 * StarRating Component
 * Display star ratings with count
 */

import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  totalRatings?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export function StarRating({
  rating,
  totalRatings,
  size = 'md',
  showCount = true,
  className = '',
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const starSize = sizeClasses[size];
  const textSize = textSizeClasses[size];

  // Calculate full, half, and empty stars
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-0.5">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} className={`${starSize} fill-yellow-500 text-yellow-500`} />
        ))}

        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <Star className={`${starSize} text-gray-600`} />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star className={`${starSize} fill-yellow-500 text-yellow-500`} />
            </div>
          </div>
        )}

        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} className={`${starSize} text-gray-600`} />
        ))}
      </div>

      {/* Rating Value */}
      <span className={`${textSize} font-semibold text-white`}>{rating.toFixed(1)}</span>

      {/* Total Ratings Count */}
      {showCount && totalRatings !== undefined && (
        <span className={`${textSize} text-gray-400`}>({totalRatings})</span>
      )}
    </div>
  );
}
