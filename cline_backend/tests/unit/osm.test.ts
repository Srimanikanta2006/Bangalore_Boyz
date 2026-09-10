import { describe, expect, it } from 'vitest';
import {
  buildAssetRecord,
  buildZoneRecord,
  mapOsmToAssetType,
  relationToBoundary,
  stitchOuterRings,
  zoneCodeFromName,
  type OsmElement,
} from '../../src/utils/osm';
import { pointInZoneGeoJson } from '../../src/utils/geo';

/** A boundary split across two outer ways that must be stitched into one closed ring. */
const splitRelation: OsmElement = {
  type: 'relation',
  id: 990001,
  tags: { name: 'Zone 9 Teynampet', admin_level: '9', boundary: 'administrative' },
  members: [
    {
      type: 'way', ref: 11, role: 'outer',
      geometry: [
        { lat: 13.0, lon: 80.2 }, { lat: 13.1, lon: 80.2 }, { lat: 13.1, lon: 80.3 },
      ],
    },
    {
      type: 'way', ref: 12, role: 'outer',
      geometry: [
        { lat: 13.1, lon: 80.3 }, { lat: 13.0, lon: 80.3 }, { lat: 13.0, lon: 80.2 },
      ],
    },
    { type: 'way', ref: 13, role: 'inner', geometry: [{ lat: 13.05, lon: 80.25 }, { lat: 13.06, lon: 80.25 }] },
    { type: 'node', ref: 99, role: 'admin_centre', lat: 13.05, lon: 80.25 },
  ],
};

describe('OSM boundary stitching', () => {
  it('stitches split outer ways into one closed ring and ignores inner/invalid members', () => {
    const rings = stitchOuterRings(splitRelation.members);
    expect(rings).toHaveLength(1);
    expect(rings[0].length).toBeGreaterThanOrEqual(4);
    expect(rings[0][0]).toEqual([80.2, 13.0]);
    expect(rings[0][rings[0].length - 1]).toEqual([80.2, 13.0]);
  });

  it('drops dangling fragments instead of fabricating a closure', () => {
    const rings = stitchOuterRings([
      { type: 'way', ref: 1, role: 'outer', geometry: [{ lat: 1, lon: 1 }, { lat: 2, lon: 2 }] },
    ]);
    expect(rings).toHaveLength(0);
  });

  it('builds a Polygon boundary with admin_centre as centroid', () => {
    const { geometry, centroid } = relationToBoundary(splitRelation);
    expect(geometry?.type).toBe('Polygon');
    expect(centroid).toEqual({ latitude: 13.05, longitude: 80.25 });
    expect(pointInZoneGeoJson(13.05, 80.25, geometry)).toBe(true);
    expect(pointInZoneGeoJson(13.5, 80.25, geometry)).toBe(false);
  });

  it('produces a MultiPolygon when a zone has disjoint parts and falls back to a bbox centroid', () => {
    const ring = (lat: number, lon: number): { type: 'way'; ref: number; role: string; geometry: { lat: number; lon: number }[] } => ({
      type: 'way', ref: lat * 100 + lon, role: 'outer',
      geometry: [
        { lat, lon }, { lat: lat + 0.1, lon }, { lat: lat + 0.1, lon: lon + 0.1 }, { lat, lon: lon + 0.1 }, { lat, lon },
      ],
    });
    const { geometry, centroid } = relationToBoundary({
      type: 'relation', id: 2, members: [ring(13.0, 80.0), ring(13.5, 80.5)],
    });
    expect(geometry?.type).toBe('MultiPolygon');
    expect(pointInZoneGeoJson(13.05, 80.05, geometry)).toBe(true);
    expect(pointInZoneGeoJson(13.55, 80.55, geometry)).toBe(true);
    expect(pointInZoneGeoJson(13.2, 80.2, geometry)).toBe(false);
    expect(centroid).toEqual({ latitude: 13.3, longitude: 80.3 }); // bbox center of both parts
  });
});

