import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app, auth, dbReady, login } from '../helpers';
import { clearWeatherCache } from '../../src/services/weather.service';
import { clearAirQualityCache } from '../../src/services/airQuality.service';
import { clearFloodCache } from '../../src/services/flood.service';

const ready = await dbReady();

// East Basin demo zone centre (has an ACTIVE CRITICAL flash-flood hazard in the seed).
const LAT = 13.062;
const LON = 80.275;

function stubProviders() {
  const now = Math.floor(Date.now() / 1000);
  const weatherPayload = {
    current: {
      time: now - 120,
      temperature_2m: 31.5,
      relative_humidity_2m: 82,
      apparent_temperature: 38.4,
      precipitation: 55,
      rain: 55,
      weather_code: 63,
      wind_speed_10m: 22,
      wind_direction_10m: 200,
      is_day: 1,
    },
    hourly: {
      time: [now + 1800, now + 5400],
      temperature_2m: [31, 32],
      precipitation: [3.2, 0],
      rain: [3.2, 0],
    },
  };
  const aqiPayload = { current: { time: now - 120, us_aqi: 64, pm2_5: 18.2, pm10: 40.1, nitrogen_dioxide: 12, ozone: 30 } };
  // 29 days at 10 m3/s then a spike to 16 m3/s (1.6x trailing mean) -> elevated=true.
  const floodPayload = { daily: { river_discharge: [...Array(29).fill(10), 16] } };

  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const u = String(url);
      const body = u.includes('air-quality') ? aqiPayload : u.includes('flood-api') ? floodPayload : weatherPayload;
      return { ok: true, status: 200, json: async () => body };
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  clearWeatherCache();
  clearAirQualityCache();
  clearFloodCache();
});

describe.skipIf(!ready)('GET /api/citizen/nearby', () => {
  it('returns a sanitized public-safety snapshot with live weather + AQI + hazards', async () => {
    const token = await login('citizen@climateshield.demo');
    stubProviders();

    const res = await request(app).get(`/api/citizen/nearby?latitude=${LAT}&longitude=${LON}&radiusKm=4`).set(auth(token));

    expect(res.status).toBe(200);
    const d = res.body.data;

    // Ward resolved from real point-in-zone.
    expect(d.ward?.name).toBeTruthy();
    expect(d.ward?.riskLevel).toBeTruthy();

    // Live weather labeled honestly.
    expect(d.weather.dataQuality).toBe('LIVE_OBSERVED');
    expect(d.weather.temperatureC).toBe(31.5);
    expect(d.weather.rainArrivalMinutes).toBeGreaterThan(0);
    // 55 mm/hr rain -> MODELED flood severity present.
    expect(d.weather.modeledSeverity).toBeTruthy();

    // Air quality from Open-Meteo.
    expect(d.airQuality?.usAqi).toBe(64);
    expect(d.airQuality?.category).toBe('Moderate');

    // Real river discharge from Open-Meteo Flood API (GloFAS) - elevated per the stubbed spike.
    expect(d.riverDischarge?.provider).toBe('Open-Meteo Flood (GloFAS)');
    expect(d.riverDischarge?.currentM3s).toBe(16);
    expect(d.riverDischarge?.elevated).toBe(true);
    // Elevated discharge is factored into the safety risk count alongside the hazard/weather drivers.
    expect(d.safety.riskCount).toBeGreaterThanOrEqual(3);

    // Active seed hazard surfaced with dataQuality.
    expect(Array.isArray(d.hazards)).toBe(true);
    expect(d.hazards.length).toBeGreaterThan(0);
    expect(d.hazards[0].dataQuality).toBeTruthy();

    // Computed fields.
    expect(['SAFE', 'MODERATE', 'HIGH', 'CRITICAL']).toContain(d.safety.level);
    expect(['CLEAR', 'CAUTION', 'BLOCKED']).toContain(d.corridorStatus);

    // Sanitization: no internal vulnerability scores leak on infrastructure.
    for (const i of d.infrastructure) expect(i).not.toHaveProperty('vulnerability');
  });

  it('degrades gracefully when the AQI provider fails (weather still returned)', async () => {
    const token = await login('citizen@climateshield.demo');
    const now = Math.floor(Date.now() / 1000);
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (String(url).includes('air-quality')) return { ok: false, status: 503, json: async () => ({}) };
        return {
          ok: true,
          status: 200,
          json: async () => ({ current: { time: now - 60, temperature_2m: 30, rain: 0, wind_speed_10m: 10, is_day: 1 } }),
        };
      }),
    );

    const res = await request(app).get(`/api/citizen/nearby?latitude=${LAT}&longitude=${LON}`).set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.data.airQuality).toBeNull();
    expect(res.body.data.weather.temperatureC).toBe(30);
  });

  it('rejects invalid coordinates with 400', async () => {
    const token = await login('citizen@climateshield.demo');
    const res = await request(app).get('/api/citizen/nearby?latitude=200&longitude=80').set(auth(token));
    expect(res.status).toBe(400);
  });

  it('is CITIZEN-only: government accounts get 403', async () => {
    const token = await login('government@climateshield.demo');
    const res = await request(app).get(`/api/citizen/nearby?latitude=${LAT}&longitude=${LON}`).set(auth(token));
    expect(res.status).toBe(403);
  });

  it('requires authentication', async () => {
    const res = await request(app).get(`/api/citizen/nearby?latitude=${LAT}&longitude=${LON}`);
    expect(res.status).toBe(401);
  });
});
