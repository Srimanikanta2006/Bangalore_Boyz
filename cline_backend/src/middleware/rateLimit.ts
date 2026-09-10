/**
 * Shared rate-limit factory (Chunk I — Phase 3 hardening). Previously rate
 * limiting only existed on `/auth/login` (see auth.routes.ts); this extends
 * the same real, working `express-rate-limit` middleware to citizen SOS and
 * hazard-report submission, the two write endpoints most exposed to abuse
 * (unauthenticated flooding is prevented by `authenticate` already running
 * first, but a single compromised/malicious citizen account could otherwise
 * spam SOS/incident creation without any limit).
 */

import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

export function makeRateLimiter(opts: { windowMs: number; limit: number; code: string; message: string }) {
  return rateLimit({
    windowMs: opts.windowMs,
    limit: opts.limit,
    standardHeaders: true,
    legacyHeaders: false,
    // Rate-limit per authenticated user when available (so one citizen's
    // burst doesn't affect others behind the same NAT/proxy); falls back to
    // IP for unauthenticated requests.
    keyGenerator: (req: Request) => req.user?.id ?? req.ip ?? 'unknown',
    handler: (_req, res) => {
      res.status(429).json({ success: false, error: { code: opts.code, message: opts.message } });
    },
  });
}

/** POST /api/citizen/sos - real emergencies are rare in quick succession; caps abuse/misfire spam. */
export const sosRateLimiter = makeRateLimiter({
  windowMs: 5 * 60 * 1000,
  limit: 5,
  code: 'SOS_RATE_LIMITED',
  message: 'Too many SOS submissions. If this is an ongoing emergency, contact local emergency services directly.',
});

/** POST /api/citizen/reports - generous enough for genuine multi-hazard reporting, caps spam. */
export const reportRateLimiter = makeRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  code: 'REPORT_RATE_LIMITED',
  message: 'Too many hazard reports submitted. Please wait before submitting another.',
});
