import type { Prisma, Severity, Simulation, SimulationResult, Zone } from '@prisma/client';
import { prisma } from '../db/prisma';
import { Errors } from '../utils/errors';
import { buildPaginated, resolvePagination } from '../utils/pagination';
import { EXPOSURE_BY_SEVERITY, SEVERITY_WEIGHTS, riskLevelFromScore } from '../utils/risk';
import { AuditActions, createAudit } from './audit.service';
import { assessAssetRisk, type HazardLike } from './risk.service';
import type { CreateSimulationInput, SimulationQuery } from '../validators/simulator.schema';
import type { AuthUser } from '../types/auth';
import type { SimulationDamageEstimate, SimulationDto } from '../types/domain';

/**
 * SIMULATOR - deterministic scenario math (no AI, no external services).
 * severityForParams() is transparent and unit-testable; results are persisted
 * per zone and fully audited.
 */

const SCENARIO_DEFAULTS: Record<string, { hazardType: string; rainfallRate?: number; temperature?: number; windSpeed?: number }> = {
  ATMOSPHERIC_RIVER: { hazardType: 'FLOOD', rainfallRate: 45 },
  FLASH_FLOOD: { hazardType: 'FLASH_FLOOD', rainfallRate: 55 },
  EXTREME_HEAT: { hazardType: 'EXTREME_HEAT', temperature: 41 },
  STORM: { hazardType: 'STORM', windSpeed: 75 },
  CUSTOM: { hazardType: 'OTHER' },
};

const PER_CAPITA_DAMAGE_USD: Record<Severity, number> = { CRITICAL: 850, HIGH: 420, MODERATE: 180, LOW: 60 };

/** Transparent severity derivation from scenario parameters. */
export function severityForParams(input: {
  scenarioType: string;
  rainfallRate?: number | null;
  temperature?: number | null;
  windSpeed?: number | null;
  drainageThroughput?: number | null;
  tidalSurge?: number | null;
}): Severity {
  const defaults = SCENARIO_DEFAULTS[input.scenarioType] ?? SCENARIO_DEFAULTS.CUSTOM;
  const rainfall = input.rainfallRate ?? defaults.rainfallRate ?? 0;
  const temperature = input.temperature ?? (defaults.hazardType === 'EXTREME_HEAT' ? defaults.temperature ?? 0 : 0);
  const wind = input.windSpeed ?? defaults.windSpeed ?? 0;
  const throughput = input.drainageThroughput ?? 100;
  const surge = input.tidalSurge ?? 0;

  // Reduced drainage throughput amplifies effective rainfall; tidal surge adds water load.
  const effectiveRainfall = rainfall * Math.min(1.4, 100 / Math.max(10, throughput)) + surge * 12;

  const rainfallSeverity: Severity =
    effectiveRainfall >= 80 ? 'CRITICAL' : effectiveRainfall >= 55 ? 'HIGH' : effectiveRainfall >= 30 ? 'MODERATE' : 'LOW';
  const heatSeverity: Severity =
    temperature >= 45 ? 'CRITICAL' : temperature >= 40 ? 'HIGH' : temperature >= 35 ? 'MODERATE' : 'LOW';
  const windSeverity: Severity =
    wind >= 100 ? 'CRITICAL' : wind >= 80 ? 'HIGH' : wind >= 60 ? 'MODERATE' : 'LOW';

  return [rainfallSeverity, heatSeverity, windSeverity].sort(
    (a, b) => SEVERITY_WEIGHTS[b] - SEVERITY_WEIGHTS[a],
  )[0];
}

