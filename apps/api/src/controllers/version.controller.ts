/**
 * Version Controller
 * Force-update endpoint for Flutter app.
 * GET /api/version - no auth required, always returns HTTP 200 with valid JSON.
 */

import { Request, Response } from 'express';

interface VersionResponse {
  latest_version: string;
  min_required_version: string;
  force_update: boolean;
}

/**
 * GET /api/version
 */
export function getVersion(req: Request, res: Response) {
  const latestVersion = process.env.APP_LATEST_VERSION ?? '2.0.0';
  const minRequiredVersion = process.env.APP_MIN_REQUIRED_VERSION ?? '1.0.0';
  const forceUpdate =
    process.env.APP_FORCE_UPDATE === 'true' || process.env.APP_FORCE_UPDATE === '1';

  const payload: VersionResponse = {
    latest_version: latestVersion,
    min_required_version: minRequiredVersion,
    force_update: forceUpdate,
  };

  res.status(200).json(payload);
}
