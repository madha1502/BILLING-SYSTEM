import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/app-error.js';
import { sendError } from '../shared/utils/response.js';
import { ZodError } from 'zod';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return sendError(
      res,
      'Invalid input parameters. Please check your form entries.',
      400,
      'VALIDATION_ERROR',
      formattedErrors
    );
  }

  // Handle AppError
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.code, err.details);
  }

  // Handle Prisma Known Request Errors (e.g. Unique constraint violations)
  if (err.code === 'P2002') {
    const target = err.meta?.target || 'field';
    return sendError(
      res,
      `A record with this ${target} already exists.`,
      409,
      'DUPLICATE_ENTRY',
      err.meta
    );
  }

  console.error('🔥 [Unhandled Server Exception]:', err);

  // Return generic user-friendly error without stack traces in production
  return sendError(
    res,
    'Something went wrong on our server. Please try again or contact support.',
    500,
    'INTERNAL_SERVER_ERROR'
  );
}
