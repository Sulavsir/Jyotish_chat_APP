'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { QUERY_KEYS, WS_EVENTS } from '@/constants';
import astrologerService, { type AstrologerProfile } from '@/services/astrologer.service';
import { ConfirmDialog } from './ConfirmDialog';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@jyotish/ui';
import { LoadingButton } from './LoadingButton';

interface OnlineStatusToggleProps {
  initialStatus?: boolean;
}

export function OnlineStatusToggle({ initialStatus }: OnlineStatusToggleProps) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const { socket } = useSocket();
  const [isOnline, setIsOnline] = useState<boolean | null>(null); // null = loading
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<boolean | null>(null);

  // Fetch current astrologer profile to get online status
  const { data: profileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: QUERY_KEYS.ASTROLOGERS.PROFILE,
    queryFn: astrologerService.getAstrologerProfile,
    staleTime: 10000, // 10 seconds (shorter for fresher data on login)
    refetchOnMount: 'always', // Always refetch on component mount
  });

  // Update local state when profile data changes
  useEffect(() => {
    if (profileData?.astrologer) {
      setIsOnline(profileData.astrologer.isOnline || false);
    }
  }, [profileData]);

  // Listen to socket events for real-time status updates
  useEffect(() => {
    if (!socket || !currentUser) return;

    // Listen for astrologer status changes (including our own)
    const handleStatusChange = ({
      astrologerId,
      isOnline: newStatus,
    }: {
      astrologerId: string;
      isOnline: boolean;
    }) => {
      // Only update if it's our own status
      if (astrologerId === currentUser.id) {
        console.log(`🔄 Own status updated via socket: ${newStatus ? 'ONLINE' : 'OFFLINE'}`);
        setIsOnline(newStatus);

        // Also update the query cache immediately
        queryClient.setQueryData(
          QUERY_KEYS.ASTROLOGERS.PROFILE,
          (old: { astrologer: AstrologerProfile } | undefined) => {
            if (!old) return old;
            return {
              astrologer: {
                ...old.astrologer,
                isOnline: newStatus,
              },
            };
          }
        );
      }
    };

    socket.on(WS_EVENTS.ASTROLOGER_STATUS_CHANGED, handleStatusChange);

    return () => {
      socket.off(WS_EVENTS.ASTROLOGER_STATUS_CHANGED, handleStatusChange);
    };
  }, [socket, currentUser, queryClient]);

  // Toggle online status mutation
  const toggleMutation = useMutation({
    mutationFn: (newStatus: boolean) => astrologerService.toggleOnlineStatus(newStatus),
    onMutate: async (newStatus: boolean) => {
      // Close dialog
      setShowConfirmDialog(false);
      setPendingStatus(null);

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.ASTROLOGERS.PROFILE });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData(QUERY_KEYS.ASTROLOGERS.PROFILE);

      // Optimistically update cache
      queryClient.setQueryData(
        QUERY_KEYS.ASTROLOGERS.PROFILE,
        (old: { astrologer: AstrologerProfile } | undefined) => {
          if (!old) return old;
          return {
            astrologer: {
              ...old.astrologer,
              isOnline: newStatus,
            },
          };
        }
      );

      // Optimistic local update
      setIsOnline(newStatus);

      return { previousProfile };
    },
    onError: (error: Error, newStatus: boolean, context?: { previousProfile: unknown }) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(QUERY_KEYS.ASTROLOGERS.PROFILE, context.previousProfile);
        setIsOnline(!newStatus);
      }

      console.error('Error toggling online status:', error);
      toast.error('Failed to update status', {
        description: 'Please try again',
      });
    },
    onSuccess: (data, newStatus: boolean) => {
      // Update state with confirmed value from server
      setIsOnline(data.isOnline);

      // Invalidate related queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ASTROLOGERS.PROFILE });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.CHATABLE });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ASTROLOGERS.LIST() });

      toast(newStatus ? '🟢 You are now online' : '🔴 You are now offline', {
        description: newStatus
          ? 'Users can now see you in their chat list.'
          : "You won't appear in user chat lists.",

        classNames: {
          toast: newStatus ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700',
          description: 'text-black',
        },
      });
    },
  });

  const handleToggle = () => {
    const newStatus = !isOnline;
    setPendingStatus(newStatus);
    setShowConfirmDialog(true);
  };

  const handleConfirm = () => {
    if (pendingStatus !== null) {
      toggleMutation.mutate(pendingStatus);
    }
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
    setPendingStatus(null);
  };

  // Show loading state while fetching profile
  if (isOnline === null || isLoadingProfile) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
        <div className="h-4 w-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
        <span className="text-sm text-slate-400 hidden sm:inline">Loading...</span>
      </div>
    );
  }

  return (
    <>
      <LoadingButton
        onClick={handleToggle}
        isLoading={toggleMutation.isPending}
        loadingText="Updating..."
        variant="ghost"
        className={cn(
          'relative inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
          ' border-white/10 backdrop-blur-sm',
          isOnline
            ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
            : 'bg-gray-500/20 hover:bg-gray-500/30 text-gray-400',
          toggleMutation.isPending && 'opacity-50 cursor-not-allowed'
        )}
        title={isOnline ? 'Click to go offline' : 'Click to go online'}
      >
        {/* Status Indicator Dot */}
        <span
          className={cn(
            'relative flex h-2.5 w-2.5 rounded-full',
            isOnline ? 'bg-green-500' : 'bg-gray-500'
          )}
        >
          {isOnline && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          )}
        </span>

        {/* Status Text */}
        <span className="text-sm font-medium hidden sm:inline">
          {isOnline ? 'Online' : 'Offline'}
        </span>

        {/* Toggle Switch */}
        <div
          className={cn(
            'relative w-9 h-5 rounded-full transition-colors duration-200',
            isOnline ? 'bg-green-500' : 'bg-gray-600'
          )}
        >
          <div
            className={cn(
              'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200',
              isOnline && 'transform translate-x-4'
            )}
          />
        </div>
      </LoadingButton>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={pendingStatus ? 'Go Online?' : 'Go Offline?'}
        description={
          pendingStatus
            ? 'You are going online. Users will be able to see you in their chat list and can start conversations with you.'
            : "You are going offline. You won't appear in user chat lists and won't receive new chat requests."
        }
        confirmText={pendingStatus ? 'Yes, Go Online' : 'Yes, Go Offline'}
        cancelText="Cancel"
        isLoading={toggleMutation.isPending}
        isDestructive={!pendingStatus}
      />
    </>
  );
}
