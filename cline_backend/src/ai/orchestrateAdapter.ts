import type { IncidentCascadeFacts } from "./explainAdapter";
// Type-only import: erased at compile time, so this is safe even though
// @climateshield/agents is a pure-ESM package ("type": "module") and
// cline_backend compiles to CommonJS. Only VALUES (functions/classes) from
// ESM-only packages need the dynamic import() workaround (see
// orchestrate.service.ts) — type imports never emit a runtime require().
import type { IncidentFacts } from "@climateshield/agents";

/**
 * ENGINE -> MULTI-AGENT ORCHESTRATOR boundary.
 *
 * Mirrors explainAdapter.ts's role for the single-shot explain layer: the
 * deterministic engine (risk.service + cascade.service, via
 * cascade.service#getIncidentCascade) produces VERIFIED facts. This adapter
 * translates those facts into the `IncidentFacts` shape the standalone
 * `@climateshield/agents` / `@climateshield/orchestration` packages expect.
 * It never invents data — every field is derived from values the engine
 * already computed. `IncidentCascadeFacts` is reused unchanged from
 * explainAdapter.ts so both AI layers are grounded on the identical facts.
 */

export interface OrchestratorAvailableUnit {
  id: string;
  callsign: string;
  type: string;
  status: string;
  departmentName?: string | null;
  etaMinutes?: number | null;
}

/** Prisma/engine Severity ("CRITICAL"/"HIGH"/"MODERATE"/"LOW") -> agents RiskLevel. */
function toRiskLevel(value: string | null | undefined): "low" | "medium" | "high" | "critical" {
  const upper = (value ?? "").toString().toUpperCase();
  if (upper === "CRITICAL") return "critical";
  if (upper === "HIGH") return "high";
  if (upper === "MODERATE" || upper === "MEDIUM") return "medium";
  return "low";
}

/**
 * Builds the orchestrator's `IncidentFacts` from the same verified cascade
 * facts used by the explain layer, plus available response units.
 *
 * Throws if the incident has no assessable infrastructure asset (same guard
 * explain.service.ts uses) — the orchestrator's `IncidentFacts.rootAsset` /
 * `baseRisk` are required fields, so there is nothing valid to build.
 */
export function toOrchestratorFacts(
  facts: IncidentCascadeFacts,
  availableUnits: OrchestratorAvailableUnit[] = [],
): IncidentFacts {
  const { incident, hazard, rootAsset, baseRisk, nodes } = facts;

  if (!rootAsset || !baseRisk || nodes.length === 0) {
    throw new Error("Incident has no assessable infrastructure asset to orchestrate.");
  }

  return {
    incidentId: incident.incidentCode?.trim() || incident.id,
    title: incident.title,
    severity: toRiskLevel(incident.severity),
    zoneName: incident.zoneName,
    hazard: hazard
      ? {
          type: hazard.type,
          severity: toRiskLevel(hazard.severity),
          rainfallRate: hazard.rainfallRate ?? null,
          temperature: hazard.temperature ?? null,
          windSpeed: hazard.windSpeed ?? null,
          waterDepth: hazard.waterDepth ?? null,
        }
      : null,
    rootAsset: {
      id: rootAsset.id,
      assetCode: rootAsset.assetCode,
      name: rootAsset.name,
      type: rootAsset.type,
    },
    baseRisk: {
      score: baseRisk.score,
      level: toRiskLevel(baseRisk.level),
      confidence: baseRisk.confidence,
      factors: baseRisk.factors.map((f) => ({ name: f.name, contribution: f.contribution })),
      explanation: baseRisk.explanation,
    },
    cascadeNodes: nodes.map((n) => ({
      assetId: n.assetId,
      assetCode: n.assetCode,
      name: n.name,
      type: n.type,
      depth: n.depth,
      impactType: n.impactType,
      impactScore: n.impactScore,
      dependencyType: n.dependencyType ?? null,
    })),
    availableUnits: availableUnits.map((u) => ({
      id: u.id,
      callsign: u.callsign,
      type: u.type,
      status: u.status,
      departmentName: u.departmentName ?? undefined,
      etaMinutes: u.etaMinutes ?? null,
    })),
  };
}
