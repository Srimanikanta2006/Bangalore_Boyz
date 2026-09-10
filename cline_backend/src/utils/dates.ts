import type { Severity } from '@prisma/client';

/** Municipal SLA policy: hours allowed to resolve an incident by severity. */
export const SLA_HOURS_BY_SEVERITY: Record<Severity, number> = {
  CRITICAL: 2,
  HIGH: 4,
  MODERATE: 8,
  LOW: 24,
};

export function slaDeadlineFor(severity: Severity, from: Date = new Date()): Date {
  return new Date(from.getTime() + SLA_HOURS_BY_SEVERITY[severity] * 60 * 60 * 1000);
}

/** Whole minutes between two dates (b - a). */
export function minutesBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 60000);
}

/** Minutes until a deadline (negative = overdue). Null when no deadline. */
export function minutesUntil(deadline: Date | null | undefined): number | null {
  if (!deadline) return null;
  return Math.round((deadline.getTime() - Date.now()) / 60000);
}

export function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

export function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}
