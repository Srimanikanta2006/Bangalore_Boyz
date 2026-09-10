import type {
  AffectedAsset,
  ExplainRequest,
  ExplainResponse,
  RecommendedAction,
  RiskLevel,
} from "./schemas.ts";

function displayHazard(type: string): string {
  return type.replaceAll("_", " ");
}

function displayCascadePath(request: ExplainRequest): string {
  return request.cascade.path
    .map((id) => request.affectedAssets.find((asset) => asset.id === id)?.name ?? id)
    .join(" â ");
}

function priorityForRisk(level: RiskLevel): RiskLevel {
  return level === "critical" ? "critical" : "high";
}

function hasHighRiskAsset(assets: AffectedAsset[], type: AffectedAsset["type"]): boolean {
  return assets.some(
    (asset) =>
      asset.type === type && (asset.riskLevel === "high" || asset.riskLevel === "critical"),
  );
}

/**
 * Produces dependable operator guidance without calling an LLM. It only uses
 * supplied incident facts and action IDs from the controlled catalog.
 */
export function buildFallbackExplanation(request: ExplainRequest): ExplainResponse {
  const affectedNames = request.affectedAssets.map((asset) => asset.name);
  const cascadePath = displayCascadePath(request);
  const timeWindow = request.cascade.etaMinutes
    ? ` within approximately ${request.cascade.etaMinutes} minutes`
    : "";
  const evidenceSentence = request.evidence.length
    ? ` Verified evidence: ${request.evidence.join("; ")}.`
    : "";

  const explanation = `${displayHazard(request.hazard.type)} has produced a ${request.risk.level} risk assessment (${request.risk.score}/100).${
    cascadePath ? ` The verified cascade path is ${cascadePath}${timeWindow}.` : ""
  }${evidenceSentence}`;

  const recommendedActions: RecommendedAction[] = [];
  if (hasHighRiskAsset(request.affectedAssets, "drain")) {
    recommendedActions.push({
      actionId: "dispatch_drainage_team",
      priority: priorityForRisk(request.risk.level),
      reason: "Inspect or clear the verified high-risk drainage location before the cascade progresses.",
    });
  }
  if (hasHighRiskAsset(request.affectedAssets, "hospital")) {
    recommendedActions.push({
      actionId: "notify_facility",
      priority: request.risk.level === "critical" ? "high" : priorityForRisk(request.risk.level),
      reason: "The verified cascade may disrupt access to the affected healthcare facility.",
    });
  }
  if (recommendedActions.length === 0 && request.risk.level !== "low") {
    recommendedActions.push({
      actionId: "issue_local_advisory",
      priority: priorityForRisk(request.risk.level),
      reason: "Share the verified localized risk while the operator reviews the incident.",
    });
  }

  return {
    incidentId: request.incidentId,
    explanation,
    impactSummary: affectedNames.length
      ? `Potential operational impact: ${affectedNames.join(", ")}.`
      : "Potential operational impact has not yet been linked to a verified asset.",
    recommendedActions,
    confidence: Math.min(request.risk.confidence, 0.9),
  };
}

