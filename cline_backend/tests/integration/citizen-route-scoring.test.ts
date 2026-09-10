import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, auth, dbReady, login } from '../helpers';

const ready = await dbReady();

// East Basin demo zone (has an ACTIVE CRITICAL flash-flood hazard in the seed).
const HAZARD_ZONE_POINT = { latitude: 13.062, longitude: 80.275 };
// Far outside any seeded zone boundary (mid-ocean) -> no zone match, no hazard hit.
const CLEAR_POINT = { latitude: 5.0, longitude: 70.0 };

function lineOf(center: { latitude: number; longitude: number }, n = 10) {
  return Array.from({ length: n }, (_, i) => ({
    latitude: center.latitude + i * 0.0005,
    longitude: center.longitude + i * 0.0005,
  }));
}

describe.skipIf(!ready)('POST /api/citizen/routes/score', () => {
  it('scores a route through an active hazard zone higher than a clear route, and recommends the lower-risk one', async () => {
    const token = await login('citizen@climateshield.demo');

    const res = await request(app)
      .post('/api/citizen/routes/score')
      .set(auth(token))
      .send({
        routes: [
          { label: 'Through Hazard Zone', distanceMeters: 5000, durationSeconds: 600, points: lineOf(HAZARD_ZONE_POINT) },
          { label: 'Clear Route', distanceMeters: 6000, durationSeconds: 700, points: lineOf(CLEAR_POINT) },
        ],
      });

    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d.routes).toHaveLength(2);

    const hazardRoute = d.routes[0];
    const clearRoute = d.routes[1];
    expect(hazardRoute.riskScore).toBeGreaterThan(clearRoute.riskScore);
    expect(hazardRoute.hazardZonesHit.length).toBeGreaterThan(0);
    expect(clearRoute.hazardZonesHit).toHaveLength(0);
    expect(clearRoute.riskScore).toBe(0);

    // Backend recommends the objectively lower-risk route.
    expect(d.recommendedIndex).toBe(1);
  });

  it('rejects malformed input (too few points, too many routes)', async () => {
    const token = await login('citizen@climateshield.demo');
    const res = await request(app)
      .post('/api/citizen/routes/score')
      .set(auth(token))
      .send({ routes: [{ points: [{ latitude: 1, longitude: 1 }] }] }); // only 1 point, needs >=2
    expect(res.status).toBe(400);
  });

  it('is CITIZEN-only: government gets 403', async () => {
    const token = await login('government@climateshield.demo');
    const res = await request(app)
      .post('/api/citizen/routes/score')
      .set(auth(token))
      .send({ routes: [{ points: lineOf(CLEAR_POINT) }] });
    expect(res.status).toBe(403);
  });
});
