/**
 * Recent Activity - Clean list of recent consultations/chats
 */

'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Skeleton,
} from '@jyotish/ui';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Calendar, Sparkles } from 'lucide-react';
import type { RecentActivity as RecentActivityType } from '@/services/jyotishDashboard.service';
import { getImageUrl } from '@/utils/image.utils';

interface RecentActivityProps {
  activities: RecentActivityType[];
  isLoading?: boolean;
}

const activityIcons = {
  consultation: Sparkles,
  chat: MessageSquare,
  appointment: Calendar,
};

export function RecentActivity({ activities, isLoading = false }: RecentActivityProps) {
  if (isLoading) {
    return (
      <Card className="bg-black/30 backdrop-blur-sm border border-white/[0.1] rounded-xl overflow-hidden shadow-lg shadow-black/10">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[#fafaf9] flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-indigo-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.04]">
                <Skeleton className="h-10 w-10 rounded-full bg-white/15" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40 bg-white/15" />
                  <Skeleton className="h-3 w-56 bg-white/15" />
                  <Skeleton className="h-3 w-24 bg-white/15" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="bg-black/30 backdrop-blur-sm border border-white/[0.1] rounded-xl overflow-hidden shadow-lg shadow-black/10">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[#fafaf9] flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-indigo-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-white/60 py-8 text-center">No recent activity</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/30 backdrop-blur-sm border border-white/[0.1] rounded-xl overflow-hidden shadow-lg shadow-black/10">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-[#fafaf9] flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-indigo-500" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type];
            const initials = activity.clientName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <li
                key={activity.id}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/[0.08] flex items-center justify-center overflow-hidden">
                  {activity.avatar ? (
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={getImageUrl(activity.avatar) || undefined} alt={activity.clientName} />
                      <AvatarFallback className="bg-indigo-500/30 text-indigo-300 text-xs font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Icon className="h-5 w-5 text-[#78716c]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#fafaf9]">{activity.title}</p>
                  <p className="text-xs text-[#78716c] truncate">{activity.description}</p>
                  <p className="text-[11px] text-[#57534e] mt-0.5">
                    {activity.clientName} · {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
