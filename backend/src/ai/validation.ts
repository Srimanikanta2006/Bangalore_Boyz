import { isAllowedActionPriority, isValidAction } from "./actionCatalog.ts";
import type {
  ActionDependency,
  AffectedAsset,
  AssetType,
  CausalChain,
  DataFreshnessItem,
  ExplainRequest,
  ExplainResponse,
  HazardType,
  KeyImpact,
  RecommendedAction,
  RiskLevel,
  RoleSpecificBriefings,
  UncertaintyItem,
} from "./schemas.ts";

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };

const HAZARD_TYPES: HazardType[] = [
  "heavy_rainfall",
  "flood",
  "extreme_heat",
  "poor_air_quality",
  "cold",
  "snowfall",
  "cyclone",
  "high_tide",
  "storm_surge",
];

const RISK_LEVELS: RiskLevel[] = ["low", "medium", "high", "critical"];

const ASSET_TYPES: AssetType[] = [
  "drain",
  "road",
  "hospital",
  "school",
  "utility",
  "substation",
  "building",
  "industrial_site",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRiskLevel(value: unknown): value is RiskLevel {
  return typeof value === "string" && RISK_LEVELS.includes(value as RiskLevel);
}

function validateAffectedAssets(value: unknown, errors: string[]): AffectedAsset[] | undefined {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push("affectedAssets must be a non-empty array.");
    return undefined;
  }

  const assets: AffectedAsset[] = [];
  value.forEach((item, index) => {
    if (!isRecord(item)) {
      errors.push(`affectedAssets[${index}] must be an object.`);
      return;
    }
    if (!isNonEmptyString(item.id)) errors.push(`affectedAssets[${index}].id must be a non-empty string.`);
    if (!ASSET_TYPES.includes(item.type as AssetType)) errors.push(`affectedAssets[${index}].type is not supported.`);
    if (!isNonEmptyString(item.name)) errors.push(`affectedAssets[${index}].name must be a non-empty string.`);
    if (!isRiskLevel(item.riskLevel)) errors.push(`affectedAssets[${index}].riskLevel is not supported.`);

    if (
      isNonEmptyString(item.id) &&
      ASSET_TYPES.includes(item.type as AssetType) &&
      isNonEmptyString(item.name) &&
      isRiskLevel(item.riskLevel)
    ) {
      assets.push({
        id: item.id,
        type: item.type as AssetType,
        name: item.name,
        riskLevel: item.riskLevel,
      });
    }
  });
  return assets;
}

function validateCausalChainsList(value: unknown, errors: string[]): CausalChain[] {
  if (!Array.isArray(value)) {
    errors.push("causalChains must be an array.");
    return [];
  }
  const chains: CausalChain[] = [];
  value.forEach((item, index) => {
    if (!isRecord(item)) {
      errors.push(`causalChains[${index}] must be an object.`);
      return;
    }
    if (!Array.isArray(item.path) || item.path.length === 0 || !item.path.every(isNonEmptyString)) {
      errors.push(`causalChains[${index}].path must be a non-empty array of strings.`);
    }
    if (!isNonEmptyString(item.impact)) {
      errors.push(`causalChains[${index}].impact must be a non-empty string.`);
    }
    if (item.etaMinutes !== undefined && (typeof item.etaMinutes !== "number" || item.etaMinutes < 0)) {
      errors.push(`causalChains[${index}].etaMinutes must be a non-negative number.`);
    }
    if (
      Array.isArray(item.path) &&
      item.path.length > 0 &&
      item.path.every(isNonEmptyString) &&
      isNonEmptyString(item.impact)
    ) {
      const chain: CausalChain = {
        path: item.path as string[],
        impact: item.impact,
      };
      if (typeof item.etaMinutes === "number") chain.etaMinutes = item.etaMinutes;
      chains.push(chain);
    }
  });
  return chains;
}

