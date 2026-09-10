import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, auth, dbReady, login } from '../helpers';

const ready = await dbReady();

describe.skipIf(!ready)('Citizen authentication & authorization', () => {
  it('citizen can log in and receives the CITIZEN role', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'citizen@climateshield.demo', password: process.env.DEMO_USER_PASSWORD ?? 'DemoGov@2024' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('CITIZEN');
    expect(res.body.data.token).toBeTruthy();
    // Never leak the password hash.
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
  });

  it('citizen CAN read public-safety data (hazards)', async () => {
    const token = await login('citizen@climateshield.demo');
    const res = await request(app).get('/api/hazards').set(auth(token));
    expect(res.status).toBe(200);
  });

  it('citizen is DENIED internal government reads (incidents, map overlays, units)', async () => {
    const token = await login('citizen@climateshield.demo');
    for (const path of ['/api/incidents', '/api/map/overlays', '/api/units', '/api/response-center']) {
      const res = await request(app).get(path).set(auth(token));
      expect(res.status, `expected 403 for ${path}`).toBe(403);
    }
  });

  it('citizen CANNOT create incidents (government write is fail-closed)', async () => {
    const token = await login('citizen@climateshield.demo');
    const res = await request(app)
      .post('/api/incidents')
      .set(auth(token))
      .send({ title: 'x', type: 'FLOODING', severity: 'LOW', zoneId: 'zone_eb' });
    expect(res.status).toBe(403);
  });

  it('government roles are UNAFFECTED by the citizen guard (incidents still readable)', async () => {
    const token = await login('government@climateshield.demo');
    const res = await request(app).get('/api/incidents').set(auth(token));
    expect(res.status).toBe(200);
  });
});
