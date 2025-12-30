'use client';

import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@jyotish/ui';

export default function ConsultationsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            📅 Consultations
          </h1>
          <p className="text-gray-400">Book and manage your astrology sessions</p>
        </div>

        {/* Consultation Types */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-black/40 backdrop-blur-md border-white/10 hover:border-blue-500/50 transition-all group">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                  <span className="text-2xl">💬</span>
                </div>
                <span>Chat Consultation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-4xl font-bold text-white mb-1">$20</p>
                <p className="text-sm text-gray-400">per 15 minutes</p>
              </div>
              <p className="text-gray-300 text-sm mb-6">
                Get instant guidance through text chat with experienced astrologers.
              </p>
              <Button className="w-full" color="info">
                Book Now
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-md border-white/10 hover:border-purple-500/50 transition-all group">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                  <span className="text-2xl">🎙️</span>
                </div>
                <span>Voice Consultation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-4xl font-bold text-white mb-1">$30</p>
                <p className="text-sm text-gray-400">per 15 minutes</p>
              </div>
              <p className="text-gray-300 text-sm mb-6">
                Have a personal conversation with astrologers via voice call.
              </p>
              <Button className="w-full" color="primary">
                Book Now
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-md border-white/10 hover:border-amber-500/50 transition-all group">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg group-hover:bg-amber-500/30 transition-colors">
                  <span className="text-2xl">📹</span>
                </div>
                <span>Video Consultation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-4xl font-bold text-white mb-1">$50</p>
                <p className="text-sm text-gray-400">per 15 minutes</p>
              </div>
              <p className="text-gray-300 text-sm mb-6">
                Face-to-face video sessions for comprehensive astrological guidance.
              </p>
              <Button className="w-full" color="warning">
                Book Now
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Consultations */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Upcoming Consultations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📆</div>
              <p className="text-gray-400 mb-2">No upcoming consultations</p>
              <p className="text-sm text-gray-500">Book your first session to get started!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
