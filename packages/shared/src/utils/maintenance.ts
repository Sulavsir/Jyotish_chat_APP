import { MAINTENANCE_ERROR_CODE, MAINTENANCE_MESSAGES } from '../constants/maintenance.constants';

export function isMaintenanceModeEnabled(raw: string | undefined): boolean {
  if (raw === undefined || raw === null) return false;
  const v = String(raw).trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

export type MaintenanceApiErrorBody = {
  success: false;
  error: {
    message: string;
    code: typeof MAINTENANCE_ERROR_CODE;
  };
};

export function buildMaintenanceApiErrorBody(): MaintenanceApiErrorBody {
  return {
    success: false,
    error: {
      message: MAINTENANCE_MESSAGES.short,
      code: MAINTENANCE_ERROR_CODE,
    },
  };
}
