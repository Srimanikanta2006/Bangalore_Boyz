import type { AssetType, Prisma, TelemetryReading, UnitType } from '@prisma/client';
import { prisma } from '../db/prisma';
import { ErrorCodes, Errors } from '../utils/errors';
import { buildPaginated, resolvePagination } from '../utils/pagination';
import { minutesBetween } from '../utils/dates';
import { nextTaskCode } from '../utils/ids';
import { ACTIVE_INCIDENT_STATUSES, ACTIVE_TASK_STATUSES, priorityToSlaHours } from '../utils/risk';
import { AuditActions, createAudit, recordAudit } from './audit.service';
import { cascadeFromAsset, mostSevereActiveHazard } from './cascade.service';
import { assessAssetRisk, persistRiskScore } from './risk.service';
import { findAssetByIdOrCode } from './lookup.service';
import type { InfrastructureQuery } from '../validators/infrastructure.schema';
import type { AuthUser } from '../types/auth';

/** INFRASTRUCTURE service - powers the Infrastructure screen (facility cards). */

const TELEMETRY_FRESH_MINUTES = 30;

async function latestTelemetryByAsset(assetIds: string[]): Promise<Map<string, TelemetryReading[]>> {
  const map = new Map<string, TelemetryReading[]>();
  if (assetIds.length === 0) return map;
  const readings = await prisma.telemetryReading.findMany({
    where: { assetId: { in: assetIds } },
    orderBy: { timestamp: 'desc' },
    take: assetIds.length * 12,
  });
  for (const reading of readings) {
    const list = map.get(reading.assetId) ?? [];
    if (list.length < 12) {
      list.push(reading);
      map.set(reading.assetId, list);
    }
  }
  return map;
}

function telemetryDelayMinutes(readings: TelemetryReading[]): number | null {
  if (readings.length === 0) return null;
  return minutesBetween(readings[0].timestamp, new Date());
}

function flattenMetadata(metadata: Prisma.JsonValue | null) {
  const md = (metadata ?? {}) as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === 'number' ? v : null);
  const bool = (v: unknown) => (typeof v === 'boolean' ? v : null);
  const str = (v: unknown) => (typeof v === 'string' ? v : null);
  return {
    failoverPower: bool(md.failoverPower),
    backupPower: bool(md.backupPower),
    waterProximityM: num(md.waterProximityM),
    evacuationStatus: str(md.evacuationStatus),
    beds: num(md.beds),
    bedOccupancyPercent: num(md.bedOccupancyPercent),
    capacity: num(md.capacity),
    occupancyPercent: num(md.occupancyPercent),
  };
}

function telemetryMap(readings: TelemetryReading[]): Record<string, { value: number; unit: string; timestamp: Date }> {
  const out: Record<string, { value: number; unit: string; timestamp: Date }> = {};
  for (const r of readings) {
    if (!out[r.metric]) out[r.metric] = { value: r.value, unit: r.unit, timestamp: r.timestamp };
  }
  return out;
}

