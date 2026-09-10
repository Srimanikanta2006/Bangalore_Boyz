import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app, auth, dbReady, login } from '../helpers';
import { clearWeatherCache } from '../../src/services/weather.service';
import type { PrismaClient } from '@prisma/client';

const ready = await dbReady();
const { prisma }: { prisma: PrismaClient } = await import('../../src/db/prisma');

const realZone = ready
  ? await prisma.zone.findFirst({ where: { dataQuality: 'REAL_GEOGRAPHIC' }, select: { id: true, name: true, latitude: true, longitude: true } })
  : null;

const okWeather = {
  current: {
    time: Math.floor(Date.now() / 1000) - 120,
    temperature_2m: 33.1,
    relative_humidity_2m: 80,
    apparent_temperature: 41.0,
    precipitation: 4.0,
    rain: 4.0,
    weather_code: 63,
    wind_speed_10m: 25.0,
    wind_direction_10m: 210,
    is_day: 1,
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
  clearWeatherCache();
});

describe.skipIf(!ready || !realZone)('GET /api/location/overview (real Chennai geography)', () => {
  it('composes live weather + real zone + nearby real assets + MODELED risk/cascade', async () => {
    const token = await login('government@climateshield.demo');
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => okWeather })));

    const res = await request(app)
      .get(`/api/location/overview?latitude=${realZone!.latitude}&longitude=${realZone!.longitude}&radiusKm=3`)
      .set(auth(token));

    expect(res.status).toBe(200);
    const d = res.body.data;

    // Live weather block
    expect(d.weather.dataQuality).toBe('LIVE_OBSERVED');
    expect(d.weather.provider).toBe('Open-Meteo');
    expect(d.weather.observedAt).toBeTruthy();

    // Real zone resolution
    expect(d.zone).toMatchObject({ id: realZone!.id, boundaryDataQuality: 'REAL_GEOGRAPHIC' });

    // Nearby assets are labelled and distance-ordered
    expect(d.nearbyAssets.length).toBeGreaterThan(0);
    expect(d.nearbyAssets.every((a: { dataQuality: string; distanceKm: number }) => !!a.dataQuality && a.distanceKm <= 3)).toBe(true);
    const real = d.nearbyAssets.find((a: { dataQuality: string }) => a.dataQuality === 'REAL_GEOGRAPHIC');
    expect(real).toBeTruthy();
    expect(real.source).toBe('OpenStreetMap');

    // Risk is MODELED on LIVE inputs, never claimed as observed
    expect(d.risk.dataQuality).toBe('MODELED');
    expect(d.risk.inputs.weather.dataQuality).toBe('LIVE_OBSERVED');
    expect(d.risk.assets.length).toBeGreaterThan(0);
    expect(d.risk.assets[0].risk.score).toBeGreaterThanOrEqual(0);
    expect(d.risk.assets[0].risk.score).toBeLessThanOrEqual(100);

    // Cascade is MODELED (dependency graph is a domain model)
    expect(d.cascade?.dataQuality).toBe('MODELED');

    // Alerts are honestly UNKNOWN, not fabricated
    expect(d.alerts.items).toEqual([]);
    expect(d.alerts.dataQuality).toBe('UNKNOWN');
  });

  it('returns zone=null for coordinates outside every mapped boundary', async () => {
    const token = await login('analyst@climateshield.demo');
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => okWeather })));
    const res = await request(app)
      .get('/api/location/overview?latitude=51.5074&longitude=-0.1278&radiusKm=2') // London
      .set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.data.zone).toBeNull();
    expect(res.body.data.cascade).toBeNull();
    expect(res.body.data.nearbyAssets).toEqual([]);
  });

  it('rejects invalid coordinates with 400', async () => {
    const token = await login('government@climateshield.demo');
    const res = await request(app)
      .get('/api/location/overview?latitude=95&longitude=80')
      .set(auth(token));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('requires authentication', async () => {
    const res = await request(app).get(`/api/location/overview?latitude=13&longitude=80`);
    expect(res.status).toBe(401);
  });
});
