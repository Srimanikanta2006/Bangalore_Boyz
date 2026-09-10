import type { Prisma, Severity } from '@prisma/client';
import { env } from '../config/env';
import { prisma } from '../db/prisma';
import { AppError } from '../utils/errors';
import { pointInZoneGeoJson } from '../utils/geo';
import { buildPaginated, resolvePagination } from '../utils/pagination';

/**
 * LIVE LOCATION-AWARE WEATHER (Open-Meteo - no API key required).
 * The live provider is authoritative for CURRENT observations; the database is
 * only used for optional zone resolution and background-poll history.
 * Measurements are provider values (LIVE_OBSERVED); anything derived from them
 * via documented thresholds is explicitly labeled MODELED. No value is invented.
 */

export type WeatherFetcher = (url: string, init?: RequestInit) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

const PROVIDER_URL = 'https://api.open-meteo.com/v1/forecast';
const FETCH_TIMEOUT_MS = 8000;

export interface ForecastHour {
  time: string;
  dataQuality: 'FORECAST';
  temperatureC: number | null;
  precipitationMm: number | null;
  rainfallMmPerHour: number | null;
}

export interface NormalizedWeather {
  location: { latitude: number; longitude: number };
  provider: 'Open-Meteo';
  dataQuality: 'LIVE_OBSERVED';
  observedAt: string | null;
  fetchedAt: string;
  freshnessSeconds: number | null;
  temperatureC: number | null;
  apparentTemperatureC: number | null;
  humidityPercent: number | null;
  precipitationMm: number | null;
  rainfallMmPerHour: number | null;
  windSpeedKmh: number | null;
  windDirectionDeg: number | null;
  windDirectionCardinal: string | null;
  weatherCode: number | null;
  weatherCondition: string | null;
  isDay: boolean | null;
  forecast: ForecastHour[];
  derivedAssessment: {
    dataQuality: 'MODELED';
    floodSeverity: Severity | null;
    heatSeverity: Severity | null;
    windSeverity: Severity | null;
    overallSeverity: Severity | null;
    explanation: string;
  };
  zone: { id: string; name: string; code: string; boundaryDataQuality: 'REAL_GEOGRAPHIC' | 'SYNTHETIC_DEMO' } | null;
  waterDepthM: null;
  notes: string[];
}

/** Provider-documented WMO weather-code labels (unknown codes stay null). */
const WMO_CONDITIONS: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Depositing rime fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
  61: 'Light rain', 63: 'Moderate rain', 65: 'Heavy rain',
  66: 'Light freezing rain', 67: 'Heavy freezing rain',
  71: 'Light snowfall', 73: 'Moderate snowfall', 75: 'Heavy snowfall', 77: 'Snow grains',
  80: 'Light rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
  85: 'Light snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
};

const CARDINALS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

function cardinal(deg: number | null | undefined): string | null {
  if (deg == null || !Number.isFinite(deg)) return null;
  return CARDINALS[Math.round(((deg % 360) / 22.5)) % 16];
}

const SEVERITY_RANK: Record<Severity, number> = { LOW: 1, MODERATE: 2, HIGH: 3, CRITICAL: 4 };

