'use client';

import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage, Card, CardContent, CardHeader, CardTitle } from '@jyotish/ui';
import { Users } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { QUERY_KEYS, WS_EVENTS } from '@/constants';
import jyotishDashboardService from '@/services/jyotishDashboard.service';
import { getImageUrl } from '@/utils/image.utils';

const DEFAULT_LIMIT = 12;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

export function OnlineAstrologersPanel() {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.JYOTISH_DASHBOARD.ONLINE_ASTROLOGERS, DEFAULT_LIMIT],
    queryFn: () => jyotishDashboardService.getOnlineAstrologers(DEFAULT_LIMIT),
    staleTime: 30_000,
  });

  const astrologers = useMemo(() => data ?? [], [data]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const onStatusChange = () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.JYOTISH_DASHBOARD.ONLINE_ASTROLOGERS,
      });
    };

    socket.on(WS_EVENTS.ASTROLOGER_STATUS_CHANGED, onStatusChange);
    return () => {
      socket.off(WS_EVENTS.ASTROLOGER_STATUS_CHANGED, onStatusChange);
    };
  }, [socket, isConnected, queryClient]);

  return (
    <Card className="bg-black/30 backdrop-blur-sm border border-white/[0.1] rounded-xl overflow-hidden shadow-lg shadow-black/10">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-[#fafaf9] flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-emerald-500" />
          Online Jyotish ({astrologers.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-white/70">Loading online astrologers...</p>
        ) : astrologers.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Users className="h-4 w-4 text-white/50" />
            No other astrologers are online right now.
          </div>
        ) : (
          <div className="space-y-3">
            {astrologers.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    <Avatar className="h-9 w-9 border border-white/15">
                      <AvatarImage src={getImageUrl(a.profilePhoto) ?? undefined} alt={a.name} />
                      <AvatarFallback className="bg-white/10 text-white text-xs">
                        {initials(a.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-black/80" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{a.name}</p>
                    <p className="text-xs text-white/60 truncate">
                      {a.category} - {a.totalConsultations} consultations
                    </p>
                  </div>
                </div>
                <span className="text-xs text-amber-300 shrink-0">★ {a.rating.toFixed(1)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

