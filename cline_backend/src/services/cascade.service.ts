import type {
  AssetType,
  CascadeImpactType,
  Hazard,
  HazardType,
  InfrastructureAsset,
  Severity,
} from '@prisma/client';
import type { DbClient } from '../db/prisma';
import { Errors } from '../utils/errors';
import { EXPOSURE_BY_SEVERITY, SEVERITY_WEIGHTS, riskLevelFromScore } from '../utils/risk';
import { assessAssetRisk, type HazardLike } from './risk.service';
import { findZoneByIdOrCode } from './lookup.service';
import type { CascadeNodeDto, ZoneCascadeData } from '../types/domain';

/**
 * CASCADE ENGINE - traverses the DependencyEdge graph stored in PostgreSQL.
 * Cascade relationships are NEVER hardcoded here: the graph comes from the DB
 * (see prisma/seed-data.ts for the demo Drain D07 -> Road R24 -> Hospital chain).
 */

export interface CascadeAssetLite {
  id: string;
  assetCode: string;
  name: string;
  type: AssetType;
  criticality: string;
  operationalStatus: string;
  zoneId: string;
  latitude: number;
  longitude: number;
}

export interface CascadeEdgeLite {
  sourceAssetId: string;
  targetAssetId: string;
  dependencyType: string;
  strength: number;
  description: string | null;
}

export const MAX_CASCADE_DEPTH = 6;
const MAX_CASCADE_NODES = 40;

/** Deterministic hazard -> asset-type impact mapping (documented in docs/API.md). */
export function impactTypeFor(assetType: AssetType, hazardType: HazardType | null): CascadeImpactType {
  if (hazardType === 'FLOOD' || hazardType === 'FLASH_FLOOD' || hazardType === 'DRAINAGE_OVERFLOW') {
    switch (assetType) {
      case 'DRAIN': return 'OVERWHELMED';
      case 'PUMPING_STATION': return 'PUMP_FAILURE';
      case 'ROAD':
      case 'BRIDGE': return 'INUNDATED';
      case 'AMBULANCE_GATE': return 'AMBULANCE_DELAYED';
      case 'HOSPITAL': return 'ACCESS_BLOCKED';
      case 'SUBSTATION': return 'POWER_AT_RISK';
      default: return 'DEGRADED';
    }
  }
  if (hazardType === 'POWER_FAILURE' || hazardType === 'STORM' || hazardType === 'HIGH_WIND') {
    switch (assetType) {
      case 'SUBSTATION': return 'POWER_LOSS';
      case 'GENERATOR': return 'BACKUP_ENGAGED';
      case 'HOSPITAL': return 'ON_BACKUP_POWER';
      default: return 'DEGRADED';
    }
  }
  if (hazardType === 'EXTREME_HEAT') {
    switch (assetType) {
      case 'COOLING_CENTER': return 'OVERCAPACITY';
      case 'HOSPITAL': return 'THERMAL_STRESS';
      case 'SUBSTATION': return 'THERMAL_OVERLOAD';
      default: return 'DEGRADED';
    }
  }
  return 'DEGRADED';
}

interface FrontierItem {
  assetId: string;
  depth: number;
  pathStrength: number;
}

/**
 * Cycle-safe breadth-first traversal. Edge loading is injected so the pure
 * algorithm is unit-testable without a database.
 */
