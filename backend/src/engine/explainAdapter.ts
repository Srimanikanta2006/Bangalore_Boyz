import type { AffectedAsset, ExplainRequest, RiskLevel } from "../ai/schemas.ts";
import { assetById } from "./pilotGraph.ts";
import type { InfrastructureGraph, SafeRoute, SimulationSnapshot } from "./types.ts";

function worstLevel(levels: RiskLevel[]): RiskLevel {
  const rank: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2, critical: 3 };
  return levels.reduce((best, level) => (rank[level] > rank[best] ? level : best), "low");
}

export function toExplainRequest(
  snapshot: SimulationSnapshot,
  graph: InfrastructureGraph,
  route?: SafeRoute | null,
): ExplainRequest {
  const involvedIds = new Set<string>();
  for (const cascade of snapshot.cascades) {
    for (const id of cascade.path) involvedIds.add(id);
  }
  if (involvedIds.size === 0) {
    const origin = snapshot.risks.find((risk) => risk.level === "high" || risk.level === "critical");
    if (origin) involvedIds.add(origin.assetId);
  }

  const affectedAssets: AffectedAsset[] = [...involvedIds]
    .map((id) => {
      const asset = assetById(graph, id);
      const risk = snapshot.risks.find((item) => item.assetId === id);
      if (!asset) return undefined;
      return {
        id: asset.id,
        type: asset.type,
        name: asset.name,
        riskLevel: risk?.level ?? "medium",
      } satisfies AffectedAsset;
    })
    .filter((asset): asset is AffectedAsset => asset !== undefined);

  const peak = snapshot.risks.reduce(
    (best, risk) => (risk.score > best.score ? risk : best),
    snapshot.risks[0] ?? {
      assetId: "none",
      score: 0,
      level: "low" as const,
      confidence: 0.75,
      evidence: [],
    },
  );

  const primary = snapshot.cascades[0];
  const evidence = [
    ...new Set([
      ...peak.evidence,
      ...snapshot.cascades.map(
        (cascade) => `${cascade.path.join(" -> ")} (${cascade.impact}, ETA ${cascade.etaMinutes} min)`,
      ),
    ]),
  ];

  return {
    incidentId: snapshot.incidentId,
    hazard: {
      type: snapshot.hazard.type,
      severity: worstLevel([peak.level, snapshot.hazard.type === "cyclone" ? "critical" : peak.level]),
    },
    risk: {
      score: peak.score,
      level: peak.level,
      confidence: peak.confidence,
    },
    affectedAssets,
    cascade: primary
      ? {
          path: primary.path,
          etaMinutes: primary.etaMinutes,
          impact: primary.impact,
        }
      : undefined,
    causalChains: snapshot.cascades.map((cascade) => ({
      path: cascade.path,
      impact: cascade.impact,
      etaMinutes: cascade.etaMinutes,
    })),
    evidence,
    dataFreshness: [
      {
        source: snapshot.hazard.source === "simulated" ? "Hazard simulator (in-memory)" : snapshot.hazard.source,
        timestamp: snapshot.hazard.timestamp,
        status: "fresh",
      },
    ],
    uncertainties: snapshot.cascades.some((cascade) => cascade.path.includes("S3"))
      ? [
          {
            statement: "Substation S3 water ingress is not yet confirmed.",
            requiredCheck: "Confirm Substation S3 barrier and pump status within 15 minutes.",
          },
        ]
      : undefined,
  };
}

