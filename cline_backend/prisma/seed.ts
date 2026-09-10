import { prisma } from '../src/db/prisma';
import { env } from '../src/config/env';
import { hashPassword } from '../src/services/auth.service';
import { assessAssetRisk, persistRiskScore } from '../src/services/risk.service';
import { getIncidentCascade, persistCascadeEvents } from '../src/services/cascade.service';
import { runSimulation } from '../src/services/simulator.service';
import * as data from './seed-data';
import type { Hazard } from '@prisma/client';

/**
 * ClimateShield seed - SYNTHETIC DEMO data for the Government Command Center.
 * Idempotent: wipes child-first, then recreates the full demo state.
 * Risk scores, cascade events and the seeded simulation are computed through
 * the REAL service layer so seeded numbers always match live API behavior.
 */

async function wipe(): Promise<void> {
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.cascadeEvent.deleteMany();
  await prisma.riskScore.deleteMany();
  await prisma.taskStatusHistory.deleteMany();
  await prisma.task.deleteMany();
  await prisma.telemetryReading.deleteMany();
  await prisma.simulationResult.deleteMany();
  await prisma.simulation.deleteMany();
  await prisma.historicalEvent.deleteMany();
  await prisma.hotspot.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.hazard.deleteMany();
  await prisma.dependencyEdge.deleteMany();
  await prisma.responseUnit.deleteMany();
  await prisma.infrastructureAsset.deleteMany();
  await prisma.user.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.department.deleteMany();
}

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('[seed] Wiping existing data...');
  await wipe();

  // eslint-disable-next-line no-console
  console.log('[seed] Creating departments, zones, users...');
  for (const d of data.departments) {
    await prisma.department.create({ data: { ...d, type: d.type as never, status: d.status as never } });
  }
  for (const z of data.zones) {
    await prisma.zone.create({
      data: {
        id: z.id, name: z.name, code: z.code, description: z.description,
        latitude: z.latitude, longitude: z.longitude, riskLevel: z.riskLevel as never,
        population: z.population, boundaryGeoJson: z.boundaryGeoJson as never,
      },
    });
  }
  const passwordHash = await hashPassword(env.DEMO_USER_PASSWORD);
  for (const u of data.users) {
    await prisma.user.create({
      data: {
        id: u.id, name: u.name, email: u.email, passwordHash,
        role: u.role as never, departmentId: u.departmentId, phone: u.phone,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log('[seed] Creating infrastructure assets, hazards, dependency graph...');
  for (const a of data.assets) {
    await prisma.infrastructureAsset.create({
      data: {
        id: a.id, assetCode: a.assetCode, name: a.name, type: a.type as never,
        zoneId: a.zoneId, latitude: a.latitude, longitude: a.longitude,
        criticality: a.criticality as never, vulnerability: a.vulnerability,
        operationalStatus: a.operationalStatus as never, description: a.description,
        metadata: a.metadata as never,
      },
    });
  }
  for (const h of data.hazards) {
    await prisma.hazard.create({
      data: {
        id: h.id, type: h.type as never, severity: h.severity as never, zoneId: h.zoneId,
        rainfallRate: h.rainfallRate, waterDepth: h.waterDepth, flowVelocity: h.flowVelocity,
        temperature: h.temperature, windSpeed: h.windSpeed, durationMinutes: h.durationMinutes,
        source: h.source as never, startedAt: h.startedAt, status: h.status as never,
      },
    });
  }
  for (const e of data.dependencyEdges) {
    await prisma.dependencyEdge.create({
      data: {
        sourceAssetId: e.sourceAssetId, targetAssetId: e.targetAssetId,
        dependencyType: e.dependencyType as never, strength: e.strength, description: e.description,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log('[seed] Creating response units, incidents, tasks...');
  for (const u of data.units) {
    await prisma.responseUnit.create({
      data: {
        id: u.id, name: u.name, callsign: u.callsign, type: u.type as never,
        departmentId: u.departmentId, status: u.status as never,
        latitude: u.latitude, longitude: u.longitude, teamSize: u.teamSize,
        capacity: u.capacity, specialization: u.specialization, etaMinutes: u.etaMinutes,
      },
    });
  }
  for (const i of data.incidents) {
    await prisma.incident.create({
      data: {
        id: i.id, incidentCode: i.incidentCode, title: i.title, description: i.description,
        type: i.type as never, severity: i.severity as never, status: i.status as never,
        zoneId: i.zoneId, hazardId: i.hazardId, primaryAssetId: i.primaryAssetId,
        reportedAt: i.reportedAt, acknowledgedAt: i.acknowledgedAt, resolvedAt: i.resolvedAt,
        slaDeadline: i.slaDeadline, createdById: i.createdById,
      },
    });
  }
  for (const t of data.tasks) {
    await prisma.task.create({
      data: {
        id: t.id, taskCode: t.taskCode, title: t.title, description: t.description,
        incidentId: t.incidentId, assetId: t.assetId, assignedUnitId: t.assignedUnitId,
        assignedDepartmentId: t.assignedDepartmentId, createdById: t.createdById,
        status: t.status as never, priority: t.priority as never, slaDeadline: t.slaDeadline,
        createdAt: t.createdAt, acknowledgedAt: t.acknowledgedAt, startedAt: t.startedAt,
        completedAt: t.completedAt, verifiedAt: t.verifiedAt,
      },
    });
  }
  for (const h of data.taskHistory) {
    await prisma.taskStatusHistory.create({
      data: {
        taskId: h.taskId, fromStatus: h.fromStatus as never, toStatus: h.toStatus as never,
        changedById: h.changedById, note: h.note, createdAt: h.createdAt,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log('[seed] Creating telemetry, historical events, hotspots, notifications...');
  await prisma.telemetryReading.createMany({
    data: data.telemetryReadings.map((r) => ({ ...r, source: r.source as never })),
  });
  await prisma.historicalEvent.createMany({
    data: data.historicalEvents.map((e) => ({ ...e, source: data.DEMO_SOURCE })),
  });
  for (const h of data.hotspots) {
    await prisma.hotspot.create({
      data: {
        zoneId: h.zoneId, name: h.name, latitude: h.latitude, longitude: h.longitude,
        hazardType: h.hazardType as never, eventCount: h.eventCount, severityScore: h.severityScore,
        recurrenceScore: h.recurrenceScore, lastOccurredAt: h.lastOccurredAt, description: h.description,
      },
    });
  }
  await prisma.notification.createMany({
    data: data.notifications.map((n) => ({ ...n, read: false })),
  });

  // --- Computed projections through the real engines ---
  // eslint-disable-next-line no-console
  console.log('[seed] Computing risk scores via risk.service...');
  const activeHazards = await prisma.hazard.findMany({ where: { status: 'ACTIVE' } });
  const hazardByZone = new Map<string, Hazard>();
  for (const h of activeHazards) {
    const current = hazardByZone.get(h.zoneId);
    if (!current || h.severity > current.severity) hazardByZone.set(h.zoneId, h);
  }
  for (const a of data.assets) {
    const asset = await prisma.infrastructureAsset.findUniqueOrThrow({ where: { id: a.id } });
    const hazard = hazardByZone.get(a.zoneId) ?? null;
    const assessment = await assessAssetRisk(prisma, asset, hazard, true);
    await persistRiskScore(prisma, a.id, hazard?.id ?? null, assessment);
  }

  // eslint-disable-next-line no-console
  console.log('[seed] Computing cascade events via cascade.service...');
  for (const i of data.incidents.filter((inc) => inc.primaryAssetId)) {
    const cascade = await getIncidentCascade(prisma, i.id);
    if (cascade.rootAsset) {
      await persistCascadeEvents(prisma, i.id, cascade.rootAsset.id, cascade.nodes);
    }
  }

  // eslint-disable-next-line no-console
  console.log('[seed] Running seeded drill simulation via simulator.service...');
  const govUser = {
    id: 'user_gov',
    name: 'Dana Whitfield',
    email: 'government@climateshield.demo',
    role: 'GOVERNMENT_OPERATOR' as const,
    departmentId: 'dept_em',
  };
  await runSimulation(
    {
      name: 'October drill: Atmospheric River (seeded)',
      scenarioType: 'ATMOSPHERIC_RIVER',
      rainfallRate: 38,
      stormDuration: 6,
      drainageThroughput: 70,
      tidalSurge: 1.2,
    },
    govUser,
  );

  await prisma.auditLog.create({
    data: {
      userId: 'user_admin', action: 'DEMO_DATA_SEEDED', entityType: 'SYSTEM', entityId: 'seed',
      metadata: { source: data.DEMO_SOURCE } as never,
    },
  });

  const counts = {
    departments: await prisma.department.count(),
    zones: await prisma.zone.count(),
    users: await prisma.user.count(),
    assets: await prisma.infrastructureAsset.count(),
    hazards: await prisma.hazard.count(),
    dependencyEdges: await prisma.dependencyEdge.count(),
    units: await prisma.responseUnit.count(),
    incidents: await prisma.incident.count(),
    tasks: await prisma.task.count(),
    taskHistory: await prisma.taskStatusHistory.count(),
    telemetry: await prisma.telemetryReading.count(),
    historicalEvents: await prisma.historicalEvent.count(),
    hotspots: await prisma.hotspot.count(),
    riskScores: await prisma.riskScore.count(),
    cascadeEvents: await prisma.cascadeEvent.count(),
    simulations: await prisma.simulation.count(),
    notifications: await prisma.notification.count(),
  };
  // eslint-disable-next-line no-console
  console.log(`[seed] Done. SYNTHETIC DEMO dataset: ${JSON.stringify(counts)}`);
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('[seed] Failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
