import { prisma } from '../db/prisma';
import { ACTIVE_INCIDENT_STATUSES } from '../utils/risk';
import type { GeoFeatureCollection, GeoPointFeature } from '../types/api';

/** MAP service - GeoJSON FeatureCollections for MapLibre (SYNTHETIC_DEMO coordinates). */

function feature<P>(lon: number, lat: number, properties: P): GeoPointFeature<P> {
  return { type: 'Feature', geometry: { type: 'Point', coordinates: [lon, lat] }, properties };
}

function collection<P>(features: GeoPointFeature<P>[]): GeoFeatureCollection<P> {
  return { type: 'FeatureCollection', dataQuality: 'SYNTHETIC_DEMO', features };
}

export async function mapAssets(filters: { zoneId?: string; assetType?: string; status?: string; criticality?: string }) {
  const assets = await prisma.infrastructureAsset.findMany({
    where: {
      ...(filters.zoneId ? { zoneId: filters.zoneId } : {}),
      ...(filters.assetType ? { type: filters.assetType as never } : {}),
      ...(filters.status ? { operationalStatus: filters.status as never } : {}),
      ...(filters.criticality ? { criticality: filters.criticality as never } : {}),
    },
    include: { zone: { select: { name: true } } },
    orderBy: { assetCode: 'asc' },
  });
  return collection(
    assets.map((a) =>
      feature(a.longitude, a.latitude, {
        id: a.id, assetCode: a.assetCode, name: a.name, type: a.type,
        criticality: a.criticality, operationalStatus: a.operationalStatus,
        vulnerability: a.vulnerability, zoneName: a.zone.name,
      }),
    ),
  );
}

export async function mapHazards(filters: { zoneId?: string; severity?: string; hazardType?: string; status?: string }) {
  const hazards = await prisma.hazard.findMany({
    where: {
      ...(filters.zoneId ? { zoneId: filters.zoneId } : {}),
      ...(filters.severity ? { severity: filters.severity as never } : {}),
      ...(filters.hazardType ? { type: filters.hazardType as never } : {}),
      ...(filters.status ? { status: filters.status as never } : {}),
    },
    include: { zone: true },
    orderBy: { startedAt: 'desc' },
  });
  return collection(
    hazards.map((h) =>
      feature(h.zone.longitude, h.zone.latitude, {
        id: h.id, type: h.type, severity: h.severity, status: h.status,
        zoneId: h.zoneId, zoneName: h.zone.name, rainfallRate: h.rainfallRate,
        waterDepth: h.waterDepth, temperature: h.temperature, windSpeed: h.windSpeed,
        startedAt: h.startedAt, source: h.source,
      }),
    ),
  );
}

export async function mapIncidents(filters: { zoneId?: string; severity?: string; status?: string }) {
  const incidents = await prisma.incident.findMany({
    where: {
      ...(filters.zoneId ? { zoneId: filters.zoneId } : {}),
      ...(filters.severity ? { severity: filters.severity as never } : {}),
      ...(filters.status ? { status: filters.status as never } : { status: { in: ACTIVE_INCIDENT_STATUSES } }),
    },
    include: { zone: true, primaryAsset: true },
    orderBy: { reportedAt: 'desc' },
  });
  return collection(
    incidents.map((i) =>
      feature(
        (i.primaryAsset ?? i.zone).longitude,
        (i.primaryAsset ?? i.zone).latitude,
        {
          id: i.id, incidentCode: i.incidentCode, title: i.title, type: i.type,
          severity: i.severity, status: i.status, zoneName: i.zone.name,
          assetName: i.primaryAsset?.name ?? null, reportedAt: i.reportedAt,
          slaDeadline: i.slaDeadline,
        },
      ),
    ),
  );
}

export async function mapUnits(filters: { status?: string; type?: string; departmentId?: string }) {
  const units = await prisma.responseUnit.findMany({
    where: {
      ...(filters.status ? { status: filters.status as never } : { status: { not: 'OFFLINE' } }),
      ...(filters.type ? { type: filters.type as never } : {}),
      ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
    },
    include: { department: { select: { name: true } } },
    orderBy: { callsign: 'asc' },
  });
  return collection(
    units
      .filter((u) => u.latitude != null && u.longitude != null)
      .map((u) =>
        feature(u.longitude!, u.latitude!, {
          id: u.id, callsign: u.callsign, name: u.name, type: u.type, status: u.status,
          departmentName: u.department?.name ?? null, etaMinutes: u.etaMinutes,
        }),
      ),
  );
}

