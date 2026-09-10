import { isAllowedActionPriority, isValidAction } from "./actionCatalog.ts";
import type {
  AffectedAsset,
  AssetType,
  ExplainRequest,
  ExplainResponse,
  HazardType,
  RecommendedAction,
  RiskLevel,
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
];

const RISK_LEVELS: RiskLevel[] = ["low", "medium", "high", "critical"];

const ASSET_TYPES: AssetType[] = [
  "drain",
  "road",
  "hospital",
  "school",
  "utility",
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

  const cascade = isRecord(input.cascade) ? input.cascade : undefined;
  if (!cascade || !Array.isArray(cascade.path) || cascade.path.length === 0 || !cascade.path.every(isNonEmptyString)) {
    errors.push("cascade.path must be a non-empty array of asset IDs.");
  }
  if (cascade?.etaMinutes !== undefined && (typeof cascade.etaMinutes !== "number" || cascade.etaMinutes < 0)) {
    errors.push("cascade.etaMinutes must be a non-negative number when provided.");
  }

  if (!Array.isArray(input.evidence) || input.evidence.length === 0 || !input.evidence.every(isNonEmptyString)) {
    errors.push("evidence must be a non-empty array of non-empty strings.");
  }

  if (errors.length > 0 || !hazard || !risk || !affectedAssets || !cascade) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      incidentId: input.incidentId as string,
      hazard: { type: hazard.type as HazardType, severity: hazard.severity as RiskLevel },
      risk: { score: risk.score as number, level: risk.level as RiskLevel, confidence: risk.confidence as number },
      affectedAssets,
      cascade: { path: cascade.path as string[], etaMinutes: cascade.etaMinutes as number | undefined },
      evidence: input.evidence as string[],
    },
  };
}

/** Validates untrusted model output before it is displayed or handed to P1. */
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

    if (isNonEmptyString(item.actionId) && isRiskLevel(item.priority) && isNonEmptyString(item.reason) && isAllowedActionPriority(item.actionId, item.priority)) {
      actions.push({ actionId: item.actionId, priority: item.priority, reason: item.reason });
    }
  });
  return errors.length ? { success: false, errors } : { success: true, data: actions };
}

export function validateExplainResponse(input: unknown): ValidationResult<ExplainResponse> {
  if (!isRecord(input)) return { success: false, errors: ["Response must be an object."] };

  const errors: string[] = [];
  if (!isNonEmptyString(input.incidentId)) errors.push("incidentId must be a non-empty string.");
  if (!isNonEmptyString(input.explanation)) errors.push("explanation must be a non-empty string.");
  if (!isNonEmptyString(input.impactSummary)) errors.push("impactSummary must be a non-empty string.");
  if (typeof input.confidence !== "number" || input.confidence < 0 || input.confidence > 1) {
    errors.push("confidence must be a number from 0 to 1.");
  }
  const actions = validateRecommendedActions(input.recommendedActions);
  if (!actions.success) errors.push(...actions.errors);

  if (errors.length || !actions.success) return { success: false, errors };
  return {
    success: true,
    data: {
      incidentId: input.incidentId as string,
      explanation: input.explanation as string,
      impactSummary: input.impactSummary as string,
      recommendedActions: actions.data,
      confidence: input.confidence as number,
    },
  };
}

