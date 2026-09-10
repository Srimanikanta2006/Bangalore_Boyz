import { assetById } from "./pilotGraph.ts";
import { riskLevelFromScore } from "./riskEngine.ts";
import type { InfrastructureGraph, RiskScore, SafeRoute } from "./types.ts";

const ROUTABLE = new Set(["road", "hospital", "building", "school"]);

function riskPenalty(level: ReturnType<typeof riskLevelFromScore>): number {
  if (level === "critical") return 1000;
  if (level === "high") return 100;
  if (level === "medium") return 20;
  return 0;
}

function undirectedNeighbors(graph: InfrastructureGraph, nodeId: string) {
  return graph.edges
    .filter((edge) => edge.fromAssetId === nodeId || edge.toAssetId === nodeId)
    .map((edge) => {
      const neighborId = edge.fromAssetId === nodeId ? edge.toAssetId : edge.fromAssetId;
      return { neighborId, distanceKm: edge.distanceKm ?? 1, edgeId: edge.id };
    });
}

/**
 * Dijkstra with cost = distanceKm + risk penalty on the destination node.
 */
export function findSafeRoute(
  graph: InfrastructureGraph,
  risks: RiskScore[],
  fromId: string,
  toId: string,
): SafeRoute | null {
  const from = assetById(graph, fromId);
  const to = assetById(graph, toId);
  if (!from || !to) return null;

  const riskById = new Map(risks.map((risk) => [risk.assetId, risk]));
  const nodes = graph.assets.filter((asset) => ROUTABLE.has(asset.type)).map((asset) => asset.id);
  if (!nodes.includes(fromId) || !nodes.includes(toId)) return null;

  const dist = new Map<string, number>(nodes.map((id) => [id, Number.POSITIVE_INFINITY]));
  const prev = new Map<string, { node: string; edgeId: string }>();
  dist.set(fromId, 0);
  const remaining = new Set(nodes);

  while (remaining.size > 0) {
    let current: string | undefined;
    let best = Number.POSITIVE_INFINITY;
    for (const id of remaining) {
      const value = dist.get(id) ?? Number.POSITIVE_INFINITY;
      if (value < best) {
        best = value;
        current = id;
      }
    }
    if (!current || best === Number.POSITIVE_INFINITY) break;
    remaining.delete(current);
    if (current === toId) break;

    for (const { neighborId, distanceKm, edgeId } of undirectedNeighbors(graph, current)) {
      if (!nodes.includes(neighborId)) continue;
      const neighborRisk = riskById.get(neighborId);
      const penalty = neighborRisk ? riskPenalty(neighborRisk.level) : 0;
      const next = (dist.get(current) ?? Number.POSITIVE_INFINITY) + distanceKm + penalty;
      if (next < (dist.get(neighborId) ?? Number.POSITIVE_INFINITY)) {
        dist.set(neighborId, next);
        prev.set(neighborId, { node: current, edgeId });
      }
    }
  }

  if (!prev.has(toId) && fromId !== toId) return null;

  const path: string[] = [toId];
  const usedEdgeIds: string[] = [];
  let cursor = toId;
  while (cursor !== fromId) {
    const step = prev.get(cursor);
    if (!step) break;
    usedEdgeIds.push(step.edgeId);
    path.push(step.node);
    cursor = step.node;
  }
  path.reverse();
  if (path[0] !== fromId) return null;

  const avoidedHighRiskSegments = graph.assets
    .filter((asset) => {
      const risk = riskById.get(asset.id);
      return (
        (asset.type === "road" || asset.type === "building") &&
        risk &&
        (risk.level === "high" || risk.level === "critical") &&
        !path.includes(asset.id)
      );
    })
    .map((asset) => asset.id);

  let distanceKm = 0;
  for (let i = 0; i < path.length - 1; i += 1) {
    const hop = undirectedNeighbors(graph, path[i]).find((item) => item.neighborId === path[i + 1]);
    distanceKm += hop?.distanceKm ?? 0;
  }

  return {
    path,
    distanceKm: Math.round(distanceKm * 100) / 100,
    avoidedHighRiskSegments,
  };
}
