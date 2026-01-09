'use client';

/**
 * AstrologerCardSkeleton Component
 * Skeleton loader for astrologer cards
 */

import { Card, CardContent } from '@jyotish/ui';

export function AstrologerCardSkeleton() {
  return (
    <Card className="bg-black/40 backdrop-blur-md border-white/10 animate-pulse">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar Skeleton */}
          <div className="h-16 w-16 rounded-full bg-white/10 flex-shrink-0" />
          <div className="flex-1 space-y-3">
            {/* Name Skeleton */}
            <div className="h-5 bg-white/10 rounded w-3/4" />
            {/* Badge Skeleton */}
            <div className="h-4 bg-white/10 rounded w-1/2" />
            {/* Bio Skeleton */}
            <div className="space-y-2 mt-2">
              <div className="h-3 bg-white/10 rounded w-full" />
              <div className="h-3 bg-white/10 rounded w-5/6" />
            </div>
            {/* Rating Skeleton */}
            <div className="h-4 bg-white/10 rounded w-1/3" />
            {/* Experience Skeleton */}
            <div className="h-3 bg-white/10 rounded w-2/5" />
            {/* Tags Skeleton */}
            <div className="flex gap-2 mt-2">
              <div className="h-5 bg-white/10 rounded w-16" />
              <div className="h-5 bg-white/10 rounded w-20" />
              <div className="h-5 bg-white/10 rounded w-14" />
            </div>
            {/* Footer Skeleton */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-4">
              <div className="space-y-1">
                <div className="h-3 bg-white/10 rounded w-20" />
                <div className="h-4 bg-white/10 rounded w-12" />
              </div>
              <div className="h-9 bg-white/10 rounded w-24" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * AstrologerGridSkeleton Component
 * Grid of astrologer card skeletons
 */
export function AstrologerGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <AstrologerCardSkeleton key={i} />
      ))}
    </div>
  );
}
