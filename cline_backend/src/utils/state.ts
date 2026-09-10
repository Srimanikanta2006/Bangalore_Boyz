import type { IncidentStatus, TaskStatus, UnitStatus } from '@prisma/client';

/**
 * Backend-owned state machines. The frontend can never bypass these -
 * every transition is validated here and recorded in TaskStatusHistory /
 * AuditLog where operationally relevant.
 */

export const TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  ASSIGNED: ['ACKNOWLEDGED', 'CANCELLED'],
  ACKNOWLEDGED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: ['CANCELLED'],
  CANCELLED: [],
};

export const INCIDENT_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  NEW: ['ACKNOWLEDGED', 'IN_PROGRESS'],
  ACKNOWLEDGED: ['IN_PROGRESS', 'RESOLVED'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
};

export const UNIT_TRANSITIONS: Record<UnitStatus, UnitStatus[]> = {
  AVAILABLE: ['ASSIGNED', 'EN_ROUTE', 'ON_SCENE', 'BUSY', 'OFFLINE'],
  ASSIGNED: ['EN_ROUTE', 'ON_SCENE', 'AVAILABLE', 'BUSY', 'OFFLINE'],
  EN_ROUTE: ['ON_SCENE', 'AVAILABLE', 'BUSY', 'OFFLINE'],
  ON_SCENE: ['AVAILABLE', 'ASSIGNED', 'BUSY', 'OFFLINE'],
  BUSY: ['AVAILABLE', 'OFFLINE'],
  OFFLINE: ['AVAILABLE'],
};

export function canTransition<S extends string>(
  map: Record<S, S[]>,
  from: S,
  to: S,
): boolean {
  return (map[from] ?? []).includes(to);
}
