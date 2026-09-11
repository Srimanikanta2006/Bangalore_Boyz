import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/db/prisma';

const app = createApp();

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

describe('Phase 3 Batch 1: Security Foundation', () => {
  let citizenToken: string;
  let citizen2Token: string;
  let citizen2Id: string;
  let govToken: string;
  let citizenReportId: string;
  let citizenSosId: string;

  it('setup: logs in users and creates test objects', async () => {
    // 1. Citizen 1 login
    const citRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'citizen@climateshield.demo', password: 'DemoGov@2024' });
    expect(citRes.status).toBe(200);
    citizenToken = citRes.body.data.token;

    // 2. Gov operator login
    const govRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'government@climateshield.demo', password: 'DemoGov@2024' });
    expect(govRes.status).toBe(200);
    govToken = govRes.body.data.token;

    // 3. Create or find Citizen 2
    let cit2 = await prisma.user.findUnique({ where: { email: 'citizen2@climateshield.demo' } });
    if (!cit2) {
      cit2 = await prisma.user.create({
        data: {
          id: 'user_cit_2',
          email: 'citizen2@climateshield.demo',
          name: 'Citizen Two',
          passwordHash: citRes.body.data.token, // dummy hash
          role: 'CITIZEN',
          isActive: true,
        },
      });
    }
    citizen2Id = cit2.id;

    // Direct token creation for Citizen 2 to test object-level isolation
    const jwt = await import('jsonwebtoken');
    const { env } = await import('../../src/config/env');
    citizen2Token = jwt.default.sign(
      { sub: citizen2Id, email: cit2.email, role: 'CITIZEN' },
      env.JWT_SECRET,
      { expiresIn: '1h' },
    );

    // 4. Citizen 1 submits a report (201 = new, 200 = deduplicated within 5-min window)
    const repRes = await request(app)
      .post('/api/citizen/reports')
      .set(auth(citizenToken))
      .field('category', 'FLASH_FLOOD')
      .field('description', 'Test report for security suite')
      .field('latitude', '13.062')
      .field('longitude', '80.275');
    expect([200, 201]).toContain(repRes.status);
    citizenReportId = repRes.body.data.id;

    // 5. Citizen 1 submits an SOS (201 = new, 200 = deduplicated within 3-min window)
    const sosRes = await request(app)
      .post('/api/citizen/sos')
      .set(auth(citizenToken))
      .send({
        latitude: 13.062,
        longitude: 80.275,
        primaryThreat: 'FLOOD_BOAT',
        note: 'Test SOS for security suite',
      });
    expect([200, 201]).toContain(sosRes.status);
    citizenSosId = sosRes.body.data.id;
  });

  describe('1. Authentication Verification', () => {
    it('rejects unauthenticated requests to protected routes with 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('rejects malformed or invalid Bearer tokens with 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set({ Authorization: 'Bearer invalid.bogus.jwt' });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });

    it('never leaks passwordHash in auth endpoints', async () => {
      const res = await request(app).get('/api/auth/me').set(auth(citizenToken));
      expect(res.status).toBe(200);
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(res.body.data.user.email).toBe('citizen@climateshield.demo');
    });
  });

  describe('2. Role-Based Access Control (RBAC)', () => {
    it('blocks CITIZEN from government overview (403)', async () => {
      const res = await request(app).get('/api/government/overview').set(auth(citizenToken));
      expect(res.status).toBe(403);
    });

    it('blocks CITIZEN from internal incident triage endpoints (403)', async () => {
      const res = await request(app).get('/api/incidents').set(auth(citizenToken));
      expect(res.status).toBe(403);
    });

    it('blocks GOVERNMENT_OPERATOR from citizen-only endpoints (403)', async () => {
      const res = await request(app).get('/api/citizen/nearby?latitude=13.06&longitude=80.27').set(auth(govToken));
      expect(res.status).toBe(403);
    });
  });

  describe('3. Object-Level Authorization & Anti-Enumeration', () => {
    it('allows Citizen 1 to view their own citizen report', async () => {
      const res = await request(app)
        .get(`/api/citizen/reports/${citizenReportId}`)
        .set(auth(citizenToken));
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(citizenReportId);
    });

    it('prevents Citizen 2 from reading Citizen 1 report (returns 404 to prevent enumeration)', async () => {
      const res = await request(app)
        .get(`/api/citizen/reports/${citizenReportId}`)
        .set(auth(citizen2Token));
      expect(res.status).toBe(404);
      expect(res.body.error.code).toContain('NOT_FOUND');
    });

    it('allows Citizen 1 to view their own SOS event', async () => {
      const res = await request(app)
        .get(`/api/citizen/sos/${citizenSosId}`)
        .set(auth(citizenToken));
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(citizenSosId);
    });

    it('prevents Citizen 2 from reading Citizen 1 SOS event (returns 404 to prevent enumeration)', async () => {
      const res = await request(app)
        .get(`/api/citizen/sos/${citizenSosId}`)
        .set(auth(citizen2Token));
      expect(res.status).toBe(404);
      expect(res.body.error.code).toContain('NOT_FOUND');
    });
  });

  describe('4. Input Validation & Parameter Guardrails', () => {
    it('rejects malformed login body with 400', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects invalid coordinates with 400', async () => {
      const res = await request(app)
        .get('/api/citizen/nearby?latitude=999&longitude=80.27')
        .set(auth(citizenToken));
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects invalid SOS threat type with 400', async () => {
      const res = await request(app)
        .post('/api/citizen/sos')
        .set(auth(citizenToken))
        .send({
          latitude: 13.062,
          longitude: 80.275,
          primaryThreat: 'ALIEN_INVASION',
        });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('5. Security Headers & Defense in Depth', () => {
    it('returns standard security headers via Helmet', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });
});