describe('zone record building', () => {
  it('extracts a stable GCC zone code and real provenance', () => {
    const record = buildZoneRecord(splitRelation);
    expect(record.code).toBe('GCC-Z09');
    expect(record.name).toBe('Zone 9 Teynampet');
    expect(record.source).toBe('OpenStreetMap');
    expect(record.sourceId).toBe('relation/990001');
    expect(record.dataQuality).toBe('REAL_GEOGRAPHIC');
    expect(record.population).toBe(0); // no population tag -> 0 (UNKNOWN), never fabricated
  });

  it('uses the population tag when the source provides it', () => {
    const record = buildZoneRecord({
      type: 'relation', id: 3, tags: { name: 'Zone 13 Adyar', population: '450000' },
      members: [{ type: 'way', ref: 1, role: 'outer', geometry: [
        { lat: 1, lon: 1 }, { lat: 1, lon: 2 }, { lat: 2, lon: 2 }, { lat: 2, lon: 1 }, { lat: 1, lon: 1 },
      ] }],
    });
    expect(record.population).toBe(450000);
  });

  it('slugifies non-numbered zone names', () => {
    expect(zoneCodeFromName('Alandur Extension')).toBe('GCC-ALANDUR-EXTENSION');
  });
});

describe('OSM tag -> AssetType mapping', () => {
  it('maps supported real facilities honestly', () => {
    expect(mapOsmToAssetType({ amenity: 'hospital' })).toBe('HOSPITAL');
    expect(mapOsmToAssetType({ amenity: 'clinic' })).toBe('CLINIC');
    expect(mapOsmToAssetType({ amenity: 'school' })).toBe('SCHOOL');
    expect(mapOsmToAssetType({ amenity: 'fire_station' })).toBe('FIRE_STATION');
    expect(mapOsmToAssetType({ amenity: 'shelter' })).toBe('EVACUATION_SHELTER');
    expect(mapOsmToAssetType({ emergency: 'assembly_point' })).toBe('EVACUATION_SHELTER');
    expect(mapOsmToAssetType({ power: 'substation' })).toBe('SUBSTATION');
    expect(mapOsmToAssetType({ power: 'generator' })).toBe('GENERATOR');
    expect(mapOsmToAssetType({ man_made: 'water_works' })).toBe('WATER_TREATMENT');
    expect(mapOsmToAssetType({ man_made: 'pumping_station' })).toBe('PUMPING_STATION');
    expect(mapOsmToAssetType({ waterway: 'drain' })).toBe('DRAIN');
    expect(mapOsmToAssetType({ highway: 'primary', bridge: 'yes' })).toBe('BRIDGE');
    expect(mapOsmToAssetType({ highway: 'secondary' })).toBe('ROAD');
  });

  it('refuses unmappable tags (never guesses)', () => {
    expect(mapOsmToAssetType({ amenity: 'restaurant' })).toBeNull();
    expect(mapOsmToAssetType({ highway: 'residential' })).toBeNull();
    expect(mapOsmToAssetType({})).toBeNull();
  });
});

describe('asset record building', () => {
  it('builds a POI record from a node with center coordinates', () => {
    const record = buildAssetRecord({
      type: 'node', id: 123, lat: 13.05, lon: 80.25, tags: { amenity: 'hospital', name: 'Govt General Hospital' },
    });
    expect(record).toMatchObject({
      assetCode: 'OSM-N123',
      name: 'Govt General Hospital',
      type: 'HOSPITAL',
      latitude: 13.05,
      longitude: 80.25,
      source: 'OpenStreetMap',
      dataQuality: 'REAL_GEOGRAPHIC',
    });
    expect(record?.geometryJson).toBeNull();
    expect((record?.metadata as { osmUrl: string }).osmUrl).toBe('https://www.openstreetmap.org/node/123');
  });

  it('uses an honest fallback name for unnamed POIs', () => {
    const record = buildAssetRecord({ type: 'node', id: 7, lat: 1, lon: 1, tags: { amenity: 'clinic' } });
    expect(record?.name).toBe('Clinic (OSM node/7)');
  });

  it('builds a linear record with real LineString geometry and a representative midpoint', () => {
    const record = buildAssetRecord({
      type: 'way', id: 555, tags: { highway: 'primary', name: 'Anna Salai' },
      geometry: [
        { lat: 13.00, lon: 80.20 }, { lat: 13.01, lon: 80.21 }, { lat: 13.02, lon: 80.22 },
      ],
    });
    expect(record?.type).toBe('ROAD');
    expect(record?.geometryJson).toEqual({
      type: 'LineString',
      coordinates: [[80.2, 13.0], [80.21, 13.01], [80.22, 13.02]],
    });
    expect(record?.latitude).toBe(13.01);
    expect(record?.longitude).toBe(80.21);
  });

  it('returns null for elements without coordinates', () => {
    expect(buildAssetRecord({ type: 'way', id: 9, tags: { amenity: 'hospital' } })).toBeNull();
  });
});