export async function listAssets(query: InfrastructureQuery) {
  const { page, limit, skip, take } = resolvePagination(query);
  const where: Prisma.InfrastructureAssetWhereInput = {
    ...(query.facilityType ? { type: query.facilityType } : {}),
    ...(query.zoneId ? { zoneId: query.zoneId } : {}),
    ...(query.status ? { operationalStatus: query.status } : {}),
    ...(query.criticality ? { criticality: query.criticality } : {}),
    ...(query.vulnerability !== undefined ? { vulnerability: { gte: query.vulnerability } } : {}),
    ...(query.search
      ? { OR: [{ name: { contains: query.search, mode: 'insensitive' } }, { assetCode: { contains: query.search, mode: 'insensitive' } }] }
      : {}),
  };

  const [assets, total] = await Promise.all([
    prisma.infrastructureAsset.findMany({
      where,
      orderBy: [{ criticality: 'desc' }, { assetCode: 'asc' }],
      skip,
      take,
      include: { zone: { select: { id: true, name: true, code: true } } },
    }),
    prisma.infrastructureAsset.count({ where }),
  ]);

  const assetIds = assets.map((a) => a.id);
  const [telemetryByAsset, incidentCounts, taskCounts, activeHazards] = await Promise.all([
    latestTelemetryByAsset(assetIds),
    prisma.incident.groupBy({
      by: ['primaryAssetId'],
      where: { primaryAssetId: { in: assetIds }, status: { in: ACTIVE_INCIDENT_STATUSES } },
      _count: { _all: true },
    }),
    prisma.task.groupBy({
      by: ['assetId'],
      where: { assetId: { in: assetIds }, status: { in: ACTIVE_TASK_STATUSES } },
      _count: { _all: true },
    }),
    prisma.hazard.findMany({ where: { status: 'ACTIVE' } }),
  ]);

  const incidentCountByAsset = new Map(incidentCounts.map((g) => [g.primaryAssetId, g._count._all]));
  const taskCountByAsset = new Map(taskCounts.map((g) => [g.assetId, g._count._all]));
  const hazardByZone = new Map<string, (typeof activeHazards)[number]>();
  for (const h of activeHazards) {
    const existing = hazardByZone.get(h.zoneId);
    if (!existing || h.severity > existing.severity) hazardByZone.set(h.zoneId, h); // enum order: LOW<MODERATE<HIGH<CRITICAL
  }

  const items = await Promise.all(
    assets.map(async (asset) => {
      const readings = telemetryByAsset.get(asset.id) ?? [];
      const hazard = hazardByZone.get(asset.zoneId) ?? null;
      const delay = telemetryDelayMinutes(readings);
      const risk = await assessAssetRisk(
        prisma,
        asset,
        hazard,
        delay !== null && delay <= TELEMETRY_FRESH_MINUTES,
      );
      return {
        id: asset.id,
        assetCode: asset.assetCode,
        name: asset.name,
        type: asset.type,
        zone: asset.zone,
        latitude: asset.latitude,
        longitude: asset.longitude,
        criticality: asset.criticality,
        vulnerability: asset.vulnerability,
        operationalStatus: asset.operationalStatus,
        description: asset.description,
        ...flattenMetadata(asset.metadata),
        telemetry: telemetryMap(readings),
        telemetryDelayMinutes: delay,
        risk: { score: risk.score, level: risk.level },
        activeIncidents: incidentCountByAsset.get(asset.id) ?? 0,
        activeTasks: taskCountByAsset.get(asset.id) ?? 0,
      };
    }),
  );
  return buildPaginated(items, total, page, limit);
}

export async function getAsset(idOrCode: string) {
  const asset = await prisma.infrastructureAsset.findFirst({
    where: { OR: [{ id: idOrCode }, { assetCode: idOrCode }] },
    include: {
      zone: { select: { id: true, name: true, code: true, riskLevel: true } },
      telemetry: { orderBy: { timestamp: 'desc' }, take: 20 },
      riskScores: { orderBy: { calculatedAt: 'desc' }, take: 5 },
      edgesFrom: { include: { targetAsset: { select: { id: true, assetCode: true, name: true, type: true, operationalStatus: true } } } },
      edgesTo: { include: { sourceAsset: { select: { id: true, assetCode: true, name: true, type: true, operationalStatus: true } } } },
      tasks: {
        where: { status: { in: ACTIVE_TASK_STATUSES } },
        include: { assignedUnit: { select: { id: true, callsign: true, name: true, status: true } } },
      },
      incidents: { where: { status: { in: ACTIVE_INCIDENT_STATUSES } }, select: { id: true, incidentCode: true, title: true, severity: true, status: true } },
    },
  });
  if (!asset) throw Errors.notFound('Infrastructure asset', idOrCode);

  const hazard = await mostSevereActiveHazard(prisma, asset.zoneId);
  const delay = asset.telemetry.length > 0 ? minutesBetween(asset.telemetry[0].timestamp, new Date()) : null;
  const risk = await assessAssetRisk(
    prisma,
    asset,
    hazard,
    delay !== null && delay <= TELEMETRY_FRESH_MINUTES,
  );
  const cascade = await cascadeFromAsset(prisma, asset.id, hazard?.type ?? null, risk.score);

  return {
    ...asset,
    metadataFlat: flattenMetadata(asset.metadata),
    telemetryDelayMinutes: delay,
    risk,
    hazard,
    cascade: cascade.nodes,
    upstream: asset.edgesTo.map((e) => ({ ...e, role: 'THIS_ASSET_DEPENDS_ON' })),
    downstream: asset.edgesFrom.map((e) => ({ ...e, role: 'DEPENDS_ON_THIS_ASSET' })),
  };
}

