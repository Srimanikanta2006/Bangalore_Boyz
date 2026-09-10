/**
 * REAL CHENNAI IMPORT (OpenStreetMap via Overpass - no API key required).
 * Imports Greater Chennai Corporation zones (OSM admin_level=9 within Chennai city relation 7910817)
 * and real infrastructure (hospitals, clinics, schools, fire stations, substations, generators,
 * water works, pumping stations, shelters, drains, roads, bridges) as REAL_GEOGRAPHIC rows.
 * - Synthetic demo rows are never touched or deleted.
 * - Idempotent: upserts by unique zone code / assetCode.
 * - Assets resolve to a containing real GCC zone via point-in-polygon; unresolvable ones are skipped.
 * Run: npm run import:chennai   (network required; not part of unit tests)
 */
import { prisma } from '../src/db/prisma';
import { pointInZoneGeoJson } from '../src/utils/geo';
import { buildAssetRecord, buildZoneRecord, type OsmElement } from '../src/utils/osm';

const CHENNAI_RELATION_ID = 7910817; // OSM: Chennai (Greater Chennai Corporation), admin_level=5, wikidata Q15116
const OVERPASS_ENDPOINTS = [
  process.env.OVERPASS_URL,
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
].filter((u): u is string => !!u);

async function fetchOverpass(query: string): Promise<OsmElement[]> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < OVERPASS_ENDPOINTS.length * 2; attempt++) {
    const url = OVERPASS_ENDPOINTS[attempt % OVERPASS_ENDPOINTS.length];
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ data: query }).toString(),
        signal: AbortSignal.timeout(90_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
      const payload = (await response.json()) as { elements?: OsmElement[] };
      if (!Array.isArray(payload.elements)) throw new Error(`Malformed payload from ${url}`);
      return payload.elements;
    } catch (err) {
      lastError = err;
      console.warn(`Overpass attempt ${attempt + 1} failed: ${err instanceof Error ? err.message : err}`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  throw new Error(`Overpass unreachable: ${lastError instanceof Error ? lastError.message : lastError}`);
}

async function importZones(): Promise<number> {
  const elements = await fetchOverpass(
    `[out:json][timeout:90];rel(${CHENNAI_RELATION_ID});map_to_area->.a;rel(area.a)["boundary"="administrative"]["admin_level"="9"];out geom;`,
  );
  let imported = 0;
  for (const rel of elements) {
    if (rel.type !== 'relation') continue;
    const record = buildZoneRecord(rel);
    if (!record.boundaryGeoJson) {
      console.warn(`Skipping ${record.name}: no stitchable boundary`);
      continue;
    }
    await prisma.zone.upsert({
      where: { code: record.code },
      create: { ...record, riskLevel: 'MODERATE' },
      update: {
        name: record.name, description: record.description, latitude: record.latitude, longitude: record.longitude,
        boundaryGeoJson: record.boundaryGeoJson, source: record.source, sourceId: record.sourceId,
        dataQuality: record.dataQuality, population: record.population,
      },
    });
    imported++;
  }
  console.log(`Zones imported/updated: ${imported}`);
  return imported;
}

type RealZone = { id: string; name: string; code: string; boundaryGeoJson: unknown };

async function loadRealZones(): Promise<RealZone[]> {
  return prisma.zone.findMany({
    where: { dataQuality: 'REAL_GEOGRAPHIC' },
    select: { id: true, name: true, code: true, boundaryGeoJson: true },
  });
}

function zoneResolver(zones: RealZone[]) {
  return (lat: number, lon: number): RealZone | null => {
    for (const zone of zones) {
      if (pointInZoneGeoJson(lat, lon, zone.boundaryGeoJson)) return zone;
    }
    return null;
  };
}

async function importAssets(): Promise<Record<string, number>> {
  const zones = await loadRealZones();
  const resolve = zoneResolver(zones);
  console.log(`Resolving assets against ${zones.length} real GCC zones...`);

  // POIs with center coordinates
  const poiElements = await fetchOverpass(
    `[out:json][timeout:120];rel(${CHENNAI_RELATION_ID});map_to_area->.a;` +
      `(nwr(area.a)["amenity"~"^(hospital|clinic|school|fire_station|shelter)$"];` +
      `nwr(area.a)["power"~"^(substation|generator)$"];` +
      `nwr(area.a)["man_made"~"^(water_works|pumping_station)$"];` +
      `nwr(area.a)["emergency"="assembly_point"];);out center tags;`,
  );

  // Linear features with full geometry (bridges first so bridge=yes ways classify as BRIDGE)
  const linearElements = await fetchOverpass(
    `[out:json][timeout:180];rel(${CHENNAI_RELATION_ID});map_to_area->.a;` +
      `(way(area.a)["highway"]["bridge"="yes"];` +
      `way(area.a)["highway"~"^(motorway|trunk|primary|secondary)$"];` +
      `way(area.a)["waterway"="drain"];);out geom;`,
  );

  const seen = new Set<string>();
  const counts: Record<string, number> = {};
  let skippedOutsideZones = 0;
  let total = 0;

  for (const el of [...poiElements, ...linearElements]) {
    const record = buildAssetRecord(el);
    if (!record) continue;
    const dedupeKey = `${el.type}/${el.id}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const zone = resolve(record.latitude, record.longitude);
    if (!zone) {
      skippedOutsideZones++;
      continue;
    }

    await prisma.infrastructureAsset.upsert({
      where: { assetCode: record.assetCode },
      create: { ...record, zoneId: zone.id, metadata: record.metadata as never, geometryJson: record.geometryJson as never },
      update: {
        name: record.name, type: record.type, latitude: record.latitude, longitude: record.longitude,
        zoneId: zone.id, metadata: record.metadata as never, geometryJson: record.geometryJson as never,
        source: record.source, sourceId: record.sourceId, dataQuality: record.dataQuality,
      },
    });
    counts[record.type] = (counts[record.type] ?? 0) + 1;
    total++;
    if (total % 500 === 0) console.log(`  ... ${total} assets upserted`);
  }

  counts.__total = total;
  counts.__skippedOutsideMappedZones = skippedOutsideZones;
  console.log('Assets by type:', JSON.stringify(counts, null, 2));
  return counts;
}

async function main() {
  console.log(`Real Chennai import started (OSM relation ${CHENNAI_RELATION_ID})`);
  const zones = await importZones();
  const assets = await importAssets();
  console.log(JSON.stringify({ success: true, zonesImported: zones, assetsImported: assets.__total, byType: assets }, null, 2));
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Import failed:', err instanceof Error ? err.message : err);
  await prisma.$disconnect();
  process.exit(1);
});
