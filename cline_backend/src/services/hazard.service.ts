import type { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { Errors } from '../utils/errors';
import { buildPaginated, resolvePagination } from '../utils/pagination';
import { AuditActions, recordAudit } from './audit.service';
import type { AuthUser } from '../types/auth';

export interface HazardQuery {
  type?: string;
  severity?: string;
  status?: string;
  zoneId?: string;
  activeOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateHazardInput {
  type: string;
  severity: string;
  zoneId: string;
  rainfallRate?: number;
  waterDepth?: number;
  flowVelocity?: number;
  temperature?: number;
  windSpeed?: number;
  durationMinutes?: number;
  source?: string;
  startedAt?: Date;
}

export async function listHazards(query: HazardQuery) {
  const { page, limit, skip, take } = resolvePagination(query);
  const where: Prisma.HazardWhereInput = {
    ...(query.type ? { type: query.type as never } : {}),
    ...(query.severity ? { severity: query.severity as never } : {}),
    ...(query.status ? { status: query.status as never } : {}),
    ...(query.zoneId ? { zoneId: query.zoneId } : {}),
    ...(query.activeOnly ? { status: 'ACTIVE' } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.hazard.findMany({
      where,
      orderBy: [{ startedAt: 'desc' }],
      skip,
      take,
      include: { zone: { select: { id: true, name: true, code: true } }, _count: { select: { incidents: true } } },
    }),
    prisma.hazard.count({ where }),
  ]);
  const items = rows.map((h) => ({
    id: h.id,
    type: h.type,
    severity: h.severity,
    status: h.status,
    zone: h.zone,
    rainfallRate: h.rainfallRate,
    waterDepth: h.waterDepth,
    flowVelocity: h.flowVelocity,
    temperature: h.temperature,
    windSpeed: h.windSpeed,
    durationMinutes: h.durationMinutes,
    source: h.source,
    startedAt: h.startedAt,
    endedAt: h.endedAt,
    incidentCount: h._count.incidents,
  }));
  return buildPaginated(items, total, page, limit);
}

export async function getHazard(id: string) {
  const hazard = await prisma.hazard.findUnique({
    where: { id },
    include: {
      zone: true,
      incidents: { select: { id: true, incidentCode: true, title: true, severity: true, status: true } },
      riskScores: { orderBy: { calculatedAt: 'desc' }, take: 10 },
    },
  });
  if (!hazard) throw Errors.notFound('Hazard', id);
  return hazard;
}

export async function createHazard(input: CreateHazardInput, user: AuthUser) {
  const zone = await prisma.zone.findUnique({ where: { id: input.zoneId } });
  if (!zone) throw Errors.notFound('Zone', input.zoneId);
  const hazard = await prisma.hazard.create({
    data: {
      type: input.type as never,
      severity: input.severity as never,
      zoneId: zone.id,
      rainfallRate: input.rainfallRate,
      waterDepth: input.waterDepth,
      flowVelocity: input.flowVelocity,
      temperature: input.temperature,
      windSpeed: input.windSpeed,
      durationMinutes: input.durationMinutes,
      source: (input.source ?? 'OPERATOR') as never,
      startedAt: input.startedAt ?? new Date(),
      status: 'ACTIVE',
    },
    include: { zone: { select: { name: true } } },
  });
  await recordAudit({
    userId: user.id,
    action: AuditActions.HAZARD_CREATED,
    entityType: 'HAZARD',
    entityId: hazard.id,
    metadata: { type: hazard.type, severity: hazard.severity, zone: zone.name },
  });
  return hazard;
}
