import type { HazardType, Severity } from '@prisma/client';
import { prisma } from '../db/prisma';
import { getCurrentWeather, type NormalizedWeather } from './weather.service';
import { assessAssetRisk, type HazardLike } from './risk.service';
import { getZoneCascade } from './cascade.service';
import { haversineKm } from '../utils/geo';

/**
 * LOCATION OVERVIEW - one coordinate -> everything the Government map needs:
 * live weather (Open-Meteo), containing zone, nearby real infrastructure,
 * known hazards, alerts, deterministic risk and cascade. All provider access stays here.
 * Every block labels its own dataQuality; nothing synthetic is presented as live.
 */

export interface LocationQuery {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  assetLimit?: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Deterministic translation of the (already MODELED) weather severity into a risk-engine hazard input. */
function liveHazardLike(weather: NormalizedWeather): HazardLike | null {
  const derived = weather.derivedAssessment;
  if (!derived.overallSeverity) return null;
  const type: HazardType = derived.floodSeverity ? 'FLOOD' : derived.heatSeverity ? 'EXTREME_HEAT' : 'HIGH_WIND';
  return {
    type,
    severity: derived.overallSeverity as Severity,
    rainfallRate: weather.rainfallMmPerHour,
    temperature: weather.temperatureC,
    windSpeed: weather.windSpeedKmh,
  };
}

export async function getLocationOverview(input: LocationQuery) {
  const latitude = input.latitude;
  const longitude = input.longitude;
  const radiusKm = Math.min(25, Math.max(0.5, input.radiusKm ?? 5));
  const assetLimit = Math.min(50, Math.max(1, input.assetLimit ?? 12));

  const weather = await getCurrentWeather({ latitude, longitude, forecastHours: 0 });
  const zone = weather.zone;

  // Nearby assets: bbox prefilter in SQL, exact haversine filter in JS (no N+1 external calls).
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.max(0.2, Math.cos((latitude * Math.PI) / 180)));
  const candidates = await prisma.infrastructureAsset.findMany({
    where: {
      latitude: { gte: latitude - latDelta, lte: latitude + latDelta },
      longitude: { gte: longitude - lonDelta, lte: longitude + lonDelta },
    },
    include: { zone: { select: { name: true } } },
    take: 2000,
  });
  const nearby = candidates
    .map((a) => ({
      asset: a,
      distanceKm: round2(haversineKm({ latitude, longitude }, { latitude: a.latitude, longitude: a.longitude })),
    }))
    .filter((n) => n.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, assetLimit);

  const nearbyAssets = nearby.map(({ asset, distanceKm }) => ({
    id: asset.id,
    assetCode: asset.assetCode,
    name: asset.name,
    type: asset.type,
    latitude: asset.latitude,
    longitude: asset.longitude,
    distanceKm,
    criticality: asset.criticality,
    operationalStatus: asset.operationalStatus,
    source: asset.source,
    dataQuality: asset.dataQuality,
    zoneName: asset.zone.name,
  }));

  const hazards = zone
    ? await prisma.hazard.findMany({
        where: { zoneId: zone.id, status: 'ACTIVE' },
        orderBy: { startedAt: 'desc' },
      })
    : [];

  // Deterministic risk on the nearest real assets using the LIVE weather observation as input.
  const liveHazard = liveHazardLike(weather);
  const assetRisks = [];
  for (const { asset, distanceKm } of nearby.slice(0, 5)) {
    const risk = await assessAssetRisk(prisma, asset, liveHazard);
    assetRisks.push({
      assetId: asset.id,
      assetCode: asset.assetCode,
      name: asset.name,
      type: asset.type,
      distanceKm,
      dataQuality: 'MODELED' as const,
      risk,
    });
  }

  const cascade = zone
    ? { dataQuality: 'MODELED' as const, ...(await getZoneCascade(prisma, zone.id)) }
    : null;

  return {
    location: { latitude, longitude },
    radiusKm,
    weather,
    zone,
    nearbyAssets,
    hazards: hazards.map((h) => ({
      id: h.id, type: h.type, severity: h.severity, status: h.status,
      startedAt: h.startedAt, source: h.source, dataQuality: h.dataQuality,
    })),
    alerts: {
      items: [] as unknown[],
      dataQuality: 'UNKNOWN' as const,
      note: 'No official public alert feed (IMD/CWC/state DMA) is integrated - those sources need credentials/manual access. Operators report observed events as incidents (ESTIMATED) instead.',
    },
    risk: {
      dataQuality: 'MODELED' as const,
      model: 'deterministic-risk-engine',
      inputs: {
        weather: {
          dataQuality: weather.dataQuality,
          provider: weather.provider,
          observedAt: weather.observedAt,
          freshnessSeconds: weather.freshnessSeconds,
        },
      },
      note: 'Scores are model-derived from live observations and asset context - not observed measurements.',
      assets: assetRisks,
    },
    cascade,
  };
}
