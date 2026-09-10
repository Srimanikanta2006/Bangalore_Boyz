import { assetById, outgoingEdges } from "./pilotGraph.ts";
import type { CascadeEvent, GraphEdge, InfrastructureGraph, RiskScore } from "./types.ts";

const CRITICAL_TYPES = new Set(["hospital", "school"]);

function impactForPath(path: string[], graph: InfrastructureGraph, edges: GraphEdge[]): string {
  const kinds = new Set(edges.map((edge) => edge.kind));
  const last = assetById(graph, path[path.length - 1]);
  if (kinds.has("power_feed") && last?.type === "hospital") return "Power-continuity risk";
  if (kinds.has("access") && last?.type === "hospital") return "Ambulance access disruption";
  if (last?.type === "hospital") return "Facility operational disruption";
  return "Operational disruption along cascade path";
}

function criticalAssetId(path: string[], graph: InfrastructureGraph): string {
  const critical = [...path].reverse().find((id) => {
    const asset = assetById(graph, id);
    return asset ? CRITICAL_TYPES.has(asset.type) : false;
  });
  return critical ?? path[path.length - 1];
}

/**
 * Walks GraphEdge relationships from high-risk origins.
 * Does not use a hardcoded path array.
 */
export function propagateCascades(
  graph: InfrastructureGraph,
  originAssetIds: string[],
  risksByAsset: Map<string, RiskScore>,
): CascadeEvent[] {
  const events: CascadeEvent[] = [];
  let sequence = 0;

  for (const originId of originAssetIds) {
    if (!assetById(graph, originId)) continue;
    if (outgoingEdges(graph, originId).length === 0) continue;

    const stack: { path: string[]; minutes: number; used: GraphEdge[] }[] = [
      { path: [originId], minutes: 0, used: [] },
    ];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) break;
      const node = current.path[current.path.length - 1];
      const nextEdges = outgoingEdges(graph, node);

      if (nextEdges.length === 0) {
        if (current.path.length > 1) {
          sequence += 1;
          const originRisk = risksByAsset.get(originId);
          events.push({
            eventId: `CSE-${originId}-${sequence}`,
            sourceAssetId: originId,
            path: current.path,
            criticalAssetId: criticalAssetId(current.path, graph),
            etaMinutes: current.minutes,
            impact: impactForPath(current.path, graph, current.used),
            confidence: originRisk?.confidence ?? 0.75,
          });
        }
        continue;
      }

      for (const edge of nextEdges) {
        if (current.path.includes(edge.toAssetId)) continue;
        if (!assetById(graph, edge.toAssetId)) continue;
        stack.push({
          path: [...current.path, edge.toAssetId],
          minutes: current.minutes + edge.delayMinutes,
          used: [...current.used, edge],
        });
      }
    }
  }

  return events.sort((a, b) => a.etaMinutes - b.etaMinutes);
}
