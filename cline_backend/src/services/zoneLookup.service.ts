import { prisma } from '../db/prisma';
import { pointInZoneGeoJson } from '../utils/geo';

/**
 * Derives the containing zone for a lat/lng point server-side (never trusted
 * from the client). Prefers REAL_GEOGRAPHIC (OSM-imported) zone boundaries
 * over SYNTHETIC_DEMO ones when both could match. Returns null (never a
 * guess) when the point falls outside every known zone boundary.
 */
export async function resolveZoneForPoint(latitude: number, longitude: number) {
  const zones = await prisma.zone.findMany({
    select: { id: true, name: true, code: true, boundaryGeoJson: true, dataQuality: true },
  });
  const ordered = [...zones].sort(
    (a, b) => Number(b.dataQuality === 'REAL_GEOGRAPHIC') - Number(a.dataQuality === 'REAL_GEOGRAPHIC'),
  );
  for (const zone of ordered) {
    if (pointInZoneGeoJson(latitude, longitude, zone.boundaryGeoJson)) return zone;
  }
  return null;
}
