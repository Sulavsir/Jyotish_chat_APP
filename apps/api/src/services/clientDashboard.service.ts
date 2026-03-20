/**
 * Client Dashboard Service
 * Aggregates dashboard data into a single response to reduce API calls.
 * Replaces: balance, rates, tips/today, my-horoscope, dashboard-rotating-copy, hasPendingBroadcast.
 */

import * as coinService from './coin.service';
import { getRatesForClient } from './platformCoinRate.service';
import type { PlatformCoinRateType } from '@prisma/client';
import { tipService } from './tip.service';
import { horoscopeService } from './horoscope.service';
import { dashboardRotatingCopyService } from './dashboardRotatingCopy.service';
import * as broadcastMessageService from './broadcastMessage.service';
import type { QuestionnaireLanguage } from '@jyotish/shared';

export interface ClientDashboardStats {
  balance: number;
  rates: Record<PlatformCoinRateType, number>;
  todayTip: { text: string };
  myHoroscope: { zodiacSign: string; prediction: string; category: string } | null;
  rotatingCopy: Array<{ id: string; title: string; subtitle: string }>;
  hasPendingBroadcast: boolean;
  pendingBroadcastCount: number;
}

export async function getClientDashboardStats(
  userId: string,
  language?: QuestionnaireLanguage
): Promise<ClientDashboardStats> {
  const lang = language ?? 'ENGLISH';

  const [
    balance,
    rates,
    tips,
    horoscopeResult,
    rotatingCopy,
    pendingMessages,
  ] = await Promise.all([
    coinService.getCoinBalance(userId),
    getRatesForClient(),
    tipService.getTipsForDate({ audience: 'CLIENT', language: lang }),
    horoscopeService.getHoroscopeForUser(userId, lang).catch(() => null),
    dashboardRotatingCopyService.listPublic(),
    broadcastMessageService.getClientBroadcastMessages(userId),
  ]);

  const horoscope = horoscopeResult;

  const pending = Array.isArray(pendingMessages)
    ? pendingMessages.filter((m: { status: string }) => m.status === 'PENDING')
    : [];

  return {
    balance,
    rates,
    todayTip: { text: tips[0]?.text ?? '' },
    myHoroscope: horoscope
      ? {
          zodiacSign: horoscope.zodiacSign,
          prediction: horoscope.prediction,
          category: horoscope.category,
        }
      : null,
    rotatingCopy: rotatingCopy.map((r: { id: string; title: string; subtitle: string }) => ({
      id: r.id,
      title: r.title,
      subtitle: r.subtitle,
    })),
    hasPendingBroadcast: pending.length > 0,
    pendingBroadcastCount: pending.length,
  };
}
