import { afterEach, describe, expect, it } from 'vitest';
import { weatherQuerySchema } from '../../src/validators/weather.schema';
import {
  buildWeatherUrl,
  cacheKey,
  clearWeatherCache,
  deriveSeverities,
  getCachedWeather,
  normalizeOpenMeteo,
  setCachedWeather,
} from '../../src/services/weather.service';
import { pointInZoneGeoJson } from '../../src/utils/geo';

const fetchedAt = new Date('2026-09-10T10:00:00Z');
const observedSec = Math.floor(new Date('2026-09-10T09:45:00Z').getTime() / 1000); // 15 min before fetch

const fullPayload = {
  utc_offset_seconds: 19800,
  current: {
    time: observedSec,
    temperature_2m: 28.8,
    relative_humidity_2m: 76,
    apparent_temperature: 34.0,
    precipitation: 12.3,
    rain: 12.3,
    weather_code: 65,
    wind_speed_10m: 22.4,
    wind_direction_10m: 235,
    is_day: 1,
  },
  hourly: {
    time: [observedSec, observedSec + 3600, observedSec + 7200],
    temperature_2m: [28.8, 28.1, 27.4],
    precipitation: [12.3, 3.1, 0.0],
    rain: [12.3, 3.1, 0.0],
  },
};

describe('weather query validation', () => {
  it('accepts valid coordinates and defaults forecastHours', () => {
    const parsed = weatherQuerySchema.parse({ latitude: '16.5062', longitude: '80.648' });
    expect(parsed.latitude).toBe(16.5062);
    expect(parsed.longitude).toBe(80.648);
    expect(parsed.forecastHours).toBe(0);
  });

  it('rejects out-of-range latitude/longitude', () => {
    expect(weatherQuerySchema.safeParse({ latitude: 91, longitude: 0 }).success).toBe(false);
    expect(weatherQuerySchema.safeParse({ latitude: 0, longitude: -181 }).success).toBe(false);
    expect(weatherQuerySchema.safeParse({ latitude: 'abc', longitude: 0 }).success).toBe(false);
  });
});

describe('Open-Meteo normalization', () => {
  it('maps provider fields to the normalized contract', () => {
    const n = normalizeOpenMeteo(fullPayload, { latitude: 16.5, longitude: 80.6, forecastHours: 2, fetchedAt });
    expect(n.provider).toBe('Open-Meteo');
    expect(n.dataQuality).toBe('LIVE_OBSERVED');
    expect(n.temperatureC).toBe(28.8);
    expect(n.precipitationMm).toBe(12.3);
    expect(n.rainfallMmPerHour).toBe(12.3);
    expect(n.windSpeedKmh).toBe(22.4);
    expect(n.windDirectionDeg).toBe(235);
    expect(n.windDirectionCardinal).toBe('SW');
    expect(n.weatherCondition).toBe('Heavy rain');
    expect(n.observedAt).toBe(new Date(observedSec * 1000).toISOString());
    expect(n.freshnessSeconds).toBeGreaterThan(0);
    expect(n.waterDepthM).toBeNull();
    expect(n.notes[0]).toContain('Live flood-depth source unavailable');
  });

  it('labels forecast entries FORECAST and excludes already-observed hours', () => {
    const n = normalizeOpenMeteo(fullPayload, { latitude: 0, longitude: 0, forecastHours: 2, fetchedAt });
    expect(n.forecast).toHaveLength(2);
    expect(n.forecast.every((f) => f.dataQuality === 'FORECAST')).toBe(true);
    expect(n.forecast[0].temperatureC).toBe(28.1);
  });

  it('returns null for missing provider fields instead of inventing values', () => {
    const sparse = { current: { time: observedSec, temperature_2m: 30 } };
    const n = normalizeOpenMeteo(sparse, { latitude: 0, longitude: 0, forecastHours: 0, fetchedAt });
    expect(n.temperatureC).toBe(30);
    expect(n.rainfallMmPerHour).toBeNull();
    expect(n.precipitationMm).toBeNull();
    expect(n.windSpeedKmh).toBeNull();
    expect(n.weatherCode).toBeNull();
    expect(n.weatherCondition).toBeNull();
  });

  it('returns null condition for unknown WMO codes', () => {
    const odd = { current: { time: observedSec, weather_code: 42 } };
    expect(normalizeOpenMeteo(odd, { latitude: 0, longitude: 0, forecastHours: 0, fetchedAt }).weatherCondition).toBeNull();
  });

  it('throws a 502 provider error on malformed payloads', () => {
    expect(() => normalizeOpenMeteo({}, { latitude: 0, longitude: 0, forecastHours: 0, fetchedAt })).toThrowError();
  });
});

