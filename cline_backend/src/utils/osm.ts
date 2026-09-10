import type { AssetType } from '@prisma/client';

/**
 * Pure OpenStreetMap/Overpass parsing helpers - NO network access here.
 * Used by scripts/import-chennai.ts and covered by tests/unit/osm.test.ts.
 * Classification is REAL_GEOGRAPHIC (geographic existence only):
 * criticality/vulnerability/operationalStatus remain schema defaults - never invented.
 */

export interface OsmGeometryPoint {
  lat: number;
  lon: number;
}

export interface OsmMember {
  type: 'node' | 'way' | 'relation';
  ref: number;
  role: string;
  geometry?: OsmGeometryPoint[];
  lat?: number;
  lon?: number;
}

export interface OsmElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  geometry?: OsmGeometryPoint[];
  members?: OsmMember[];
  tags?: Record<string, string>;
}

export type BoundaryGeometry =
  | { type: 'Polygon'; coordinates: number[][][] }
  | { type: 'MultiPolygon'; coordinates: number[][][][] };

const EPS = 1e-9;
const samePoint = (a: [number, number], b: [number, number]) => Math.abs(a[0] - b[0]) < EPS && Math.abs(a[1] - b[1]) < EPS;

/** Stitch outer member ways (Overpass `out geom` format) into closed rings [lon, lat]. */
export function stitchOuterRings(members: OsmMember[] | undefined): number[][][] {
  const segments = (members ?? [])
    .filter((m): m is { type: 'way'; ref: number; role: string; geometry: OsmGeometryPoint[] } =>
      m.type === 'way' && m.role === 'outer' && Array.isArray(m.geometry) && m.geometry.length > 1)
    .map((m) => m.geometry.map((g) => [g.lon, g.lat] as [number, number]));

  const rings: number[][][] = [];
  const used = new Array(segments.length).fill(false);

  for (let i = 0; i < segments.length; i++) {
    if (used[i]) continue;
    used[i] = true;
    const ring: [number, number][] = [...segments[i]];
    let closed = samePoint(ring[0], ring[ring.length - 1]);
    while (!closed) {
      const end = ring[ring.length - 1];
      let extended = false;
      for (let j = 0; j < segments.length; j++) {
        if (used[j]) continue;
        const seg = segments[j];
        if (samePoint(seg[0], end)) {
          ring.push(...seg.slice(1));
          used[j] = true;
          extended = true;
        } else if (samePoint(seg[seg.length - 1], end)) {
          ring.push(...seg.slice(0, -1).reverse());
          used[j] = true;
          extended = true;
        }
        if (extended) break;
      }
      if (!extended) break; // dangling fragment - drop rather than fabricate a closure
      closed = samePoint(ring[0], ring[ring.length - 1]);
    }
    if (closed && ring.length >= 4) {
      rings.push(ring.map(([lon, lat]) => [lon, lat]));
    }
  }
  return rings;
}

/** Build zone boundary geometry + representative centroid (admin_centre/label node, else bbox center). */
export function relationToBoundary(rel: OsmElement): {
  geometry: BoundaryGeometry | null;
  centroid: { latitude: number; longitude: number } | null;
} {
  const rings = stitchOuterRings(rel.members);
  if (rings.length === 0) return { geometry: null, centroid: null };

  const geometry: BoundaryGeometry = rings.length === 1
    ? { type: 'Polygon', coordinates: [rings[0]] }
    : { type: 'MultiPolygon', coordinates: rings.map((r) => [r]) };

  const centreNode = (rel.members ?? []).find(
    (m) => m.type === 'node' && (m.role === 'admin_centre' || m.role === 'label') && m.lat != null && m.lon != null,
  );
  if (centreNode) return { geometry, centroid: { latitude: centreNode.lat!, longitude: centreNode.lon! } };

  let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
  for (const ring of rings) {
    for (const [lon, lat] of ring) {
      minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
      minLon = Math.min(minLon, lon); maxLon = Math.max(maxLon, lon);
    }
  }
  return {
    geometry,
    centroid: { latitude: (minLat + maxLat) / 2, longitude: (minLon + maxLon) / 2 }, // computed representative point
  };
}

/** Stable unique zone code from the real OSM zone name (e.g. "Zone 9 Teynampet" -> GCC-Z09). */
export function zoneCodeFromName(name: string): string {
  const match = /Zone\s+(\d+)/i.exec(name);
  if (match) return `GCC-Z${String(Number(match[1])).padStart(2, '0')}`;
  return `GCC-${name.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24)}`;
}