export async function getTelemetry(idOrCode: string, query: { metric?: string; limit: number }) {
  const asset = await findAssetByIdOrCode(prisma, idOrCode);
  const readings = await prisma.telemetryReading.findMany({
    where: { assetId: asset.id, ...(query.metric ? { metric: query.metric } : {}) },
    orderBy: { timestamp: 'desc' },
    take: query.limit,
  });
  return { asset: { id: asset.id, assetCode: asset.assetCode, name: asset.name, type: asset.type }, readings, latest: telemetryMap(readings) };
}

export async function getRisk(idOrCode: string) {
  const asset = await findAssetByIdOrCode(prisma, idOrCode);
  const hazard = await mostSevereActiveHazard(prisma, asset.zoneId);
  const latest = await prisma.telemetryReading.findFirst({ where: { assetId: asset.id }, orderBy: { timestamp: 'desc' } });
  const delay = latest ? minutesBetween(latest.timestamp, new Date()) : null;
  const assessment = await assessAssetRisk(
    prisma,
    asset,
    hazard,
    delay !== null && delay <= TELEMETRY_FRESH_MINUTES,
  );
  const persisted = await persistRiskScore(prisma, asset.id, hazard?.id ?? null, assessment);
  return { asset: { id: asset.id, assetCode: asset.assetCode, name: asset.name }, hazard, assessment, snapshotId: persisted.id };
}

export async function getDependencies(idOrCode: string) {
  const asset = await findAssetByIdOrCode(prisma, idOrCode);
  const [upstream, downstream] = await Promise.all([
    prisma.dependencyEdge.findMany({
      where: { targetAssetId: asset.id },
      include: { sourceAsset: { select: { id: true, assetCode: true, name: true, type: true, criticality: true, operationalStatus: true } } },
    }),
    prisma.dependencyEdge.findMany({
      where: { sourceAssetId: asset.id },
      include: { targetAsset: { select: { id: true, assetCode: true, name: true, type: true, criticality: true, operationalStatus: true } } },
    }),
  ]);
  const hazard = await mostSevereActiveHazard(prisma, asset.zoneId);
  const risk = await assessAssetRisk(prisma, asset, hazard);
  const cascade = await cascadeFromAsset(prisma, asset.id, hazard?.type ?? null, risk.score);
  return {
    asset: { id: asset.id, assetCode: asset.assetCode, name: asset.name, type: asset.type },
    upstream: upstream.map((e) => ({ dependencyType: e.dependencyType, strength: e.strength, description: e.description, asset: e.sourceAsset })),
    downstream: downstream.map((e) => ({ dependencyType: e.dependencyType, strength: e.strength, description: e.description, asset: e.targetAsset })),
    cascadePreview: cascade.nodes,
  };
}

// ---------- Infrastructure actions (all audited) ----------

const RAPID_TEAM_UNIT_TYPES: Record<AssetType, UnitType[]> = {
  HOSPITAL: ['EMS', 'PUBLIC_WORKS'],
  AMBULANCE_GATE: ['EMS', 'BARRIER_CREW'],
  SUBSTATION: ['UTILITY'],
  GENERATOR: ['UTILITY'],
  DRAIN: ['PUMP_CREW', 'PUBLIC_WORKS'],
  PUMPING_STATION: ['PUMP_CREW', 'UTILITY'],
  WATER_TREATMENT: ['PUMP_CREW', 'UTILITY'],
  ROAD: ['BARRIER_CREW', 'PUBLIC_WORKS', 'HEAVY_EQUIPMENT'],
  BRIDGE: ['HEAVY_EQUIPMENT', 'PUBLIC_WORKS'],
  EVACUATION_SHELTER: ['EMS', 'POLICE'],
  COOLING_CENTER: ['EMS', 'PUBLIC_WORKS'],
  FIRE_STATION: ['FIRE_RESCUE'],
  OTHER: ['PUBLIC_WORKS'],
};

