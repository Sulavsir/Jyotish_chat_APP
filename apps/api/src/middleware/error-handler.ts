/**
 * Global Error Handler Middleware
 * Catches all errors thrown in the application and sends appropriate responses
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { HTTP_STATUS, ERROR_CODES } from '../constants';

/**
 * Custom Application Error class
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    public code: string = ERROR_CODES.SERVER_ERROR
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 * Should be registered as the last middleware in the app
 */
export const errorHandler = (
  error: Error | AppError | ZodError | Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error for debugging
  console.error('Error occurred:', {
    name: error.name,
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    const messages: string[] = [];

    error.errors.forEach((err) => {
      const field = err.path.join('.');
      fieldErrors[field] = err.message;
      messages.push(`${field}: ${err.message}`);
    });

    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: {
        message: messages[0] || 'Validation failed',
        code: ERROR_CODES.VALIDATION_ERROR,
        fields: fieldErrors,
        details: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      },
    });
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          error: {
            message: 'A record with this value already exists',
            code: ERROR_CODES.DUPLICATE_ENTRY,
            field: (error.meta?.target as string[])?.join(', ') || 'unknown',
          },
        });

      case 'P2025':
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: 'Record not found',
            code: ERROR_CODES.NOT_FOUND,
          },
        });

      case 'P2003':
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Invalid reference - related record does not exist',
            code: ERROR_CODES.VALIDATION_ERROR,
          },
        });

      case 'P2021':
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: {
            message: 'The table does not exist in the database. Please run database migrations.',
            code: ERROR_CODES.DATABASE_ERROR,
          },
        });

      case 'P2022':
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: {
            message: 'The database column does not exist. Please run database migrations.',
            code: ERROR_CODES.DATABASE_ERROR,
          },
        });

      case 'P1001':
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: {
            message: 'Cannot connect to database. Please check database connection.',
            code: ERROR_CODES.DATABASE_ERROR,
          },
        });

      case 'P1008':
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: {
            message: 'Database operation timed out. Please try again.',
            code: ERROR_CODES.DATABASE_ERROR,
          },
        });

      case 'P1017':
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: {
            message: 'Database connection was closed unexpectedly.',
            code: ERROR_CODES.DATABASE_ERROR,
          },
        });

      default:
        // Log the error for debugging
        console.error('Unhandled Prisma error:', {
          code: error.code,
          message: error.message,
          meta: error.meta,
        });

        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: {
            message:
              process.env.NODE_ENV === 'production'
                ? 'An unexpected database error occurred. Please try again later.'
                : `Database error: ${error.message}`,
            code: ERROR_CODES.DATABASE_ERROR,
            ...(process.env.NODE_ENV === 'development' && {
              details: error.code,
              meta: error.meta,
            }),
          },
        });
    }
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: {
        message: 'Invalid data provided',
        code: ERROR_CODES.VALIDATION_ERROR,
      },
    });
  }

  // Handle custom AppError
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
      },
    });
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: {
        message: 'Invalid token',
        code: ERROR_CODES.UNAUTHORIZED,
      },
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: {
        message: 'Token expired',
        code: ERROR_CODES.UNAUTHORIZED,
      },
    });
  }

  // Default error response
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: {
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      code: ERROR_CODES.SERVER_ERROR,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
  });
};

/**
 * Helper function to throw AppError
 */
export const throwError = (
  message: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  code: string = ERROR_CODES.SERVER_ERROR
): never => {
  throw new AppError(message, statusCode, code);
};
