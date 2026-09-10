import { prisma } from '../db/prisma';
import { ACTIVE_INCIDENT_STATUSES, SEVERITY_WEIGHTS } from '../utils/risk';
import { hoursAgo } from '../utils/dates';
import type {
  HazardSummary,
  OverviewMetrics,
  RecentIncidentSummary,
} from '../types/domain';
import type { Severity } from '@prisma/client';

/**
 * OVERVIEW API - every number is computed from PostgreSQL, never hardcoded.
 * Resilience formula (deterministic, documented in docs/API.md):
 *   resilience = 100 * (0.30*(1 - hazardLoad)
 *                     + 0.30*(1 - incidentLoad)
 *                     + 0.25*(1 - infrastructureLoad)
 *                     + 0.15*(unitReadiness))
 */
const W = { hazard: 0.3, incidents: 0.3, infrastructure: 0.25, readiness: 0.15 };
const INCIDENT_SEVERITY_LOAD: Record<Severity, number> = { CRITICAL: 1, HIGH: 0.6, MODERATE: 0.3, LOW: 0.1 };

async function latestReading(metric: string): Promise<{ value: number; timestamp: Date } | null> {
  const reading = await prisma.telemetryReading.findFirst({ where: { metric }, orderBy: { timestamp: 'desc' } });
  return reading ? { value: reading.value, timestamp: reading.timestamp } : null;
}

function maxOf(...values: (number | null | undefined)[]): number | null {
  const nums = values.filter((v): v is number => v != null);
  return nums.length > 0 ? Math.max(...nums) : null;
}

