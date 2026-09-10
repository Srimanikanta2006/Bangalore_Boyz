/**
 * Real route alternatives via the free public OSRM demo server (no API key).
 * NOTE: router.project-osrm.org is a demo/evaluation instance (rate-limited,
 * not for production traffic) - fine for this MVP; a production deployment
 * should self-host OSRM or use a licensed provider (see Stage F §7 option 2/3).
 */

export interface OsrmRoute {
  distanceMeters: number;
  durationSeconds: number;
  /** [latitude, longitude] pairs decoded from the GeoJSON geometry. */
  points: { latitude: number; longitude: number }[];
}

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

export async function fetchOsrmAlternatives(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  signal?: AbortSignal,
): Promise<OsrmRoute[]> {
  const coords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
  const url = `${OSRM_BASE}/${coords}?alternatives=true&overview=full&geometries=geojson`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`OSRM routing failed (${res.status})`);
  const data = (await res.json()) as {
    code: string;
    routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
  };
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No routes found');
  return data.routes.map((r) => ({
    distanceMeters: r.distance,
    durationSeconds: r.duration,
    points: r.geometry.coordinates.map(([lon, lat]) => ({ latitude: lat, longitude: lon })),
  }));
}
