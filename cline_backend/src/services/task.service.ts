import type { Prisma, TaskStatus } from '@prisma/client';
import { prisma } from '../db/prisma';
import { ErrorCodes, Errors } from '../utils/errors';
import { buildPaginated, resolvePagination } from '../utils/pagination';
import { minutesUntil } from '../utils/dates';
import { nextTaskCode } from '../utils/ids';
import { canTransition, TASK_TRANSITIONS } from '../utils/state';
import { ACTIVE_INCIDENT_STATUSES, ACTIVE_TASK_STATUSES, priorityToSlaHours, severityToPriority } from '../utils/risk';
import { AuditActions, createAudit } from './audit.service';
import { findIncidentByIdOrCode, findUnitByIdOrCallsign } from './lookup.service';
import type { CreateTaskInput, TaskQuery } from '../validators/task.schema';
import type { AuthUser } from '../types/auth';

/**
 * TASK + DISPATCH service. Dispatch is fully transactional: task creation,
 * unit status change, TaskStatusHistory and AuditLog either all succeed or
 * all roll back - no partial dispatch can ever remain.
 */

const taskInclude = {
  incident: { select: { id: true, incidentCode: true, title: true, severity: true, status: true } },
  asset: { select: { id: true, assetCode: true, name: true, type: true, operationalStatus: true } },
  assignedUnit: { include: { department: { select: { id: true, name: true } } } },
  assignedDepartment: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true, role: true } },
} satisfies Prisma.TaskInclude;

function toTaskDto(task: Prisma.TaskGetPayload<{ include: typeof taskInclude }>) {
  return {
    id: task.id,
    taskCode: task.taskCode,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    incident: task.incident
      ? { id: task.incident.id, incidentCode: task.incident.incidentCode, title: task.incident.title, severity: task.incident.severity, status: task.incident.status }
      : null,
    asset: task.asset,
    assignedUnit: task.assignedUnit
      ? {
          id: task.assignedUnit.id,
          callsign: task.assignedUnit.callsign,
          name: task.assignedUnit.name,
          type: task.assignedUnit.type,
          status: task.assignedUnit.status,
          departmentName: task.assignedUnit.department?.name ?? null,
        }
      : null,
    assignedDepartment: task.assignedDepartment,
    createdByName: task.createdBy?.name ?? null,
    slaDeadline: task.slaDeadline,
    slaMinutesRemaining: minutesUntil(task.slaDeadline),
    createdAt: task.createdAt,
    acknowledgedAt: task.acknowledgedAt,
    startedAt: task.startedAt,
    completedAt: task.completedAt,
    verifiedAt: task.verifiedAt,
    updatedAt: task.updatedAt,
  };
}

export async function listTasks(query: TaskQuery) {
  const { page, limit, skip, take } = resolvePagination(query);
  const where: Prisma.TaskWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.priority ? { priority: query.priority } : {}),
    ...(query.incidentId ? { incidentId: query.incidentId } : {}),
    ...(query.assignedUnitId ? { assignedUnitId: query.assignedUnitId } : {}),
    ...(query.assetId ? { assetId: query.assetId } : {}),
    ...(query.assignedDepartmentId ? { assignedDepartmentId: query.assignedDepartmentId } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.task.findMany({ where, orderBy: [{ createdAt: 'desc' }], skip, take, include: taskInclude }),
    prisma.task.count({ where }),
  ]);
  return buildPaginated(rows.map(toTaskDto), total, page, limit);
}

export async function getTask(idOrCode: string) {
  const task = await prisma.task.findFirst({
    where: { OR: [{ id: idOrCode }, { taskCode: idOrCode }] },
    include: {
      ...taskInclude,
      history: {
        orderBy: { createdAt: 'asc' },
        include: { changedBy: { select: { id: true, name: true, role: true } } },
      },
    },
  });
  if (!task) throw Errors.notFound('Task', idOrCode);
  return { ...toTaskDto(task), history: task.history };
}

export async function getTaskHistory(idOrCode: string) {
  const task = await prisma.task.findFirst({ where: { OR: [{ id: idOrCode }, { taskCode: idOrCode }] } });
  if (!task) throw Errors.notFound('Task', idOrCode);
  const history = await prisma.taskStatusHistory.findMany({
    where: { taskId: task.id },
    orderBy: { createdAt: 'asc' },
    include: { changedBy: { select: { id: true, name: true, role: true } } },
  });
  return { task: { id: task.id, taskCode: task.taskCode, status: task.status }, history };
}

