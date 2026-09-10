import type { Criticality, IncidentStatus, Priority, Severity, TaskStatus } from '@prisma/client';

/**
 * Transparent, deterministic risk weights.
 * The full formula lives in services/risk.service.ts - no AI/LLM involved.
 */
export const SEVERITY_WEIGHTS: Record<Severity, number> = {
  LOW: 0.25,
  MODERATE: 0.5,
  HIGH: 0.75,
  CRITICAL: 1.0,
};

export const CRITICALITY_WEIGHTS: Record<Criticality, number> = {
  LOW: 0.3,
  MEDIUM: 0.55,
  HIGH: 0.8,
  CRITICAL: 1.0,
};

/** Share of zone population considered exposed, by hazard severity. */
export const EXPOSURE_BY_SEVERITY: Record<Severity, number> = {
  CRITICAL: 0.55,
  HIGH: 0.35,
  MODERATE: 0.18,
  LOW: 0.08,
};

export type RiskBucket = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

/** Maps a 0-100 risk score to a bucket. */
export function riskLevelFromScore(score: number): RiskBucket {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MODERATE';
  return 'LOW';
}

export function severityToPriority(severity: Severity): Priority {
  if (severity === 'CRITICAL') return 'CRITICAL';
  if (severity === 'HIGH') return 'HIGH';
  if (severity === 'MODERATE') return 'MEDIUM';
  return 'LOW';
}

export function priorityToSlaHours(priority: Priority): number {
  if (priority === 'CRITICAL') return 2;
  if (priority === 'HIGH') return 4;
  if (priority === 'MEDIUM') return 8;
  return 24;
}

export const ACTIVE_INCIDENT_STATUSES: IncidentStatus[] = ['NEW', 'ACKNOWLEDGED', 'IN_PROGRESS'];
export const ACTIVE_TASK_STATUSES: TaskStatus[] = ['ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS'];
export const DEPLOYED_UNIT_STATUSES = ['ASSIGNED', 'EN_ROUTE', 'ON_SCENE'] as const;