/** POST /api/infrastructure/:id/assign-team - transactional rapid team dispatch. */
export async function assignRapidTeam(
  assetKey: string,
  input: { unitId?: string; note?: string },
  user: AuthUser,
) {
  return prisma.$transaction(async (tx) => {
    const asset = await findAssetByIdOrCode(tx, assetKey);

    let unit = null as { id: string; callsign: string; departmentId: string; status: string } | null;
    if (input.unitId) {
      const found = await tx.responseUnit.findFirst({ where: { OR: [{ id: input.unitId }, { callsign: input.unitId }] } });
      if (!found) throw Errors.notFound('Response unit', input.unitId);
      unit = found;
    } else {
      const preferred = RAPID_TEAM_UNIT_TYPES[asset.type];
      const found = await tx.responseUnit.findFirst({
        where: { status: 'AVAILABLE', type: { in: preferred } },
        orderBy: [{ etaMinutes: 'asc' }, { callsign: 'asc' }],
      });
      if (!found) {
        throw Errors.conflict(
          ErrorCodes.NO_UNITS_AVAILABLE,
          `No AVAILABLE units matching types [${preferred.join(', ')}] for a ${asset.type} asset`,
        );
      }
      unit = found;
    }
    if (unit.status !== 'AVAILABLE') {
      throw Errors.conflict(ErrorCodes.UNIT_NOT_AVAILABLE, `Response unit ${unit.callsign} is currently ${unit.status}`);
    }

    const taskCode = await nextTaskCode(tx);
    const priority = asset.criticality === 'CRITICAL' ? 'CRITICAL' : asset.criticality === 'HIGH' ? 'HIGH' : 'MEDIUM';
    const task = await tx.task.create({
      data: {
        taskCode,
        title: `Rapid response: ${asset.name}`,
        description: input.note ?? `Rapid response team assigned to ${asset.assetCode} (${asset.type}, ${asset.operationalStatus})`,
        assetId: asset.id,
        assignedUnitId: unit.id,
        assignedDepartmentId: unit.departmentId,
        createdById: user.id,
        status: 'ASSIGNED',
        priority,
        slaDeadline: new Date(Date.now() + priorityToSlaHours(priority) * 60 * 60 * 1000),
      },
    });
    await tx.taskStatusHistory.create({
      data: { taskId: task.id, fromStatus: null, toStatus: 'ASSIGNED', changedById: user.id, note: `Rapid team ${unit.callsign} assigned to ${asset.assetCode}` },
    });
    await tx.responseUnit.update({ where: { id: unit.id }, data: { status: 'ASSIGNED' } });

    await createAudit(tx, {
      userId: user.id, action: AuditActions.ASSET_TEAM_ASSIGNED, entityType: 'INFRASTRUCTURE_ASSET', entityId: asset.id,
      metadata: { assetCode: asset.assetCode, unit: unit.callsign, taskCode, priority },
    });
    await createAudit(tx, {
      userId: user.id, action: AuditActions.TASK_CREATED, entityType: 'TASK', entityId: task.id,
      metadata: { taskCode, assetCode: asset.assetCode, unit: unit.callsign },
    });
    return { task, unit: { id: unit.id, callsign: unit.callsign, status: 'ASSIGNED' } };
  });
}