export function buildZoneRecord(rel: OsmElement) {
  const tags = rel.tags ?? {};
  const name = tags['name:en'] ?? tags.name ?? `OSM relation ${rel.id}`;
  const { geometry, centroid } = relationToBoundary(rel);
  const population = Number.parseInt(tags.population ?? '', 10);
  return {
    code: zoneCodeFromName(name),
    name,
    description: `Greater Chennai Corporation zone - boundary imported from OpenStreetMap relation/${rel.id}`,
    latitude: centroid?.latitude ?? 0,
    longitude: centroid?.longitude ?? 0,
    boundaryGeoJson: geometry as never,
    source: 'OpenStreetMap',
    sourceId: `relation/${rel.id}`,
    dataQuality: 'REAL_GEOGRAPHIC',
    population: Number.isFinite(population) && population > 0 ? population : 0, // 0 = UNKNOWN (not fabricated)
  };
}

const TYPE_LABELS: Record<AssetType, string> = {
  HOSPITAL: 'Hospital', CLINIC: 'Clinic', SCHOOL: 'School', SUBSTATION: 'Substation',
  PUMPING_STATION: 'Pumping station', ROAD: 'Road', BRIDGE: 'Bridge', EVACUATION_SHELTER: 'Shelter',
  COOLING_CENTER: 'Cooling centre', DRAIN: 'Drain', WATER_TREATMENT: 'Water works', GENERATOR: 'Generator',
  FIRE_STATION: 'Fire station', AMBULANCE_GATE: 'Gate', OTHER: 'Facility',
};

/** Map real OSM tags onto the application AssetType. Returns null when nothing maps honestly. */
export function mapOsmToAssetType(tags: Record<string, string>): AssetType | null {
  if (tags.amenity === 'hospital') return 'HOSPITAL';
  if (tags.amenity === 'clinic') return 'CLINIC';
  if (tags.amenity === 'school') return 'SCHOOL';
  if (tags.amenity === 'fire_station') return 'FIRE_STATION';
  if (tags.amenity === 'shelter') return 'EVACUATION_SHELTER';
  if (tags.emergency === 'assembly_point') return 'EVACUATION_SHELTER';
  if (tags.power === 'substation') return 'SUBSTATION';
  if (tags.power === 'generator') return 'GENERATOR';
  if (tags.man_made === 'water_works') return 'WATER_TREATMENT';
  if (tags.man_made === 'pumping_station') return 'PUMPING_STATION';
  if (tags.waterway === 'drain') return 'DRAIN';
  if (tags.highway && tags.bridge === 'yes') return 'BRIDGE';
  if (tags.highway && /^(motorway|trunk|primary|secondary)$/.test(tags.highway)) return 'ROAD';
  return null;
}

const OSM_TAG_SUBSET = [
  'name', 'name:en', 'amenity', 'highway', 'waterway', 'power', 'man_made', 'bridge',
  'emergency', 'operator', 'wikidata', 'wheelchair', 'building', 'tunnel', 'layer',
];

export interface OsmAssetRecord {
  assetCode: string;
  name: string;
  type: AssetType;
  latitude: number;
  longitude: number;
  description: string;
  metadata: Record<string, unknown>;
  geometryJson: Record<string, unknown> | null;
  source: 'OpenStreetMap';
  sourceId: string;
  dataQuality: 'REAL_GEOGRAPHIC';
}

/** Build an honest asset record from an Overpass element (POI with center, or way with geometry). */
export function buildAssetRecord(el: OsmElement): OsmAssetRecord | null {
  const tags = el.tags ?? {};
  const type = mapOsmToAssetType(tags);
  if (!type) return null;

  let latitude: number | null = null;
  let longitude: number | null = null;
  let geometryJson: Record<string, unknown> | null = null;

  if (el.type === 'node' && el.lat != null && el.lon != null) {
    latitude = el.lat;
    longitude = el.lon;
  } else if (el.center) {
    latitude = el.center.lat;
    longitude = el.center.lon;
  } else if (Array.isArray(el.geometry) && el.geometry.length > 1) {
    const coordinates = el.geometry.map((g) => [g.lon, g.lat]);
    const mid = coordinates[Math.floor(coordinates.length / 2)];
    latitude = mid[1];
    longitude = mid[0];
    geometryJson = { type: 'LineString', coordinates };
  }
  if (latitude == null || longitude == null) return null;

  const osmTags: Record<string, string> = {};
  for (const key of OSM_TAG_SUBSET) if (tags[key] != null) osmTags[key] = tags[key];

  const name = tags.name ?? tags['name:en'] ?? `${TYPE_LABELS[type]} (OSM ${el.type}/${el.id})`;
  const osmId = `${el.type}/${el.id}`;
  return {
    assetCode: `OSM-${el.type[0].toUpperCase()}${el.id}`,
    name,
    type,
    latitude,
    longitude,
    description: `Imported from OpenStreetMap ${osmId} - geographic existence only; criticality/status are application defaults, not live observations.`,
    metadata: {
      osmType: el.type,
      osmId: el.id,
      osmUrl: `https://www.openstreetmap.org/${osmId}`,
      osmTags,
      zoneResolution: 'REPRESENTATIVE_POINT',
    },
    geometryJson,
    source: 'OpenStreetMap',
    sourceId: osmId,
    dataQuality: 'REAL_GEOGRAPHIC',
  };
}