export async function buildCascade(
  root: CascadeAssetLite,
  fetchEdges: (assetIds: string[]) => Promise<CascadeEdgeLite[]>,
  fetchAssets: (assetIds: string[]) => Promise<CascadeAssetLite[]>,
  hazardType: HazardType | null,
  baseScore: number,
  maxDepth: number = MAX_CASCADE_DEPTH,
): Promise<CascadeNodeDto[]> {
  const nodes: CascadeNodeDto[] = [
    {
      assetId: root.id,
      assetCode: root.assetCode,
      name: root.name,
      type: root.type,
      criticality: root.criticality,
      operationalStatus: root.operationalStatus,
      depth: 0,
      impactType: impactTypeFor(root.type, hazardType),
      impactScore: Math.round(baseScore),
      explanation: `${root.name} is the cascade root (risk ${Math.round(baseScore)}/100).`,
      dependencyType: null,
      edgeStrength: null,
    },
  ];
  const visited = new Set<string>([root.id]); // cycle prevention
  let frontier: FrontierItem[] = [{ assetId: root.id, depth: 0, pathStrength: 1 }];

  while (frontier.length > 0 && nodes.length < MAX_CASCADE_NODES) {
    const edges = await fetchEdges(frontier.map((f) => f.assetId));
    const unseenTargets = [
      ...new Set(edges.map((e) => e.targetAssetId).filter((id) => !visited.has(id))),
    ];
    const assets = unseenTargets.length > 0 ? await fetchAssets(unseenTargets) : [];
    const assetById = new Map(assets.map((a) => [a.id, a]));
    const frontierById = new Map(frontier.map((f) => [f.assetId, f]));
    const next: FrontierItem[] = [];

    for (const edge of edges) {
      const target = assetById.get(edge.targetAssetId);
      const source = frontierById.get(edge.sourceAssetId);
      if (!target || !source) continue;
      if (visited.has(target.id)) continue; // prevents cycles
      const depth = source.depth + 1;
      if (depth > maxDepth) continue;
      visited.add(target.id);

      const pathStrength = source.pathStrength * edge.strength;
      const impactScore = Math.max(
        5,
        Math.min(100, Math.round(baseScore * pathStrength * Math.pow(0.9, depth))),
      );
      nodes.push({
        assetId: target.id,
        assetCode: target.assetCode,
        name: target.name,
        type: target.type,
        criticality: target.criticality,
        operationalStatus: target.operationalStatus,
        depth,
        impactType: impactTypeFor(target.type, hazardType),
        impactScore,
        explanation: `${root.name} -> ${target.name} via ${edge.dependencyType} (depth ${depth}, strength ${edge.strength})`,
        dependencyType: edge.dependencyType,
        edgeStrength: edge.strength,
      });
      next.push({ assetId: target.id, depth, pathStrength });
    }
    frontier = next;
  }

  return nodes.sort((a, b) => a.depth - b.depth || a.assetCode.localeCompare(b.assetCode));
}

function toLite(asset: InfrastructureAsset): CascadeAssetLite {
  return {
    id: asset.id,
    assetCode: asset.assetCode,
    name: asset.name,
    type: asset.type,
    criticality: asset.criticality,
    operationalStatus: asset.operationalStatus,
    zoneId: asset.zoneId,
    latitude: asset.latitude,
    longitude: asset.longitude,
  };
}

/** Loads the root asset and traverses its downstream dependency graph. */
export async function cascadeFromAsset(
  client: DbClient,
  rootAssetId: string,
  hazardType: HazardType | null,
  baseScore: number,
): Promise<{ root: CascadeAssetLite; nodes: CascadeNodeDto[] }> {
  const root = await client.infrastructureAsset.findUnique({ where: { id: rootAssetId } });
  if (!root) throw Errors.notFound('Infrastructure asset', rootAssetId);
  const nodes = await buildCascade(
    toLite(root),
    (ids) =>
      client.dependencyEdge.findMany({
        where: { sourceAssetId: { in: ids } },
        orderBy: [{ sourceAssetId: 'asc' }, { targetAssetId: 'asc' }],
      }),
    (ids) => client.infrastructureAsset.findMany({ where: { id: { in: ids } }, orderBy: { assetCode: 'asc' } }),
    hazardType,
    baseScore,
  );
  return { root: toLite(root), nodes };
}

/** Persists computed cascade events for an incident (audit/analysis trail). */
export async function persistCascadeEvents(
  client: DbClient,
  incidentId: string,
  rootAssetId: string,
  nodes: CascadeNodeDto[],
): Promise<void> {
  await client.cascadeEvent.deleteMany({ where: { incidentId } });
  const downstream = nodes.filter((n) => n.depth > 0);
  if (downstream.length === 0) return;
  await client.cascadeEvent.createMany({
    data: downstream.map((n) => ({
      incidentId,
      rootAssetId,
      affectedAssetId: n.assetId,
      depth: n.depth,
      impactType: n.impactType as CascadeImpactType,
      impactScore: n.impactScore,
      explanation: n.explanation,
    })),
  });
}

