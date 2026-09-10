import type { Severity } from '@prisma/client';
import { prisma } from '../db/prisma';
import { getCurrentWeather, type NormalizedWeather, type WeatherFetcher } from './weather.service';
import { getCurrentAirQuality, type AqiFetcher } from './airQuality.service';
import { haversineKm } from '../utils/geo';

/**
 * CITIZEN experience service — sanitized, public-safety-only views composed from
 * the same live sources the government map uses (Open-Meteo weather + air
 * quality, DB hazards/zones/infrastructure), but WITHOUT any internal fields
 * (vulnerability scores, unit callsigns, telemetry internals, SLAs).
 * Every environmental value carries its own dataQuality; nothing is invented.
 */

const round2 = (n: number) => Math.round(n * 100) / 100;

export type SafetyLevel = 'SAFE' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type CorridorStatus = 'CLEAR' | 'CAUTION' | 'BLOCKED';

const SEVERITY_RANK: Record<Severity, number> = { LOW: 1, MODERATE: 2, HIGH: 3, CRITICAL: 4 };
const SAFETY_BY_RANK: SafetyLevel[] = ['SAFE', 'SAFE', 'MODERATE', 'HIGH', 'CRITICAL'];
const SCORE_BY_RANK = [12, 28, 52, 74, 92];

const FLOOD_HAZARD_TYPES = ['FLOOD', 'FLASH_FLOOD', 'DRAINAGE_OVERFLOW'];
const CITIZEN_INFRA_TYPES = [
  'EVACUATION_SHELTER',
  'COOLING_CENTER',
  'HOSPITAL',
  'CLINIC',
  'FIRE_STATION',
  'ROAD',
  'BRIDGE',
] as const;

function asSeverity(value: string | null | undefined): Severity | null {
  return value && value in SEVERITY_RANK ? (value as Severity) : null;
}

export function worstRank(severities: (Severity | null | undefined)[]): number {
  return severities.reduce<number>((max, s) => (s ? Math.max(max, SEVERITY_RANK[s]) : max), 0);
}

/** Deterministic citizen "safety index" from the worst active driver. */
export function computeSafety(input: {
  hazardSeverities: Severity[];
  weatherOverall: Severity | null;
  zoneRiskLevel?: string | null;
}): { level: SafetyLevel; score: number; riskCount: number } {
  const rank = worstRank([...input.hazardSeverities, input.weatherOverall, asSeverity(input.zoneRiskLevel)]);
  const riskCount = input.hazardSeverities.length + (input.weatherOverall ? 1 : 0);
  return { level: SAFETY_BY_RANK[rank], score: SCORE_BY_RANK[rank], riskCount };
}

/** Corridor status from nearby road/bridge operational states + active flooding. */
export function computeCorridorStatus(
  roads: { operationalStatus: string }[],
  floodActive: boolean,
): CorridorStatus {
  if (roads.some((r) => r.operationalStatus === 'COMPROMISED' || r.operationalStatus === 'OFFLINE')) return 'BLOCKED';
  if (floodActive || roads.some((r) => r.operationalStatus === 'AT_RISK' || r.operationalStatus === 'DEGRADED')) {
    return 'CAUTION';
  }
  return 'CLEAR';
}

/** Minutes until the next forecast hour with meaningful rain, else null. */
export function rainArrivalMinutes(
  forecast: { time: string; rainfallMmPerHour: number | null }[],
  now: number = Date.now(),
): number | null {
  for (const f of forecast) {
    if ((f.rainfallMmPerHour ?? 0) > 0.2) {
      const t = new Date(f.time).getTime();
      if (Number.isFinite(t) && t > now) return Math.round((t - now) / 60000);
    }
  }
  return null;
}

function freshnessMinutes(from: Date | string | null, now = Date.now()): number | null {
  if (!from) return null;
  const t = new Date(from).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.max(0, Math.round((now - t) / 60000));
}

