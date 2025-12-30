/**
 * Async Handler Utility
 * Wraps async route handlers to automatically catch errors and pass them to the global error handler
 */

import { Request, Response, NextFunction } from 'express';

type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<any>;

/**
 * Wraps an async function to catch errors and pass them to next()
 * This ensures all async errors are caught and handled by the global error handler
 */
export const asyncHandler = (fn: AsyncFunction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