function validateKeyImpactsList(value: unknown, errors: string[]): KeyImpact[] {
  if (!Array.isArray(value)) {
    errors.push("keyImpacts must be an array.");
    return [];
  }
  const impacts: KeyImpact[] = [];
  value.forEach((item, index) => {
    if (!isRecord(item)) {
      errors.push(`keyImpacts[${index}] must be an object.`);
      return;
    }
    if (!isNonEmptyString(item.assetName)) errors.push(`keyImpacts[${index}].assetName must be a non-empty string.`);
    if (!isNonEmptyString(item.description)) errors.push(`keyImpacts[${index}].description must be a non-empty string.`);
    if (!isRiskLevel(item.severity)) errors.push(`keyImpacts[${index}].severity is not supported.`);
    if (item.timeHorizonMinutes !== undefined && (typeof item.timeHorizonMinutes !== "number" || item.timeHorizonMinutes < 0)) {
      errors.push(`keyImpacts[${index}].timeHorizonMinutes must be a non-negative number.`);
    }

    if (isNonEmptyString(item.assetName) && isNonEmptyString(item.description) && isRiskLevel(item.severity)) {
      const impact: KeyImpact = {
        assetName: item.assetName,
        description: item.description,
        severity: item.severity,
      };
      if (typeof item.assetId === "string") impact.assetId = item.assetId;
      if (typeof item.timeHorizonMinutes === "number") impact.timeHorizonMinutes = item.timeHorizonMinutes;
      impacts.push(impact);
    }
  });
  return impacts;
}

function validateActionDependenciesList(value: unknown, errors: string[]): ActionDependency[] {
  if (!Array.isArray(value)) {
    errors.push("actionDependencies must be an array.");
    return [];
  }
  const deps: ActionDependency[] = [];
  value.forEach((item, index) => {
    if (!isRecord(item)) {
      errors.push(`actionDependencies[${index}] must be an object.`);
      return;
    }
    if (!isNonEmptyString(item.actionId)) errors.push(`actionDependencies[${index}].actionId must be a non-empty string.`);
    if (!isNonEmptyString(item.rule)) errors.push(`actionDependencies[${index}].rule must be a non-empty string.`);

    if (isNonEmptyString(item.actionId) && isNonEmptyString(item.rule)) {
      const dep: ActionDependency = {
        actionId: item.actionId,
        rule: item.rule,
      };
      if (typeof item.dependsOnActionId === "string") dep.dependsOnActionId = item.dependsOnActionId;
      deps.push(dep);
    }
  });
  return deps;
}

function validateUncertaintiesList(value: unknown, errors: string[]): UncertaintyItem[] {
  if (!Array.isArray(value)) {
    errors.push("uncertainties must be an array.");
    return [];
  }
  const items: UncertaintyItem[] = [];
  value.forEach((item, index) => {
    if (!isRecord(item)) {
      errors.push(`uncertainties[${index}] must be an object.`);
      return;
    }
    if (!isNonEmptyString(item.statement)) errors.push(`uncertainties[${index}].statement must be a non-empty string.`);
    if (!isNonEmptyString(item.requiredCheck)) errors.push(`uncertainties[${index}].requiredCheck must be a non-empty string.`);

    if (isNonEmptyString(item.statement) && isNonEmptyString(item.requiredCheck)) {
      items.push({ statement: item.statement, requiredCheck: item.requiredCheck });
    }
  });
  return items;
}

function validateDataFreshnessList(value: unknown, errors: string[]): DataFreshnessItem[] {
  if (!Array.isArray(value)) {
    errors.push("dataFreshness must be an array.");
    return [];
  }
  const items: DataFreshnessItem[] = [];
  const allowedStatuses = ["fresh", "stale", "unconfirmed"];
  value.forEach((item, index) => {
    if (!isRecord(item)) {
      errors.push(`dataFreshness[${index}] must be an object.`);
      return;
    }
    if (!isNonEmptyString(item.source)) errors.push(`dataFreshness[${index}].source must be a non-empty string.`);
    if (typeof item.status !== "string" || !allowedStatuses.includes(item.status)) {
      errors.push(`dataFreshness[${index}].status must be one of: fresh, stale, unconfirmed.`);
    }

    if (isNonEmptyString(item.source) && typeof item.status === "string" && allowedStatuses.includes(item.status)) {
      const freshness: DataFreshnessItem = {
        source: item.source,
        status: item.status as "fresh" | "stale" | "unconfirmed",
      };
      if (typeof item.timestamp === "string") freshness.timestamp = item.timestamp;
      items.push(freshness);
    }
  });
  return items;
}

