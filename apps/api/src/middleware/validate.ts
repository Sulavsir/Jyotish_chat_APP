/**
 * Validation Middleware
 * Validates request body, params, or query using Zod schemas
 * Errors are passed to the global error handler
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

type ValidationTarget = 'body' | 'params' | 'query';

/**
 * Generic validation middleware factory
 * Validates data and passes errors to global error handler
 */
export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = req[target];
      const validatedData = await schema.parseAsync(dataToValidate);

      // Replace the original data with validated data
      req[target] = validatedData;

      next();
    } catch (error) {
      // Pass error to global error handler
      next(error);
    }
  };
}

/**
 * Shorthand for body validation
 */
export const validateBody = (schema: ZodSchema) => validate(schema, 'body');

/**
 * Shorthand for params validation
 */
export const validateParams = (schema: ZodSchema) => validate(schema, 'params');

/**
 * Shorthand for query validation
 */
export const validateQuery = (schema: ZodSchema) => validate(schema, 'query');