function recommendActions(severity: Severity, hazardType: string): string[] {
  const actions: string[] = [];
  if (['FLOOD', 'FLASH_FLOOD', 'DRAINAGE_OVERFLOW'].includes(hazardType)) {
    actions.push('Pre-deploy pump crews to drains with vulnerability above 70.');
    actions.push('Stage barrier crews at arterial road chokepoints.');
    actions.push('Alert hospitals to verify backup power and ambulance access routes.');
  } else if (hazardType === 'EXTREME_HEAT') {
    actions.push('Extend cooling center operating hours and confirm HVAC redundancy.');
    actions.push('Schedule field crews on 30-minute heat rotations.');
    actions.push('Pre-position EMS near senior-care facilities.');
  } else {
    actions.push('Inspect substation feeders and tree-line contacts.');
    actions.push('Confirm generator fuel levels at critical facilities.');
    actions.push('Stage heavy-equipment units for debris clearance.');
  }
  if (severity === 'CRITICAL') actions.push('Recommend precautionary evacuation of low-lying blocks.');
  else if (severity === 'HIGH') actions.push('Place mutual-aid units on 15-minute standby.');
  else actions.push('Continue enhanced monitoring; re-run simulation in 60 minutes.');
  return actions.slice(0, 5);
}

type ResultWithZone = SimulationResult & { zone: { name: string } | null };

function toDto(
  simulation: Simulation & { results: ResultWithZone[] },
  createdByName: string | null,
): SimulationDto {
  const results = simulation.results;
  const worst = [...results].sort((a, b) => b.riskScore - a.riskScore)[0];
  return {
    id: simulation.id,
    name: simulation.name,
    scenarioType: simulation.scenarioType,
    status: simulation.status,
    parameters: (simulation.parameters ?? {}) as Record<string, unknown>,
    createdBy: createdByName,
    createdAt: simulation.createdAt,
    completedAt: simulation.completedAt,
    results: results.map((r) => ({
      id: r.id,
      zoneId: r.zoneId,
      zoneName: r.zone?.name ?? null,
      riskScore: r.riskScore,
      riskLevel: riskLevelFromScore(r.riskScore),
      affectedAssets: r.affectedAssets,
      affectedRoads: r.affectedRoads,
      estimatedPopulation: r.estimatedPopulation,
      estimatedDamage: (r.estimatedDamage ?? null) as SimulationDamageEstimate | null,
      recommendedActions: ((r.recommendedActions ?? []) as unknown as string[]),
    })),
    summary: {
      worstZone: worst?.zone?.name ?? null,
      maxRiskScore: worst?.riskScore ?? 0,
      totalAffectedAssets: results.reduce((s, r) => s + r.affectedAssets, 0),
      totalAffectedRoads: results.reduce((s, r) => s + r.affectedRoads, 0),
      totalPopulationExposed: results.reduce((s, r) => s + r.estimatedPopulation, 0),
      totalDamageUsd: results.reduce((s, r) => s + ((r.estimatedDamage as { totalUsd?: number } | null)?.totalUsd ?? 0), 0),
    },
  };
}

