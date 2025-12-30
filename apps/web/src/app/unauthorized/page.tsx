'use client';

import Link from 'next/link';
import { Button } from '@jyotish/ui';
import { ROUTES, USER_ROLES } from '@/constants';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useEffect } from 'react';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  // Redirect to appropriate dashboard if user is logged in
  useEffect(() => {
    if (isAuthenticated && user && user.role) {
      const validDashboard =
        user.role === USER_ROLES.ASTROLOGER ? ROUTES.JYOTISH_DASHBOARD : ROUTES.DASHBOARD;

      setTimeout(() => {
        router.push(validDashboard);
      }, 1000);
    }
  }, [isAuthenticated, user, router]);

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

      {/* Floating Shields/Locks */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-20 left-20 w-32 h-32 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 blur-2xl animate-float"
          style={{ animationDelay: '0s' }}
        />
        <div
          className="absolute bottom-20 right-20 w-40 h-40 rounded-full bg-gradient-to-br from-yellow-500/20 to-red-500/20 blur-2xl animate-float"
          style={{ animationDelay: '1s' }}
        />
        <div
          className="absolute top-1/2 right-1/3 w-24 h-24 rounded-full bg-gradient-to-br from-orange-500/20 to-pink-500/20 blur-2xl animate-float"
          style={{ animationDelay: '2s' }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-4 space-y-8">
        {/* 401 Number with cosmic effect */}
        <div className="relative">
          <h1 className="text-[180px] font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-500 to-yellow-400 drop-shadow-[0_0_80px_rgba(239,68,68,0.8)] leading-none select-none">
            401
          </h1>

          {/* Orbiting lock icons around 401 */}
          <div className="absolute inset-0 pointer-events-none">
            {[0, 60, 120, 180, 240, 300].map((angle) => (
              <div
                key={angle}
                className="absolute top-1/2 left-1/2"
                style={{
                  animation: `orbit401 10s linear infinite`,
                  animationDelay: `${angle / 60}s`,
                }}
              >
                <div
                  className="text-4xl animate-pulse"
                  style={{ animationDelay: `${(angle / 60) * 0.5}s` }}
                >
                  🔒
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            Access Denied
          </h2>
          {isAuthenticated && user ? (
            <>
              <p className="text-xl text-gray-300">
                You don&apos;t have permission to access this area.
              </p>
              <p className="text-gray-400">Redirecting you to your dashboard...</p>
            </>
          ) : (
            <>
              <p className="text-xl text-gray-300">
                You don&apos;t have permission to access this cosmic realm.
              </p>
              <p className="text-gray-400">
                This area is protected by celestial forces. You need proper authorization to enter.
              </p>
            </>
          )}
        </div>

        {/* Security Shield Icon */}
        <div className="pt-4">
          <div className="inline-block relative">
            <div className="text-8xl animate-bounce">🛡️</div>
            {/* Pulsing rings around shield */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border-2 border-red-500/30 animate-ping" />
            </div>
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ animationDelay: '0.5s' }}
            >
              <div className="w-32 h-32 rounded-full border-2 border-orange-500/30 animate-ping" />
            </div>
          </div>
        </div>

        {/* Reason Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto pt-8">
          <div className="bg-white/5 backdrop-blur-sm border border-red-500/30 rounded-lg p-6 space-y-2">
            <div className="text-3xl">🚫</div>
            <h3 className="font-bold text-white">Not Logged In</h3>
            <p className="text-sm text-gray-400">You need to sign in first</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-orange-500/30 rounded-lg p-6 space-y-2">
            <div className="text-3xl">🔐</div>
            <h3 className="font-bold text-white">Insufficient Rights</h3>
            <p className="text-sm text-gray-400">Your role lacks permission</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-6 space-y-2">
            <div className="text-3xl">⏰</div>
            <h3 className="font-bold text-white">Session Expired</h3>
            <p className="text-sm text-gray-400">Please log in again</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <Link href={ROUTES.LOGIN}>
            <Button
              color="primary"
              size="lg"
              className="min-w-[200px] font-bold transform hover:scale-105 transition-transform"
            >
              🔑 Sign In
            </Button>
          </Link>
          <Button
            color="secondary"
            size="lg"
            className="min-w-[200px] font-bold transform hover:scale-105 transition-transform"
            onClick={() => router.back()}
          >
            ← Go Back
          </Button>
          <Link href={ROUTES.HOME}>
            <Button
              variant="outline"
              size="lg"
              className="min-w-[200px] font-bold transform hover:scale-105 transition-transform"
            >
              🏠 Home
            </Button>
          </Link>
        </div>

        {/* Fun message */}
        <p className="text-sm text-gray-500 italic pt-4">
          &quot;The cosmos keeps its secrets well protected...&quot;
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

        @keyframes orbit401 {
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
          @keyframes orbit401 {
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
