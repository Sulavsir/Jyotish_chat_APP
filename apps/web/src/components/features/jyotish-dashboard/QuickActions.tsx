/**
 * Quick Actions Component
 * Displays quick action buttons for common tasks
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@jyotish/ui';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants';
import { MessageSquare, Calendar, User, Settings, Sparkles, Clock } from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  gradient: string;
  borderColor: string;
}

const quickActions: QuickAction[] = [
  {
    id: 'chat',
    label: 'Start Chat',
    description: 'Connect with clients',
    icon: MessageSquare,
    route: ROUTES.JYOTISH_CHAT,
    gradient: 'from-orange-600/30 to-amber-600/30',
    borderColor: 'orange-500',
  },
  {
    id: 'appointments',
    label: 'View Schedule',
    description: 'Manage appointments',
    icon: Calendar,
    route: ROUTES.JYOTISH_APPOINTMENTS,
    gradient: 'from-yellow-600/30 to-orange-600/30',
    borderColor: 'yellow-500',
  },
  {
    id: 'profile',
    label: 'My Profile',
    description: 'Update your details',
    icon: User,
    route: ROUTES.JYOTISH_PROFILE,
    gradient: 'from-amber-600/30 to-yellow-600/30',
    borderColor: 'amber-500',
  },
  {
    id: 'consultations',
    label: 'Consultations',
    description: 'View consultations',
    icon: Sparkles,
    route: ROUTES.JYOTISH_CONSULTATIONS,
    gradient: 'from-purple-600/30 to-pink-600/30',
    borderColor: 'purple-500',
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Manage preferences',
    icon: Settings,
    route: ROUTES.JYOTISH_SETTINGS,
    gradient: 'from-blue-600/30 to-indigo-600/30',
    borderColor: 'blue-500',
  },
];

export function QuickActions() {
  const router = useRouter();

  return (
    <Card className="bg-black/20 backdrop-blur-sm border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-400" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => router.push(action.route)}
                className={`p-6 rounded-lg bg-gradient-to-br ${action.gradient} border border-white/20 hover:border-white/40 transition-all duration-300 group cursor-pointer shadow-lg hover:shadow-xl`}
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300 flex items-center justify-center">
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-white font-semibold mb-1 text-center">{action.label}</h3>
                <p className="text-sm text-gray-400 text-center group-hover:text-gray-300 transition-colors">
                  {action.description}
                </p>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
