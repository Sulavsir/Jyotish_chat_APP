/**
 * Jyotish Matching Modal
 * Shows an animated visualization of searching/matching with available Jyotish
 * Used for instant chat requests and broadcast messages
 */

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Minimize2, User, Search, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback, Badge } from '@jyotish/ui';
import { useAuthStore } from '@/store/auth-store';
import { getImageUrl } from '@/utils/image.utils';
import { ConfirmDialog } from './ConfirmDialog';

interface JyotishMatchingModalProps {
  isOpen: boolean;
  onCancel?: () => void;
  timeRemaining?: number; // Time remaining in seconds
  title?: string;
  subtitle?: string;
}

interface JyotishNode {
  id: string;
  angle: number; // Angle in degrees around the center
  distance: number; // Distance from center
  avatar?: string;
  name?: string;
}

export const JyotishMatchingModal: React.FC<JyotishMatchingModalProps> = ({
  isOpen,
  onCancel,
  timeRemaining,
  title = 'Searching for Available Jyotish',
  subtitle = 'Please wait while we find the best match for you...',
}) => {
  const user = useAuthStore((state) => state.user);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [currentTargetIndex, setCurrentTargetIndex] = useState(0);
  const [signalState, setSignalState] = useState<'traveling' | 'waiting' | 'returning'>(
    'traveling'
  );
  const [signalProgress, setSignalProgress] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const waitingStartTimeRef = useRef<number>(0);

  // Mock Jyotish images - using placeholder service with different seeds
  const mockJyotishImages = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=jyotish1&backgroundColor=b6e3ff',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=jyotish2&backgroundColor=c7f5d9',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=jyotish3&backgroundColor=ffdfbf',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=jyotish4&backgroundColor=ffd5dc',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=jyotish5&backgroundColor=e4d5f7',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=jyotish6&backgroundColor=fce7f3',
  ];

  // Generate Jyotish nodes in a circle around the center
  const jyotishNodes: JyotishNode[] = React.useMemo(() => {
    const count = 6; // Number of Jyotish nodes
    const radius = 80; // Distance from center
    const nodes: JyotishNode[] = [];

    for (let i = 0; i < count; i++) {
      const angle = (i * 360) / count;
      nodes.push({
        id: `jyotish-${i}`,
        angle,
        distance: radius,
        avatar: mockJyotishImages[i],
        name: `Jyotish ${i + 1}`,
      });
    }

    return nodes;
  }, []);

  // Calculate position for a node
  const getNodePosition = useCallback((node: JyotishNode, centerX: number, centerY: number) => {
    const angleRad = (node.angle * Math.PI) / 180;
    const x = centerX + Math.cos(angleRad) * node.distance;
    const y = centerY + Math.sin(angleRad) * node.distance;
    return { x, y };
  }, []);

  // Animate signal
  useEffect(() => {
    if (!isOpen || isMinimized) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;

      if (signalState === 'traveling') {
        const travelDuration = 1000; // 1 second to travel
        const progress = Math.min(elapsed / travelDuration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setSignalProgress(easeOut);

        if (progress >= 1) {
          // Reached target, start waiting
          setSignalState('waiting');
          waitingStartTimeRef.current = Date.now();
        }
      } else if (signalState === 'waiting') {
        const waitDuration = 1500; // Wait 1.5 seconds
        const waitElapsed = Date.now() - waitingStartTimeRef.current;

        if (waitElapsed >= waitDuration) {
          // No response, return
          setSignalState('returning');
          startTimeRef.current = Date.now();
        }
      } else if (signalState === 'returning') {
        const returnDuration = 800; // 0.8 seconds to return
        const progress = Math.min(elapsed / returnDuration, 1);
        const easeIn = progress * progress;
        setSignalProgress(1 - easeIn);

        if (progress >= 1) {
          // Returned, move to next target
          setCurrentTargetIndex((prev) => (prev + 1) % jyotishNodes.length);
          setSignalState('traveling');
          startTimeRef.current = Date.now();
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Initialize
    startTimeRef.current = Date.now();
    setSignalProgress(0);
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isOpen, isMinimized, currentTargetIndex, signalState, jyotishNodes]);

  // Reset animation when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentTargetIndex(0);
      setSignalState('traveling');
      setIsMinimized(false);
      setSignalProgress(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCancelClick = () => {
    if (onCancel) {
      setShowCancelConfirm(true);
    }
  };

  const handleConfirmCancel = () => {
    setShowCancelConfirm(false);
    onCancel?.();
  };

  // Get user avatar URL
  const userAvatarUrl = user?.profilePhoto ? getImageUrl(user.profilePhoto) : null;
  const userInitials = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  const centerX = 150;
  const centerY = 150;
  const currentTarget = jyotishNodes[currentTargetIndex];
  const targetPos = getNodePosition(currentTarget, centerX, centerY);

  // Calculate signal position
  const signalX =
    signalState === 'returning'
      ? targetPos.x + (centerX - targetPos.x) * (1 - signalProgress)
      : centerX + (targetPos.x - centerX) * signalProgress;
  const signalY =
    signalState === 'returning'
      ? targetPos.y + (centerY - targetPos.y) * (1 - signalProgress)
      : centerY + (targetPos.y - centerY) * signalProgress;

  // Get status message and icon based on signal state
  const getStatusInfo = () => {
    switch (signalState) {
      case 'traveling':
        return {
          message: 'Searching for available Jyotish...',
          icon: Search,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
        };
      case 'waiting':
        return {
          message: 'Waiting for response...',
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
        };
      case 'returning':
        return {
          message: 'No response, trying next Jyotish...',
          icon: AlertCircle,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
        };
      default:
        return {
          message: 'Searching...',
          icon: Search,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <>
      {/* Backdrop - click to minimize, only blur when not minimized */}
      {!isMinimized && (
        <div
          className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-sm"
          onClick={() => setIsMinimized(true)}
        />
      )}

      {/* Modal - Centered like other modals */}
      {!isMinimized ? (
        <div
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] transition-all duration-300 w-[600px] max-w-[90vw]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-3 w-3 bg-green-400 rounded-full animate-ping absolute -top-1 -right-1" />
                  <div className="h-3 w-3 bg-green-500 rounded-full absolute -top-1 -right-1" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">{title}</h3>
                  {timeRemaining !== undefined && (
                    <p className="text-white/80 text-xs">{formatTime(timeRemaining)} remaining</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Minimize"
                >
                  <Minimize2 className="h-4 w-4 text-white" />
                </button>
                {onCancel && (
                  <button
                    onClick={handleCancelClick}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Cancel"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-gray-600 text-sm mb-4 text-center">{subtitle}</p>

              {/* Status Alert Cards */}
              <div className="flex flex-col gap-2 mb-4">
                <div
                  className={`flex items-center gap-3 p-3 rounded-lg border ${statusInfo.bgColor} ${statusInfo.borderColor}`}
                >
                  <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                  <span className={`text-sm font-medium ${statusInfo.color}`}>
                    {statusInfo.message}
                  </span>
                </div>
              </div>

              {/* Animation Container */}
              <div className="relative bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-8 mb-4 h-[320px] flex items-center justify-center">
                <svg
                  width="300"
                  height="300"
                  viewBox="0 0 300 300"
                  className="absolute inset-0 w-full h-full"
                >
                  {/* Connection lines */}
                  {jyotishNodes.map((node) => {
                    const pos = getNodePosition(node, centerX, centerY);
                    return (
                      <line
                        key={`line-${node.id}`}
                        x1={centerX}
                        y1={centerY}
                        x2={pos.x}
                        y2={pos.y}
                        stroke="rgba(147, 51, 234, 0.1)"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Signal path */}
                  <line
                    x1={centerX}
                    y1={centerY}
                    x2={signalX}
                    y2={signalY}
                    stroke={
                      signalState === 'waiting'
                        ? 'rgba(255, 215, 0, 0.6)'
                        : 'rgba(147, 51, 234, 0.6)'
                    }
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    className="animate-pulse"
                  />

                  {/* Signal pulse */}
                  <circle
                    cx={signalX}
                    cy={signalY}
                    r={8 + Math.sin(Date.now() / 100) * 2}
                    fill={
                      signalState === 'waiting'
                        ? 'rgba(255, 215, 0, 0.8)'
                        : 'rgba(147, 51, 234, 0.8)'
                    }
                    className="transition-all duration-100"
                  >
                    {signalState === 'waiting' && (
                      <animate
                        attributeName="r"
                        values="8;12;8"
                        dur="1s"
                        repeatCount="indefinite"
                      />
                    )}
                  </circle>

                  {/* Center user node */}
                  <circle
                    cx={centerX}
                    cy={centerY}
                    r="25"
                    fill="rgba(147, 51, 234, 0.2)"
                    stroke="rgba(147, 51, 234, 0.8)"
                    strokeWidth="3"
                  />
                </svg>

                {/* Overlay Jyotish Avatars */}
                <div className="relative w-full h-full">
                  {jyotishNodes.map((node, index) => {
                    const angleRad = (node.angle * Math.PI) / 180;
                    const x = 50 + Math.cos(angleRad) * 33.33; // Percentage-based positioning
                    const y = 50 + Math.sin(angleRad) * 33.33;
                    const isCurrentTarget = index === currentTargetIndex;

                    return (
                      <div
                        key={node.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                        }}
                      >
                        <Avatar
                          className={`h-10 w-10 border-2 transition-all ${
                            isCurrentTarget && signalState === 'waiting'
                              ? 'border-purple-600 ring-4 ring-purple-200 scale-110'
                              : 'border-purple-300'
                          }`}
                        >
                          <AvatarImage src={node.avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white text-xs">
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    );
                  })}

                  {/* Center User Avatar */}
                  <div
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: '50%', top: '50%' }}
                  >
                    <Avatar className="h-12 w-12 border-3 border-purple-600 ring-4 ring-purple-200">
                      <AvatarImage src={userAvatarUrl || undefined} alt={user?.name || 'User'} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-bold">
                        {user?.name ? userInitials : <User className="h-6 w-6" />}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="fixed left-1/2 -translate-x-1/2 bottom-4 z-[9999] transition-all duration-300 cursor-pointer"
          onClick={(e) => {
            // Only reopen if clicking on the container, not on buttons
            if (
              e.target === e.currentTarget ||
              (e.target as HTMLElement).closest('.minimized-content')
            ) {
              setIsMinimized(false);
            }
          }}
        >
          <div className="px-4 py-2.5 flex items-center justify-between bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg minimized-content">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-white font-medium">{title}</span>
              {timeRemaining !== undefined && (
                <>
                  <span className="text-white/60">•</span>
                  <Badge
                    variant="outline"
                    className="bg-white/20 border-white/30 text-white font-semibold px-2 py-0.5"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTime(timeRemaining)}
                  </Badge>
                </>
              )}
            </div>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setIsMinimized(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title="Expand"
              >
                <Minimize2 className="h-3.5 w-3.5 text-white rotate-180" />
              </button>
              {onCancel && (
                <button
                  onClick={handleCancelClick}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  title="Cancel"
                >
                  <X className="h-3.5 w-3.5 text-white" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Request?"
        description="Are you sure you want to cancel this request? You'll need to create a new request to find an available Jyotish."
        confirmText="Yes, Cancel"
        cancelText="No, Continue"
        isDestructive={true}
      />
    </>
  );
};
