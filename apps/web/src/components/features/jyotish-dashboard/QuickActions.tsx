/**
 * Quick Actions - Simple action cards for dashboard
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@jyotish/ui';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants';
import { MessageSquare, Calendar, User, Settings, Sparkles } from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
}

const quickActions: QuickAction[] = [
  {
    id: 'chat',
    label: 'Start Chat',
    description: 'Connect with clients',
    icon: MessageSquare,
    route: ROUTES.JYOTISH_CHAT,
  },
  {
    id: 'appointments',
    label: 'View Schedule',
    description: 'Manage appointments',
    icon: Calendar,
    route: ROUTES.JYOTISH_APPOINTMENTS,
  },
  {
    id: 'profile',
    label: 'My Profile',
    description: 'Update your details',
    icon: User,
    route: ROUTES.JYOTISH_PROFILE,
  },
  {
    id: 'consultations',
    label: 'Consultations',
    description: 'View consultations',
    icon: Sparkles,
    route: ROUTES.JYOTISH_CONSULTATIONS,
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Manage preferences',
    icon: Settings,
    route: ROUTES.JYOTISH_SETTINGS,
  },
];

export function QuickActions() {
  const router = useRouter();

  return (
    <Card className="bg-black/30 backdrop-blur-sm border border-white/[0.1] rounded-xl overflow-hidden shadow-lg shadow-black/10">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-[#fafaf9] flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-amber-500" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => router.push(action.route)}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-amber-500/10 hover:border-amber-500/30 text-left transition-all duration-200 group"
              >
                <div className="p-2.5 rounded-lg bg-amber-500/15 text-amber-400 group-hover:bg-amber-500/25 group-hover:scale-105 transition-all">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[#fafaf9] text-sm">{action.label}</p>
                  <p className="text-xs text-white/60 truncate">{action.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
