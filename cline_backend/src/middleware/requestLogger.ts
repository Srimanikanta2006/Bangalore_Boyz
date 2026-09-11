import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { recordHttpRequest } from '../services/metrics.service';

const SAFE_HEADER_RE = /^[a-zA-Z0-9\-_]{1,64}$/;

function sanitizeId(raw: string | undefined): string {
  if (raw && SAFE_HEADER_RE.test(raw)) return raw;
  return randomUUID();
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = sanitizeId(req.headers['x-request-id'] as string | undefined);
  const traceId = sanitizeId(req.headers['x-trace-id'] as string | undefined);
  const startedAt = process.hrtime.bigint();

  req.requestId = requestId;
  req.traceId = traceId;
  res.setHeader('X-Request-Id', requestId);
  res.setHeader('X-Trace-Id', traceId);

  res.on('finish', () => {
    const durationMs = Math.round(Number(process.hrtime.bigint() - startedAt) / 1e4) / 100;
    recordHttpRequest(res.statusCode, durationMs);
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({
      level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'http',
      time: new Date().toISOString(),
      requestId,
      traceId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs,
      userId: req.user?.id ?? null,
    }));
  });

  next();
}