function validateRoleSpecificBriefingsObj(value: unknown, errors: string[]): RoleSpecificBriefings | undefined {
  if (!isRecord(value)) {
    errors.push("roleSpecificBriefings must be an object.");
    return undefined;
  }
  if (!isNonEmptyString(value.operator)) errors.push("roleSpecificBriefings.operator must be a non-empty string.");
  if (!isNonEmptyString(value.hospitalManager)) errors.push("roleSpecificBriefings.hospitalManager must be a non-empty string.");
  if (!isNonEmptyString(value.fieldTeam)) errors.push("roleSpecificBriefings.fieldTeam must be a non-empty string.");
  if (!isNonEmptyString(value.public)) errors.push("roleSpecificBriefings.public must be a non-empty string.");

  if (
    isNonEmptyString(value.operator) &&
    isNonEmptyString(value.hospitalManager) &&
    isNonEmptyString(value.fieldTeam) &&
    isNonEmptyString(value.public)
  ) {
    return {
      operator: value.operator,
      hospitalManager: value.hospitalManager,
      fieldTeam: value.fieldTeam,
      public: value.public,
    };
  }
  return undefined;
}

/** Validates untrusted incident input before it reaches P4 explanation logic. */
export function validateExplainRequest(input: unknown): ValidationResult<ExplainRequest> {
  const errors: string[] = [];
  if (!isRecord(input)) return { success: false, errors: ["Request body must be an object."] };

  if (!isNonEmptyString(input.incidentId)) errors.push("incidentId must be a non-empty string.");

  const hazard = isRecord(input.hazard) ? input.hazard : undefined;
  if (!hazard) {
    errors.push("hazard must be an object.");
  } else {
    if (!HAZARD_TYPES.includes(hazard.type as HazardType)) errors.push("hazard.type is not supported.");
    if (!isRiskLevel(hazard.severity)) errors.push("hazard.severity is not supported.");
  }

  const risk = isRecord(input.risk) ? input.risk : undefined;
  if (!risk) {
    errors.push("risk must be an object.");
  } else {
    if (typeof risk.score !== "number" || risk.score < 0 || risk.score > 100) {
      errors.push("risk.score must be a number from 0 to 100.");
    }
    if (!isRiskLevel(risk.level)) errors.push("risk.level is not supported.");
    if (typeof risk.confidence !== "number" || risk.confidence < 0 || risk.confidence > 1) {
      errors.push("risk.confidence must be a number from 0 to 1.");
    }
  }

  const affectedAssets = validateAffectedAssets(input.affectedAssets, errors);

  // Validate cascade or causalChains (must provide at least one)
  const hasCascade = isRecord(input.cascade) && Array.isArray(input.cascade.path);
  const hasChains = Array.isArray(input.causalChains) && input.causalChains.length > 0;

  if (!hasCascade && !hasChains) {
    errors.push("Either cascade or causalChains must be provided with valid paths.");
  }

  let cascadeObj = undefined;
  if (isRecord(input.cascade)) {
    if (!Array.isArray(input.cascade.path) || input.cascade.path.length === 0 || !input.cascade.path.every(isNonEmptyString)) {
      errors.push("cascade.path must be a non-empty array of asset IDs.");
    }
    if (input.cascade.etaMinutes !== undefined && (typeof input.cascade.etaMinutes !== "number" || input.cascade.etaMinutes < 0)) {
      errors.push("cascade.etaMinutes must be a non-negative number when provided.");
    }
    if (Array.isArray(input.cascade.path) && input.cascade.path.every(isNonEmptyString)) {
      cascadeObj = {
        path: input.cascade.path as string[],
        etaMinutes: typeof input.cascade.etaMinutes === "number" ? input.cascade.etaMinutes : undefined,
        impact: typeof input.cascade.impact === "string" ? input.cascade.impact : undefined,
      };
    }
  }

  let causalChainsList = undefined;
  if (input.causalChains !== undefined) {
    causalChainsList = validateCausalChainsList(input.causalChains, errors);
  }

  if (!Array.isArray(input.evidence) || input.evidence.length === 0 || !input.evidence.every(isNonEmptyString)) {
    errors.push("evidence must be a non-empty array of non-empty strings.");
  }

  let uncertaintiesList = undefined;
  if (input.uncertainties !== undefined) {
    uncertaintiesList = validateUncertaintiesList(input.uncertainties, errors);
  }

  let dataFreshnessList = undefined;
  if (input.dataFreshness !== undefined) {
    dataFreshnessList = validateDataFreshnessList(input.dataFreshness, errors);
  }

  if (errors.length > 0 || !hazard || !risk || !affectedAssets) {
    return { success: false, errors };
  }

  const req: ExplainRequest = {
    incidentId: input.incidentId as string,
    hazard: { type: hazard.type as HazardType, severity: hazard.severity as RiskLevel },
    risk: { score: risk.score as number, level: risk.level as RiskLevel, confidence: risk.confidence as number },
    affectedAssets,
    evidence: input.evidence as string[],
  };
  if (cascadeObj) req.cascade = cascadeObj;
  if (causalChainsList) req.causalChains = causalChainsList;
  if (uncertaintiesList) req.uncertainties = uncertaintiesList;
  if (dataFreshnessList) req.dataFreshness = dataFreshnessList;

  return { success: true, data: req };
}

