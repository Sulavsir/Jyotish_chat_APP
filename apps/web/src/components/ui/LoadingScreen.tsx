/**
 * LoadingScreen Component - Full page loading with cosmic theme
 */

'use client';

import { useState, useEffect } from 'react';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Initializing...' }: LoadingScreenProps) {
  const [dots, setDots] = useState('');
  const [stars, setStars] = useState<Array<{ width: number; height: number; top: number; left: number; delay: number; duration: number }>>([]);

  // Generate stars only on client side after hydration
  useEffect(() => {
    const generatedStars = [...Array(50)].map(() => ({
      width: Math.random() * 3,
      height: Math.random() * 3,
      top: Math.random() * 100,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: Math.random() * 3 + 2,
    }));
    setStars(generatedStars);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
      {/* Animated Stars Background */}
      <div className="absolute inset-0">
        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: star.width + 'px',
              height: star.height + 'px',
              top: star.top + '%',
              left: star.left + '%',
              animationDelay: star.delay + 's',
              animationDuration: star.duration + 's',
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center space-y-8">
        {/* Cosmic Loader */}
        <div className="relative w-32 h-32 mx-auto">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />

          {/* Middle rotating ring */}
          <div
            className="absolute inset-2 rounded-full border-4 border-pink-500/30 border-t-pink-500 animate-spin"
            style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}
          />

          {/* Inner rotating ring */}
          <div
            className="absolute inset-4 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin"
            style={{ animationDuration: '2s' }}
          />

          {/* Center glow */}
          <div className="absolute inset-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 animate-pulse" />

          {/* Orbiting particles */}
          <div className="absolute inset-0">
            {[0, 120, 240].map((angle) => (
              <div
                key={angle}
                className="absolute top-1/2 left-1/2 w-3 h-3 -ml-1.5 -mt-1.5"
                style={{
                  animation: `orbit 3s linear infinite`,
                  animationDelay: `${angle / 120}s`,
                }}
              >
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-500/50" />
              </div>
            ))}
          </div>
        </div>

        {/* Loading Text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
            {message}
            <span className="inline-block w-8 text-left">{dots}</span>
          </h2>
          <p className="text-gray-400 text-sm">Connecting to the cosmos</p>
        </div>

        {/* Animated progress bars */}
        <div className="w-64 mx-auto space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full"
                style={{
                  animation: `loadingBar 2s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes orbit {
          from {
            transform: rotate(0deg) translateX(60px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(60px) rotate(-360deg);
          }
        }

        @keyframes loadingBar {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
