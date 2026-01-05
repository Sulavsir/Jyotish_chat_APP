'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@jyotish/ui';

const getTodayDate = () => {
  const today = new Date();
  return today.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const zodiacSigns = [
  { name: 'Aries', icon: '♈' },
  { name: 'Taurus', icon: '♉' },
  { name: 'Gemini', icon: '♊' },
  { name: 'Cancer', icon: '♋' },
  { name: 'Leo', icon: '♌' },
  { name: 'Virgo', icon: '♍' },
  { name: 'Libra', icon: '♎' },
  { name: 'Scorpio', icon: '♏' },
  { name: 'Sagittarius', icon: '♐' },
  { name: 'Capricorn', icon: '♑' },
  { name: 'Aquarius', icon: '♒' },
  { name: 'Pisces', icon: '♓' },
];

export default function HoroscopePage() {
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const todayDate = getTodayDate();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            ⭐ Daily Horoscope
          </h1>
          <p className="text-gray-400">
            Discover your cosmic forecast •{' '}
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Zodiac Sign Selection */}
        <Card className="bg-black/40 backdrop-blur-md border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white">Select Your Zodiac Sign</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {zodiacSigns.map((sign) => (
                <button
                  key={sign.name}
                  onClick={() => setSelectedSign(sign.name)}
                  className={`p-4 rounded-lg border transition-all ${
                    selectedSign === sign.name
                      ? 'bg-purple-600/40 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/50'
                  }`}
                >
                  <div className="text-4xl mb-2">{sign.icon}</div>
                  <p className="text-white font-medium text-sm">{sign.name}</p>
                  <p className="text-gray-400 text-xs mt-1">{todayDate}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Horoscope Content */}
        {selectedSign ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-black/40 backdrop-blur-md border-white/10 hover:border-pink-500/50 transition-all">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <div className="p-2 bg-pink-500/20 rounded-lg">
                    <span className="text-xl">💜</span>
                  </div>
                  Love
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                  Your romantic connections shine brightly today. Venus&apos;s position brings harmony
                  and understanding to your relationships.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Rating:</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < 4 ? 'text-yellow-400' : 'text-gray-600'}>
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 backdrop-blur-md border-white/10 hover:border-blue-500/50 transition-all">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <span className="text-xl">💼</span>
                  </div>
                  Career
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                  Professional opportunities are on the horizon. Mercury&apos;s alignment favors
                  communication and new projects.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Rating:</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < 3 ? 'text-yellow-400' : 'text-gray-600'}>
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 backdrop-blur-md border-white/10 hover:border-green-500/50 transition-all">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <span className="text-xl">🌱</span>
                  </div>
                  Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                  Energy levels are high. Focus on balance and self-care. The moon&apos;s phase supports
                  wellness activities.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Rating:</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < 5 ? 'text-yellow-400' : 'text-gray-600'}>
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="bg-black/40 backdrop-blur-md border-white/10">
            <CardContent className="py-20">
              <div className="text-center">
                <div className="text-6xl mb-4">🌟</div>
                <h3 className="text-xl font-semibold text-white mb-2">Select Your Zodiac Sign</h3>
                <p className="text-gray-400">
                  Choose your zodiac sign above to view your personalized daily horoscope
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscribe to Daily Horoscope */}
        <Card className="bg-slate-900/50 backdrop-blur-md border-slate-700">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">📧 Never Miss Your Horoscope</h3>
                <p className="text-gray-300 text-sm">
                  Subscribe to receive your daily cosmic forecast via SMS every morning
                </p>
              </div>
              <Button color="primary" className="whitespace-nowrap">
                Subscribe Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
