/**
 * Platform Settings Service - key-value configuration (Settings table)
 */

import { prisma } from '@jyotish/database';
import bcrypt from 'bcryptjs';
import { SETTINGS_KEYS } from '../constants/settings.constants';

export const settingsService = {
  async getByKey(key: string): Promise<string | null> {
    const row = await prisma.settings.findUnique({
      where: { key },
      select: { value: true },
    });
    return row?.value ?? null;
  },

  async upsertByKey(key: string, value: string): Promise<void> {
    await prisma.settings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  },

  async getIntByKey(
    key: string,
    fallback: number,
    opts?: { min?: number; max?: number }
  ): Promise<number> {
    const raw = await this.getByKey(key);
    const parsed = raw == null ? Number.NaN : Number(raw);
    if (!Number.isFinite(parsed)) return fallback;
    const rounded = Math.floor(parsed);
    const withMin = opts?.min != null ? Math.max(opts.min, rounded) : rounded;
    const withMax = opts?.max != null ? Math.min(opts.max, withMin) : withMin;
    return withMax;
  },

  /**
   * Verify the astrologer edit password (used for admin edit/delete astrologer actions).
   * Returns true if plainPassword matches the hashed value in Settings.
   */
  async verifyAstrologerEditPassword(plainPassword: string): Promise<boolean> {
    const hashed = await this.getByKey(SETTINGS_KEYS.ASTROLOGER_EDIT_PASSWORD);
    if (!hashed) return false;
    return bcrypt.compare(plainPassword, hashed);
  },
};