/** Deterministic, documented thresholds (aligned with the risk engine's intensity rules). */
export function deriveSeverities(input: { rainfallMmPerHour: number | null; temperatureC: number | null; windSpeedKmh: number | null }) {
  const rain = input.rainfallMmPerHour;
  const floodSeverity: Severity | null =
    rain == null || rain <= 0 ? null : rain >= 70 ? 'CRITICAL' : rain >= 50 ? 'HIGH' : rain >= 30 ? 'MODERATE' : 'LOW';
  const temp = input.temperatureC;
  const heatSeverity: Severity | null =
    temp == null || temp < 35 ? null : temp >= 45 ? 'CRITICAL' : temp >= 40 ? 'HIGH' : 'MODERATE';
  const wind = input.windSpeedKmh;
  const windSeverity: Severity | null =
    wind == null || wind < 60 ? null : wind >= 90 ? 'CRITICAL' : wind >= 70 ? 'HIGH' : 'MODERATE';
  const drivers = [floodSeverity, heatSeverity, windSeverity].filter((s): s is Severity => s != null);
  const overallSeverity = drivers.length
    ? drivers.reduce((a, b) => (SEVERITY_RANK[b] > SEVERITY_RANK[a] ? b : a))
    : null;
  return { floodSeverity, heatSeverity, windSeverity, overallSeverity };
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export function normalizeOpenMeteo(
  payload: unknown,
  ctx: { latitude: number; longitude: number; forecastHours: number; fetchedAt: Date },
): NormalizedWeather {
  const current = (payload as { current?: Record<string, unknown> } | null)?.current;
  if (!current || typeof current !== 'object') {
    throw new AppError('WEATHER_PROVIDER_ERROR', 'Live weather provider returned a malformed payload', 502);
  }
  const observedMs = num(current.time);
  const observedAt = observedMs != null ? new Date(observedMs * 1000).toISOString() : null;
  const temperatureC = num(current.temperature_2m);
  const precipitationMm = num(current.precipitation);
  const rainfallMmPerHour = num(current.rain);
  const windSpeedKmh = num(current.wind_speed_10m);
  const windDirectionDeg = num(current.wind_direction_10m);
  const weatherCode = num(current.weather_code);
  const isDay = typeof current.is_day === 'number' ? current.is_day === 1 : null;

  const forecast: ForecastHour[] = [];
  const hourly = (payload as { hourly?: Record<string, unknown> } | null)?.hourly;
  if (ctx.forecastHours > 0 && hourly && Array.isArray(hourly.time)) {
    const times = hourly.time as number[];
    const temps = (hourly.temperature_2m ?? []) as unknown[];
    const prec = (hourly.precipitation ?? []) as unknown[];
    const rain = (hourly.rain ?? []) as unknown[];
    for (let i = 0; i < times.length && forecast.length < ctx.forecastHours; i++) {
      if (observedMs != null && times[i] <= observedMs) continue;
      forecast.push({
        time: new Date(times[i] * 1000).toISOString(),
        dataQuality: 'FORECAST',
        temperatureC: num(temps[i]),
        precipitationMm: num(prec[i]),
        rainfallMmPerHour: num(rain[i]),
      });
    }
  }

  const derived = deriveSeverities({ rainfallMmPerHour, temperatureC, windSpeedKmh });
  const driverText = [
    derived.floodSeverity ? `rainfall ${rainfallMmPerHour} mm/hr -> ${derived.floodSeverity}` : null,
    derived.heatSeverity ? `temperature ${temperatureC} C -> ${derived.heatSeverity}` : null,
    derived.windSeverity ? `wind ${windSpeedKmh} km/h -> ${derived.windSeverity}` : null,
  ].filter(Boolean).join('; ');

  return {
    location: { latitude: ctx.latitude, longitude: ctx.longitude },
    provider: 'Open-Meteo',
    dataQuality: 'LIVE_OBSERVED',
    observedAt,
    fetchedAt: ctx.fetchedAt.toISOString(),
    freshnessSeconds: observedMs != null ? Math.max(0, Math.round((ctx.fetchedAt.getTime() - observedMs * 1000) / 1000)) : null,
    temperatureC,
    apparentTemperatureC: num(current.apparent_temperature),
    humidityPercent: num(current.relative_humidity_2m),
    precipitationMm,
    rainfallMmPerHour,
    windSpeedKmh,
    windDirectionDeg,
    windDirectionCardinal: cardinal(windDirectionDeg),
    weatherCode,
    weatherCondition: weatherCode != null ? WMO_CONDITIONS[weatherCode] ?? null : null,
    isDay,
    forecast,
    derivedAssessment: {
      dataQuality: 'MODELED',
      ...derived,
      explanation: derived.overallSeverity
        ? `MODELED severity (${derived.overallSeverity}) derived from live observations via documented thresholds: ${driverText}. This is a modeled classification, NOT an observed measurement.`
        : 'No hazard driver exceeds documented thresholds; modeled severity is null.',
    },
    zone: null, // resolved by the caller (DB-dependent)
    waterDepthM: null,
    notes: ['Live flood-depth source unavailable: waterDepth is null (no accessible gauge/hydrology provider integrated). Rainfall is live independently.'],
  };
}

export function buildWeatherUrl(latitude: number, longitude: number, forecastHours: number): string {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m,is_day',
    timezone: 'auto',
    timeformat: 'unixtime',
  });
  if (forecastHours > 0) {
    params.set('hourly', 'temperature_2m,precipitation,rain');
    params.set('forecast_days', '2');
  }
  return `${PROVIDER_URL}?${params.toString()}`;
}

