/**
 * LIVE RIVER DISCHARGE (Open-Meteo Flood API - GloFAS reanalysis/forecast,
 * no API key required for non-commercial use). This is a genuine
 * flood-specific signal (m³/s of river discharge at the nearest ~5km grid
 * cell), complementing our existing rainfall-only flood inference.
 *
 * Deterministic, documented method (mirrors the risk engine's style): we
 * fetch the last 30 days + today of daily discharge, use the trailing mean
 * as a live-computed baseline, and flag "elevated" when today's discharge
 * exceeds 1.3x that baseline. This is NOT a forecast model of our own - it
 * is a transparent ratio over real provider data, never fabricated.
 */

const PROVIDER_URL = 'https://flood-api.open-meteo.com/v1/flood';
const FETCH_TIMEOUT_MS = 8000;
const ELEVATED_RATIO_THRESHOLD = 1.3;

export type FloodFetcher = (url: string, init?: RequestInit) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

export interface RiverDischarge {
  provider: 'Open-Meteo Flood (GloFAS)';
  dataQuality: 'LIVE_OBSERVED';
  latitude: number;
  longitude: number;
  currentM3s: number | null;
  trailingMeanM3s: number | null;
  ratioToTrailingMean: number | null;
  elevated: boolean;
  sampleDays: number;
  explanation: string;
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export function buildFloodUrl(latitude: number, longitude: number): string {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily: 'river_discharge',
    past_days: '30',
    forecast_days: '1',
    timeformat: 'unixtime',
  });
  return `${PROVIDER_URL}?${params.toString()}`;
}

export function normalizeFloodResponse(payload: unknown, latitude: number, longitude: number): RiverDischarge | null {
  const daily = (payload as { daily?: { time?: unknown; river_discharge?: unknown } } | null)?.daily;
  const values = Array.isArray(daily?.river_discharge) ? (daily!.river_discharge as unknown[]).map(num) : [];
  if (values.length === 0) return null;

  // Last non-null value is "current"; everything before it (real, provider-returned) is the trailing baseline.
  let currentIdx = values.length - 1;
  while (currentIdx >= 0 && values[currentIdx] == null) currentIdx--;
  if (currentIdx < 0) return null;

  const current = values[currentIdx];
  const history = values.slice(0, currentIdx).filter((v): v is number => v != null);
  const trailingMean = history.length > 0 ? history.reduce((a, b) => a + b, 0) / history.length : null;
  const ratio = current != null && trailingMean != null && trailingMean > 0 ? round2(current / trailingMean) : null;
  const elevated = ratio != null && ratio >= ELEVATED_RATIO_THRESHOLD;

  return {
    provider: 'Open-Meteo Flood (GloFAS)',
    dataQuality: 'LIVE_OBSERVED',
    latitude,
    longitude,
    currentM3s: current,
    trailingMeanM3s: trailingMean != null ? round2(trailingMean) : null,
    ratioToTrailingMean: ratio,
    elevated,
    sampleDays: history.length,
    explanation:
      ratio != null
        ? `Current river discharge (${current} m³/s) is ${ratio}x the ${history.length}-day trailing average (${round2(trailingMean!)} m³/s)${elevated ? ` — exceeds the ${ELEVATED_RATIO_THRESHOLD}x elevated-flow threshold.` : '.'}`
        : 'Insufficient discharge history at this location to compute a baseline.',
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// ---------- short-lived in-memory cache ----------
interface CacheEntry { payload: RiverDischarge; fetchedAtMs: number }
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_SECONDS = 3600; // river discharge changes slowly; 1h cache is appropriate

function cacheKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
}

export function clearFloodCache(): void {
  cache.clear();
}

/** Best-effort: returns null on any provider failure rather than throwing - river discharge is a supplementary signal. */
export async function getRiverDischarge(
  input: { latitude: number; longitude: number },
  fetcher: FloodFetcher = (url, init) => fetch(url, init),
): Promise<RiverDischarge | null> {
  const key = cacheKey(input.latitude, input.longitude);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.fetchedAtMs <= CACHE_TTL_SECONDS * 1000) return hit.payload;

  try {
    const response = await fetcher(buildFloodUrl(input.latitude, input.longitude), {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const normalized = normalizeFloodResponse(await response.json(), input.latitude, input.longitude);
    if (normalized) cache.set(key, { payload: normalized, fetchedAtMs: Date.now() });
    return normalized;
  } catch {
    return null;
  }
}