/**
 * POST /api/incidents/:incidentId/dispatch
 * Transactional dispatch: validate -> create task -> assign unit -> history -> audit.
 */
export async function dispatchUnitToIncident(incidentKey: string, unitId: string, user: AuthUser) {
  return prisma.$transaction(async (tx) => {
    const incident = await findIncidentByIdOrCode(tx, incidentKey);
    if (!ACTIVE_INCIDENT_STATUSES.includes(incident.status)) {
      throw Errors.businessRule(
        ErrorCodes.INCIDENT_NOT_ACTIVE,
        `Incident ${incident.incidentCode} is ${incident.status} and can no longer receive dispatches`,
      );
    }

    const unit = await tx.responseUnit.findUnique({ where: { id: unitId } });
    if (!unit) throw Errors.notFound('Response unit', unitId);

    // Duplicate protection takes precedence so the operator gets the clearest
    // conflict message: this unit is ALREADY on this incident.
    const duplicate = await tx.task.findFirst({
      where: { incidentId: incident.id, assignedUnitId: unit.id, status: { in: ACTIVE_TASK_STATUSES } },
    });
    if (duplicate) {
      throw Errors.conflict(
        ErrorCodes.DUPLICATE_DISPATCH,
        `Unit ${unit.callsign} is already assigned to incident ${incident.incidentCode} (active task ${duplicate.taskCode})`,
        { existingTaskCode: duplicate.taskCode },
      );
    }

    if (unit.status !== 'AVAILABLE') {
      throw Errors.conflict(
        ErrorCodes.UNIT_NOT_AVAILABLE,
        `Response unit ${unit.callsign} is currently ${unit.status} and cannot be dispatched`,
        { unitStatus: unit.status },
      );
    }

    const taskCode = await nextTaskCode(tx);
    const priority = severityToPriority(incident.severity);
    const slaDeadline =
      incident.slaDeadline ?? new Date(Date.now() + priorityToSlaHours(priority) * 60 * 60 * 1000);

    const task = await tx.task.create({
      data: {
        taskCode,
        title: `Respond to ${incident.incidentCode}: ${incident.title}`,
        description: incident.description,
        incidentId: incident.id,
        assetId: incident.primaryAssetId ?? undefined,
        assignedUnitId: unit.id,
        assignedDepartmentId: unit.departmentId,
        createdById: user.id,
        status: 'ASSIGNED',
        priority,
        slaDeadline,
      },
    });

    await tx.taskStatusHistory.create({
      data: {
        taskId: task.id,
        fromStatus: null,
        toStatus: 'ASSIGNED',
        changedById: user.id,
        note: `Dispatched ${unit.callsign} to ${incident.incidentCode}`,
      },
    });

    await tx.responseUnit.update({ where: { id: unit.id }, data: { status: 'ASSIGNED' } });

    // First dispatch acknowledges a NEW incident (backend-initiated, valid transition).
    let incidentStatus = incident.status;
    if (incident.status === 'NEW') {
      incidentStatus = 'ACKNOWLEDGED';
      await tx.incident.update({
        where: { id: incident.id },
        data: { status: 'ACKNOWLEDGED', acknowledgedAt: incident.acknowledgedAt ?? new Date() },
      });
    }

    await createAudit(tx, {
      userId: user.id,
      action: AuditActions.TASK_CREATED,
      entityType: 'TASK',
      entityId: task.id,
      metadata: { taskCode, incidentCode: incident.incidentCode, unit: unit.callsign, priority },
    });
    await createAudit(tx, {
      userId: user.id,
      action: AuditActions.UNIT_ASSIGNED,
      entityType: 'RESPONSE_UNIT',
      entityId: unit.id,
      metadata: { taskCode, incidentCode: incident.incidentCode },
    });

    return {
      task: { id: task.id, taskCode: task.taskCode, incidentId: incident.id, incidentCode: incident.incidentCode, unitId: unit.id, unitCallsign: unit.callsign, status: task.status, priority: task.priority, slaDeadline: task.slaDeadline },
      incident: { id: incident.id, incidentCode: incident.incidentCode, status: incidentStatus },
      unit: { id: unit.id, callsign: unit.callsign, status: 'ASSIGNED' },
    };
  });
}

