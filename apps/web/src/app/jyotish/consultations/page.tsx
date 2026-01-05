/**
 * Jyotish Consultations Page - Manage chat consultations for astrologers
 */

'use client';

import { JyotishLayout } from '@/components/layouts/JyotishLayout';
import { useRequireAuth } from '@/hooks';
import { USER_ROLES } from '@/constants';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@jyotish/ui';
import { LoadingScreenWithBackground } from '@/components/ui';

export default function JyotishConsultationsPage() {
  const { user, isCheckingAccess } = useRequireAuth({
    requiredRole: USER_ROLES.ASTROLOGER,
  });

  if (isCheckingAccess) {
    return <LoadingScreenWithBackground message="Verifying access..." />;
  }

  return (
    <JyotishLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white">Chat Sessions 💬</h1>
            <p className="text-gray-300">Manage your chat consultations with clients</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-black/40 backdrop-blur-md border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white">Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">5</div>
              <p className="text-xs mt-1 text-gray-400">3 completed, 2 active</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-md border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">18</div>
              <p className="text-xs mt-1 text-gray-400">12 completed</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-md border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">2</div>
              <p className="text-xs mt-1 text-gray-400">In progress now</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-md border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white">Total This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">42</div>
              <p className="text-xs mt-1 text-gray-400">+8 from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Chat Sessions */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Active Chat Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  client: 'Ramesh Kumar',
                  type: 'Birth Chart Reading',
                  time: 'Started 15 min ago',
                  duration: '30 min session',
                  status: 'active',
                },
                {
                  client: 'Sita Sharma',
                  type: 'Career Guidance',
                  time: 'Scheduled for 2:30 PM',
                  duration: '20 min session',
                  status: 'scheduled',
                },
              ].map((consultation, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold">
                      {consultation.client.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{consultation.client}</p>
                      <p className="text-sm text-gray-400">{consultation.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-white">{consultation.time}</p>
                      <p className="text-xs text-gray-400">{consultation.duration}</p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        consultation.status === 'active'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {consultation.status}
                    </span>
                    <Button size="sm" variant="outline">
                      {consultation.status === 'active' ? 'Continue' : 'View'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Completed Sessions */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Recent Completed Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  client: 'Prakash Thapa',
                  type: 'Relationship Reading',
                  time: 'Completed 2 hours ago',
                  duration: '25 min',
                  rating: 5,
                },
                {
                  client: 'Maya Gurung',
                  type: 'Life Path Guidance',
                  time: 'Completed yesterday',
                  duration: '35 min',
                  rating: 4,
                },
              ].map((consultation, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold">
                      {consultation.client.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-medium">{consultation.client}</p>
                      <p className="text-xs text-gray-400">{consultation.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-gray-400">{consultation.time}</p>
                      <p className="text-xs text-gray-500">{consultation.duration}</p>
                    </div>
                    <div className="flex">
                      {[...Array(5)].map((_, idx) => (
                        <span
                          key={idx}
                          className={
                            idx < consultation.rating ? 'text-yellow-400' : 'text-gray-600'
                          }
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </JyotishLayout>
  );
}
