/**
 * Welcome Hero - Eye-catching welcome section for Jyotish dashboard
 */

'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface WelcomeHeroProps {
  name: string;
}

const GREETINGS = [
  'May the stars guide your day',
  'Your wisdom lights the path',
  'Connect, guide, inspire',
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function WelcomeHero({ name }: WelcomeHeroProps) {
  const timeGreeting = getGreeting();
  const tagline = GREETINGS[new Date().getDate() % GREETINGS.length];

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-gradient-to-r from-violet-500/10 via-amber-500/5 to-transparent">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.02\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-80" />
      <div className="relative px-6 py-5 sm:px-8 sm:py-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30">
            <Sparkles className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <p className="text-sm text-amber-400/90 font-medium">
              {timeGreeting}, <span className="text-[#fafaf9]">{name || 'Jyotish'}</span>
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-[#fafaf9] tracking-tight mt-0.5">
              Welcome to your portal
            </h1>
            <p className="text-sm text-[#a8a29e] mt-1 max-w-md">
              {tagline}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