/** Manual task creation (asset maintenance, pre-incident tasking, etc.). */
export async function createTask(input: CreateTaskInput, user: AuthUser) {
  return prisma.$transaction(async (tx) => {
    let incident: Awaited<ReturnType<typeof findIncidentByIdOrCode>> | null = null;
    if (input.incidentId) {
      incident = await findIncidentByIdOrCode(tx, input.incidentId);
      if (!ACTIVE_INCIDENT_STATUSES.includes(incident.status)) {
        throw Errors.businessRule(ErrorCodes.INCIDENT_NOT_ACTIVE, `Incident ${incident.incidentCode} is ${incident.status}`);
      }
    }

    let assetId = input.assetId ?? incident?.primaryAssetId ?? undefined;
    if (input.assetId) {
      const asset = await tx.infrastructureAsset.findFirst({ where: { OR: [{ id: input.assetId }, { assetCode: input.assetId }] } });
      if (!asset) throw Errors.notFound('Infrastructure asset', input.assetId);
      assetId = asset.id;
    }

    let unit: { id: string; callsign: string; departmentId: string } | null = null;
    if (input.assignedUnitId) {
      const found = await findUnitByIdOrCallsign(tx, input.assignedUnitId);
      if (found.status !== 'AVAILABLE') {
        throw Errors.conflict(ErrorCodes.UNIT_NOT_AVAILABLE, `Response unit ${found.callsign} is currently ${found.status}`);
      }
      unit = { id: found.id, callsign: found.callsign, departmentId: found.departmentId };
    }

    if (input.assignedDepartmentId) {
      const dept = await tx.department.findFirst({ where: { OR: [{ id: input.assignedDepartmentId }, { code: input.assignedDepartmentId }] } });
      if (!dept) throw Errors.notFound('Department', input.assignedDepartmentId);
    }

    const taskCode = await nextTaskCode(tx);
    const priority = input.priority ?? (incident ? severityToPriority(incident.severity) : 'MEDIUM');
    const slaDeadline =
      input.slaDeadline ?? incident?.slaDeadline ?? new Date(Date.now() + priorityToSlaHours(priority) * 60 * 60 * 1000);

    const task = await tx.task.create({
      data: {
        taskCode,
        title: input.title,
        description: input.description,
        incidentId: incident?.id,
        assetId,
        assignedUnitId: unit?.id,
        assignedDepartmentId: input.assignedDepartmentId ?? unit?.departmentId,
        createdById: user.id,
        status: 'ASSIGNED',
        priority,
        slaDeadline,
      },
    });

    await tx.taskStatusHistory.create({
      data: { taskId: task.id, fromStatus: null, toStatus: 'ASSIGNED', changedById: user.id, note: 'Task created' },
    });

    if (unit) {
      await tx.responseUnit.update({ where: { id: unit.id }, data: { status: 'ASSIGNED' } });
      await createAudit(tx, {
        userId: user.id, action: AuditActions.UNIT_ASSIGNED, entityType: 'RESPONSE_UNIT', entityId: unit.id,
        metadata: { taskCode, incidentCode: incident?.incidentCode ?? null },
      });
    }
    await createAudit(tx, {
      userId: user.id, action: AuditActions.TASK_CREATED, entityType: 'TASK', entityId: task.id,
      metadata: { taskCode, incidentCode: incident?.incidentCode ?? null, priority },
    });
    return task;
  });
}

