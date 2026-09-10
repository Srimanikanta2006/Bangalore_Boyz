export type HazardType =
  | "heavy_rainfall"
  | "flood"
  | "extreme_heat"
  | "poor_air_quality"
  | "cold"
  | "snowfall";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type AssetType =
  | "drain"
  | "road"
  | "hospital"
  | "school"
  | "utility"
  | "building"
  | "industrial_site";

export interface HazardContext {
  type: HazardType;
  severity: RiskLevel;
}

export interface RiskContext {
  score: number;
  level: RiskLevel;
  confidence: number;
}

export interface AffectedAsset {
  id: string;
  type: AssetType;
  name: string;
  riskLevel: RiskLevel;
}

export interface CascadeContext {
  path: string[];
  etaMinutes?: number;
}

export interface ExplainRequest {
  incidentId: string;
  hazard: HazardContext;
  risk: RiskContext;
  affectedAssets: AffectedAsset[];
  cascade: CascadeContext;
  evidence: string[];
}

export interface RecommendedAction {
  actionId: string;
  priority: RiskLevel;
  reason: string;
}

export interface ExplainResponse {
  incidentId: string;
  explanation: string;
  impactSummary: string;
  recommendedActions: RecommendedAction[];
  confidence: number;
}