/** GIS overlays for the Live Map layer toggles. */
export async function mapOverlays() {
  const [zones, activeHazards, roadAssets, shelters, drains, criticalAssets, incidents, units] = await Promise.all([
    prisma.zone.findMany({ include: { hazards: { where: { status: 'ACTIVE' } } } }),
    prisma.hazard.findMany({ where: { status: 'ACTIVE' }, include: { zone: true } }),
    prisma.infrastructureAsset.findMany({ where: { type: { in: ['ROAD', 'BRIDGE'] } }, orderBy: { assetCode: 'asc' } }),
    prisma.infrastructureAsset.findMany({ where: { type: { in: ['EVACUATION_SHELTER', 'COOLING_CENTER'] } }, orderBy: { assetCode: 'asc' } }),
    prisma.infrastructureAsset.findMany({ where: { type: { in: ['DRAIN', 'PUMPING_STATION'] } }, orderBy: { assetCode: 'asc' } }),
    prisma.infrastructureAsset.findMany({ where: { criticality: { in: ['CRITICAL', 'HIGH'] } }, orderBy: { assetCode: 'asc' } }),
    prisma.incident.findMany({ where: { status: { in: ACTIVE_INCIDENT_STATUSES } }, include: { zone: true, primaryAsset: true }, orderBy: { reportedAt: 'desc' } }),
    prisma.responseUnit.findMany({ where: { status: { not: 'OFFLINE' } }, include: { department: { select: { name: true } } }, orderBy: { callsign: 'asc' } }),
  ]);

  const floodHazardTypes = ['FLOOD', 'FLASH_FLOOD', 'DRAINAGE_OVERFLOW'];
  const floodZones = zones.filter(
    (z) => z.hazards.some((h) => floodHazardTypes.includes(h.type)) || ['HIGH', 'CRITICAL'].includes(z.riskLevel),
  );
  const heatZones = zones.filter((z) => z.hazards.some((h) => h.type === 'EXTREME_HEAT'));

  const floodHazards = activeHazards.filter((h) => floodHazardTypes.includes(h.type));
  const heatHazards = activeHazards.filter((h) => h.type === 'EXTREME_HEAT');

  const drainageReadings = await prisma.telemetryReading.findMany({
    where: { assetId: { in: drains.map((d) => d.id) }, metric: { in: ['water_depth', 'pump_runtime', 'rainfall'] } },
    orderBy: { timestamp: 'desc' },
    take: 300,
  });
  const latestByAssetMetric = new Map<string, number>();
  for (const r of drainageReadings) {
    const key = `${r.assetId}:${r.metric}`;
    if (!latestByAssetMetric.has(key)) latestByAssetMetric.set(key, r.value);
  }

  const closureIncidentAssets = new Set(
    incidents.filter((i) => i.primaryAssetId && ['ROAD_BLOCKAGE', 'FLOODING'].includes(i.type)).map((i) => i.primaryAssetId),
  );

  return {
    dataQuality: 'SYNTHETIC_DEMO',
    floodZones: collection(
      floodZones.map((z) =>
        feature(z.longitude, z.latitude, {
          zoneId: z.id, name: z.name, riskLevel: z.riskLevel,
          hazard: floodHazards.find((h) => h.zoneId === z.id) ?? null, population: z.population,
        }),
      ),
    ),
    heatZones: collection(
      heatZones.map((z) =>
        feature(z.longitude, z.latitude, {
          zoneId: z.id, name: z.name, riskLevel: z.riskLevel,
          hazard: heatHazards.find((h) => h.zoneId === z.id) ?? null, population: z.population,
        }),
      ),
    ),
    roadClosures: collection(
      roadAssets
        .filter((a) => a.operationalStatus !== 'OPERATIONAL' || closureIncidentAssets.has(a.id))
        .map((a) =>
          feature(a.longitude, a.latitude, {
            assetId: a.id, assetCode: a.assetCode, name: a.name, type: a.type,
            operationalStatus: a.operationalStatus,
            reason: closureIncidentAssets.has(a.id) ? 'ACTIVE_INCIDENT' : a.operationalStatus,
          }),
        ),
    ),
    criticalInfrastructure: collection(
      criticalAssets.map((a) =>
        feature(a.longitude, a.latitude, {
          assetId: a.id, assetCode: a.assetCode, name: a.name, type: a.type,
          criticality: a.criticality, operationalStatus: a.operationalStatus,
        }),
      ),
    ),
    drainageTelemetry: collection(
      drains.map((d) =>
        feature(d.longitude, d.latitude, {
          assetId: d.id, assetCode: d.assetCode, name: d.name, type: d.type,
          operationalStatus: d.operationalStatus,
          waterDepthM: latestByAssetMetric.get(`${d.id}:water_depth`) ?? null,
          pumpRuntimeHours: latestByAssetMetric.get(`${d.id}:pump_runtime`) ?? null,
          rainfallMmPerHour: latestByAssetMetric.get(`${d.id}:rainfall`) ?? null,
        }),
      ),
    ),
    evacuationCorridors: collection(
      shelters.map((s) =>
        feature(s.longitude, s.latitude, {
          assetId: s.id, assetCode: s.assetCode, name: s.name, type: s.type,
          operationalStatus: s.operationalStatus,
          capacity: (s.metadata as unknown as { capacity?: number } | null)?.capacity ?? null,
        }),
      ),
    ),
    incidents: collection(
      incidents.map((i) =>
        feature((i.primaryAsset ?? i.zone).longitude, (i.primaryAsset ?? i.zone).latitude, {
          id: i.id, incidentCode: i.incidentCode, title: i.title, severity: i.severity, status: i.status, type: i.type,
        }),
      ),
    ),
    units: collection(
      units
        .filter((u) => u.latitude != null && u.longitude != null)
        .map((u) => feature(u.longitude!, u.latitude!, { id: u.id, callsign: u.callsign, type: u.type, status: u.status, departmentName: u.department?.name ?? null })),
    ),
  };
}
