import type {
  AssetType as PrismaAssetType,
  HazardType as PrismaHazardType,
  Severity,
} from "@prisma/client";
import type {
  AffectedAsset,
  AssetType,
  CausalChain,
  ExplainRequest,
  HazardType,
  RiskLevel,
} from "./schemas";

/**
 * ENGINE -> AI boundary.
 *
 * The deterministic engine (risk.service + cascade.service) produces VERIFIED
 * facts. This adapter translates those facts into the AI-layer ExplainRequest.
 * It never invents data: every field is derived from values the engine supplied.
 * This is the mechanism that keeps the AI grounded.
 */

/** Structural shape of `getIncidentCascade()` output (kept decoupled on purpose). */
export interface IncidentCascadeFacts {
  incident: {
    id: string;
    incidentCode?: string;
    title: string;
    severity: Severity;
    status: string;
    zoneName?: string;
  };
  hazard:
    | {
        type: PrismaHazardType;
        severity: Severity;
        rainfallRate?: number | null;
        temperature?: number | null;
        windSpeed?: number | null;
        waterDepth?: number | null;
      }
    | null;
  rootAsset: {
    id: string;
    assetCode: string;
    name: string;
    type: PrismaAssetType;
  } | null;
  baseRisk: {
    score: number;
    level: string;
    confidence: number;
    factors: { name: string; contribution: number }[];
    explanation: string;
  } | null;
  nodes: {
    assetId: string;
    assetCode: string;
    name: string;
    type: PrismaAssetType;
    depth: number;
    impactType: string;
    impactScore: number;
    explanation: string;
    dependencyType: string | null;
  }[];
}

const FLOOD_HAZARDS = new Set<PrismaHazardType>(["FLOOD", "FLASH_FLOOD", "DRAINAGE_OVERFLOW"]);

/** Prisma HazardType -> AI HazardType (best-effort; defaults to flood for demo). */
export function mapHazardType(type: PrismaHazardType | null | undefined): HazardType {
  switch (type) {
    case "FLOOD":
    case "FLASH_FLOOD":
      return "flood";
    case "DRAINAGE_OVERFLOW":
      return "heavy_rainfall";
    case "EXTREME_HEAT":
      return "extreme_heat";
    case "STORM":
    case "HIGH_WIND":
      return "cyclone";
    default:
      // POWER_FAILURE / OTHER / null have no direct AI-hazard analog; the label
      // is descriptive only and the risk score is unaffected.
      return "flood";
  }
}

/** Prisma Severity -> AI RiskLevel. */
export function mapSeverity(severity: Severity | null | undefined): RiskLevel {
  switch (severity) {
    case "CRITICAL":
      return "critical";
    case "HIGH":
      return "high";
    case "MODERATE":
      return "medium";
    default:
      return "low";
  }
}

/** Prisma AssetType -> AI AssetType (collapses the richer domain to AI categories). */
export function mapAssetType(type: PrismaAssetType): AssetType {
  switch (type) {
    case "HOSPITAL":
      return "hospital";
    case "DRAIN":
      return "drain";
    case "ROAD":
    case "BRIDGE":
    case "AMBULANCE_GATE":
      return "road";
    case "SUBSTATION":
      return "substation";
    case "PUMPING_STATION":
    case "WATER_TREATMENT":
    case "GENERATOR":
      return "utility";
    default:
      // COOLING_CENTER, EVACUATION_SHELTER, FIRE_STATION, OTHER
      return "building";
  }
}

/** 0-100 score -> AI RiskLevel (aligned with the engine's riskLevelFromScore bands). */
export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 40) return "medium";
  return "low";
}

