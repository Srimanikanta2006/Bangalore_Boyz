import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app, auth, dbReady, login } from '../helpers';
import { clearWeatherCache } from '../../src/services/weather.service';

const ready = await dbReady();
const LAT = 13.062;
const LON = 80.275;

function stubWeather(rain: number) {
  const now = Math.floor(Date.now() / 1000);
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        current: { time: now - 60, temperature_2m: 31, rain, precipitation: rain, wind_speed_10m: 15, is_day: 1 },
        hourly: { time: [now + 1800], temperature_2m: [31], precipitation: [rain], rain: [rain] },
      }),
    })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  clearWeatherCache();
});

describe.skipIf(!ready)('GET /api/citizen/alerts', () => {
  it('computes advisories from active hazards + modeled weather (labeled)', async () => {
    const token = await login('citizen@climateshield.demo');
    stubWeather(60); // 60 mm/hr -> MODELED HIGH flood

    const res = await request(app).get(`/api/citizen/alerts?latitude=${LAT}&longitude=${LON}`).set(auth(token));
    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d.count).toBeGreaterThan(0);
    // Sorted worst-first; every alert carries category, severity, dataQuality, tags.
    for (const a of d.alerts) {
      expect(a).toHaveProperty('category');
      expect(a).toHaveProperty('dataQuality');
      expect(Array.isArray(a.tags)).toBe(true);
    }
    // A modeled live-weather advisory should be present.
    expect(d.alerts.some((a: { id: string }) => a.id === 'weather-modeled')).toBe(true);
  });

  it('is CITIZEN-only (government 403) and requires auth (401)', async () => {
    const govToken = await login('government@climateshield.demo');
    const forbidden = await request(app).get(`/api/citizen/alerts?latitude=${LAT}&longitude=${LON}`).set(auth(govToken));
    expect(forbidden.status).toBe(403);

    const unauth = await request(app).get(`/api/citizen/alerts?latitude=${LAT}&longitude=${LON}`);
    expect(unauth.status).toBe(401);
  });
});
