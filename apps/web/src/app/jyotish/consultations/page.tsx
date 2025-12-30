/**
 * Jyotish Consultations Page - Manage consultations for astrologers
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
            <h1 className="text-4xl font-bold text-white">Consultations 📅</h1>
            <p className="text-gray-300">Manage your appointments and sessions</p>
          </div>
          <Button color="primary" size="lg">
            + New Consultation
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-primary to-primary/80 backdrop-blur-sm border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">5</div>
              <p className="text-xs mt-1">3 completed, 2 upcoming</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary to-primary/80 backdrop-blur-sm border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">18</div>
              <p className="text-xs mt-1">12 confirmed</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary to-primary/80 backdrop-blur-sm border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">7</div>
              <p className="text-xs mt-1">Awaiting confirmation</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary to-primary/80 backdrop-blur-sm border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">42</div>
              <p className="text-xs mt-1">+8 from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Consultations */}
        <Card className="bg-black/20 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Upcoming Consultations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  client: 'Ramesh Kumar',
                  type: 'Birth Chart Reading',
                  time: 'Today, 2:00 PM',
                  duration: '60 min',
                  status: 'confirmed',
                },
                {
                  client: 'Sita Sharma',
                  type: 'Career Consultation',
                  time: 'Today, 4:30 PM',
                  duration: '45 min',
                  status: 'confirmed',
                },
                {
                  client: 'Prakash Thapa',
                  type: 'Horoscope Matching',
                  time: 'Tomorrow, 10:00 AM',
                  duration: '90 min',
                  status: 'pending',
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
                        consultation.status === 'confirmed'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {consultation.status}
                    </span>
                    <Button size="sm" variant="outline">
                      View
                    </Button>
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

