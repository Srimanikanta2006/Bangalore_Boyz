/** Minimal JS geography helpers (no PostGIS at MVP scale). */

const EARTH_RADIUS_KM = 6371;

export function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

function isPolygon(value: unknown): value is GeoJsonPolygon {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as { type?: string }).type === 'Polygon' &&
    Array.isArray((value as { coordinates?: unknown }).coordinates) &&
    ((value as { coordinates: number[][][][] }).coordinates.length ?? 0) > 0
  );
}

/** Ray-casting even-odd test against the polygon's outer ring [lon, lat]. Malformed boundaries -> false (never guess). */
export function pointInPolygon(latitude: number, longitude: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (!Number.isFinite(xi) || !Number.isFinite(yi) || !Number.isFinite(xj) || !Number.isFinite(yj)) return false;
    const intersects = yi > latitude !== yj > latitude &&
      longitude < ((xj - xi) * (latitude - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/** Point-in-zone test against a Zone.boundaryGeoJson value. Returns false when the boundary is absent/malformed. */
export function pointInZoneGeoJson(latitude: number, longitude: number, boundary: unknown): boolean {
  if (!isPolygon(boundary)) return false;
  return pointInPolygon(latitude, longitude, boundary.coordinates[0]);
}
