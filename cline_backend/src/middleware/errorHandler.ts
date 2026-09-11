import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { env } from '../config/env';
import { AppError } from '../utils/errors';
import { flattenZodError } from './validation';

/** 404 for unmatched routes (consistent error envelope). */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { code: 'ROUTE_NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
}

/** Central error handler - the single place that renders error responses. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      // eslint-disable-next-line no-console
      console.error(JSON.stringify({ level: 'error', scope: 'app', code: err.code, message: err.message }));
    }
    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Request validation failed', details: flattenZodError(err) },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: { code: 'UNIQUE_CONSTRAINT', message: 'A record with the same unique value already exists' },
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Requested record not found' },
      });
      return;
    }
  }

function sanitizeErrorMessage(raw: string): string {
  let clean = raw.replace(/\/[a-zA-Z0-9_.-]+(\/[a-zA-Z0-9_.-]+)+/g, '[path]');
  clean = clean.replace(/postgres(ql)?:\/\/[^\s]+/gi, '[database-url]');
  clean = clean.replace(/Bearer\s+[a-zA-Z0-9_.-]+/gi, 'Bearer [token]');
  return clean;
}

  // Unknown error: log server-side, never leak internals in production.
  // eslint-disable-next-line no-console
  console.error(JSON.stringify({
    level: 'error',
    scope: 'unhandled',
    name: err instanceof Error ? err.name : typeof err,
    message: err instanceof Error ? sanitizeErrorMessage(err.message) : String(err),
    stack: env.isProd ? undefined : err instanceof Error ? err.stack : undefined,
  }));

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: env.isProd ? 'Internal server error' : err instanceof Error ? sanitizeErrorMessage(err.message) : 'Internal server error',
    },
  });
}
