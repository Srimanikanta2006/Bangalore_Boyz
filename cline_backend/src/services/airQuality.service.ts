import { env } from '../config/env';
import type { DataFreshness, Confidence } from '../utils/fetchResilience';

/**
 * LIVE AIR QUALITY (Open-Meteo Air Quality API - no API key required).
 * Supplementary/best-effort: on any provider failure we return null rather than
 * throwing, because AQI is non-critical context on the citizen map. Values are
 * provider observations (LIVE_OBSERVED); nothing is invented.
 *
 * Resilience: 3.5s timeout, 1 retry with backoff, stale-cache fallback.
 * Freshness flag: "live" | "stale" | "mock_fallback"
 * Confidence:     "HIGH" (live) | "MEDIUM" (stale) | "ESTIMATED" (mock_fallback)
 */

export type AqiFetcher = (
  url: string,
  init?: RequestInit,
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

const PROVIDER_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const FETCH_TIMEOUT_MS = 3500; // strict 3.5s per attempt
const FETCH_MAX_RETRIES = 1;
const STALE_FALLBACK_SECONDS = 3600; // up to 1 hour stale in degraded mode

export interface NormalizedAirQuality {
  provider: 'Open-Meteo Air Quality';
  dataQuality: 'LIVE_OBSERVED';
  /** Batch 2: explicit freshness tag. */
  dataFreshness: DataFreshness;
  /** Batch 2: confidence, downgraded for stale/fallback data. */
  confidence: Confidence;
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
    dataFreshness: 'live',  // default; overridden on stale fallback path
    confidence: 'HIGH',     // default; downgraded on stale fallback path
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

/** Return the stale entry if it's within the extended stale window, else null. */
function getStaleCachedAqi(key: string, now = Date.now()): NormalizedAirQuality | null {
  const entry = cache.get(key);
  if (!entry) return null;
  const ageMs = now - entry.fetchedAtMs;
  if (ageMs > (env.WEATHER_CACHE_SECONDS + STALE_FALLBACK_SECONDS) * 1000) return null;
  return entry.payload;
}

export async function getCurrentAirQuality(
  input: { latitude: number; longitude: number },
  fetcher: AqiFetcher = (url, init) => fetch(url, init),
): Promise<NormalizedAirQuality | null> {
  const key = cacheKey(input.latitude, input.longitude);
  const ttl = env.WEATHER_CACHE_SECONDS;
  const now = Date.now();

  // 1. Fresh cache hit
  const hit = cache.get(key);
  if (hit && ttl > 0 && now - hit.fetchedAtMs <= ttl * 1000) return hit.payload;

  // 2. Attempt live fetch with 1 retry + backoff
  const url = buildAirQualityUrl(input.latitude, input.longitude);
  for (let attempt = 0; attempt <= FETCH_MAX_RETRIES; attempt++) {
    if (attempt > 0) await new Promise<void>((r) => setTimeout(r, 400 * 2 ** (attempt - 1)));
    try {
      const response = await fetcher(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      if (!response.ok) break;
      const normalized = normalizeAirQuality(await response.json());
      if (normalized) {
        normalized.dataFreshness = 'live';
        normalized.confidence = 'HIGH';
        cache.set(key, { payload: normalized, fetchedAtMs: Date.now() });
        return normalized;
      }
      return null;
    } catch {
      // Transient: retry
    }
  }

  // 3. Stale fallback
  const stale = getStaleCachedAqi(key, now);
  if (stale) {
    return {
      ...stale,
      dataFreshness: 'stale',
      confidence: 'MEDIUM',
    };
  }

  // 4. No data at all — AQI is non-critical, return null
  return null;
}
