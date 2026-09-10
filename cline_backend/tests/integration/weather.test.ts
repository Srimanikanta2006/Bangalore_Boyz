import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app, auth, dbReady, login } from '../helpers';
import { clearWeatherCache } from '../../src/services/weather.service';

const ready = await dbReady();

const okPayload = {
  current: {
    time: Math.floor(Date.now() / 1000) - 60,
    temperature_2m: 31.4,
    relative_humidity_2m: 70,
    apparent_temperature: 36.2,
    precipitation: 2.5,
    rain: 2.5,
    weather_code: 61,
    wind_speed_10m: 18.1,
    wind_direction_10m: 220,
    is_day: 1,
  },
};

function stubFetch(behavior: 'ok' | 'fail') {
  const mock = vi.fn(async () =>
    behavior === 'ok'
      ? { ok: true, status: 200, json: async () => okPayload }
      : { ok: false, status: 500, json: async () => ({}) },
  );
  vi.stubGlobal('fetch', mock);
  return mock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  clearWeatherCache();
});

describe.skipIf(!ready)('GET /api/weather/current (live provider, mocked fetch)', () => {
  it('returns normalized LIVE_OBSERVED weather for lat/lng (no seed/DB dependency)', async () => {
    const token = await login('government@climateshield.demo');
    stubFetch('ok');
    const res = await request(app)
      .get('/api/weather/current?latitude=16.5062&longitude=80.6480&forecastHours=3')
      .set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const d = res.body.data;
    expect(d.provider).toBe('Open-Meteo');
    expect(d.dataQuality).toBe('LIVE_OBSERVED');
    expect(d.location).toEqual({ latitude: 16.5062, longitude: 80.648 });
    expect(d.temperatureC).toBe(31.4);
    expect(d.rainfallMmPerHour).toBe(2.5);
    expect(d.windDirectionCardinal).toBe('SW');
    expect(d.weatherCondition).toBe('Light rain');
    expect(d.freshnessSeconds).toBeGreaterThanOrEqual(60);
    expect(d.waterDepthM).toBeNull();
    expect(d.derivedAssessment.dataQuality).toBe('MODELED');
    expect(d.notes[0]).toContain('Live flood-depth source unavailable');
  });

  it('serves the second request from the short-lived cache (fetch called once)', async () => {
    const token = await login('government@climateshield.demo');
    const mock = stubFetch('ok');
    await request(app).get('/api/weather/current?latitude=12.0&longitude=77.0').set(auth(token));
    await request(app).get('/api/weather/current?latitude=12.0&longitude=77.0').set(auth(token));
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid coordinates with 400 VALIDATION_ERROR', async () => {
    const token = await login('government@climateshield.demo');
    stubFetch('ok');
    const res = await request(app).get('/api/weather/current?latitude=95&longitude=80').set(auth(token));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('maps provider failures to 502 WEATHER_PROVIDER_* without leaking internals', async () => {
    const token = await login('government@climateshield.demo');
    stubFetch('fail');
    const res = await request(app).get('/api/weather/current?latitude=12.0&longitude=77.0').set(auth(token));
    expect(res.status).toBe(502);
    expect(['WEATHER_PROVIDER_ERROR', 'WEATHER_PROVIDER_UNAVAILABLE']).toContain(res.body.error.code);
  });

  it('requires authentication', async () => {
    stubFetch('ok');
    const res = await request(app).get('/api/weather/current?latitude=12&longitude=77');
    expect(res.status).toBe(401);
  });
});
