import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { Errors } from '../utils/errors';
import { buildPaginated, resolvePagination } from '../utils/pagination';
import { clusterHistoricalEvents, type ClusterableEvent } from './hotspotClustering.service';

export interface HotspotQuery {
  hazardType?: string;
  zoneId?: string;
  severity?: string;
  minRecurrence?: number;
  page?: number;
  limit?: number;
}

const SEVERITY_FLOOR: Record<string, number> = { LOW: 0, MODERATE: 45, HIGH: 65, CRITICAL: 85 };

export async function listHotspots(query: HotspotQuery) {
  const { page, limit, skip, take } = resolvePagination(query);
  const where: Prisma.HotspotWhereInput = {
    ...(query.hazardType ? { hazardType: query.hazardType as never } : {}),
    ...(query.zoneId ? { zoneId: query.zoneId } : {}),
    ...(query.severity ? { severityScore: { gte: SEVERITY_FLOOR[query.severity] ?? 0 } } : {}),
    ...(query.minRecurrence !== undefined ? { recurrenceScore: { gte: query.minRecurrence } } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.hotspot.findMany({ where, orderBy: [{ recurrenceScore: 'desc' }, { eventCount: 'desc' }], skip, take, include: { zone: { select: { id: true, name: true, code: true, riskLevel: true } } } }),
    prisma.hotspot.count({ where }),
  ]);
  const items = rows.map((h) => ({
    id: h.id,
    name: h.name,
    zone: h.zone,
    hazardType: h.hazardType,
    eventCount: h.eventCount,
    severityScore: h.severityScore,
    recurrenceScore: h.recurrenceScore,
    lastOccurredAt: h.lastOccurredAt,
    latitude: h.latitude,
    longitude: h.longitude,
    description: h.description,
  }));
  return buildPaginated(items, total, page, limit);
}

export async function getHotspot(id: string) {
  const hotspot = await prisma.hotspot.findUnique({
    where: { id },
    include: {
      zone: true,
    },
  });
  if (!hotspot) throw Errors.notFound('Hotspot', id);
  const relatedEvents = await prisma.historicalEvent.findMany({
    where: { zoneId: hotspot.zoneId, hazardType: hotspot.hazardType },
    orderBy: { occurredAt: 'desc' },
    take: 10,
  });
  return { ...hotspot, relatedHistoricalEvents: relatedEvents };
}

/**
 * Real hotspot DERIVATION via clustering over HistoricalEvent rows (see
 * hotspotClustering.service.ts) - a second, additive, clearly-labeled view
 * alongside the hand-seeded `/api/hotspots` list. Computed live on every
 * request (nothing stored/cached) so it always reflects the current DB state.
 */
export async function listDerivedHotspots() {
  const events = await prisma.historicalEvent.findMany({
    include: {
      zone: { select: { id: true, name: true, latitude: true, longitude: true } },
      asset: { select: { latitude: true, longitude: true } },
    },
    orderBy: { occurredAt: 'desc' },
  });

  const clusterable: ClusterableEvent[] = events.map((e) => ({
    id: e.id,
    // Prefer the linked asset's real coordinates; fall back to the zone centroid
    // when an event has no linked asset (both are real DB coordinates, never fabricated).
    latitude: e.asset?.latitude ?? e.zone.latitude,
    longitude: e.asset?.longitude ?? e.zone.longitude,
    hazardType: e.hazardType,
    severity: e.severity,
    occurredAt: e.occurredAt,
    zoneId: e.zone.id,
    zoneName: e.zone.name,
  }));

  return clusterHistoricalEvents(clusterable);
}
