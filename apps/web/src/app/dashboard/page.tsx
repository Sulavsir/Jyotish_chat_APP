'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ROUTES } from '@/constants';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Alert,
  AlertTitle,
  AlertDescription,
  Button,
} from '@jyotish/ui';
import { useRequireAuth } from '@/hooks';
import { USER_ROLES } from '@/constants';
import { LoadingScreenWithBackground } from '@/components/ui';
import { OnlineUsers } from '@/components/features/chat';
import { RequestInstantChatButton } from '@/components/features/instant-chat/RequestInstantChatButton';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isCheckingAccess } = useRequireAuth({
    requiredRole: USER_ROLES.CLIENT,
  });
  const [showWelcomeAlert, setShowWelcomeAlert] = useState(true);

  // Show loading state while checking access - prevents any flash of content
  if (isCheckingAccess) {
    return <LoadingScreenWithBackground message="Verifying access..." />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome, {user?.name || 'User'}! 🌟
            </h1>
            <p className="text-gray-400">
              Your cosmic journey begins here. Explore your horoscope, chat with astrologers, or book
              a consultation.
            </p>
          </div>
          <RequestInstantChatButton />
        </div>

        {/* Welcome Alert - Dismissible Example */}
        {showWelcomeAlert && (
          <Alert variant="info" dismissible onDismiss={() => setShowWelcomeAlert(false)}>
            <AlertTitle>Welcome to Jyotish!</AlertTitle>
            <AlertDescription>
              Explore your personalized horoscope, chat with expert astrologers, and discover cosmic
              insights.{' '}
              {!user?.profileCompleted && user && (
                <Button
                  onClick={() => router.push(ROUTES.PROFILE)}
                  variant="link"
                  color="info"
                  size="sm"
                  className="text-white"
                >
                  Complete your profile
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-black/40 backdrop-blur-md border-white/10 hover:border-purple-500/50 transition-all">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <svg
                    className="w-5 h-5 text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <span>Messages</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white mb-1">0</p>
              <p className="text-sm text-gray-400">No new messages</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-md border-white/10 hover:border-blue-500/50 transition-all">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <svg
                    className="w-5 h-5 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <span>Consultations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white mb-1">0</p>
              <p className="text-sm text-gray-400">No upcoming sessions</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-md border-white/10 hover:border-amber-500/50 transition-all">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <svg
                    className="w-5 h-5 text-amber-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                </div>
                <span>Horoscope</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white mb-1">Today</p>
              <p className="text-sm text-gray-400">Check your daily horoscope</p>
            </CardContent>
          </Card>
        </div>

        {/* Online Astrologers - Who's Active Now */}
        <OnlineUsers title="Online Astrologers - Start Chatting Now!" maxUsers={10} />

        {/* Recent Activity */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <svg
                className="w-5 h-5 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🌌</div>
              <p className="text-gray-400 mb-1">No recent activity</p>
              <p className="text-sm text-gray-500">Start exploring the cosmic insights!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
