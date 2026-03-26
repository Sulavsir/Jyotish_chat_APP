/**
 * GET /api/version – extended for clients to detect maintenance without calling /api/v1.
 */
export type AppVersionApiResponse = {
  latest_version: string;
  min_required_version: string;
  force_update: boolean;
  maintenance: boolean;
};
