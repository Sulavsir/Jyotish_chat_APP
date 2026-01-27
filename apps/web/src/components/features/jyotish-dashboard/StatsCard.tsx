/**
 * Stats Card Component
 * Displays a single statistic with icon and gradient background
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@jyotish/ui';
import { LucideIcon } from 'lucide-react';
import { Skeleton } from '@jyotish/ui';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  gradient: string;
  borderColor: string;
  isLoading?: boolean;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  borderColor,
  isLoading = false,
}: StatsCardProps) {
  if (isLoading) {
    return (
      <Card className={`bg-gradient-to-br ${gradient} backdrop-blur-sm border-${borderColor}/30`}>
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-3 w-40" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-to-br ${gradient} backdrop-blur-sm border-white/20 hover:border-white/40 transition-all duration-300 group shadow-lg`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-white/90">{title}</CardTitle>
          <div className="p-2 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-white mb-1">{value}</div>
        {subtitle && <p className="text-xs text-white/70 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
