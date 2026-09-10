import type { DbClient } from '../db/prisma';

const pad = (n: number, width: number) => String(n).padStart(width, '0');

function suffix(code: string): number {
  const match = code.match(/(\d+)\s*$/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Generates the next sequential human-readable code (INC-205, TASK-005, ...).
 * Scans existing codes for the numeric maximum so codes stay stable and
 * collision-free regardless of insertion order.
 */
export function nextCode(prefix: string, lastCode: string | null | undefined, width = 3): string {
  return `${prefix}-${pad(suffix(lastCode ?? '') + 1, width)}`;
}

export async function nextIncidentCode(client: DbClient): Promise<string> {
  const rows = await client.incident.findMany({ select: { incidentCode: true } });
  const max = rows.reduce((m, r) => Math.max(m, suffix(r.incidentCode)), 0);
  return `INC-${pad(max + 1, 3)}`;
}

export async function nextTaskCode(client: DbClient): Promise<string> {
  const rows = await client.task.findMany({ select: { taskCode: true } });
  const max = rows.reduce((m, r) => Math.max(m, suffix(r.taskCode)), 0);
  return `TASK-${pad(max + 1, 3)}`;
}

export async function nextCitizenReportCode(client: DbClient): Promise<string> {
  const rows = await client.citizenReport.findMany({ select: { reportCode: true } });
  const max = rows.reduce((m, r) => Math.max(m, suffix(r.reportCode)), 0);
  return `CR-${pad(max + 1, 3)}`;
}

export async function nextSosCode(client: DbClient): Promise<string> {
  const rows = await client.sosEvent.findMany({ select: { sosCode: true } });
  const max = rows.reduce((m, r) => Math.max(m, suffix(r.sosCode)), 0);
  return `SOS-${pad(max + 1, 3)}`;
}
