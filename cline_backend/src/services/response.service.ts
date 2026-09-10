import type { Hotspot, Incident, ResponseUnit, Severity } from '@prisma/client';
import { prisma } from '../db/prisma';
import { daysAgo, minutesUntil, SLA_HOURS_BY_SEVERITY } from '../utils/dates';
import { ACTIVE_INCIDENT_STATUSES, ACTIVE_TASK_STATUSES, severityToPriority } from '../utils/risk';
import { AuditActions, recordAudit } from './audit.service';
import { getZoneCascade, mostSevereActiveHazard } from './cascade.service';
import { findZoneByIdOrCode } from './lookup.service';
import type { AuthUser } from '../types/auth';
import type {
  HotspotCard,
  IncidentCard,
  ResponseCenterData,
  ResponsePlanAction,
  ResponsePlanData,
  TelemetrySummary,
  UnitCard,
} from '../types/domain';

/** RESPONSE CENTER - operational dispatch board, computed live from PostgreSQL. */

type IncidentRow = Incident & {
  zone: { name: string } | null;
  primaryAsset: { name: string } | null;
  tasks: { taskCode: string; status: string; assignedUnit: { callsign: string; name: string } | null }[];
};

function toIncidentCard(incident: IncidentRow): IncidentCard {
  const activeTasks = incident.tasks.filter((t) => ACTIVE_TASK_STATUSES.includes(t.status as never));
  return {
    id: incident.id,
    incidentCode: incident.incidentCode,
    title: incident.title,
    description: incident.description,
    severity: incident.severity,
    status: incident.status,
    type: incident.type,
    zoneId: incident.zoneId,
    zoneName: incident.zone?.name ?? null,
    assetName: incident.primaryAsset?.name ?? null,
    reportedAt: incident.reportedAt,
    slaDeadline: incident.slaDeadline,
    slaMinutesRemaining: minutesUntil(incident.slaDeadline),
    assignedUnits: activeTasks.map((t) => t.assignedUnit?.callsign).filter((c): c is string => !!c),
    taskCodes: activeTasks.map((t) => t.taskCode),
  };
}

function toUnitCard(unit: ResponseUnit & { department: { name: string } | null }): UnitCard {
  return {
    id: unit.id,
    name: unit.name,
    callsign: unit.callsign,
    type: unit.type,
    status: unit.status,
    departmentId: unit.departmentId,
    departmentName: unit.department?.name ?? null,
    teamSize: unit.teamSize,
    etaMinutes: unit.etaMinutes,
    latitude: unit.latitude,
    longitude: unit.longitude,
    specialization: unit.specialization,
  };
}

function toHotspotCard(hotspot: Hotspot & { zone: { name: string } | null }): HotspotCard {
  return {
    id: hotspot.id,
    name: hotspot.name,
    zoneId: hotspot.zoneId,
    zoneName: hotspot.zone?.name ?? null,
    hazardType: hotspot.hazardType,
    eventCount: hotspot.eventCount,
    severityScore: hotspot.severityScore,
    recurrenceScore: hotspot.recurrenceScore,
    lastOccurredAt: hotspot.lastOccurredAt,
    latitude: hotspot.latitude,
    longitude: hotspot.longitude,
    description: hotspot.description,
  };
}

async function telemetrySummary(): Promise<TelemetrySummary> {
  const specs: { metric: string; mode: 'latest' | 'max' }[] = [
    { metric: 'rainfall', mode: 'latest' },
    { metric: 'water_depth', mode: 'max' },
    { metric: 'temperature', mode: 'max' },
    { metric: 'pump_runtime', mode: 'max' },
    { metric: 'power_load', mode: 'max' },
  ];
  const summary: TelemetrySummary = {
    rainfallMmPerHour: null,
    maxWaterDepthM: null,
    maxTemperatureC: null,
    maxPumpRuntimeHours: null,
    maxPowerLoadPercent: null,
    updatedAt: null,
  };
  let updatedAt: Date | null = null;
  for (const { metric, mode } of specs) {
    const readings = await prisma.telemetryReading.findMany({
      where: { metric },
      orderBy: { timestamp: 'desc' },
      take: 50,
      select: { value: true, timestamp: true },
    });
    if (readings.length === 0) continue;
    const value = mode === 'latest' ? readings[0].value : Math.max(...readings.map((r) => r.value));
    const latestTs = readings[0].timestamp;
    if (!updatedAt || latestTs > updatedAt) updatedAt = latestTs;
    if (metric === 'rainfall') summary.rainfallMmPerHour = Math.round(value * 10) / 10;
    if (metric === 'water_depth') summary.maxWaterDepthM = Math.round(value * 100) / 100;
    if (metric === 'temperature') summary.maxTemperatureC = Math.round(value * 10) / 10;
    if (metric === 'pump_runtime') summary.maxPumpRuntimeHours = Math.round(value * 10) / 10;
    if (metric === 'power_load') summary.maxPowerLoadPercent = Math.round(value);
  }
  summary.updatedAt = updatedAt;
  return summary;
}

