/**
 * Services Grid Component
 * Avatar-icons for services with service name below
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  Sun,
  HeartHandshake,
  Plane,
  ScrollText,
  BookOpen,
  GitCompareArrows,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { ROUTES } from '@/constants';
interface Service {
  id: string;
  name: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

interface ServicesGridProps {
  onOpenPanditModal: () => void;
  onOpenVaastuModal: () => void;
  onOpenKathaModal: () => void;
  onOpenKundaliReviewModal?: () => void;
  onOpenKundaliMatchModal?: () => void;
}

export function ServicesGrid({
  onOpenPanditModal,
  onOpenVaastuModal,
  onOpenKathaModal,
  onOpenKundaliReviewModal,
  onOpenKundaliMatchModal,
}: ServicesGridProps) {
  const router = useRouter();

  const services: Service[] = [
    {
      id: 'chat',
      name: 'Chat with Jyotish',
      icon: <MessageCircle className="h-6 w-6" />,
      onClick: () => router.push(ROUTES.ASTROLOGERS),
    },
    ...(onOpenKundaliReviewModal
      ? [
          {
            id: 'kundali-review',
            name: 'Full Kundali Review',
            icon: <Sparkles className="h-6 w-6" />,
            onClick: onOpenKundaliReviewModal,
          },
        ]
      : []),
    {
      id: 'horoscope',
      name: 'Daily Horoscope',
      icon: <Sun className="h-6 w-6" />,
      onClick: () => router.push(ROUTES.HOROSCOPE),
    },
    ...(onOpenKundaliMatchModal
      ? [
          {
            id: 'kundali-match',
            name: 'Kundali Match',
            icon: <GitCompareArrows className="h-6 w-6" />,
            onClick: onOpenKundaliMatchModal,
          },
        ]
      : [
          {
            id: 'kundali-match',
            name: 'Kundali Match',
            icon: <GitCompareArrows className="h-6 w-6" />,
            onClick: () => {},
            disabled: true,
          },
        ]),
    {
      id: 'pandit',
      name: 'Book Pandit Ji',
      icon: <ScrollText className="h-6 w-6" />,
      onClick: onOpenPanditModal,
    },
    {
      id: 'vaastu',
      name: 'Book Vaastu Sastri',
      icon: <BookOpen className="h-6 w-6" />,
      onClick: onOpenVaastuModal,
    },
    {
      id: 'katha',
      name: 'Katha Vachak',
      icon: <HeartHandshake className="h-6 w-6" />,
      onClick: onOpenKathaModal,
    },
    {
      id: 'instant',
      name: 'Travel Predictions',
      icon: <Plane className="h-6 w-6" />,
      onClick: () => router.push(ROUTES.CHAT),
      disabled: true,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-6">
      {services.map((service) => (
        <button
          key={service.id}
          onClick={service.disabled ? undefined : service.onClick}
          disabled={service.disabled}
          className="flex flex-col items-center gap-3 p-4 rounded-lg transition-all hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="relative h-20 w-20 rounded-full border-2 border-orange-500/40 bg-gradient-to-br from-yellow-500/40 via-amber-500/30 to-orange-500/30 group-hover:scale-110 group-hover:border-yellow-500/60 transition-all flex items-center justify-center shadow-lg shadow-yellow-500/20">
            <div className="text-white">{service.icon}</div>
          </div>
          <span className="text-xs text-center text-white font-medium group-hover:text-white/90 transition-colors">
            {service.name}
          </span>
        </button>
      ))}
    </div>
  );
}
