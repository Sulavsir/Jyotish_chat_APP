/**
 * 404 Not Found Page - Custom error page with cosmic theme
 */

'use client';

import Link from 'next/link';
import { Button } from '@jyotish/ui';
import { ROUTES } from '@/constants';
import { useAuth } from '@/hooks';

export default function NotFound() {
  const { user, getDashboard } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
      {/* Animated Stars Background */}
      <div className="absolute inset-0">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: Math.random() * 3 + 'px',
              height: Math.random() * 3 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 2 + 's',
              animationDuration: Math.random() * 3 + 2 + 's',
            }}
          />
        ))}
      </div>

      {/* Floating Planets */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-20 left-20 w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-2xl animate-float"
          style={{ animationDelay: '0s' }}
        />
        <div
          className="absolute bottom-20 right-20 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 blur-2xl animate-float"
          style={{ animationDelay: '1s' }}
        />
        <div
          className="absolute top-1/2 right-1/3 w-24 h-24 rounded-full bg-gradient-to-br from-pink-500/20 to-red-500/20 blur-2xl animate-float"
          style={{ animationDelay: '2s' }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-4 space-y-8">
        {/* 404 Number with cosmic effect */}
        <div className="relative">
          <h1 className="text-[180px] font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-400 drop-shadow-[0_0_80px_rgba(168,85,247,0.8)] leading-none select-none">
            404
          </h1>

          {/* Orbiting stars around 404 */}
          <div className="absolute inset-0 pointer-events-none">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <div
                key={angle}
                className="absolute top-1/2 left-1/2 w-4 h-4"
                style={{
                  animation: `orbit404 8s linear infinite`,
                  animationDelay: `${(angle / 45) * 0.5}s`,
                }}
              >
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-500/50 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            Lost in Space
          </h2>
          <p className="text-xl text-gray-300">
            The page you&apos;re looking for has drifted into another dimension.
          </p>
          <p className="text-gray-400">
            Don&apos;t worry, even the best navigators sometimes lose their way among the stars.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <Link href={ROUTES.HOME}>
            <Button
              color="primary"
              size="lg"
              className="min-w-[200px] font-bold transform hover:scale-105 transition-transform"
            >
              🏠 Return Home
            </Button>
          </Link>
          {user && (
            <Link href={getDashboard()}>
              <Button
                color="secondary"
                size="lg"
                className="min-w-[200px] font-bold transform hover:scale-105 transition-transform"
              >
                📊 Go to Dashboard
              </Button>
            </Link>
          )}
        </div>

        {/* Decorative Element */}
        <div className="pt-12">
          <div className="inline-block p-6 rounded-full bg-white/5 backdrop-blur-sm border border-purple-500/30">
            <div className="text-6xl animate-bounce">🛸</div>
          </div>
        </div>

        {/* Fun message */}
        <p className="text-sm text-gray-500 italic pt-4">
          &quot;In space, no one can hear you 404...&quot;
        </p>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-20px) scale(1.1);
          }
        }

        @keyframes orbit404 {
          from {
            transform: rotate(0deg) translateX(200px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(200px) rotate(-360deg);
          }
        }

        :global(.animate-float) {
          animation: float 6s ease-in-out infinite;
        }

        @media (max-width: 640px) {
          @keyframes orbit404 {
            from {
              transform: rotate(0deg) translateX(120px) rotate(0deg);
            }
            to {
              transform: rotate(360deg) translateX(120px) rotate(-360deg);
            }
          }
        }
      `}</style>
    </div>
  );
}
