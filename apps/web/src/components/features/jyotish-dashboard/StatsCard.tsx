/**
 * Stats Card - Clean card for dashboard metrics
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@jyotish/ui';
import { Skeleton } from '@jyotish/ui';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  gradient: string;
  borderColor: string;
  isLoading?: boolean;
  href?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  borderColor,
  isLoading = false,
  href,
}: StatsCardProps) {
  if (isLoading) {
    return (
      <Card className="bg-black/40 backdrop-blur-sm border border-white/[0.12] rounded-xl overflow-hidden">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-28 bg-white/15" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-8 w-20 bg-white/15" />
          <Skeleton className="h-3 w-36 bg-white/15" />
        </CardContent>
      </Card>
    );
  }

  const cardContent = (
    <>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-white/80">{title}</CardTitle>
        <div className={`p-2 rounded-lg transition-colors ${gradient}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
        {subtitle && (
          <p className="text-xs text-white/60 mt-1 leading-relaxed">{subtitle}</p>
        )}
      </CardContent>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        <Card className="group bg-black/40 backdrop-blur-sm border border-white/[0.12] rounded-xl overflow-hidden hover:bg-black/50 hover:border-white/[0.18] transition-all duration-200 shadow-lg shadow-black/20 cursor-pointer">
          {cardContent}
        </Card>
      </Link>
    );
  }

  return (
    <Card className="group bg-black/40 backdrop-blur-sm border border-white/[0.12] rounded-xl overflow-hidden hover:bg-black/50 hover:border-white/[0.18] transition-all duration-200 shadow-lg shadow-black/20">
      {cardContent}
    </Card>
  );
}
