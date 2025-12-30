/**
 * Loading Screen Component with Space Background
 * Matches the home page background for consistency
 */

'use client';

import Image from 'next/image';
import spaceImage from '@/assets/images/space.jpg';
import { TwinklingStars } from './TwinklingStars';

interface LoadingScreenWithBackgroundProps {
  message?: string;
}

export function LoadingScreenWithBackground({
  message = 'Loading...',
}: LoadingScreenWithBackgroundProps) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={spaceImage}
          alt="Cosmic Space"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        <TwinklingStars count={60} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-purple-900/30 to-black/90"></div>
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

