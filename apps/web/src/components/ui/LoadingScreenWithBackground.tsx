/**
 * Loading Screen Component with Space-like Gradient Background
 * Uses CSS gradient instead of image for instant LCP (no 1.7MB image load)
 */

'use client';

import { TwinklingStars } from './TwinklingStars';

interface LoadingScreenWithBackgroundProps {
  message?: string;
}

export function LoadingScreenWithBackground({
  message = 'Loading...',
}: LoadingScreenWithBackgroundProps) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Gradient background - instant paint, no image LCP */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #0a0a0f 0%, #1a0a1f 30%, #0d0d14 60%, #0a0a0f 100%)',
        }}
        aria-hidden
      />
      <div className="absolute inset-0">
        <TwinklingStars count={60} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-purple-900/30 to-black/90" />
      </div>

      {/* Loading Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400 mb-4"></div>
          <p className="text-white text-lg font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
}