/** Most severe ACTIVE hazard in a zone (ties broken by earliest start). */
export async function mostSevereActiveHazard(client: DbClient, zoneId: string): Promise<Hazard | null> {
  const hazards = await client.hazard.findMany({ where: { zoneId, status: 'ACTIVE' } });
  if (hazards.length === 0) return null;
  return [...hazards].sort(
    (a, b) =>
      SEVERITY_WEIGHTS[b.severity] - SEVERITY_WEIGHTS[a.severity] ||
      a.startedAt.getTime() - b.startedAt.getTime(),
  )[0];
}

/** Cascade for an incident: root = primary asset, else highest-risk asset in zone. */
export async function getIncidentCascade(client: DbClient, incidentId: string) {
  const incident = await client.incident.findFirst({
    where: { OR: [{ id: incidentId }, { incidentCode: incidentId }] },
    include: { primaryAsset: true, hazard: true, zone: true },
  });
  if (!incident) throw Errors.notFound('Incident', incidentId);

  const hazard: HazardLike | null = incident.hazard ?? (await mostSevereActiveHazard(client, incident.zoneId));

  let rootAsset: InfrastructureAsset | null = incident.primaryAsset;
  if (!rootAsset) {
    const assets = await client.infrastructureAsset.findMany({ where: { zoneId: incident.zoneId } });
    let best: { asset: InfrastructureAsset; score: number } | null = null;
    for (const asset of assets) {
      const risk = await assessAssetRisk(client, asset, hazard);
      if (!best || risk.score > best.score) best = { asset, score: risk.score };
    }
    rootAsset = best?.asset ?? null;
  }

  if (!rootAsset) {
    return {
      incident: {
        id: incident.id,
        incidentCode: incident.incidentCode,
        title: incident.title,
        severity: incident.severity,
        status: incident.status,
        zoneName: incident.zone.name,
      },
      hazard,
      rootAsset: null,
      baseRisk: null,
      nodes: [] as CascadeNodeDto[],
      note: 'No infrastructure assets registered in this zone.',
    };
  }

  const baseRisk = await assessAssetRisk(client, rootAsset, hazard);
  const { nodes } = await cascadeFromAsset(client, rootAsset.id, hazard?.type ?? null, baseRisk.score);
  return {
    incident: {
      id: incident.id,
      incidentCode: incident.incidentCode,
      title: incident.title,
      severity: incident.severity,
      status: incident.status,
      zoneName: incident.zone.name,
    },
    hazard,
    rootAsset: toLite(rootAsset),
    baseRisk,
    nodes,
  };
}

function severityFromLevel(level: string): Severity {
  if (level === 'CRITICAL') return 'CRITICAL';
  if (level === 'HIGH') return 'HIGH';
  if (level === 'MODERATE') return 'MODERATE';
  return 'LOW';
}

function recommendActions(
  hazardType: HazardType | null,
  severity: Severity,
  ctx: { zoneName: string; roads: string[]; facilities: string[]; residents: number },
): string[] {
  const actions: string[] = [];
  if (hazardType === 'FLOOD' || hazardType === 'FLASH_FLOOD' || hazardType === 'DRAINAGE_OVERFLOW' || hazardType === null) {
    if (ctx.roads[0]) actions.push(`Establish traffic reroute around ${ctx.roads[0]} and deploy a barrier crew.`);
    actions.push('Deploy pump crews to the highest-vulnerability drains and verify backup generator fuel levels.');
    if (ctx.facilities[0]) actions.push(`Notify ${ctx.facilities[0]} to prepare failover power and shed non-critical load.`);
    actions.push('Pre-position an EMS unit near the primary medical access route.');
  } else if (hazardType === 'EXTREME_HEAT') {
    actions.push('Extend cooling center hours and confirm HVAC redundancy at medical facilities.');
    if (ctx.facilities[0]) actions.push(`Check thermal load and occupancy limits at ${ctx.facilities[0]}.`);
    actions.push('Rotate outdoor field crews on 30-minute heat-cycle schedules.');
  } else {
    actions.push('Dispatch utility crews to inspect feeders and tree-line contacts.');
    if (ctx.facilities[0]) actions.push(`Confirm backup power engagement at ${ctx.facilities[0]}.`);
    actions.push('Stage heavy-equipment unit for debris clearance on primary arterials.');
  }
  if (severity === 'CRITICAL') {
    actions.push(`Escalate to the Emergency Operations Center duty officer; prepare evacuation messaging for ~${ctx.residents.toLocaleString('en-US')} exposed residents.`);
  } else if (severity === 'HIGH') {
    actions.push('Place mutual-aid units on 15-minute standby and open shelters preemptively.');
  } else {
    actions.push('Continue enhanced monitoring and re-evaluate in 60 minutes.');
  }
  return actions.slice(0, 6);
}

