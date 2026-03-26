/**
 * Maintenance mode – reads env and exposes helpers for middleware / version payload.
 */

import { isMaintenanceModeEnabled } from '@jyotish/shared';

export function isMaintenanceModeActive(): boolean {
  return isMaintenanceModeEnabled(process.env.MAINTENANCE_MODE);
}
