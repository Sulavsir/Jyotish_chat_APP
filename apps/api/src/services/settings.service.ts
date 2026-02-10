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
