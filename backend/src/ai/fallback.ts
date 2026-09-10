import type {
  ActionDependency,
  AffectedAsset,
  CausalChain,
  ExplainRequest,
  ExplainResponse,
  KeyImpact,
  RecommendedAction,
  RiskLevel,
  RoleSpecificBriefings,
  UncertaintyItem,
} from "./schemas.ts";

function displayHazard(type: string): string {
  return type.replaceAll("_", " ");
}

function resolveAssetName(id: string, assets: AffectedAsset[]): string {
  const asset = assets.find((a) => a.id === id);
  return asset?.name ?? id;
}

function formatPath(path: string[], assets: AffectedAsset[]): string[] {
  return path.map((id) => resolveAssetName(id, assets));
}

function priorityForRisk(level: RiskLevel): RiskLevel {
  return level === "critical" ? "critical" : "high";
}

function normalizeChains(request: ExplainRequest): CausalChain[] {
  if (request.causalChains && request.causalChains.length > 0) {
    return request.causalChains.map((chain) => ({
      path: formatPath(chain.path, request.affectedAssets),
      impact: chain.impact,
      etaMinutes: chain.etaMinutes,
    }));
  }
  if (request.cascade && request.cascade.path.length > 0) {
    return [
      {
        path: formatPath(request.cascade.path, request.affectedAssets),
        impact: request.cascade.impact ?? "Operational disruption along cascade path",
        etaMinutes: request.cascade.etaMinutes,
      },
    ];
  }
  return [];
}

/**
 * Builds a deterministic, compound cascade explanation without calling an LLM.
 * Synthesizes multi-path cascade risks, prioritizes safe human-approved actions,
 * tracks uncertainties, and generates tailored role-specific briefings.
 */