function sanitizeWeather(weather: NormalizedWeather) {
  return {
    provider: weather.provider,
    dataQuality: weather.dataQuality,
    observedAt: weather.observedAt,
    freshnessSeconds: weather.freshnessSeconds,
    condition: weather.weatherCondition,
    temperatureC: weather.temperatureC,
    apparentTemperatureC: weather.apparentTemperatureC,
    humidityPercent: weather.humidityPercent,
    rainfallMmPerHour: weather.rainfallMmPerHour,
    windSpeedKmh: weather.windSpeedKmh,
    windDirectionCardinal: weather.windDirectionCardinal,
    isDay: weather.isDay,
    modeledSeverity: weather.derivedAssessment.overallSeverity,
    rainArrivalMinutes: rainArrivalMinutes(weather.forecast),
  };
}

export interface CitizenNearbyQuery {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  limit?: number;
}

export async function getCitizenNearby(
  input: CitizenNearbyQuery,
  fetchers: { weather?: WeatherFetcher; airQuality?: AqiFetcher } = {},
) {
  const latitude = input.latitude;
  const longitude = input.longitude;
  const radiusKm = Math.min(25, Math.max(0.5, input.radiusKm ?? 5));
  const limit = Math.min(50, Math.max(1, input.limit ?? 15));
  const now = Date.now();

  // Live environment (weather is authoritative; AQI is best-effort/nullable).
  const [weather, airQuality] = await Promise.all([
    getCurrentWeather({ latitude, longitude, forecastHours: 6 }, fetchers.weather),
    getCurrentAirQuality({ latitude, longitude }, fetchers.airQuality),
  ]);

  const zoneLite = weather.zone;
  const zone = zoneLite
    ? await prisma.zone.findUnique({
        where: { id: zoneLite.id },
        select: { id: true, name: true, code: true, riskLevel: true, population: true, latitude: true, longitude: true },
      })
    : null;

  // Nearby public infrastructure: bbox prefilter in SQL, exact haversine in JS.
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.max(0.2, Math.cos((latitude * Math.PI) / 180)));
  const candidates = await prisma.infrastructureAsset.findMany({
    where: {
      type: { in: CITIZEN_INFRA_TYPES as unknown as string[] as never },
      latitude: { gte: latitude - latDelta, lte: latitude + latDelta },
      longitude: { gte: longitude - lonDelta, lte: longitude + lonDelta },
    },
    take: 2000,
  });

  const nearby = candidates
    .map((a) => ({ a, distanceKm: round2(haversineKm({ latitude, longitude }, { latitude: a.latitude, longitude: a.longitude })) }))
    .filter((n) => n.distanceKm <= radiusKm)
    .sort((x, y) => x.distanceKm - y.distanceKm)
    .slice(0, limit);

  const infrastructure = nearby.map(({ a, distanceKm }) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    operationalStatus: a.operationalStatus,
    distanceKm,
    latitude: a.latitude,
    longitude: a.longitude,
    capacity: (a.metadata as { capacity?: number } | null)?.capacity ?? null,
    source: a.source,
    dataQuality: a.dataQuality,
  }));

  const roads = infrastructure.filter((i) => i.type === 'ROAD' || i.type === 'BRIDGE');

  const activeHazards = zone
    ? await prisma.hazard.findMany({ where: { zoneId: zone.id, status: 'ACTIVE' }, orderBy: { startedAt: 'desc' } })
    : [];

  const hazards = activeHazards.map((h) => ({
    id: h.id,
    type: h.type,
    severity: h.severity,
    status: h.status,
    startedAt: h.startedAt,
    freshnessMinutes: freshnessMinutes(h.startedAt, now),
    source: h.source,
    dataQuality: h.dataQuality,
    zoneName: zone?.name ?? null,
    latitude: zone?.latitude ?? null,
    longitude: zone?.longitude ?? null,
    rainfallRate: h.rainfallRate,
    waterDepth: h.waterDepth,
    temperature: h.temperature,
    windSpeed: h.windSpeed,
  }));

  const floodActive =
    activeHazards.some((h) => FLOOD_HAZARD_TYPES.includes(h.type)) ||
    weather.derivedAssessment.floodSeverity != null;

  const safety = computeSafety({
    hazardSeverities: activeHazards.map((h) => h.severity),
    weatherOverall: weather.derivedAssessment.overallSeverity,
    zoneRiskLevel: zone?.riskLevel ?? null,
  });

  return {
    location: { latitude, longitude },
    radiusKm,
    generatedAt: new Date().toISOString(),
    ward: zone
      ? {
          id: zone.id,
          name: zone.name,
          code: zone.code,
          riskLevel: zone.riskLevel,
          population: zone.population,
          boundaryDataQuality: zoneLite?.boundaryDataQuality ?? 'SYNTHETIC_DEMO',
        }
      : null,
    weather: sanitizeWeather(weather),
    airQuality,
    safety,
    corridorStatus: computeCorridorStatus(roads, floodActive),
    hazards,
    infrastructure,
    notes: [
      'Public-safety view. Environmental values are labeled by dataQuality (LIVE_OBSERVED / FORECAST / MODELED / SYNTHETIC_DEMO).',
      ...weather.notes,
    ],
  };
}