export async function getOverview(): Promise<OverviewMetrics> {
  const [
    zones,
    activeHazards,
    activeIncidents,
    incidentsLast24h,
    incidentsPrev24h,
    units,
    criticalAssets,
    roadAssets,
    gridAssets,
    recentCriticalRows,
    rainfallReading,
    powerLoadReading,
    temperatureReading,
  ] = await Promise.all([
    prisma.zone.findMany(),
    prisma.hazard.findMany({ where: { status: 'ACTIVE' }, include: { zone: true }, orderBy: { startedAt: 'asc' } }),
    prisma.incident.findMany({
      where: { status: { in: ACTIVE_INCIDENT_STATUSES } },
      include: { zone: true, primaryAsset: true, tasks: { include: { assignedUnit: true } } },
    }),
    prisma.incident.count({ where: { createdAt: { gte: hoursAgo(24) } } }),
    prisma.incident.count({ where: { createdAt: { gte: hoursAgo(48), lt: hoursAgo(24) } } }),
    prisma.responseUnit.findMany(),
    prisma.infrastructureAsset.findMany({ where: { criticality: 'CRITICAL' } }),
    prisma.infrastructureAsset.findMany({ where: { type: { in: ['ROAD', 'BRIDGE'] } } }),
    prisma.infrastructureAsset.findMany({ where: { type: { in: ['SUBSTATION', 'GENERATOR'] } } }),
    prisma.incident.findMany({
      where: { severity: { in: ['CRITICAL', 'HIGH'] } },
      orderBy: { reportedAt: 'desc' },
      take: 5,
      include: { zone: true, primaryAsset: true, tasks: { include: { assignedUnit: true } } },
    }),
    latestReading('rainfall'),
    latestReading('power_load'),
    latestReading('temperature'),
  ]);

  // --- component loads ---
  const hazardLoad = activeHazards.length
    ? activeHazards.reduce((sum, h) => sum + SEVERITY_WEIGHTS[h.severity], 0) / activeHazards.length
    : 0;
  const incidentSeveritySum = activeIncidents.reduce((sum, i) => sum + INCIDENT_SEVERITY_LOAD[i.severity], 0);
  const incidentLoad = Math.min(1, incidentSeveritySum / 6);
  const compromised = criticalAssets.filter((a) => a.operationalStatus === 'COMPROMISED' || a.operationalStatus === 'OFFLINE').length;
  const degraded = criticalAssets.filter((a) => a.operationalStatus === 'DEGRADED' || a.operationalStatus === 'AT_RISK').length;
  const infrastructureLoad = criticalAssets.length
    ? Math.min(1, (compromised + degraded * 0.6) / criticalAssets.length)
    : 0;
  const activeUnits = units.filter((u) => u.status !== 'OFFLINE');
  const availableUnits = units.filter((u) => u.status === 'AVAILABLE');
  const readiness = activeUnits.length ? availableUnits.length / activeUnits.length : 1;

  const resilienceIndex = Math.round(
    100 * (W.hazard * (1 - hazardLoad) + W.incidents * (1 - incidentLoad) + W.infrastructure * (1 - infrastructureLoad) + W.readiness * readiness),
  );
  const resilienceLevel: OverviewMetrics['resilienceLevel'] =
    resilienceIndex >= 75 ? 'STRONG' : resilienceIndex >= 50 ? 'GUARDED' : resilienceIndex >= 25 ? 'MODERATE_CAUTION' : 'CRITICAL_ALERT';

  const trendDelta = incidentsLast24h - incidentsPrev24h;
  const resilienceTrend = {
    direction: (trendDelta < 0 ? 'IMPROVING' : trendDelta > 0 ? 'DECLINING' : 'STABLE') as 'IMPROVING' | 'STABLE' | 'DECLINING',
    delta: trendDelta,
    description: `${incidentsLast24h} new incidents in the last 24h vs ${incidentsPrev24h} in the prior 24h.`,
  };

  // --- mobility ---
  const operationalRoads = roadAssets.filter((a) => a.operationalStatus === 'OPERATIONAL').length;
  const mobilityIndex = roadAssets.length ? Math.round((operationalRoads / roadAssets.length) * 100) : 100;
  const mobilityStatus = mobilityIndex >= 80 ? 'FLUID' : mobilityIndex >= 50 ? 'DEGRADED' : 'SEVERE';

  // --- grid ---
  const gridCompromised = gridAssets.filter((a) => a.operationalStatus === 'COMPROMISED' || a.operationalStatus === 'OFFLINE').length;
  const gridStrained = gridAssets.filter((a) => a.operationalStatus === 'DEGRADED' || a.operationalStatus === 'AT_RISK').length;
  const gridStatus = gridCompromised > 0 ? 'COMPROMISED' : gridStrained > 0 ? 'STRAINED' : 'STABLE';

  const hazardRainfall = maxOf(...activeHazards.map((h) => h.rainfallRate));
  const precipitation =
    maxOf(hazardRainfall, rainfallReading?.value) !== null
      ? { value: maxOf(hazardRainfall, rainfallReading?.value) as number, unit: 'mm/hr' as const, source: 'active hazard monitor / sensor telemetry (synthetic demo)' }
      : null;
  const hazardTemp = maxOf(...activeHazards.map((h) => h.temperature));
  const heatValue = maxOf(hazardTemp, temperatureReading?.value);
  const heat = heatValue !== null ? { value: heatValue, unit: '°C', source: 'active hazard monitor / sensor telemetry (synthetic demo)' } : null;

  const criticalIncidents = activeIncidents.filter((i) => i.severity === 'CRITICAL');

  const activeHazardSummaries: HazardSummary[] = activeHazards.map((h) => ({
    id: h.id,
    type: h.type,
    severity: h.severity,
    status: h.status,
    zoneId: h.zoneId,
    zoneName: h.zone.name,
    startedAt: h.startedAt,
    rainfallRate: h.rainfallRate,
    waterDepth: h.waterDepth,
    temperature: h.temperature,
    windSpeed: h.windSpeed,
  }));

  const recentCriticalIncidents: RecentIncidentSummary[] = recentCriticalRows.map((i) => ({
    id: i.id,
    incidentCode: i.incidentCode,
    title: i.title,
    severity: i.severity,
    status: i.status,
    type: i.type,
    zoneName: i.zone.name,
    assetName: i.primaryAsset?.name ?? null,
    reportedAt: i.reportedAt,
    slaDeadline: i.slaDeadline,
    assignedUnits: i.tasks.map((t) => t.assignedUnit?.callsign).filter((c): c is string => !!c),
  }));

  return {
    dataQuality: 'SYNTHETIC_DEMO',
    resilienceIndex,
    resilienceLevel,
    resilienceFormula: '0.30*(1-hazardLoad) + 0.30*(1-incidentLoad) + 0.25*(1-infrastructureLoad) + 0.15*unitReadiness, scaled to 0-100',
    resilienceTrend,
    activeThreats: activeHazards.length,
    monitoredZones: zones.length,
    criticalInfrastructure: { total: criticalAssets.length, compromised, degraded },
    mobility: { index: mobilityIndex, status: mobilityStatus, blockedRoads: roadAssets.length - operationalRoads },
    grid: {
      status: gridStatus,
      loadPercent: powerLoadReading ? Math.round(powerLoadReading.value) : null,
      note: `${gridCompromised} of ${gridAssets.length} generation/transmission assets compromised, ${gridStrained} degraded (synthetic demo).`,
    },
    precipitation,
    heat,
    activeIncidents: activeIncidents.length,
    criticalIncidents: criticalIncidents.length,
    resourceReadiness: {
      percent: activeUnits.length ? Math.round(readiness * 100) : 100,
      availableUnits: availableUnits.length,
      totalUnits: units.length,
    },
    recentCriticalIncidents,
    activeHazards: activeHazardSummaries,
  };
}