export async function getResponseCenter(): Promise<ResponseCenterData> {
  const [activeIncidents, units, acknowledgedTasks, resolvedIncidents, hotspots, telemetry] = await Promise.all([
    prisma.incident.findMany({
      where: { status: { in: ACTIVE_INCIDENT_STATUSES } },
      include: {
        zone: { select: { name: true } },
        primaryAsset: { select: { name: true } },
        tasks: { include: { assignedUnit: { select: { callsign: true, name: true } } } },
      },
      orderBy: [{ severity: 'desc' }, { reportedAt: 'desc' }],
    }) as Promise<IncidentRow[]>,
    prisma.responseUnit.findMany({ include: { department: { select: { name: true } } }, orderBy: { callsign: 'asc' } }),
    prisma.task.findMany({
      where: { acknowledgedAt: { gte: daysAgo(30) } },
      select: { createdAt: true, acknowledgedAt: true },
    }),
    prisma.incident.findMany({
      where: { status: { in: ['RESOLVED', 'CLOSED'] }, resolvedAt: { not: null }, slaDeadline: { not: null } },
      select: { resolvedAt: true, slaDeadline: true },
    }),
    prisma.hotspot.findMany({ include: { zone: { select: { name: true } } }, orderBy: { recurrenceScore: 'desc' }, take: 5 }),
    telemetrySummary(),
  ]);

  const cards = activeIncidents.map(toIncidentCard);
  const unassignedIncidents = cards.filter((c) => c.assignedUnits.length === 0);
  const group = (severity: Severity) => cards.filter((c) => c.severity === severity);

  const activeUnits = units.filter((u) => u.status !== 'OFFLINE');
  const availableUnits = units.filter((u) => u.status === 'AVAILABLE');
  const assignedUnitCount = units.filter((u) => ['ASSIGNED', 'EN_ROUTE', 'ON_SCENE'].includes(u.status)).length;

  const responseMinutes = acknowledgedTasks
    .filter((t) => t.acknowledgedAt)
    .map((t) => (t.acknowledgedAt!.getTime() - t.createdAt.getTime()) / 60000);
  const avgResponseMinutes = responseMinutes.length
    ? Math.round(responseMinutes.reduce((a, b) => a + b, 0) / responseMinutes.length)
    : null;

  const withSla = resolvedIncidents.filter((i) => i.resolvedAt && i.slaDeadline);
  const slaMet = withSla.filter((i) => i.resolvedAt! <= i.slaDeadline!).length;
  const slaCompliancePercent = withSla.length ? Math.round((slaMet / withSla.length) * 100) : null;

  return {
    summary: {
      activeIncidents: cards.length,
      critical: group('CRITICAL').length,
      high: group('HIGH').length,
      moderate: group('MODERATE').length,
      unassignedIncidents: unassignedIncidents.length,
      assignedUnits: assignedUnitCount,
      readinessPercent: activeUnits.length ? Math.round((availableUnits.length / activeUnits.length) * 100) : 100,
      avgResponseMinutes,
      slaCompliancePercent,
      targetResolutionHours: SLA_HOURS_BY_SEVERITY,
    },
    severityGroups: {
      CRITICAL: group('CRITICAL'),
      HIGH: group('HIGH'),
      MODERATE: group('MODERATE'),
      LOW: group('LOW'),
    },
    activeIncidents: cards,
    unassignedIncidents,
    availableUnits: availableUnits.map(toUnitCard),
    telemetry,
    hotspots: hotspots.map(toHotspotCard),
  };
}