// ============================ CITIZEN ALERTS ============================

export type AlertCategory = 'FLOOD' | 'HEAT' | 'STORM' | 'WEATHER' | 'CORRIDOR';

export interface CitizenAlert {
  id: string;
  category: AlertCategory;
  severity: Severity;
  title: string;
  description: string;
  source: string;
  dataQuality: string;
  issuedAt: string;
  freshnessMinutes: number | null;
  tags: string[];
}

function hazardCategory(type: string): AlertCategory {
  if (FLOOD_HAZARD_TYPES.includes(type)) return 'FLOOD';
  if (type === 'EXTREME_HEAT') return 'HEAT';
  if (type === 'STORM' || type === 'HIGH_WIND') return 'STORM';
  return 'WEATHER';
}

function tagsFor(category: AlertCategory, severity: Severity): string[] {
  const tags: string[] = [];
  if (severity === 'HIGH' || severity === 'CRITICAL') tags.push('high');
  if (category === 'CORRIDOR') tags.push('corridors');
  else tags.push('weather');
  return tags;
}

/**
 * Computed nearby advisories from live active hazards, modeled weather severity
 * and nearby road/bridge closures. Public-safety info only — no deployments,
 * SLAs, or internal boards.
 */
export async function getCitizenAlerts(
  input: CitizenNearbyQuery,
  fetchers: { weather?: WeatherFetcher } = {},
) {
  const { latitude, longitude } = input;
  const radiusKm = Math.min(25, Math.max(0.5, input.radiusKm ?? 5));
  const now = Date.now();

  const weather = await getCurrentWeather({ latitude, longitude, forecastHours: 6 }, fetchers.weather);
  const zone = weather.zone;

  const activeHazards = zone
    ? await prisma.hazard.findMany({ where: { zoneId: zone.id, status: 'ACTIVE' }, orderBy: { startedAt: 'desc' } })
    : [];

  const alerts: CitizenAlert[] = [];

  // 1) Active hazard advisories.
  for (const h of activeHazards) {
    const category = hazardCategory(h.type);
    alerts.push({
      id: `hazard-${h.id}`,
      category,
      severity: h.severity,
      title: `${prettyLabel(h.type)} advisory${zone ? ` — ${zone.name}` : ''}`,
      description: describeHazard(h),
      source: h.source,
      dataQuality: h.dataQuality,
      issuedAt: new Date(h.startedAt).toISOString(),
      freshnessMinutes: freshnessMinutes(h.startedAt, now),
      tags: tagsFor(category, h.severity),
    });
  }

  // 2) Modeled live-weather advisory (only if it adds signal beyond existing hazards).
  const wx = weather.derivedAssessment;
  if (wx.overallSeverity) {
    const category: AlertCategory = wx.floodSeverity ? 'FLOOD' : wx.heatSeverity ? 'HEAT' : 'STORM';
    const rainMin = rainArrivalMinutes(weather.forecast, now);
    alerts.push({
      id: 'weather-modeled',
      category,
      severity: wx.overallSeverity,
      title: `Live weather advisory: ${category === 'FLOOD' ? 'heavy rainfall' : category === 'HEAT' ? 'extreme heat' : 'high winds'}`,
      description:
        `${wx.explanation}` + (rainMin != null ? ` Rain expected in ~${rainMin} min.` : ''),
      source: 'WEATHER_API',
      dataQuality: 'MODELED',
      issuedAt: weather.observedAt ?? weather.fetchedAt,
      freshnessMinutes: weather.freshnessSeconds != null ? Math.round(weather.freshnessSeconds / 60) : null,
      tags: tagsFor(category, wx.overallSeverity),
    });
  }

  // 3) Nearby road/bridge closures -> corridor advisories.
  if (zone) {
    const latDelta = radiusKm / 111;
    const lonDelta = radiusKm / (111 * Math.max(0.2, Math.cos((latitude * Math.PI) / 180)));
    const roads = await prisma.infrastructureAsset.findMany({
      where: {
        type: { in: ['ROAD', 'BRIDGE'] as never },
        operationalStatus: { not: 'OPERATIONAL' },
        latitude: { gte: latitude - latDelta, lte: latitude + latDelta },
        longitude: { gte: longitude - lonDelta, lte: longitude + lonDelta },
      },
      take: 50,
    });
    for (const r of roads) {
      const blocked = r.operationalStatus === 'COMPROMISED' || r.operationalStatus === 'OFFLINE';
      const severity: Severity = blocked ? 'HIGH' : 'MODERATE';
      alerts.push({
        id: `corridor-${r.id}`,
        category: 'CORRIDOR',
        severity,
        title: `${blocked ? 'Road closed' : 'Road disrupted'}: ${r.name}`,
        description: `${r.name} is currently ${prettyLabel(r.operationalStatus)}. Consider an alternate route.`,
        source: r.source,
        dataQuality: r.dataQuality,
        issuedAt: new Date(r.updatedAt).toISOString(),
        freshnessMinutes: freshnessMinutes(r.updatedAt, now),
        tags: tagsFor('CORRIDOR', severity),
      });
    }
  }

  alerts.sort(
    (a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || (a.freshnessMinutes ?? 1e9) - (b.freshnessMinutes ?? 1e9),
  );

  return {
    location: { latitude, longitude },
    radiusKm,
    generatedAt: new Date().toISOString(),
    ward: zone ? { id: zone.id, name: zone.name, code: zone.code } : null,
    count: alerts.length,
    alerts,
    note: 'Computed from live hazards, modeled weather severity, and road status. No official IMD/CWC/DMA push feed is integrated; absent data is never invented.',
  };
}

function prettyLabel(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function describeHazard(h: {
  type: string;
  severity: string;
  rainfallRate: number | null;
  waterDepth: number | null;
  temperature: number | null;
  windSpeed: number | null;
}): string {
  const bits: string[] = [];
  if (h.rainfallRate != null) bits.push(`rainfall ${h.rainfallRate} mm/hr`);
  if (h.waterDepth != null) bits.push(`water depth ${h.waterDepth} m`);
  if (h.temperature != null) bits.push(`temperature ${h.temperature}°C`);
  if (h.windSpeed != null) bits.push(`wind ${h.windSpeed} km/h`);
  const measured = bits.length ? ` (${bits.join(', ')})` : '';
  return `${h.severity} ${prettyLabel(h.type)} conditions reported${measured}. Follow local guidance and avoid affected areas.`;
}
