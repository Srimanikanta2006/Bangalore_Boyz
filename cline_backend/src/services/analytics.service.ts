import { prisma } from '../db/prisma';
import { daysAgo } from '../utils/dates';
import { ACTIVE_INCIDENT_STATUSES, ACTIVE_TASK_STATUSES } from '../utils/risk';

/** ANALYTICS - all aggregates computed in the backend from PostgreSQL. */

function groupCount<T>(rows: T[], key: (row: T) => string): { key: string; count: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const k = key(row);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()].map(([k, count]) => ({ key: k, count })).sort((a, b) => b.count - a.count);
}

export async function getAnalyticsOverview() {
  const [incidents14d, activeIncidents, completedTasks, allTasks, units, historicalEvents, hotspots, assets, departments] =
    await Promise.all([
      prisma.incident.findMany({ where: { createdAt: { gte: daysAgo(14) } }, select: { createdAt: true, severity: true } }),
      prisma.incident.findMany({ where: { status: { in: ACTIVE_INCIDENT_STATUSES } }, select: { severity: true } }),
      prisma.task.findMany({
        where: { status: 'COMPLETED', completedAt: { not: null }, startedAt: { not: null } },
        select: { startedAt: true, completedAt: true, slaDeadline: true, assignedDepartmentId: true },
      }),
      prisma.task.findMany({
        select: { status: true, priority: true, assignedDepartmentId: true, acknowledgedAt: true, createdAt: true },
      }),
      prisma.responseUnit.findMany({ select: { status: true, type: true, departmentId: true } }),
      prisma.historicalEvent.findMany({ select: { hazardType: true, zoneId: true, assetId: true, occurredAt: true } }),
      prisma.hotspot.findMany({ include: { zone: { select: { name: true } } }, orderBy: { recurrenceScore: 'desc' }, take: 5 }),
      prisma.infrastructureAsset.findMany({ select: { id: true, type: true, operationalStatus: true } }),
      prisma.department.findMany({ select: { id: true, name: true, code: true } }),
    ]);

  // --- incident trends (14 daily buckets) ---
  const buckets: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    d.setHours(0, 0, 0, 0);
    buckets.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }
  for (const incident of incidents14d) {
    const key = incident.createdAt.toISOString().slice(0, 10);
    const bucket = buckets.find((b) => b.date === key);
    if (bucket) bucket.count++;
  }

  // --- response performance ---
  const ackMinutes = allTasks
    .filter((t) => t.acknowledgedAt)
    .map((t) => (t.acknowledgedAt!.getTime() - t.createdAt.getTime()) / 60000);
  const avgResponseMinutes = ackMinutes.length
    ? Math.round(ackMinutes.reduce((a, b) => a + b, 0) / ackMinutes.length)
    : null;
  const completionMinutes = completedTasks.map((t) => (t.completedAt!.getTime() - t.startedAt!.getTime()) / 60000);
  const avgCompletionMinutes = completionMinutes.length
    ? Math.round(completionMinutes.reduce((a, b) => a + b, 0) / completionMinutes.length)
    : null;
  const withSla = completedTasks.filter((t) => t.slaDeadline);
  const slaCompliancePercent = withSla.length
    ? Math.round((withSla.filter((t) => t.completedAt! <= t.slaDeadline!).length / withSla.length) * 100)
    : null;

  // --- severity distribution ---
  const incidentsBySeverity = groupCount(activeIncidents, (i) => i.severity);

  // --- infrastructure failures ---
  const assetById = new Map(assets.map((a) => [a.id, a]));
  const failuresByAssetType = groupCount(
    historicalEvents.filter((e) => e.assetId && assetById.has(e.assetId)),
    (e) => assetById.get(e.assetId!)!.type,
  );
  const nonOperationalByType = groupCount(
    assets.filter((a) => a.operationalStatus !== 'OPERATIONAL'),
    (a) => a.type,
  );

  // --- hazard frequency ---
  const historicalByHazardType = groupCount(historicalEvents, (e) => e.hazardType);

  // --- department performance ---
  const deptName = new Map(departments.map((d) => [d.id, d.name]));
  const departmentPerformance = departments.map((dept) => {
    const deptUnits = units.filter((u) => u.departmentId === dept.id);
    const deptTasks = allTasks.filter((t) => t.assignedDepartmentId === dept.id);
    const deptCompleted = completedTasks.filter((t) => t.assignedDepartmentId === dept.id);
    const deptCompletionMinutes = deptCompleted.map((t) => (t.completedAt!.getTime() - t.startedAt!.getTime()) / 60000);
    return {
      departmentId: dept.id,
      departmentName: deptName.get(dept.id) ?? dept.name,
      totalUnits: deptUnits.length,
      availableUnits: deptUnits.filter((u) => u.status === 'AVAILABLE').length,
      deployedUnits: deptUnits.filter((u) => ['ASSIGNED', 'EN_ROUTE', 'ON_SCENE'].includes(u.status)).length,
      totalTasks: deptTasks.length,
      activeTasks: deptTasks.filter((t) => ACTIVE_TASK_STATUSES.includes(t.status)).length,
      completedTasks: deptCompleted.length,
      avgCompletionMinutes: deptCompletionMinutes.length
        ? Math.round(deptCompletionMinutes.reduce((a, b) => a + b, 0) / deptCompletionMinutes.length)
        : null,
    };
  });

  // --- resource utilization ---
  const unitsByStatus = groupCount(units, (u) => u.status);
  const deployed = units.filter((u) => ['ASSIGNED', 'EN_ROUTE', 'ON_SCENE'].includes(u.status)).length;
  const utilizationPercent = units.length ? Math.round((deployed / units.length) * 100) : 0;

  return {
    dataQuality: 'SYNTHETIC_DEMO',
    incidentTrends: buckets,
    totalIncidents14d: incidents14d.length,
    responsePerformance: { avgResponseMinutes, avgCompletionMinutes, slaCompliancePercent },
    incidentsBySeverity,
    infrastructureFailures: { failuresByAssetType, nonOperationalByType, historicalEventCount: historicalEvents.length },
    hazardFrequency: { historicalByHazardType },
    hotspotRecurrence: hotspots.map((h) => ({
      id: h.id, name: h.name, zoneName: h.zone?.name ?? null, hazardType: h.hazardType,
      eventCount: h.eventCount, recurrenceScore: h.recurrenceScore, lastOccurredAt: h.lastOccurredAt,
    })),
    departmentPerformance,
    resourceUtilization: { unitsByStatus, deployed, totalUnits: units.length, utilizationPercent },
  };
}
