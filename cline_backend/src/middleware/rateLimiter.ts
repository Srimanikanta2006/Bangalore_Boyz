import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

function makeLimiter(windowMs: number, limit: number, message: string, skipInTest = false) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => (skipInTest ? env.isTest : false),
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message,
        },
      });
    },
  });
}

/** 15 login attempts per 15 minutes per IP. */
export const authLimiter = makeLimiter(
  15 * 60 * 1000,
  15,
  'Too many login attempts. Please wait 15 minutes before trying again.',
);

/** 10 SOS submissions per 2 minutes per IP to throttle panic/spam triggers. */
export const sosLimiter = makeLimiter(
  2 * 60 * 1000,
  10,
  'Emergency SOS rate limit reached. Please wait before submitting additional emergency requests.',
);

/** 25 hazard reports per 5 minutes per IP. */
export const reportLimiter = makeLimiter(
  5 * 60 * 1000,
  25,
  'Too many hazard reports submitted. Please wait before submitting more reports.',
);

/** General API rate limiter: 400 requests per 15 minutes. */
export const globalApiLimiter = makeLimiter(
  15 * 60 * 1000,
  400,
  'Too many requests to the ClimateShield API. Please slow down.',
  true,
);
