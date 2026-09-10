import { prisma } from '../db/prisma';
import { buildPaginated, resolvePagination } from '../utils/pagination';
import { ACTIVE_INCIDENT_STATUSES } from '../utils/risk';
import { findZoneByIdOrCode } from './lookup.service';

export interface ZoneQuery {
  riskLevel?: string;
  page?: number;
  limit?: number;
}

export async function listZones(query: ZoneQuery) {
  const { page, limit, skip, take } = resolvePagination(query);
  const where = query.riskLevel ? { riskLevel: query.riskLevel as never } : {};
  const [zones, total] = await Promise.all([
    prisma.zone.findMany({
      where,
      orderBy: [{ riskLevel: 'desc' }, { name: 'asc' }],
      skip,
      take,
      include: {
        hazards: { where: { status: 'ACTIVE' }, select: { id: true, type: true, severity: true, startedAt: true } },
        incidents: { where: { status: { in: ACTIVE_INCIDENT_STATUSES } }, select: { id: true } },
        _count: { select: { assets: true, hotspots: true, historicalEvents: true } },
      },
    }),
    prisma.zone.count({ where }),
  ]);
  const items = zones.map((z) => ({
    id: z.id,
    name: z.name,
    code: z.code,
    description: z.description,
    latitude: z.latitude,
    longitude: z.longitude,
    riskLevel: z.riskLevel,
    population: z.population,
    source: z.source,
    sourceId: z.sourceId,
    dataQuality: z.dataQuality,
    assetCount: z._count.assets,
    hotspotCount: z._count.hotspots,
    historicalEventCount: z._count.historicalEvents,
    activeHazards: z.hazards,
    activeIncidentCount: z.incidents.length,
  }));
  return buildPaginated(items, total, page, limit);
}

export async function getZone(idOrCode: string) {
  const zone = await findZoneByIdOrCode(prisma, idOrCode);
  const [assets, hazards, incidents, hotspots] = await Promise.all([
    prisma.infrastructureAsset.findMany({
      where: { zoneId: zone.id },
      orderBy: [{ criticality: 'desc' }, { assetCode: 'asc' }],
      select: { id: true, assetCode: true, name: true, type: true, criticality: true, vulnerability: true, operationalStatus: true, latitude: true, longitude: true },
    }),
    prisma.hazard.findMany({ where: { zoneId: zone.id, status: 'ACTIVE' }, orderBy: { startedAt: 'asc' } }),
    prisma.incident.findMany({
      where: { zoneId: zone.id, status: { in: ACTIVE_INCIDENT_STATUSES } },
      orderBy: { reportedAt: 'desc' },
      select: { id: true, incidentCode: true, title: true, severity: true, status: true, type: true, reportedAt: true, slaDeadline: true },
    }),
    prisma.hotspot.findMany({ where: { zoneId: zone.id }, orderBy: { recurrenceScore: 'desc' } }),
  ]);
  return { zone, assets, activeHazards: hazards, activeIncidents: incidents, hotspots };
}