/** POST /api/infrastructure/:id/maintenance - creates a PUBLIC_WORKS maintenance task. */
export async function requestMaintenance(
  assetKey: string,
  input: { description?: string; priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' },
  user: AuthUser,
) {
  return prisma.$transaction(async (tx) => {
    const asset = await findAssetByIdOrCode(tx, assetKey);
    const department = await tx.department.findFirst({ where: { type: 'PUBLIC_WORKS' } });
    if (!department) throw Errors.notFound('Department', 'PUBLIC_WORKS');

    const taskCode = await nextTaskCode(tx);
    const priority =
      input.priority ?? (asset.criticality === 'CRITICAL' ? 'CRITICAL' : asset.criticality === 'HIGH' ? 'HIGH' : 'MEDIUM');
    const task = await tx.task.create({
      data: {
        taskCode,
        title: `Maintenance: ${asset.name}`,
        description: input.description ?? `Preventive/corrective maintenance requested for ${asset.assetCode} (status ${asset.operationalStatus})`,
        assetId: asset.id,
        assignedDepartmentId: department.id,
        createdById: user.id,
        status: 'ASSIGNED',
        priority,
        slaDeadline: new Date(Date.now() + priorityToSlaHours(priority) * 60 * 60 * 1000),
      },
    });
    await tx.taskStatusHistory.create({
      data: { taskId: task.id, fromStatus: null, toStatus: 'ASSIGNED', changedById: user.id, note: 'Maintenance requested from Infrastructure screen' },
    });
    await createAudit(tx, {
      userId: user.id, action: AuditActions.ASSET_MAINTENANCE_REQUESTED, entityType: 'INFRASTRUCTURE_ASSET', entityId: asset.id,
      metadata: { assetCode: asset.assetCode, taskCode, priority },
    });
    await createAudit(tx, {
      userId: user.id, action: AuditActions.TASK_CREATED, entityType: 'TASK', entityId: task.id,
      metadata: { taskCode, assetCode: asset.assetCode, department: department.code },
    });
    return task;
  });
}

/** POST /api/infrastructure/:id/reroute - issues an audited traffic reroute advisory. */
export async function rerouteTraffic(assetKey: string, input: { reason?: string }, user: AuthUser) {
  const asset = await findAssetByIdOrCode(prisma, assetKey);
  const alternatives = await prisma.infrastructureAsset.findMany({
    where: {
      type: { in: ['ROAD', 'BRIDGE'] },
      zoneId: asset.zoneId,
      operationalStatus: 'OPERATIONAL',
      id: { not: asset.id },
    },
    orderBy: { assetCode: 'asc' },
    take: 3,
    select: { id: true, assetCode: true, name: true, type: true },
  });

  await recordAudit({
    userId: user.id,
    action: AuditActions.TRAFFIC_REROUTED,
    entityType: 'INFRASTRUCTURE_ASSET',
    entityId: asset.id,
    metadata: { assetCode: asset.assetCode, reason: input.reason ?? null, alternatives: alternatives.map((a) => a.assetCode) },
  });

  return {
    asset: { id: asset.id, assetCode: asset.assetCode, name: asset.name, type: asset.type, operationalStatus: asset.operationalStatus },
    alternatives,
    advisory:
      `Traffic reroute advisory issued for ${asset.name}${input.reason ? ` (reason: ${input.reason})` : ''}. ` +
      `Route via ${alternatives[0]?.name ?? 'municipal alternate arterials'}. (DEMO/SIMULATED advisory - no external traffic systems connected.)`,
    issuedAt: new Date(),
  };
}

/** GET /api/infrastructure/:id/logs - facility operational history. */
export async function getFacilityLogs(idOrCode: string) {
  const asset = await findAssetByIdOrCode(prisma, idOrCode);
  const [auditLogs, tasks, telemetry, riskScores, incidents] = await Promise.all([
    prisma.auditLog.findMany({
      where: { entityType: 'INFRASTRUCTURE_ASSET', entityId: asset.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { name: true, role: true } } },
    }),
    prisma.task.findMany({
      where: { assetId: asset.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { history: { orderBy: { createdAt: 'asc' } }, assignedUnit: { select: { callsign: true, name: true } } },
    }),
    prisma.telemetryReading.findMany({ where: { assetId: asset.id }, orderBy: { timestamp: 'desc' }, take: 20 }),
    prisma.riskScore.findMany({ where: { assetId: asset.id }, orderBy: { calculatedAt: 'desc' }, take: 10 }),
    prisma.incident.findMany({ where: { primaryAssetId: asset.id }, orderBy: { reportedAt: 'desc' }, take: 10, select: { id: true, incidentCode: true, title: true, severity: true, status: true, reportedAt: true } }),
  ]);
  return {
    asset: { id: asset.id, assetCode: asset.assetCode, name: asset.name, type: asset.type, operationalStatus: asset.operationalStatus },
    auditLogs,
    tasks,
    incidents,
    telemetry,
    riskScores,
  };
}