describe('deterministic severity derivation (MODELED)', () => {
  it('uses documented rainfall thresholds', () => {
    expect(deriveSeverities({ rainfallMmPerHour: 75, temperatureC: 20, windSpeedKmh: 10 }).floodSeverity).toBe('CRITICAL');
    expect(deriveSeverities({ rainfallMmPerHour: 65, temperatureC: null, windSpeedKmh: null }).floodSeverity).toBe('HIGH');
    expect(deriveSeverities({ rainfallMmPerHour: 35, temperatureC: null, windSpeedKmh: null }).floodSeverity).toBe('MODERATE');
    expect(deriveSeverities({ rainfallMmPerHour: 0, temperatureC: null, windSpeedKmh: null }).floodSeverity).toBeNull();
  });

  it('uses documented heat and wind thresholds', () => {
    expect(deriveSeverities({ rainfallMmPerHour: null, temperatureC: 46, windSpeedKmh: null }).heatSeverity).toBe('CRITICAL');
    expect(deriveSeverities({ rainfallMmPerHour: null, temperatureC: 41, windSpeedKmh: null }).heatSeverity).toBe('HIGH');
    expect(deriveSeverities({ rainfallMmPerHour: null, temperatureC: 30, windSpeedKmh: null }).heatSeverity).toBeNull();
    expect(deriveSeverities({ rainfallMmPerHour: null, temperatureC: null, windSpeedKmh: 95 }).windSeverity).toBe('CRITICAL');
    expect(deriveSeverities({ rainfallMmPerHour: null, temperatureC: null, windSpeedKmh: 55 }).windSeverity).toBeNull();
  });

  it('marks derived assessment MODELED and never claims observation', () => {
    const n = normalizeOpenMeteo(fullPayload, { latitude: 0, longitude: 0, forecastHours: 0, fetchedAt });
    expect(n.derivedAssessment.dataQuality).toBe('MODELED');
    expect(n.derivedAssessment.explanation).toContain('NOT an observed measurement');
    expect(n.derivedAssessment.floodSeverity).toBe('LOW'); // 12.3 mm/hr
  });
});

describe('weather cache', () => {
  afterEach(() => clearWeatherCache());

  it('returns cached payloads within TTL and expires after TTL', () => {
    const key = cacheKey(16.5, 80.6, 0);
    const payload = normalizeOpenMeteo(fullPayload, { latitude: 16.5, longitude: 80.6, forecastHours: 0, fetchedAt });
    setCachedWeather(key, payload, 1000);
    expect(getCachedWeather(key, { now: 2000, ttlSeconds: 300 })).not.toBeNull();
    expect(getCachedWeather(key, { now: 1000 + 301 * 1000, ttlSeconds: 300 })).toBeNull();
  });

  it('rounds cache keys to ~110m and honors TTL=0 (disabled)', () => {
    expect(cacheKey(16.50001, 80.60002, 0)).toBe(cacheKey(16.50004, 80.60007, 0));
    const key = cacheKey(1, 2, 0);
    setCachedWeather(key, normalizeOpenMeteo(fullPayload, { latitude: 1, longitude: 2, forecastHours: 0, fetchedAt }));
    expect(getCachedWeather(key, { now: Date.now(), ttlSeconds: 0 })).toBeNull();
  });

  it('builds a provider URL with unixtime + optional hourly forecast', () => {
    const url = buildWeatherUrl(16.5, 80.6, 3);
    expect(url).toContain('api.open-meteo.com');
    expect(url).toContain('timeformat=unixtime');
    expect(url).toContain('hourly=');
    expect(buildWeatherUrl(1, 2, 0)).not.toContain('hourly=');
  });
});

describe('point-in-zone boundaries', () => {
  const boundary = {
    type: 'Polygon',
    coordinates: [[[80.0, 13.0], [81.0, 13.0], [81.0, 14.0], [80.0, 14.0], [80.0, 13.0]]],
  };
  it('detects points inside/outside the polygon', () => {
    expect(pointInZoneGeoJson(13.5, 80.5, boundary)).toBe(true);
    expect(pointInZoneGeoJson(12.5, 80.5, boundary)).toBe(false);
  });
  it('never guesses on malformed boundaries', () => {
    expect(pointInZoneGeoJson(13.5, 80.5, null)).toBe(false);
    expect(pointInZoneGeoJson(13.5, 80.5, { type: 'Polygon' })).toBe(false);
  });
});