export function buildFallbackExplanation(request: ExplainRequest): ExplainResponse {
  const chains = normalizeChains(request);
  const assets = request.affectedAssets;

  const drainAsset = assets.find((a) => a.type === "drain");
  const roadAsset = assets.find((a) => a.type === "road");
  const hospitalAsset = assets.find((a) => a.type === "hospital");
  const substationAsset = assets.find((a) => a.type === "substation" || a.type === "utility");

  // Determine earliest ETA
  const etas = chains
    .map((c) => c.etaMinutes)
    .filter((eta): eta is number => typeof eta === "number" && eta > 0);
  const earliestEta = etas.length > 0 ? Math.min(...etas) : request.cascade?.etaMinutes ?? 20;

  // Build situation summary
  let situationSummary: string;
  if (chains.length >= 2 && hospitalAsset) {
    situationSummary = `This is not only a ${displayHazard(request.hazard.type)} incident. It is a compound access-and-power continuity threat to ${hospitalAsset.name}.`;
  } else if (hospitalAsset && roadAsset) {
    situationSummary = `Compound operational risk: ${displayHazard(request.hazard.type)} threatens access to ${hospitalAsset.name} via ${roadAsset.name}.`;
  } else {
    situationSummary = `${displayHazard(request.hazard.type)} has produced a ${request.risk.level} risk assessment (${request.risk.score}/100) affecting verified infrastructure assets.`;
  }

  // Key impacts
  const keyImpacts: KeyImpact[] = [];
  if (roadAsset) {
    keyImpacts.push({
      assetId: roadAsset.id,
      assetName: roadAsset.name,
      description: "Surface flooding threatening emergency vehicle transit",
      timeHorizonMinutes: earliestEta,
      severity: roadAsset.riskLevel,
    });
  }
  if (substationAsset) {
    const subChain = chains.find((c) => c.path.some((p) => p.includes(substationAsset.name) || p.includes(substationAsset.id)));
    keyImpacts.push({
      assetId: substationAsset.id,
      assetName: substationAsset.name,
      description: "Water ingress risk threatening grid continuity and facility backup systems",
      timeHorizonMinutes: subChain?.etaMinutes ?? (earliestEta + 15),
      severity: substationAsset.riskLevel,
    });
  }
  if (hospitalAsset) {
    const isCompound = substationAsset !== undefined && roadAsset !== undefined;
    keyImpacts.push({
      assetId: hospitalAsset.id,
      assetName: hospitalAsset.name,
      description: isCompound
        ? "Dual vulnerability: ambulance access disruption and backup-power risk"
        : "Facility access disruption for emergency transport",
      timeHorizonMinutes: earliestEta,
      severity: hospitalAsset.riskLevel,
    });
  }
  if (keyImpacts.length === 0) {
    assets.forEach((asset) => {
      keyImpacts.push({
        assetId: asset.id,
        assetName: asset.name,
        description: `Operational risk linked to ${displayHazard(request.hazard.type)}`,
        timeHorizonMinutes: earliestEta,
        severity: asset.riskLevel,
      });
    });
  }

  // Prioritized actions
  const recommendedActions: RecommendedAction[] = [];
  if (drainAsset) {
    recommendedActions.push({
      actionId: "dispatch_drainage_team",
      priority: "critical",
      reason: `Inspect or clear ${drainAsset.name} immediately to prevent earliest cascade progression.`,
      targetAssetId: drainAsset.id,
    });
  }
  if (roadAsset && hospitalAsset) {
    recommendedActions.push({
      actionId: "open_alternate_route",
      priority: "critical",
      reason: `Establish verified alternate transit before ${roadAsset.name} becomes impassable.`,
      targetAssetId: roadAsset.id,
    });
  }
  if (hospitalAsset) {
    recommendedActions.push({
      actionId: "notify_facility",
      priority: "high",
      reason: `Alert ${hospitalAsset.name} to activate internal emergency and backup access protocols.`,
      targetAssetId: hospitalAsset.id,
    });
    recommendedActions.push({
      actionId: "pre_position_ambulance",
      priority: "high",
      reason: `Pre-position emergency transport outside the flood perimeter to mitigate transit delay.`,
      targetAssetId: hospitalAsset.id,
    });
  }
  if (recommendedActions.length === 0) {
    recommendedActions.push({
      actionId: "issue_local_advisory",
      priority: priorityForRisk(request.risk.level),
      reason: "Share verified localized risk while operational response is organized.",
    });
  }

  // Action dependencies
  const actionDependencies: ActionDependency[] = [];
  if (roadAsset && recommendedActions.some((a) => a.actionId === "open_alternate_route")) {
    actionDependencies.push({
      actionId: "close_road",
      dependsOnActionId: "open_alternate_route",
      rule: `Do not close ${roadAsset.name} until verified alternate route is confirmed operational.`,
    });
  }
  if (drainAsset) {
    actionDependencies.push({
      actionId: "dispatch_drainage_team",
      rule: `Dispatch drainage team to ${drainAsset.name} within first ${Math.min(earliestEta, 15)} minutes to mitigate downstream inundation.`,
    });
  }

  // Uncertainties
  const uncertainties: UncertaintyItem[] = request.uncertainties && request.uncertainties.length > 0
    ? request.uncertainties
    : [];

  if (uncertainties.length === 0 && substationAsset) {
    uncertainties.push({
      statement: `${substationAsset.name} water ingress is not yet confirmed.`,
      requiredCheck: `Confirm ${substationAsset.name} barrier and pump status within 15 minutes.`,
    });
  }

  // Data freshness
  const dataFreshness = request.dataFreshness && request.dataFreshness.length > 0
    ? request.dataFreshness
    : [
        {
          source: "Hydrological Sensors & Risk Engine",
          timestamp: new Date().toISOString(),
          status: "fresh" as const,
        },
      ];

  // Role-specific briefings
  const roadName = roadAsset?.name ?? "affected thoroughfare";
  const hospitalName = hospitalAsset?.name ?? "affected medical facility";
  const drainName = drainAsset?.name ?? "upstream drainage";

  const roleSpecificBriefings: RoleSpecificBriefings = {
    operator: `Compound incident threatening ${hospitalName}. Prioritize clearing ${drainName} and opening alternate ambulance routes before considering closing ${roadName}.`,
    hospitalManager: `Ambulance access via ${roadName} may be disrupted in ${earliestEta} minutes. Activate internal access contingencies and verify generator fuel levels.`,
    fieldTeam: `Clear and inspect ${drainName} immediately; resolving this bottleneck protects ${roadName} and emergency access to ${hospitalName}.`,
    public: `Avoid ${roadName} due to localized flooding risk. Follow verified municipal diversions.`,
  };

  // Backward compatibility strings
  const chainText = chains.length > 0
    ? chains.map((c) => `${c.path.join(" -> ")}${c.etaMinutes ? ` (${c.etaMinutes}m)` : ""}`).join("; ")
    : assets.map((a) => a.name).join(" -> ");

  const explanation = `${situationSummary} Competing cascade paths: ${chainText}. Verified evidence: ${request.evidence.join("; ")}.`;
  const impactSummary = keyImpacts.map((k) => `${k.assetName}: ${k.description}`).join(" | ");

  return {
    incidentId: request.incidentId,
    situationSummary,
    causalChains: chains,
    keyImpacts,
    recommendedActions,
    actionDependencies,
    uncertainties,
    dataFreshness,
    roleSpecificBriefings,
    confidence: Math.min(request.risk.confidence, 0.9),
    explanation,
    impactSummary,
  };
}