/** PATCH /api/tasks/:id/status - validated lifecycle transition. */
export async function updateTaskStatus(taskKey: string, status: TaskStatus, note: string | undefined, user: AuthUser) {
  return prisma.$transaction(async (tx) => {
    const task = await tx.task.findFirst({ where: { OR: [{ id: taskKey }, { taskCode: taskKey }] } });
    if (!task) throw Errors.notFound('Task', taskKey);

    if (!canTransition(TASK_TRANSITIONS, task.status, status)) {
      throw Errors.businessRule(
        ErrorCodes.INVALID_STATUS_TRANSITION,
        `Task ${task.taskCode} cannot move from ${task.status} to ${status}`,
        { allowed: TASK_TRANSITIONS[task.status] },
      );
    }

    const updated = await tx.task.update({
      where: { id: task.id },
      data: {
        status,
        ...(status === 'ACKNOWLEDGED' && !task.acknowledgedAt ? { acknowledgedAt: new Date() } : {}),
        ...(status === 'IN_PROGRESS' && !task.startedAt ? { startedAt: new Date() } : {}),
        ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
      },
    });

    await tx.taskStatusHistory.create({
      data: { taskId: task.id, fromStatus: task.status, toStatus: status, changedById: user.id, note: note ?? null },
    });

    // Release the unit when the task reaches a terminal state.
    if ((status === 'COMPLETED' || status === 'CANCELLED') && task.assignedUnitId) {
      const stillActive = await tx.task.count({
        where: { assignedUnitId: task.assignedUnitId, status: { in: ACTIVE_TASK_STATUSES }, id: { not: task.id } },
      });
      if (stillActive === 0) {
        await tx.responseUnit.update({ where: { id: task.assignedUnitId }, data: { status: 'AVAILABLE' } });
      }
    }

    const action =
      status === 'ACKNOWLEDGED' ? AuditActions.TASK_ACKNOWLEDGED
      : status === 'IN_PROGRESS' ? AuditActions.TASK_STARTED
      : status === 'COMPLETED' ? AuditActions.TASK_COMPLETED
      : AuditActions.TASK_CANCELLED;
    await createAudit(tx, {
      userId: user.id, action, entityType: 'TASK', entityId: task.id,
      metadata: {
        taskCode: task.taskCode,
        from: task.status,
        to: status,
        note: note ?? null,
        // Batch 3: explicit oldState/newState for audit trail completeness
        oldState: task.status,
        newState: status,
      },
    });

    return updated;
  });
}

/** POST /api/tasks/:id/assign - attach a unit to an unassigned task. */
export async function assignUnitToTask(taskKey: string, unitId: string, user: AuthUser) {
  return prisma.$transaction(async (tx) => {
    const task = await tx.task.findFirst({ where: { OR: [{ id: taskKey }, { taskCode: taskKey }] } });
    if (!task) throw Errors.notFound('Task', taskKey);
    if (task.assignedUnitId) {
      throw Errors.conflict(ErrorCodes.TASK_ALREADY_ASSIGNED, `Task ${task.taskCode} already has an assigned unit`);
    }
    if (!ACTIVE_TASK_STATUSES.includes(task.status)) {
      throw Errors.businessRule('TASK_NOT_ACTIVE', `Task ${task.taskCode} is ${task.status} and cannot receive units`);
    }

    const unit = await findUnitByIdOrCallsign(tx, unitId);
    if (unit.status !== 'AVAILABLE') {
      throw Errors.conflict(ErrorCodes.UNIT_NOT_AVAILABLE, `Response unit ${unit.callsign} is currently ${unit.status}`);
    }

    const updated = await tx.task.update({
      where: { id: task.id },
      data: { assignedUnitId: unit.id, assignedDepartmentId: unit.departmentId },
    });
    await tx.responseUnit.update({ where: { id: unit.id }, data: { status: 'ASSIGNED' } });
    await createAudit(tx, {
      userId: user.id, action: AuditActions.UNIT_ASSIGNED, entityType: 'RESPONSE_UNIT', entityId: unit.id,
      metadata: { taskCode: task.taskCode },
    });
    return updated;
  });
}

/** POST /api/tasks/:id/verify - Government verification of completed work. */
export async function verifyTask(taskKey: string, note: string | undefined, user: AuthUser) {
  return prisma.$transaction(async (tx) => {
    const task = await tx.task.findFirst({ where: { OR: [{ id: taskKey }, { taskCode: taskKey }] } });
    if (!task) throw Errors.notFound('Task', taskKey);
    if (task.status !== 'COMPLETED') {
      throw Errors.businessRule(ErrorCodes.TASK_NOT_COMPLETED, `Only COMPLETED tasks can be verified (current: ${task.status})`);
    }
    if (task.verifiedAt) {
      throw Errors.conflict(ErrorCodes.TASK_ALREADY_VERIFIED, `Task ${task.taskCode} was already verified`);
    }

    const updated = await tx.task.update({ where: { id: task.id }, data: { verifiedAt: new Date() } });
    await createAudit(tx, {
      userId: user.id, action: AuditActions.TASK_VERIFIED, entityType: 'TASK', entityId: task.id,
      metadata: { taskCode: task.taskCode, note: note ?? null },
    });
    return updated;
  });
}
