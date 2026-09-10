import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { recordHttpRequest } from '../metrics/registry';

/**
 * Structured JSON request logging (satisfies the "Morgan or structured
 * logging" requirement with a machine-readable format).
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
  const startedAt = process.hrtime.bigint();

  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    const durationMs = Math.round(Number(process.hrtime.bigint() - startedAt) / 1e4) / 100;
    const entry = {
      level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'http',
      time: new Date().toISOString(),
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs,
      userId: req.user?.id ?? null,
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(entry));

    // Real metrics from real request data (Chunk I /metrics endpoint). Uses the
    // matched route PATTERN (e.g. "/citizen/reports/:id"), never the raw path,
    // to keep label cardinality bounded (no user-supplied IDs as metric labels).
    const route = (req.route as { path?: string } | undefined)?.path
      ? `${req.baseUrl}${(req.route as { path?: string }).path}`
      : req.baseUrl || 'unmatched';
    recordHttpRequest(req.method, route, res.statusCode, durationMs / 1000);
  });

  next();
}