function preferredUnitTypes(hazardType: string | null): string[] {
  if (['FLOOD', 'FLASH_FLOOD', 'DRAINAGE_OVERFLOW'].includes(hazardType ?? '')) {
    return ['PUMP_CREW', 'BARRIER_CREW', 'PUBLIC_WORKS', 'HEAVY_EQUIPMENT'];
  }
  if (hazardType === 'EXTREME_HEAT') return ['EMS', 'PUBLIC_WORKS', 'MUTUAL_AID'];
  if (['POWER_FAILURE', 'STORM', 'HIGH_WIND'].includes(hazardType ?? '')) {
    return ['UTILITY', 'FIRE_RESCUE', 'HEAVY_EQUIPMENT'];
  }
  return ['PUBLIC_WORKS', 'EMS', 'POLICE'];
}

function severityFromLevel(level: string): Severity {
  if (level === 'CRITICAL') return 'CRITICAL';
  if (level === 'HIGH') return 'HIGH';
  if (level === 'MODERATE') return 'MODERATE';
  return 'LOW';
}

/**
 * POST /api/zones/:zoneId/response-plan
 * Generates a DETERMINISTIC, PROPOSED-ONLY plan from live data.
 * No autonomous execution: the Government operator must confirm/dispatch.
 */
export async function createResponsePlan(zoneKey: string, user: AuthUser): Promise<ResponsePlanData> {
  const zone = await findZoneByIdOrCode(prisma, zoneKey);
  const hazard = await mostSevereActiveHazard(prisma, zone.id);
  const cascade = await getZoneCascade(prisma, zone.id);

  const available = await prisma.responseUnit.findMany({
    where: { status: 'AVAILABLE' },
    include: { department: { select: { name: true } } },
    orderBy: [{ etaMinutes: 'asc' }, { callsign: 'asc' }],
  });
  const preferred = preferredUnitTypes(hazard?.type ?? null);
  const recommendedUnits = [...available]
    .sort((a, b) => {
      const pa = preferred.indexOf(a.type);
      const pb = preferred.indexOf(b.type);
      return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb) || (a.etaMinutes ?? 99) - (b.etaMinutes ?? 99);
    })
    .slice(0, 4);

  const severity: Severity = hazard?.severity ?? severityFromLevel(cascade.riskLevel);
  const priority = severityToPriority(severity);
  const etaMinutes = recommendedUnits[0]?.etaMinutes ?? (priority === 'CRITICAL' ? 10 : priority === 'HIGH' ? 15 : 25);

  const recommendedActions: ResponsePlanAction[] = cascade.recommendedResponseActions.map((action, index) => ({
    action,
    rationale: `Derived from ${cascade.riskLevel} zone risk (${cascade.riskScore}/100) and dependency-cascade analysis${hazard ? ` under ${hazard.type} conditions` : ''}.`,
    priority: index === 0 ? priority : index < 3 ? 'HIGH' : 'MEDIUM',
    suggestedUnitTypes: preferred,
  }));

  await recordAudit({
    userId: user.id,
    action: AuditActions.RESPONSE_PLAN_CREATED,
    entityType: 'ZONE',
    entityId: zone.id,
    metadata: {
      zone: zone.name,
      riskScore: cascade.riskScore,
      recommendedUnits: recommendedUnits.map((u) => u.callsign),
      actions: recommendedActions.length,
    },
  });

  return {
    zoneId: zone.id,
    zoneName: zone.name,
    generatedAt: new Date(),
    status: 'PROPOSED',
    note: 'DEMO/SIMULATED planning data. Plan status: PROPOSED only - nothing has been dispatched. A Government operator must confirm each action before execution.',
    riskScore: cascade.riskScore,
    riskLevel: cascade.riskLevel,
    severity,
    hazardType: hazard?.type ?? null,
    priority,
    etaMinutes,
    affectedAssets: cascade.impactedInfrastructure
      .slice(0, 8)
      .map((n) => ({
        assetCode: n.assetCode,
        name: n.name,
        type: n.type,
        operationalStatus: n.operationalStatus,
        impactType: n.impactType,
      })),
    recommendedActions,
    recommendedUnits: recommendedUnits.map((u) => ({
      unitId: u.id,
      name: u.name,
      callsign: u.callsign,
      type: u.type,
      departmentName: u.department?.name ?? null,
      etaMinutes: u.etaMinutes,
      teamSize: u.teamSize,
    })),
    cascadeSummary: cascade.cascade.map((c) => `${c.asset} -> ${c.impact} (depth ${c.depth}, impact ${c.impactScore}/100)`),
  };
}
