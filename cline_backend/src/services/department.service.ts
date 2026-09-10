import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { Errors } from '../utils/errors';
import { buildPaginated, resolvePagination } from '../utils/pagination';
import { daysAgo } from '../utils/dates';
import { ACTIVE_TASK_STATUSES } from '../utils/risk';
import { findDepartmentByIdOrCode } from './lookup.service';

export async function listDepartments(query: { type?: string; page?: number; limit?: number }) {
  const { page, limit, skip, take } = resolvePagination(query);
  const where: Prisma.DepartmentWhereInput = query.type ? { type: query.type as never } : {};
  const [rows, total, unitCounts, activeTaskCounts] = await Promise.all([
    prisma.department.findMany({ where, orderBy: { name: 'asc' }, skip, take }),
    prisma.department.count({ where }),
    prisma.responseUnit.groupBy({ by: ['departmentId'], _count: { _all: true } }),
    prisma.task.groupBy({ by: ['assignedDepartmentId'], where: { status: { in: ACTIVE_TASK_STATUSES } }, _count: { _all: true } }),
  ]);
  const unitCountByDept = new Map(unitCounts.map((g) => [g.departmentId, g._count._all]));
  const taskCountByDept = new Map(activeTaskCounts.map((g) => [g.assignedDepartmentId, g._count._all]));
  const items = rows.map((d) => ({
    ...d,
    unitCount: unitCountByDept.get(d.id) ?? 0,
    activeTaskCount: taskCountByDept.get(d.id) ?? 0,
  }));
  return buildPaginated(items, total, page, limit);
}

export async function getDepartment(idOrCode: string) {
  const department = await prisma.department.findFirst({
    where: { OR: [{ id: idOrCode }, { code: idOrCode }] },
    include: {
      users: { select: { id: true, name: true, email: true, role: true, isActive: true } },
      _count: { select: { units: true, tasks: true } },
    },
  });
  if (!department) throw Errors.notFound('Department', idOrCode);
  return department;
}

export async function getDepartmentUnits(
  idOrCode: string,
  query: { status?: string; page?: number; limit?: number },
) {
  const department = await findDepartmentByIdOrCode(prisma, idOrCode);
  const { page, limit, skip, take } = resolvePagination(query);
  const where: Prisma.ResponseUnitWhereInput = {
    departmentId: department.id,
    ...(query.status ? { status: query.status as never } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.responseUnit.findMany({ where, orderBy: { callsign: 'asc' }, skip, take }),
    prisma.responseUnit.count({ where }),
  ]);
  return buildPaginated(rows, total, page, limit);
}

export async function getDepartmentReadiness(idOrCode: string) {
  const department = await findDepartmentByIdOrCode(prisma, idOrCode);
  const [units, activeTasks, completedRecent] = await Promise.all([
    prisma.responseUnit.findMany({ where: { departmentId: department.id }, select: { status: true } }),
    prisma.task.count({ where: { assignedDepartmentId: department.id, status: { in: ACTIVE_TASK_STATUSES } } }),
    prisma.task.findMany({
      where: { assignedDepartmentId: department.id, status: 'COMPLETED', completedAt: { gte: daysAgo(30) }, startedAt: { not: null } },
      select: { startedAt: true, completedAt: true, slaDeadline: true },
    }),
  ]);

  const available = units.filter((u) => u.status === 'AVAILABLE').length;
  const deployed = units.filter((u) => ['ASSIGNED', 'EN_ROUTE', 'ON_SCENE'].includes(u.status)).length;
  const offline = units.filter((u) => u.status === 'OFFLINE').length;
  const busy = units.filter((u) => u.status === 'BUSY').length;
  const deployable = units.length - offline;

  const completionMinutes = completedRecent.map((t) => (t.completedAt!.getTime() - t.startedAt!.getTime()) / 60000);
  const avgCompletionMinutes = completionMinutes.length
    ? Math.round(completionMinutes.reduce((a, b) => a + b, 0) / completionMinutes.length)
    : null;
  const withSla = completedRecent.filter((t) => t.slaDeadline);
  const slaCompliancePercent = withSla.length
    ? Math.round((withSla.filter((t) => t.completedAt! <= t.slaDeadline!).length / withSla.length) * 100)
    : null;

  return {
    department: { id: department.id, name: department.name, code: department.code, type: department.type, status: department.status },
    fleet: {
      totalUnits: units.length,
      available,
      deployed,
      busy,
      offline,
      utilizationPercent: deployable > 0 ? Math.round((deployed / deployable) * 100) : 0,
      readinessPercent: deployable > 0 ? Math.round((available / deployable) * 100) : 0,
    },
    workload: {
      activeTasks,
      completedTasks30d: completedRecent.length,
      avgCompletionMinutes,
      slaCompliancePercent,
    },
    posture:
      available === 0
        ? 'SATURATED - no available units; request mutual aid'
        : deployed > available
          ? 'HIGH_DEMAND - deployment exceeds reserve'
          : 'READY',
  };
}
