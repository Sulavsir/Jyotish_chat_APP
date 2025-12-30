/**
 * Jyotish Clients Page - Manage client profiles for astrologers
 */

'use client';

import { JyotishLayout } from '@/components/layouts/JyotishLayout';
import { useRequireAuth } from '@/hooks';
import { USER_ROLES } from '@/constants';
import { Card, CardContent, CardHeader, CardTitle, Input, Button } from '@jyotish/ui';
import { useState } from 'react';
import { LoadingScreenWithBackground } from '@/components/ui';

export default function JyotishClientsPage() {
  const { user, isCheckingAccess } = useRequireAuth({
    requiredRole: USER_ROLES.ASTROLOGER,
  });
  const [searchQuery, setSearchQuery] = useState('');

  if (isCheckingAccess) {
    return <LoadingScreenWithBackground message="Verifying access..." />;
  }

  const clients = [
    {
      name: 'Ramesh Kumar',
      phone: '9812345678',
      zodiac: 'Aries',
      consultations: 12,
      lastSession: '2 days ago',
      status: 'active',
    },
    {
      name: 'Sita Sharma',
      phone: '9823456789',
      zodiac: 'Taurus',
      consultations: 8,
      lastSession: '1 week ago',
      status: 'active',
    },
    {
      name: 'Prakash Thapa',
      phone: '9834567890',
      zodiac: 'Gemini',
      consultations: 5,
      lastSession: '3 weeks ago',
      status: 'inactive',
    },
    {
      name: 'Maya Gurung',
      phone: '9845678901',
      zodiac: 'Cancer',
      consultations: 15,
      lastSession: '1 day ago',
      status: 'active',
    },
  ];

  return (
    <JyotishLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Clients 👥</h1>
          <p className="text-gray-300">Manage your client profiles and history</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-primary to-primary/80 backdrop-blur-sm border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">24</div>
              <p className="text-xs mt-1">+3 this week</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary to-primary/80 backdrop-blur-sm border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">18</div>
              <p className="text-xs mt-1">Last 30 days</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary to-primary/80 backdrop-blur-sm border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">6</div>
              <p className="text-xs mt-1">+2 from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary to-primary/80 backdrop-blur-sm border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Avg. Consultations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">8.5</div>
              <p className="text-xs mt-1">Per client</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="bg-black/20 backdrop-blur-sm border-white/10">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Input
                type="text"
                placeholder="Search clients by name, phone, or zodiac sign..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
              <Button color="secondary">Search</Button>
            </div>
          </CardContent>
        </Card>

        {/* Clients List */}
        <Card className="bg-black/20 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white">All Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clients.map((client, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{client.name}</p>
                      <p className="text-sm text-gray-400">{client.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-8">
                    <div className="text-center hidden md:block">
                      <p className="text-xs text-gray-400">Zodiac</p>
                      <p className="text-sm text-white font-semibold">{client.zodiac}</p>
                    </div>
                    <div className="text-center hidden sm:block">
                      <p className="text-xs text-gray-400">Consultations</p>
                      <p className="text-sm text-white font-semibold">{client.consultations}</p>
                    </div>
                    <div className="text-center hidden lg:block">
                      <p className="text-xs text-gray-400">Last Session</p>
                      <p className="text-sm text-white">{client.lastSession}</p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        client.status === 'active'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {client.status}
                    </span>
                    <Button size="sm" variant="outline">
                      View Profile
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