/** Zone Detail cascade: zone + hazard + factors + impact + cascade vector + actions. */
export async function getZoneCascade(client: DbClient, zoneIdOrCode: string): Promise<ZoneCascadeData> {
  const zone = await findZoneByIdOrCode(client, zoneIdOrCode);

  const hazard = await mostSevereActiveHazard(client, zone.id);
  const assets = await client.infrastructureAsset.findMany({ where: { zoneId: zone.id }, orderBy: { assetCode: 'asc' } });

  const scored: { asset: InfrastructureAsset; score: number; factors: { name: string; contribution: number }[] }[] = [];
  for (const asset of assets) {
    const risk = await assessAssetRisk(client, asset, hazard);
    scored.push({ asset, score: risk.score, factors: risk.factors });
  }
  scored.sort((a, b) => b.score - a.score || a.asset.assetCode.localeCompare(b.asset.assetCode));

  const top = scored[0] ?? null;
  const zoneRisk = top?.score ?? 0;
  const zoneRiskLevel = riskLevelFromScore(zoneRisk);
  const nodes = top
    ? (await cascadeFromAsset(client, top.asset.id, hazard?.type ?? null, zoneRisk)).nodes
    : [];

  const impacted = nodes.filter((n) => n.depth > 0);
  const cascadeRoads = impacted.filter((n) => n.type === 'ROAD' || n.type === 'BRIDGE');
  const cascadeFacilities = impacted.filter((n) => n.type !== 'ROAD' && n.type !== 'BRIDGE');
  const nonOperationalRoads = assets.filter(
    (a) => (a.type === 'ROAD' || a.type === 'BRIDGE') && a.operationalStatus !== 'OPERATIONAL',
  );
  const blockedRoadIds = new Set([...cascadeRoads.map((n) => n.assetId), ...nonOperationalRoads.map((a) => a.id)]);
  const roadNames = [
    ...new Set([
      ...cascadeRoads.map((n) => n.name),
      ...nonOperationalRoads.map((a) => a.name),
    ]),
  ];
  const facilityNames = [...new Set(cascadeFacilities.map((n) => n.name))];

  const severity: Severity = hazard?.severity ?? severityFromLevel(zoneRiskLevel);
  const residents = Math.round(zone.population * EXPOSURE_BY_SEVERITY[severity]);

  return {
    zone: {
      id: zone.id,
      name: zone.name,
      code: zone.code,
      riskLevel: zone.riskLevel,
      description: zone.description,
      latitude: zone.latitude,
      longitude: zone.longitude,
      population: zone.population,
    },
    hazard: hazard
      ? {
          id: hazard.id,
          type: hazard.type,
          severity: hazard.severity,
          rainfallRate: hazard.rainfallRate,
          temperature: hazard.temperature,
          startedAt: hazard.startedAt,
        }
      : null,
    riskScore: zoneRisk,
    riskLevel: zoneRiskLevel,
    riskFactors: top?.factors ?? [],
    contributingFactors:
      top
        ? top.factors.map((f) => `${f.name}: +${f.contribution} points`)
        : ['No assets and no active hazard registered in this zone'],
    impact: {
      blockedRoads: blockedRoadIds.size,
      affectedFacilities: facilityNames.length,
      residents,
    },
    cascade: nodes.map((n) => ({
      asset: n.name,
      assetCode: n.assetCode,
      impact: n.impactType,
      depth: n.depth,
      impactScore: n.impactScore,
    })),
    impactedInfrastructure: impacted.map((n) => ({
      assetId: n.assetId,
      assetCode: n.assetCode,
      name: n.name,
      type: n.type,
      operationalStatus: n.operationalStatus,
      impactType: n.impactType,
      impactScore: n.impactScore,
    })),
    affectedRoads: roadNames,
    affectedFacilities: facilityNames,
    recommendedResponseActions: recommendActions(hazard?.type ?? null, severity, {
      zoneName: zone.name,
      roads: roadNames,
      facilities: facilityNames,
      residents,
    }),
  };
}