// ---------- short-lived in-memory cache (no Redis) ----------

interface CacheEntry { payload: NormalizedWeather; fetchedAtMs: number }
const cache = new Map<string, CacheEntry>();

export function cacheKey(latitude: number, longitude: number, forecastHours: number): string {
  return `${latitude.toFixed(3)},${longitude.toFixed(3)},${forecastHours}`; // ~110m resolution
}

export function getCachedWeather(key: string, opts: { now?: number; ttlSeconds?: number } = {}): NormalizedWeather | null {
  const ttl = opts.ttlSeconds ?? env.WEATHER_CACHE_SECONDS;
  if (ttl <= 0) return null;
  const entry = cache.get(key);
  if (!entry) return null;
  if ((opts.now ?? Date.now()) - entry.fetchedAtMs > ttl * 1000) {
    cache.delete(key);
    return null;
  }
  return entry.payload;
}

export function setCachedWeather(key: string, payload: NormalizedWeather, now = Date.now()): void {
  cache.set(key, { payload, fetchedAtMs: now });
}

export function clearWeatherCache(): void {
  cache.clear();
}

// ---------- zone resolution (real GCC zones preferred over synthetic demo zones) ----------

async function resolveZone(latitude: number, longitude: number) {
  const zones = await prisma.zone.findMany({
    select: { id: true, name: true, code: true, dataQuality: true, boundaryGeoJson: true },
  });
  const ordered = [...zones].sort(
    (a, b) => Number(b.dataQuality === 'REAL_GEOGRAPHIC') - Number(a.dataQuality === 'REAL_GEOGRAPHIC'),
  );
  for (const zone of ordered) {
    if (pointInZoneGeoJson(latitude, longitude, zone.boundaryGeoJson)) {
      return {
        id: zone.id,
        name: zone.name,
        code: zone.code,
        boundaryDataQuality: zone.dataQuality === 'REAL_GEOGRAPHIC' ? ('REAL_GEOGRAPHIC' as const) : ('SYNTHETIC_DEMO' as const),
      };
    }
  }
  return null;
}

export async function getCurrentWeather(
  input: { latitude: number; longitude: number; forecastHours?: number },
  fetcher: WeatherFetcher = (url, init) => fetch(url, init),
): Promise<NormalizedWeather> {
  const forecastHours = input.forecastHours ?? 0;
  const key = cacheKey(input.latitude, input.longitude, forecastHours);
  const cached = getCachedWeather(key);
  if (cached) return cached;

  let payload: unknown;
  try {
    const response = await fetcher(buildWeatherUrl(input.latitude, input.longitude, forecastHours), {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new AppError('WEATHER_PROVIDER_ERROR', `Live weather provider returned HTTP ${response.status}`, 502);
    }
    payload = await response.json();
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('WEATHER_PROVIDER_UNAVAILABLE', 'Live weather provider is unreachable', 502);
  }

  const normalized = normalizeOpenMeteo(payload, {
    latitude: input.latitude,
    longitude: input.longitude,
    forecastHours,
    fetchedAt: new Date(),
  });
  normalized.zone = await resolveZone(input.latitude, input.longitude);
  setCachedWeather(key, normalized);
  return normalized;
}

// ---------- persisted history (background polling) ----------

export async function listWeatherHistory(query: { zoneId?: string; page?: number; limit?: number }) {
  const { page, limit, skip, take } = resolvePagination(query);
  const where: Prisma.WeatherSnapshotWhereInput = query.zoneId ? { zoneId: query.zoneId } : {};
  const [rows, total] = await Promise.all([
    prisma.weatherSnapshot.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { zone: { select: { id: true, name: true, code: true } } },
    }),
    prisma.weatherSnapshot.count({ where }),
  ]);
  return buildPaginated(rows, total, page, limit);
}
