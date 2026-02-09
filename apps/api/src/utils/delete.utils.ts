/**
 * General delete utilities for admin/entity soft-delete flows.
 * Use with validateParams (e.g. uuidParamSchema) on the route.
 */

import { Response, NextFunction } from 'express';
import { sendSuccess } from './index';

/**
 * Execute a delete (soft-delete) operation and send a success response with null body.
 * Use in controllers: await executeSoftDelete(res, next, id, (id) => service.delete(id));
 */
export async function executeSoftDelete(
  res: Response,
  next: NextFunction,
  id: string,
  deleteFn: (id: string) => Promise<unknown>
): Promise<void> {
  try {
    await deleteFn(id);
    sendSuccess(res, null);
  } catch (error) {
    next(error);
  }
}
