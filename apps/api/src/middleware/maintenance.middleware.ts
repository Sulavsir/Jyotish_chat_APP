/**
 * Returns 503 for API traffic when maintenance mode is on.
 * Exempt: GET /health, GET /api/version (so clients can read maintenance flag).
 */

import { Request, Response, NextFunction } from 'express';
import { buildMaintenanceApiErrorBody } from '@jyotish/shared';
import { HTTP_STATUS } from '../constants';
import { isMaintenanceModeActive } from '../services/maintenance.service';

function isExemptPath(path: string): boolean {
  if (path === '/health') return true;
  if (path === '/api/version' || path === '/api/version/') return true;
  return false;
}

function shouldBlockPath(path: string): boolean {
  if (path.startsWith('/api/v1')) return true;
  if (path.startsWith('/api-docs')) return true;
  return false;
}

export function maintenanceMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!isMaintenanceModeActive()) {
    next();
    return;
  }

  const path = req.path;

  if (isExemptPath(path)) {
    next();
    return;
  }

  if (shouldBlockPath(path)) {
    res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json(buildMaintenanceApiErrorBody());
    return;
  }

  next();
}
