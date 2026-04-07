import { AstrologerCategory } from '@jyotish/shared';
import { settingsService } from './settings.service';
import { SETTINGS_KEYS } from '../constants/settings.constants';
import {
  BROADCAST_ACCEPTANCE_LIMITS,
  BROADCAST_MESSAGE_EXPIRY_MINUTES,
} from '../constants/broadcastMessage.constants';

const MIN_EXPIRY_MINUTES = 1;
const MAX_EXPIRY_MINUTES = 120;
const MIN_ACCEPTANCE_LIMIT = 0;
const MAX_ACCEPTANCE_LIMIT = 100;

export type BroadcastRuntimeSettings = {
  expiryMinutes: number;
  acceptanceLimitOrdinary: number;
  acceptanceLimitProfessional: number;
};

export async function getBroadcastRuntimeSettings(): Promise<BroadcastRuntimeSettings> {
  const [expiryMinutes, acceptanceLimitOrdinary, acceptanceLimitProfessional] = await Promise.all([
    settingsService.getIntByKey(
      SETTINGS_KEYS.BROADCAST_EXPIRY_MINUTES,
      BROADCAST_MESSAGE_EXPIRY_MINUTES,
      { min: MIN_EXPIRY_MINUTES, max: MAX_EXPIRY_MINUTES }
    ),
    settingsService.getIntByKey(
      SETTINGS_KEYS.BROADCAST_ACCEPTANCE_LIMIT_ORDINARY,
      BROADCAST_ACCEPTANCE_LIMITS.ORDINARY,
      { min: MIN_ACCEPTANCE_LIMIT, max: MAX_ACCEPTANCE_LIMIT }
    ),
    settingsService.getIntByKey(
      SETTINGS_KEYS.BROADCAST_ACCEPTANCE_LIMIT_PROFESSIONAL,
      BROADCAST_ACCEPTANCE_LIMITS.PROFESSIONAL,
      { min: MIN_ACCEPTANCE_LIMIT, max: MAX_ACCEPTANCE_LIMIT }
    ),
  ]);

  return {
    expiryMinutes,
    acceptanceLimitOrdinary,
    acceptanceLimitProfessional,
  };
}

export async function getBroadcastExpiryMs(): Promise<number> {
  const settings = await getBroadcastRuntimeSettings();
  return settings.expiryMinutes * 60 * 1000;
}

export async function getBroadcastAcceptanceLimitByCategory(
  category: AstrologerCategory | string
): Promise<number> {
  const settings = await getBroadcastRuntimeSettings();
  if (category === AstrologerCategory.ORDINARY) return settings.acceptanceLimitOrdinary;
  if (category === AstrologerCategory.PROFESSIONAL) return settings.acceptanceLimitProfessional;
  return 0;
}

