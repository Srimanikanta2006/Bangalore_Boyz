import { prisma } from '../db/prisma';
import { haversineKm, pointInZoneGeoJson } from '../utils/geo';
import { riskLevelFromScore } from '../utils/risk';

/**
 * SAFE ROUTE SCORING - Stage F (§7 option 1, approved): no routing engine is
 * built here. The CLIENT supplies candidate route geometries (e.g. from a
 * free public routing provider such as OSRM); this service deterministically
 * scores each candidate against the backend's OWN real hazard/zone/road data.
 * The backend remains the single source of truth for risk - candidate
 * geometry/distance/duration are trusted only as routing shape, never as
 * hazard/risk input.
 */

const PROXIMITY_KM = 0.3; // ~300m: a sampled point this close to a non-operational road counts as "near a closure"
const MAX_SAMPLED_POINTS = 40; // cap compute cost; deterministic even-stride sampling

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface CandidateRoute {
  label?: string;
  distanceMeters?: number;
  durationSeconds?: number;
  points: RoutePoint[];
}

export interface ScoredRoute {
  label: string;
  distanceMeters: number | null;
  durationSeconds: number | null;
  riskScore: number;
  riskLevel: string;
  hazardZonesHit: { zoneId: string; zoneName: string; severity: string }[];
  blockedRoadsHit: { assetId: string; name: string; operationalStatus: string }[];
  sampledPoints: number;
  explanation: string;
}

/** Evenly-strided sample so long polylines stay bounded without biasing toward one end. */
function samplePoints(points: RoutePoint[], max: number): RoutePoint[] {
  if (points.length <= max) return points;
  const stride = points.length / max;
  const sampled: RoutePoint[] = [];
  for (let i = 0; i < max; i++) sampled.push(points[Math.floor(i * stride)]);
  return sampled;
}

export async function scoreCandidateRoutes(routes: CandidateRoute[]): Promise<{ routes: ScoredRoute[]; recommendedIndex: number }> {
  // Preload real data ONCE (not per point): zones+active hazards, and non-operational roads/bridges.
  const [zones, blockedRoads] = await Promise.all([
    prisma.zone.findMany({
      select: {
        id: true,
        name: true,
        boundaryGeoJson: true,
        dataQuality: true,
        hazards: { where: { status: 'ACTIVE' }, select: { severity: true } },
      },
    }),
    prisma.infrastructureAsset.findMany({
      where: { type: { in: ['ROAD', 'BRIDGE'] }, operationalStatus: { not: 'OPERATIONAL' } },
      select: { id: true, name: true, operationalStatus: true, latitude: true, longitude: true },
    }),
  ]);
  const zonesOrdered = [...zones].sort(
    (a, b) => Number(b.dataQuality === 'REAL_GEOGRAPHIC') - Number(a.dataQuality === 'REAL_GEOGRAPHIC'),
  );
  const SEVERITY_RANK: Record<string, number> = { LOW: 1, MODERATE: 2, HIGH: 3, CRITICAL: 4 };

  const scored = routes.map((route): ScoredRoute => {
    const sampled = samplePoints(route.points, MAX_SAMPLED_POINTS);
    const hazardZoneHits = new Map<string, { zoneId: string; zoneName: string; severity: string }>();
    const blockedRoadHits = new Map<string, { assetId: string; name: string; operationalStatus: string }>();
    let hazardPointHits = 0;
    let roadPointHits = 0;

    for (const p of sampled) {
      const zone = zonesOrdered.find((z) => pointInZoneGeoJson(p.latitude, p.longitude, z.boundaryGeoJson));
      if (zone && zone.hazards.length > 0) {
        hazardPointHits++;
        const worst = [...zone.hazards].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])[0];
        const existing = hazardZoneHits.get(zone.id);
        if (!existing || SEVERITY_RANK[worst.severity] > SEVERITY_RANK[existing.severity]) {
          hazardZoneHits.set(zone.id, { zoneId: zone.id, zoneName: zone.name, severity: worst.severity });
        }
      }
      const nearRoad = blockedRoads.find((r) => haversineKm(p, { latitude: r.latitude, longitude: r.longitude }) <= PROXIMITY_KM);
      if (nearRoad) {
        roadPointHits++;
        blockedRoadHits.set(nearRoad.id, { assetId: nearRoad.id, name: nearRoad.name, operationalStatus: nearRoad.operationalStatus });
      }
    }

    const hazardRatio = sampled.length ? hazardPointHits / sampled.length : 0;
    const roadRatio = sampled.length ? roadPointHits / sampled.length : 0;
    const riskScore = Math.min(100, Math.round(hazardRatio * 70 + roadRatio * 50));
    const riskLevel = riskLevelFromScore(riskScore);

    const hazardList = [...hazardZoneHits.values()];
    const roadList = [...blockedRoadHits.values()];
    const explanation =
      hazardList.length === 0 && roadList.length === 0
        ? 'No active hazard zones or road closures detected along this route.'
        : [
            hazardList.length > 0 ? `Passes through ${hazardList.length} active hazard zone(s): ${hazardList.map((h) => `${h.zoneName} (${h.severity})`).join(', ')}.` : null,
            roadList.length > 0 ? `Passes near ${roadList.length} non-operational road(s)/bridge(s): ${roadList.map((r) => r.name).join(', ')}.` : null,
          ].filter(Boolean).join(' ');

    return {
      label: route.label ?? 'Route',
      distanceMeters: route.distanceMeters ?? null,
      durationSeconds: route.durationSeconds ?? null,
      riskScore,
      riskLevel,
      hazardZonesHit: hazardList,
      blockedRoadsHit: roadList,
      sampledPoints: sampled.length,
      explanation,
    };
  });

  let recommendedIndex = 0;
  for (let i = 1; i < scored.length; i++) {
    const a = scored[recommendedIndex];
    const b = scored[i];
    if (
      b.riskScore < a.riskScore ||
      (b.riskScore === a.riskScore && (b.durationSeconds ?? Infinity) < (a.durationSeconds ?? Infinity))
    ) {
      recommendedIndex = i;
    }
  }

  return { routes: scored, recommendedIndex };
}