/** Validates untrusted model output before it is displayed or handed to operator/P1. */
export function validateRecommendedActions(input: unknown): ValidationResult<RecommendedAction[]> {
  if (!Array.isArray(input)) return { success: false, errors: ["recommendedActions must be an array."] };

  const errors: string[] = [];
  const actions: RecommendedAction[] = [];
  input.forEach((item, index) => {
    if (!isRecord(item)) {
      errors.push(`recommendedActions[${index}] must be an object.`);
      return;
    }
    if (!isNonEmptyString(item.actionId) || !isValidAction(item.actionId)) {
      errors.push(`recommendedActions[${index}].actionId is not in the controlled catalog.`);
    }
    if (!isRiskLevel(item.priority) || !isNonEmptyString(item.actionId) || !isAllowedActionPriority(item.actionId, item.priority)) {
      errors.push(`recommendedActions[${index}].priority is not allowed for its action.`);
    }
    if (!isNonEmptyString(item.reason)) errors.push(`recommendedActions[${index}].reason must be a non-empty string.`);

    if (
      isNonEmptyString(item.actionId) &&
      isRiskLevel(item.priority) &&
      isNonEmptyString(item.reason) &&
      isAllowedActionPriority(item.actionId, item.priority)
    ) {
      const act: RecommendedAction = {
        actionId: item.actionId,
        priority: item.priority,
        reason: item.reason,
      };
      if (typeof item.targetAssetId === "string") act.targetAssetId = item.targetAssetId;
      actions.push(act);
    }
  });
  return errors.length ? { success: false, errors } : { success: true, data: actions };
}

export function validateExplainResponse(input: unknown): ValidationResult<ExplainResponse> {
  if (!isRecord(input)) return { success: false, errors: ["Response must be an object."] };

  const errors: string[] = [];
  if (!isNonEmptyString(input.incidentId)) errors.push("incidentId must be a non-empty string.");

  const situationSummary = isNonEmptyString(input.situationSummary)
    ? input.situationSummary
    : isNonEmptyString(input.explanation)
    ? input.explanation
    : undefined;

  if (!situationSummary) errors.push("situationSummary must be a non-empty string.");

  if (typeof input.confidence !== "number" || input.confidence < 0 || input.confidence > 1) {
    errors.push("confidence must be a number from 0 to 1.");
  }

  const actions = validateRecommendedActions(input.recommendedActions);
  if (!actions.success) errors.push(...actions.errors);

  const causalChains = validateCausalChainsList(input.causalChains ?? [], errors);
  const keyImpacts = validateKeyImpactsList(input.keyImpacts ?? [], errors);
  const actionDependencies = validateActionDependenciesList(input.actionDependencies ?? [], errors);
  const uncertainties = validateUncertaintiesList(input.uncertainties ?? [], errors);
  const dataFreshness = validateDataFreshnessList(input.dataFreshness ?? [], errors);
  const roleSpecificBriefings = validateRoleSpecificBriefingsObj(input.roleSpecificBriefings, errors);

  if (errors.length || !actions.success || !situationSummary || !roleSpecificBriefings) {
    return { success: false, errors };
  }

  const explanation = isNonEmptyString(input.explanation) ? input.explanation : situationSummary;
  const impactSummary = isNonEmptyString(input.impactSummary)
    ? input.impactSummary
    : keyImpacts.map((k) => `${k.assetName}: ${k.description}`).join(" | ");

  return {
    success: true,
    data: {
      incidentId: input.incidentId as string,
      situationSummary,
      causalChains,
      keyImpacts,
      recommendedActions: actions.data,
      actionDependencies,
      uncertainties,
      dataFreshness,
      roleSpecificBriefings,
      confidence: input.confidence as number,
      explanation,
      impactSummary,
    },
  };
}