export async function runSimulation(input: CreateSimulationInput, user: AuthUser): Promise<SimulationDto> {
  const defaults = SCENARIO_DEFAULTS[input.scenarioType] ?? SCENARIO_DEFAULTS.CUSTOM;
  const params = {
    scenarioType: input.scenarioType,
    rainfallRate: input.rainfallRate ?? defaults.rainfallRate ?? null,
    stormDuration: input.stormDuration ?? null,
    drainageThroughput: input.drainageThroughput ?? 100,
    tidalSurge: input.tidalSurge ?? 0,
    temperature: input.temperature ?? (defaults.hazardType === 'EXTREME_HEAT' ? defaults.temperature : null),
    windSpeed: defaults.windSpeed ?? null,
    zoneId: input.zoneId ?? null,
  };
  const severity = severityForParams(params);
  const hazardType = defaults.hazardType;

  const syntheticHazard: HazardLike = {
    type: hazardType as never,
    severity,
    rainfallRate: params.rainfallRate,
    temperature: params.temperature,
    windSpeed: params.windSpeed,
    waterDepth: params.tidalSurge ? params.tidalSurge : null,
  };

  return prisma.$transaction(async (tx) => {
    const simulation = await tx.simulation.create({
      data: {
        name: input.name ?? `${input.scenarioType.replace(/_/g, ' ')} scenario`,
        scenarioType: input.scenarioType,
        parameters: params as unknown as Prisma.InputJsonValue,
        status: 'RUNNING',
        createdById: user.id,
      },
    });
    await createAudit(tx, {
      userId: user.id, action: AuditActions.SIMULATION_STARTED, entityType: 'SIMULATION', entityId: simulation.id,
      metadata: { scenarioType: input.scenarioType, derivedSeverity: severity, params },
    });

    const zones: Zone[] = input.zoneId
      ? [await (async () => { const z = await tx.zone.findUnique({ where: { id: input.zoneId! } }); if (!z) throw Errors.notFound('Zone', input.zoneId!); return z; })()]
      : await tx.zone.findMany({ orderBy: { name: 'asc' } });

    const createdResults: SimulationResult[] = [];
    for (const zone of zones) {
      const assets = await tx.infrastructureAsset.findMany({ where: { zoneId: zone.id } });
      let maxRisk = 0;
      let affectedAssets = 0;
      let affectedRoads = 0;
      for (const asset of assets) {
        const risk = await assessAssetRisk(tx, asset, syntheticHazard);
        if (risk.score > maxRisk) maxRisk = risk.score;
        if (risk.score >= 40) {
          affectedAssets++;
          if (asset.type === 'ROAD' || asset.type === 'BRIDGE') affectedRoads++;
        }
      }
      const exposureFactor = Math.min(1, EXPOSURE_BY_SEVERITY[severity] * (0.75 + (0.5 * maxRisk) / 100));
      const population = Math.round(zone.population * exposureFactor);
      const totalUsd = Math.round(population * PER_CAPITA_DAMAGE_USD[severity]);
      const damage: SimulationDamageEstimate = {
        totalUsd,
        residentialUsd: Math.round(totalUsd * 0.6),
        infrastructureUsd: Math.round(totalUsd * 0.4),
      };
      const result = await tx.simulationResult.create({
        data: {
          simulationId: simulation.id,
          zoneId: zone.id,
          riskScore: maxRisk,
          affectedAssets,
          affectedRoads,
          estimatedPopulation: population,
          estimatedDamage: damage as unknown as Prisma.InputJsonValue,
          recommendedActions: recommendActions(severity, hazardType) as unknown as Prisma.InputJsonValue,
        },
      });
      createdResults.push(result);
    }

    const completed = await tx.simulation.update({
      where: { id: simulation.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
    await createAudit(tx, {
      userId: user.id, action: AuditActions.SIMULATION_COMPLETED, entityType: 'SIMULATION', entityId: simulation.id,
      metadata: { scenarioType: input.scenarioType, severity, zones: zones.length, worstRiskScore: Math.max(0, ...createdResults.map((r) => r.riskScore)) },
    });

    const withZones: ResultWithZone[] = createdResults.map((r) => ({
      ...r,
      zone: zones.find((z) => z.id === r.zoneId) ?? null,
    }));
    return toDto({ ...completed, results: withZones }, user.name);
  }, { maxWait: 10000, timeout: 30000 });
}

export async function listSimulations(query: SimulationQuery) {
  const { page, limit, skip, take } = resolvePagination(query);
  const where: Prisma.SimulationWhereInput = {
    ...(query.scenarioType ? { scenarioType: query.scenarioType } : {}),
    ...(query.status ? { status: query.status } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.simulation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { results: { include: { zone: { select: { name: true } } } }, createdBy: { select: { name: true } } },
    }),
    prisma.simulation.count({ where }),
  ]);
  const items = rows.map((s) => toDto(s, s.createdBy?.name ?? null));
  return buildPaginated(items, total, page, limit);
}

export async function getSimulation(id: string): Promise<SimulationDto> {
  const simulation = await prisma.simulation.findUnique({
    where: { id },
    include: { results: { include: { zone: { select: { name: true } } } }, createdBy: { select: { name: true } } },
  });
  if (!simulation) throw Errors.notFound('Simulation', id);
  return toDto(simulation, simulation.createdBy?.name ?? null);
}
