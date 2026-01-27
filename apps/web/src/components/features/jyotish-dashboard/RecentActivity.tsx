/**
 * Recent Activity Component
 * Displays recent activities from consultations, chats, and appointments
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Avatar, AvatarImage, AvatarFallback, Skeleton } from '@jyotish/ui';
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

const activityColors = {
  consultation: 'from-purple-500 to-pink-600',
  chat: 'from-orange-500 to-amber-600',
  appointment: 'from-yellow-500 to-orange-600',
};

export function RecentActivity({ activities, isLoading = false }: RecentActivityProps) {
  if (isLoading) {
    return (
      <Card className="bg-black/20 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-4 p-4 rounded-lg bg-white/5">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-64" />
                  <Skeleton className="h-3 w-24" />
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
      <Card className="bg-black/20 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            <p>No recent activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/20 backdrop-blur-sm border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-400" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type];
            const gradient = activityColors[activity.type];
            const initials = activity.clientName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={activity.id}
                className="flex items-start space-x-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-200 group"
              >
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg`}
                >
                  {activity.avatar ? (
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={getImageUrl(activity.avatar)} alt={activity.clientName} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold group-hover:text-white/90 transition-colors">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-400 truncate">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.clientName} • {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
