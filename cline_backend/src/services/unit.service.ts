import type { Prisma, UnitStatus } from '@prisma/client';
import { prisma } from '../db/prisma';
import { ErrorCodes, Errors } from '../utils/errors';
import { buildPaginated, resolvePagination } from '../utils/pagination';
import { canTransition, UNIT_TRANSITIONS } from '../utils/state';
import { ACTIVE_TASK_STATUSES } from '../utils/risk';
import { AuditActions, createAudit } from './audit.service';
import type { AuthUser } from '../types/auth';

export interface UnitQuery {
  status?: UnitStatus;
  type?: string;
  departmentId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function listUnits(query: UnitQuery) {
  const { page, limit, skip, take } = resolvePagination(query);
  const where: Prisma.ResponseUnitWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.type ? { type: query.type as never } : {}),
    ...(query.departmentId ? { departmentId: query.departmentId } : {}),
    ...(query.search
      ? { OR: [{ name: { contains: query.search, mode: 'insensitive' } }, { callsign: { contains: query.search, mode: 'insensitive' } }] }
      : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.responseUnit.findMany({
      where,
      orderBy: { callsign: 'asc' },
      skip,
      take,
      include: {
        department: { select: { id: true, name: true, code: true } },
        tasks: { where: { status: { in: ACTIVE_TASK_STATUSES } }, select: { id: true, taskCode: true, status: true, incidentId: true } },
      },
    }),
    prisma.responseUnit.count({ where }),
  ]);
  const items = rows.map((u) => ({
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
    latitude: u.latitude,
    longitude: u.longitude,
    activeTasks: u.tasks,
  }));
  return buildPaginated(items, total, page, limit);
}

export async function getUnit(idOrCode: string) {
  const unit = await prisma.responseUnit.findFirst({
    where: { OR: [{ id: idOrCode }, { callsign: idOrCode }] },
    include: {
      department: { select: { id: true, name: true, code: true } },
      tasks: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { incident: { select: { incidentCode: true, title: true, severity: true } } },
      },
    },
  });
  if (!unit) throw Errors.notFound('Response unit', idOrCode);
  return unit;
}

export async function updateUnitStatus(idOrCode: string, status: UnitStatus, note: string | undefined, user: AuthUser) {
  return prisma.$transaction(async (tx) => {
    const unit = await tx.responseUnit.findFirst({ where: { OR: [{ id: idOrCode }, { callsign: idOrCode }] } });
    if (!unit) throw Errors.notFound('Response unit', idOrCode);

    if (!canTransition(UNIT_TRANSITIONS, unit.status, status)) {
      throw Errors.businessRule(
        ErrorCodes.INVALID_STATUS_TRANSITION,
        `Unit ${unit.callsign} cannot move from ${unit.status} to ${status}`,
        { allowed: UNIT_TRANSITIONS[unit.status] },
      );
    }

    const updated = await tx.responseUnit.update({ where: { id: unit.id }, data: { status } });
    await createAudit(tx, {
      userId: user.id,
      action: AuditActions.UNIT_STATUS_CHANGED,
      entityType: 'RESPONSE_UNIT',
      entityId: unit.id,
      metadata: {
        callsign: unit.callsign,
        from: unit.status,
        to: status,
        note: note ?? null,
        // Batch 3: explicit oldState/newState for audit trail completeness
        oldState: unit.status,
        newState: status,
      },
    });
    return updated;
  });
}
