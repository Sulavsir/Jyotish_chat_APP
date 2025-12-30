/**
 * Jyotish Dashboard Page - Main dashboard for astrologers
 */

'use client';

import { JyotishLayout } from '@/components/layouts/JyotishLayout';
import { useRequireAuth } from '@/hooks';
import { USER_ROLES } from '@/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@jyotish/ui';
import { useRouter } from 'next/navigation';
import { LoadingScreenWithBackground } from '@/components/ui';
import { OnlineUsers } from '@/components/features/chat';

export default function JyotishDashboardPage() {
  const router = useRouter();
  const { user, isCheckingAccess } = useRequireAuth({
    requiredRole: USER_ROLES.ASTROLOGER,
  });

  // Show loading state while checking access - prevents any flash of content
  if (isCheckingAccess) {
    return <LoadingScreenWithBackground message="Verifying access..." />;
  }

  return (
    <JyotishLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Welcome, {user?.name || 'Jyotish'}! 🙏</h1>
          <p className="text-gray-300">
            Manage your consultations, clients, and astrological services
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-primary to-primary/80 backdrop-blur-sm border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium ">Today&apos;s Consultations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">5</div>
              <p className="text-xs  mt-1">3 completed, 2 upcoming</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary to-primary/80 backdrop-blur-sm border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium ">Active Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">24</div>
              <p className="text-xs  mt-1">+3 this week</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary to-primary/80 backdrop-blur-sm border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium ">Pending Chats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">8</div>
              <p className="text-xs  mt-1">2 require urgent response</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary to-primary/80 backdrop-blur-sm border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium ">This Month&apos;s Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">NPR 45,000</div>
              <p className="text-xs  mt-1">+12% from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Online Clients - Who's Active Now */}
        <OnlineUsers title="Active Clients - Connect Now!" maxUsers={6} />

        {/* Quick Actions */}
        <Card className="bg-black/20 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => router.push('/jyotish/chat')}
                className="p-6 rounded-lg bg-gradient-to-br from-orange-600/30 to-amber-600/30 border border-orange-500/30 hover:from-orange-600/40 hover:to-amber-600/40 transition-all group"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">💬</div>
                <h3 className="text-white font-semibold mb-1">Start Chat</h3>
                <p className="text-sm text-gray-400">Connect with clients</p>
              </button>

              <button
                onClick={() => router.push('/jyotish/consultations')}
                className="p-6 rounded-lg bg-gradient-to-br from-yellow-600/30 to-orange-600/30 border border-yellow-500/30 hover:from-yellow-600/40 hover:to-orange-600/40 transition-all group"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📅</div>
                <h3 className="text-white font-semibold mb-1">View Schedule</h3>
                <p className="text-sm text-gray-400">Manage appointments</p>
              </button>

              <button
                onClick={() => router.push('/jyotish/clients')}
                className="p-6 rounded-lg bg-gradient-to-br from-amber-600/30 to-yellow-600/30 border border-amber-500/30 hover:from-amber-600/40 hover:to-yellow-600/40 transition-all group"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">👥</div>
                <h3 className="text-white font-semibold mb-1">View Clients</h3>
                <p className="text-sm text-gray-400">Browse client profiles</p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-black/20 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold">
                  R
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">New consultation booked</p>
                  <p className="text-sm text-gray-400">Ramesh Kumar - Birth Chart Reading</p>
                  <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white font-bold">
                  S
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">Chat message received</p>
                  <p className="text-sm text-gray-400">Sita Sharma - Question about career</p>
                  <p className="text-xs text-gray-500 mt-1">5 hours ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white font-bold">
                  P
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">Consultation completed</p>
                  <p className="text-sm text-gray-400">Prakash Thapa - Horoscope Matching</p>
                  <p className="text-xs text-gray-500 mt-1">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </JyotishLayout>
  );
}
