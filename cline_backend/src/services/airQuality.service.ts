import { env } from '../config/env';

/**
 * LIVE AIR QUALITY (Open-Meteo Air Quality API - no API key required).
 * Supplementary/best-effort: on any provider failure we return null rather than
 * throwing, because AQI is non-critical context on the citizen map. Values are
 * provider observations (LIVE_OBSERVED); nothing is invented.
 */

export type AqiFetcher = (
  url: string,
  init?: RequestInit,
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

const PROVIDER_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const FETCH_TIMEOUT_MS = 8000;

export interface NormalizedAirQuality {
  provider: 'Open-Meteo Air Quality';
  dataQuality: 'LIVE_OBSERVED';
  observedAt: string | null;
  usAqi: number | null;
  category: string | null;
  pm2_5: number | null;
  pm10: number | null;
  ozone: number | null;
  nitrogenDioxide: number | null;
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** US EPA AQI category bands. Unknown/degenerate values -> null. */
export function usAqiCategory(aqi: number | null): string | null {
  if (aqi == null) return null;
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

export function buildAirQualityUrl(latitude: number, longitude: number): string {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone',
    timeformat: 'unixtime',
  });
  return `${PROVIDER_URL}?${params.toString()}`;
}

export function normalizeAirQuality(payload: unknown): NormalizedAirQuality | null {
  const current = (payload as { current?: Record<string, unknown> } | null)?.current;
  if (!current || typeof current !== 'object') return null;
  const observedMs = num(current.time);
  const usAqi = num(current.us_aqi);
  return {
    provider: 'Open-Meteo Air Quality',
    dataQuality: 'LIVE_OBSERVED',
    observedAt: observedMs != null ? new Date(observedMs * 1000).toISOString() : null,
    usAqi,
    category: usAqiCategory(usAqi),
    pm2_5: num(current.pm2_5),
    pm10: num(current.pm10),
    ozone: num(current.ozone),
    nitrogenDioxide: num(current.nitrogen_dioxide),
  };
}

// ---------- short-lived in-memory cache ----------
interface CacheEntry { payload: NormalizedAirQuality; fetchedAtMs: number }
const cache = new Map<string, CacheEntry>();

function cacheKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
}

export function clearAirQualityCache(): void {
  cache.clear();
}

export async function getCurrentAirQuality(
  input: { latitude: number; longitude: number },
  fetcher: AqiFetcher = (url, init) => fetch(url, init),
): Promise<NormalizedAirQuality | null> {
  const key = cacheKey(input.latitude, input.longitude);
  const ttl = env.WEATHER_CACHE_SECONDS;
  const hit = cache.get(key);
  if (hit && ttl > 0 && Date.now() - hit.fetchedAtMs <= ttl * 1000) return hit.payload;

  try {
    const response = await fetcher(buildAirQualityUrl(input.latitude, input.longitude), {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const normalized = normalizeAirQuality(await response.json());
    if (normalized) cache.set(key, { payload: normalized, fetchedAtMs: Date.now() });
    return normalized;
  } catch {
    return null; // best-effort; never blocks the citizen map
  }
}
