import { propagateCascades } from "./cascadeEngine";
import { assetById, PILOT_GRAPH } from "./pilotGraph";
import { isCascadeOrigin, riskLevelFromScore, scoreGraph } from "./riskEngine";
import type { Hazard, HazardSource, InfrastructureGraph, RiskScore, SimulationSnapshot } from "./types";

let incidentCounter = 0;

export function createHazard(input: {
  rainfallMmPerHour: number;
  source?: HazardSource;
  type?: Hazard["type"];
  zoneId?: string;
}): Hazard {
  return {
    id: `HZ-${Date.now()}`,
    type: input.type ?? (input.rainfallMmPerHour >= 50 ? "cyclone" : "heavy_rainfall"),
    rainfallMmPerHour: input.rainfallMmPerHour,
    source: input.source ?? "simulated",
    timestamp: new Date().toISOString(),
    zoneId: input.zoneId ?? PILOT_GRAPH.zoneId,
  };
}

export function simulateHazard(
  rainfallMmPerHour: number,
  graph: InfrastructureGraph = PILOT_GRAPH,
  source: HazardSource = "simulated",
): SimulationSnapshot {
  if (!Number.isFinite(rainfallMmPerHour) || rainfallMmPerHour < 0) {
    throw new Error("rainfallMmPerHour must be a non-negative number");
  }

  incidentCounter += 1;
  const hazard = createHazard({
    rainfallMmPerHour,
    source,
    zoneId: graph.zoneId,
  });
  const risks = scoreGraph(graph.assets, hazard);
  const risksByAsset = new Map(risks.map((risk) => [risk.assetId, risk]));
  const origins = graph.assets
    .filter((asset) => {
      const risk = risksByAsset.get(asset.id);
      return risk ? isCascadeOrigin(risk, asset) : false;
    })
    .map((asset) => asset.id);

  const cascades = propagateCascades(graph, origins, risksByAsset);
  const mergedRisks = applyDownstreamRisk(graph, risks, cascades);

  return {
    incidentId: `INC-SIM-${String(incidentCounter).padStart(3, "0")}`,
    hazard,
    risks: mergedRisks,
    cascades,
  };
}

function applyDownstreamRisk(
  graph: InfrastructureGraph,
  risks: RiskScore[],
  cascades: SimulationSnapshot["cascades"],
): RiskScore[] {
  const byId = new Map(risks.map((risk) => [risk.assetId, { ...risk }]));

  for (const cascade of cascades) {
    const origin = byId.get(cascade.sourceAssetId);
    if (!origin) continue;
    cascade.path.forEach((assetId, index) => {
      if (index === 0) return;
      const asset = assetById(graph, assetId);
      const current = byId.get(assetId);
      if (!asset || !current) return;
      const inherited =
        asset.type === "hospital" || index === cascade.path.length - 1
          ? origin.score
          : Math.max(current.score, origin.score - 5);
      current.score = Math.min(100, inherited);
      current.level = riskLevelFromScore(current.score);
      current.evidence = [
        ...current.evidence,
        `Inherited cascade from ${cascade.sourceAssetId} via ${cascade.path.join(" -> ")}`,
      ];
    });
  }

  return [...byId.values()];
}

