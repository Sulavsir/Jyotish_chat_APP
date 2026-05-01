/**
 * Admin: broadcast chat acceptance reports
 */

import { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types';
import { sendSuccess } from '../utils';
import * as adminBroadcastAcceptanceReportService from '../services/adminBroadcastAcceptanceReport.service';
import type { ListAdminBroadcastAcceptanceReportQuery } from '../validators/adminBroadcastAcceptanceReport.validators';

export async function listBroadcastAcceptanceReport(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const q = req.query as unknown as ListAdminBroadcastAcceptanceReportQuery;
    const result =
      await adminBroadcastAcceptanceReportService.listAstrologerChatAcceptanceReport({
        from: q.from,
        to: q.to,
        search: q.search,
        page: q.page,
        limit: q.limit,
        sortBy: q.sortBy,
        sortOrder: q.sortOrder,
      });
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
