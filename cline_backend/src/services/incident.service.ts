import type { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { Errors } from '../utils/errors';
import { buildPaginated, resolvePagination } from '../utils/pagination';
import { minutesUntil, slaDeadlineFor } from '../utils/dates';
import { nextIncidentCode } from '../utils/ids';
import { canTransition, INCIDENT_TRANSITIONS } from '../utils/state';
import { AuditActions, recordAudit } from './audit.service';
import { cascadeFromAsset, getIncidentCascade, mostSevereActiveHazard, persistCascadeEvents } from './cascade.service';
import { assessAssetRisk } from './risk.service';
import type { CreateIncidentInput, IncidentQuery, UpdateIncidentInput } from '../validators/incident.schema';
import type { AuthUser } from '../types/auth';

const incidentInclude = {
  zone: true,
  hazard: true,
  primaryAsset: true,
  createdBy: { select: { id: true, name: true, role: true } },
  tasks: { include: { assignedUnit: { include: { department: { select: { id: true, name: true } } } } } },
  _count: { select: { tasks: true, cascadeEvents: true } },
} satisfies Prisma.IncidentInclude;

type IncidentWithRelations = Prisma.IncidentGetPayload<{ include: typeof incidentInclude }>;

function toSummary(incident: IncidentWithRelations) {
  return {
    id: incident.id,
    incidentCode: incident.incidentCode,
    title: incident.title,
    description: incident.description,
    type: incident.type,
    severity: incident.severity,
    status: incident.status,
    zone: incident.zone
      ? { id: incident.zone.id, name: incident.zone.name, code: incident.zone.code, riskLevel: incident.zone.riskLevel }
      : null,
    hazard: incident.hazard
      ? { id: incident.hazard.id, type: incident.hazard.type, severity: incident.hazard.severity, status: incident.hazard.status }
      : null,
    primaryAsset: incident.primaryAsset
      ? {
          id: incident.primaryAsset.id,
          assetCode: incident.primaryAsset.assetCode,
          name: incident.primaryAsset.name,
          type: incident.primaryAsset.type,
          operationalStatus: incident.primaryAsset.operationalStatus,
        }
      : null,
    reportedAt: incident.reportedAt,
    acknowledgedAt: incident.acknowledgedAt,
    resolvedAt: incident.resolvedAt,
    slaDeadline: incident.slaDeadline,
    slaMinutesRemaining: minutesUntil(incident.slaDeadline),
    taskCount: incident._count?.tasks ?? 0,
    cascadeEventCount: incident._count?.cascadeEvents ?? 0,
    assignedUnits: incident.tasks
      .filter((t) => t.assignedUnit)
      .map((t) => ({
        id: t.assignedUnit!.id,
        callsign: t.assignedUnit!.callsign,
        name: t.assignedUnit!.name,
        status: t.assignedUnit!.status,
        departmentName: t.assignedUnit!.department?.name ?? null,
        taskCode: t.taskCode,
        taskStatus: t.status,
      })),
    createdByName: incident.createdBy?.name ?? null,
    createdAt: incident.createdAt,
    updatedAt: incident.updatedAt,
  };
}

export async function listIncidents(query: IncidentQuery) {
  const { page, limit, skip, take } = resolvePagination(query);
  const where: Prisma.IncidentWhereInput = {
    ...(query.severity ? { severity: query.severity } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.type ? { type: query.type } : {}),
    ...(query.zoneId ? { zoneId: query.zoneId } : {}),
    ...(query.hazardId ? { hazardId: query.hazardId } : {}),
    ...(query.search ? { title: { contains: query.search, mode: 'insensitive' } } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.incident.findMany({ where, orderBy: [{ reportedAt: 'desc' }], skip, take, include: incidentInclude }),
    prisma.incident.count({ where }),
  ]);
  return buildPaginated(rows.map(toSummary), total, page, limit);
}

export async function getIncident(idOrCode: string, viewer?: AuthUser) {
  const incident = await prisma.incident.findFirst({
    where: { OR: [{ id: idOrCode }, { incidentCode: idOrCode }] },
    include: incidentInclude,
  });
  if (!incident) throw Errors.notFound('Incident', idOrCode);

  const cascade = await getIncidentCascade(prisma, incident.id);

  const availableUnits = await prisma.responseUnit.findMany({
    where: { status: 'AVAILABLE' },
    include: { department: { select: { id: true, name: true } } },
    orderBy: [{ etaMinutes: 'asc' }, { callsign: 'asc' }],
    take: 12,
  });

  await recordAudit({
    userId: viewer?.id ?? null,
    action: AuditActions.INCIDENT_VIEWED,
    entityType: 'INCIDENT',
    entityId: incident.id,
    metadata: { incidentCode: incident.incidentCode },
  });

  return {
    incident: toSummary(incident),
    cascade: {
      rootAsset: cascade.rootAsset,
      hazard: cascade.hazard,
      baseRisk: cascade.baseRisk,
      nodes: cascade.nodes,
    },
    availableUnits: availableUnits.map((u) => ({
      id: u.id,
      name: u.name,
      callsign: u.callsign,
      type: u.type,
      status: u.status,
      departmentId: u.departmentId,
      departmentName: u.department?.name ?? null,
      teamSize: u.teamSize,
      capacity: u.capacity,
      specialization: u.specialization,
      etaMinutes: u.etaMinutes,
    })),
  };
}

export async function createIncident(input: CreateIncidentInput, user: AuthUser) {
  const zone = await prisma.zone.findUnique({ where: { id: input.zoneId } });
  if (!zone) throw Errors.notFound('Zone', input.zoneId);

  const hazard = input.hazardId
    ? await prisma.hazard.findUnique({ where: { id: input.hazardId } })
    : await mostSevereActiveHazard(prisma, input.zoneId);
  if (input.hazardId && !hazard) throw Errors.notFound('Hazard', input.hazardId);
  if (hazard && hazard.zoneId !== zone.id) {
    throw Errors.businessRule('HAZARD_ZONE_MISMATCH', 'Hazard does not belong to the incident zone');
  }

  const asset = input.primaryAssetId
    ? await prisma.infrastructureAsset.findUnique({ where: { id: input.primaryAssetId } })
    : null;
  if (input.primaryAssetId && !asset) throw Errors.notFound('Infrastructure asset', input.primaryAssetId);
  if (asset && asset.zoneId !== zone.id) {
    throw Errors.businessRule('ASSET_ZONE_MISMATCH', 'Primary asset does not belong to the incident zone');
  }

  const reportedAt = input.reportedAt ?? new Date();
  const incidentCode = await nextIncidentCode(prisma);
  const created = await prisma.incident.create({
    data: {
      incidentCode,
      title: input.title,
      description: input.description,
      type: input.type,
      severity: input.severity,
      status: 'NEW',
      zoneId: zone.id,
      hazardId: hazard?.id,
      primaryAssetId: asset?.id,
      reportedAt,
      slaDeadline: input.slaDeadline ?? slaDeadlineFor(input.severity, reportedAt),
      createdById: user.id,
    },
  });

  // Persist the deterministic cascade projection for this incident.
  if (asset) {
    const baseRisk = await assessAssetRisk(prisma, asset, hazard);
    const { nodes } = await cascadeFromAsset(prisma, asset.id, hazard?.type ?? null, baseRisk.score);
    await persistCascadeEvents(prisma, created.id, asset.id, nodes);
  }

  await recordAudit({
    userId: user.id,
    action: AuditActions.INCIDENT_CREATED,
    entityType: 'INCIDENT',
    entityId: created.id,
    metadata: { incidentCode, severity: input.severity, type: input.type, zone: zone.name },
  });

  const full = await prisma.incident.findUnique({ where: { id: created.id }, include: incidentInclude });
  return toSummary(full!);
}

export async function updateIncident(idOrCode: string, input: UpdateIncidentInput, user: AuthUser) {
  const incident = await prisma.incident.findFirst({ where: { OR: [{ id: idOrCode }, { incidentCode: idOrCode }] } });
  if (!incident) throw Errors.notFound('Incident', idOrCode);

  const severityChanged = input.severity && input.severity !== incident.severity;
  const updated = await prisma.incident.update({
    where: { id: incident.id },
    data: {
      ...(input.title ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.severity ? { severity: input.severity } : {}),
      ...(severityChanged && !incident.slaDeadline ? { slaDeadline: slaDeadlineFor(input.severity!) } : {}),
      ...(input.hazardId !== undefined ? { hazardId: input.hazardId ?? undefined } : {}),
      ...(input.primaryAssetId !== undefined ? { primaryAssetId: input.primaryAssetId ?? undefined } : {}),
    },
  });

  await recordAudit({
    userId: user.id,
    action: AuditActions.INCIDENT_UPDATED,
    entityType: 'INCIDENT',
    entityId: incident.id,
    metadata: { incidentCode: incident.incidentCode, fields: Object.keys(input) },
  });
  return updated;
}

export async function updateIncidentStatus(
  idOrCode: string,
  status: 'NEW' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED',
  note: string | undefined,
  user: AuthUser,
) {
  const incident = await prisma.incident.findFirst({ where: { OR: [{ id: idOrCode }, { incidentCode: idOrCode }] } });
  if (!incident) throw Errors.notFound('Incident', idOrCode);

  if (!canTransition(INCIDENT_TRANSITIONS, incident.status, status)) {
    throw Errors.businessRule(
      'INVALID_STATUS_TRANSITION',
      `Incident ${incident.incidentCode} cannot move from ${incident.status} to ${status}`,
      { allowed: INCIDENT_TRANSITIONS[incident.status] },
    );
  }

  const updated = await prisma.incident.update({
    where: { id: incident.id },
    data: {
      status,
      ...(status === 'ACKNOWLEDGED' && !incident.acknowledgedAt ? { acknowledgedAt: new Date() } : {}),
      ...(status === 'RESOLVED' ? { resolvedAt: new Date() } : {}),
    },
  });

  await recordAudit({
    userId: user.id,
    action: AuditActions.INCIDENT_STATUS_CHANGED,
    entityType: 'INCIDENT',
    entityId: incident.id,
    metadata: { incidentCode: incident.incidentCode, from: incident.status, to: status, note: note ?? null },
  });
  return updated;
}