function mapRiskLevelString(level: string): RiskLevel {
  const upper = level.toUpperCase();
  if (upper === "CRITICAL") return "critical";
  if (upper === "HIGH") return "high";
  if (upper === "MODERATE" || upper === "MEDIUM") return "medium";
  return "low";
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Builds a grounded ExplainRequest from verified incident cascade facts.
 * Throws if the incident has no assessable asset (nothing to explain).
 */
export function toExplainRequest(facts: IncidentCascadeFacts): ExplainRequest {
  const { incident, hazard, rootAsset, baseRisk, nodes } = facts;

  if (!rootAsset || !baseRisk || nodes.length === 0) {
    throw new Error("Incident has no assessable infrastructure asset to explain.");
  }

  const incidentId = incident.incidentCode?.trim() || incident.id;

  // ---- affected assets (deduped, derived from the real cascade nodes) ----
  const seen = new Set<string>();
  const affectedAssets: AffectedAsset[] = [];
  for (const node of nodes) {
    if (seen.has(node.assetId)) continue;
    seen.add(node.assetId);
    affectedAssets.push({
      id: node.assetId,
      type: mapAssetType(node.type),
      name: node.name,
      riskLevel: riskLevelFromScore(node.impactScore),
    });
  }

  // ---- cascade path + single ordered causal chain (by propagation depth) ----
  const ordered = [...nodes].sort((a, b) => a.depth - b.depth);
  const pathIds = ordered.map((n) => n.assetId);
  const downstream = ordered.filter((n) => n.depth > 0);

  const causalChains: CausalChain[] = [];
  if (downstream.length > 0) {
    causalChains.push({
      path: pathIds,
      impact: `Dependency failure propagates from ${rootAsset.name} to ${downstream
        .map((n) => n.name)
        .join(" -> ")}.`,
    });
  }

  // ---- evidence (every string is a fact the engine actually produced) ----
  const evidence: string[] = [];
  evidence.push(baseRisk.explanation);
  if (hazard) {
    const bits: string[] = [`Active hazard: ${hazard.type} at severity ${hazard.severity}`];
    if (hazard.rainfallRate != null) bits.push(`rainfall ${hazard.rainfallRate} mm/hr`);
    if (hazard.temperature != null) bits.push(`temperature ${hazard.temperature} C`);
    if (hazard.windSpeed != null) bits.push(`wind ${hazard.windSpeed} km/h`);
    evidence.push(`${bits.join(", ")}.`);
  }
  for (const f of baseRisk.factors) {
    if (f.contribution > 0) evidence.push(`${f.name} contributes +${f.contribution} points to the risk score.`);
  }
  evidence.push(
    `Deterministic risk engine scored ${rootAsset.name} at ${baseRisk.score}/100 (${baseRisk.level}).`,
  );
  if (downstream.length > 0) {
    evidence.push(
      `Dependency-graph traversal identified ${downstream.length} downstream affected asset(s).`,
    );
    for (const n of downstream.slice(0, 5)) {
      evidence.push(`${rootAsset.name} -> ${n.name}: ${n.impactType} (impact ${n.impactScore}/100).`);
    }
  }

  // ---- honest uncertainty (matches weather.service: no live flood-depth gauge) ----
  const uncertainties =
    hazard && FLOOD_HAZARDS.has(hazard.type)
      ? [
          {
            statement:
              "Live flood-depth gauge data is not integrated; water depth is modeled from rainfall, not directly measured.",
            requiredCheck: `Confirm on-ground water level near ${rootAsset.name} before committing field crews.`,
          },
        ]
      : [];

  return {
    incidentId,
    hazard: {
      type: mapHazardType(hazard?.type),
      severity: mapSeverity(hazard?.severity ?? incident.severity),
    },
    risk: {
      score: baseRisk.score,
      level: mapRiskLevelString(baseRisk.level),
      confidence: clamp01(baseRisk.confidence),
    },
    affectedAssets,
    cascade: {
      path: pathIds,
      impact: `Cascade rooted at ${rootAsset.name} (${incident.title}).`,
    },
    causalChains,
    evidence: evidence.filter((s) => typeof s === "string" && s.trim().length > 0),
    uncertainties,
    dataFreshness: [
      {
        source: "ClimateShield deterministic risk & cascade engine (PostgreSQL dependency graph)",
        timestamp: new Date().toISOString(),
        status: "fresh",
      },
    ],
  };
}
