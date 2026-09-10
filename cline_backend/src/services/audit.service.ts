import type { Prisma } from '@prisma/client';
import { prisma, type DbClient } from '../db/prisma';
import { buildPaginated, resolvePagination } from '../utils/pagination';

/** Operationally significant actions recorded for auditability. */
export const AuditActions = {
  AUTH_LOGIN: 'AUTH_LOGIN',
  AUTH_LOGIN_FAILED: 'AUTH_LOGIN_FAILED',
  INCIDENT_VIEWED: 'INCIDENT_VIEWED',
  INCIDENT_CREATED: 'INCIDENT_CREATED',
  INCIDENT_UPDATED: 'INCIDENT_UPDATED',
  INCIDENT_STATUS_CHANGED: 'INCIDENT_STATUS_CHANGED',
  HAZARD_CREATED: 'HAZARD_CREATED',
  PIPELINE_REPORT_GENERATED: 'PIPELINE_REPORT_GENERATED',
  UNIT_ASSIGNED: 'UNIT_ASSIGNED',
  UNIT_STATUS_CHANGED: 'UNIT_STATUS_CHANGED',
  TASK_CREATED: 'TASK_CREATED',
  TASK_ACKNOWLEDGED: 'TASK_ACKNOWLEDGED',
  TASK_STARTED: 'TASK_STARTED',
  TASK_COMPLETED: 'TASK_COMPLETED',
  TASK_CANCELLED: 'TASK_CANCELLED',
  TASK_VERIFIED: 'TASK_VERIFIED',
  SIMULATION_STARTED: 'SIMULATION_STARTED',
  SIMULATION_COMPLETED: 'SIMULATION_COMPLETED',
  ASSET_UPDATED: 'ASSET_UPDATED',
  ASSET_TEAM_ASSIGNED: 'ASSET_TEAM_ASSIGNED',
  ASSET_MAINTENANCE_REQUESTED: 'ASSET_MAINTENANCE_REQUESTED',
  TRAFFIC_REROUTED: 'TRAFFIC_REROUTED',
  RESPONSE_PLAN_CREATED: 'RESPONSE_PLAN_CREATED',
  CITIZEN_REPORT_SUBMITTED: 'CITIZEN_REPORT_SUBMITTED',
  CITIZEN_REPORT_STATUS_CHANGED: 'CITIZEN_REPORT_STATUS_CHANGED',
  CITIZEN_SOS_SUBMITTED: 'CITIZEN_SOS_SUBMITTED',
} as const;

export interface AuditInput {
  userId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Best-effort audit write for non-transactional contexts (reads, etc.).
 * Failures are logged but never break the primary operation.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({ data: toAuditData(input) });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(JSON.stringify({
      level: 'error',
      scope: 'audit',
      message: 'Failed to write audit log',
      detail: err instanceof Error ? err.message : String(err),
    }));
  }
}

/**
 * Strict audit write for use INSIDE a database transaction - errors propagate
 * so the whole transaction rolls back (dispatch/task lifecycle guarantee).
 */
export async function createAudit(client: DbClient, input: AuditInput): Promise<void> {
  await client.auditLog.create({ data: toAuditData(input) });
}

function toAuditData(input: AuditInput) {
  return {
    userId: input.userId ?? undefined,
    action: input.action,
    entityType: input.entityType ?? undefined,
    entityId: input.entityId ?? undefined,
    metadata: (input.metadata ?? undefined) as unknown as Prisma.InputJsonValue,
  };
}

export interface AuditFilters {
  action?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

export async function listAudit(filters: AuditFilters) {
  const { page, limit, skip, take } = resolvePagination(filters);
  const where = {
    ...(filters.action ? { action: filters.action } : {}),
    ...(filters.entityType ? { entityType: filters.entityType } : {}),
    ...(filters.entityId ? { entityId: filters.entityId } : {}),
    ...(filters.userId ? { userId: filters.userId } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return buildPaginated(items, total, page, limit);
}
