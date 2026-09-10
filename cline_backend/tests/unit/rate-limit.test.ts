import { describe, expect, it } from 'vitest';
import { makeRateLimiter, sosRateLimiter, reportRateLimiter } from '../../src/middleware/rateLimit';

/** Minimal Express-shaped req/res/next stubs for driving the middleware directly
 *  (avoids polluting the real DB with dozens of SOS/report rows just to trip a limiter). */
function fakeReqRes(userId: string) {
  const req = { user: { id: userId }, ip: '127.0.0.1', headers: {} } as never;
  const res = {
    statusCode: 200,
    _json: null as unknown,
    setHeader: () => {},
    getHeader: () => undefined,
    status(code: number) { this.statusCode = code; return this; },
    json(body: unknown) { this._json = body; return this; },
    end() { return this; },
  } as never;
  return { req, res };
}

describe('rate limit middleware (Chunk I — extended beyond login to SOS/report)', () => {
  it('allows requests under the configured limit', async () => {
    const limiter = makeRateLimiter({ windowMs: 60_000, limit: 3, code: 'TEST_LIMITED', message: 'nope' });
    const { req, res } = fakeReqRes('user_rl_1');
    let nextCalled = 0;
    for (let i = 0; i < 3; i++) {
      await new Promise<void>((resolve) => limiter(req, res, () => { nextCalled++; resolve(); }));
    }
    expect(nextCalled).toBe(3);
    expect((res as { statusCode: number }).statusCode).toBe(200);
  });

  it('blocks with 429 + the configured error code once the limit is exceeded', async () => {
    const limiter = makeRateLimiter({ windowMs: 60_000, limit: 2, code: 'TEST_LIMITED', message: 'Too many.' });
    const { req, res } = fakeReqRes('user_rl_2');
    for (let i = 0; i < 2; i++) {
      await new Promise<void>((resolve) => limiter(req, res, () => resolve()));
    }
    await new Promise<void>((resolve) => { limiter(req, res, () => resolve()); setTimeout(resolve, 10); });
    expect((res as { statusCode: number }).statusCode).toBe(429);
    expect((res as { _json: { error: { code: string } } })._json.error.code).toBe('TEST_LIMITED');
  });

  it('rate-limits per authenticated user, not globally (one user tripping it does not affect another)', async () => {
    const limiter = makeRateLimiter({ windowMs: 60_000, limit: 1, code: 'TEST_LIMITED', message: 'nope' });
    const a = fakeReqRes('user_rl_a');
    const b = fakeReqRes('user_rl_b');
    await new Promise<void>((resolve) => limiter(a.req, a.res, () => resolve()));
    await new Promise<void>((resolve) => limiter(b.req, b.res, () => resolve()));
    expect((a.res as { statusCode: number }).statusCode).toBe(200);
    expect((b.res as { statusCode: number }).statusCode).toBe(200);
  });

  it('exports real, distinctly-configured limiters for SOS and hazard reports', () => {
    expect(typeof sosRateLimiter).toBe('function');
    expect(typeof reportRateLimiter).toBe('function');
    expect(sosRateLimiter).not.toBe(reportRateLimiter);
  });
});
