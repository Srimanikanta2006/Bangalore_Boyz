export type HazardType =
  | "heavy_rainfall"
  | "flood"
  | "extreme_heat"
  | "poor_air_quality"
  | "cold"
  | "snowfall"
  | "cyclone"
  | "high_tide"
  | "storm_surge";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type AssetType =
  | "drain"
  | "road"
  | "hospital"
  | "school"
  | "utility"
  | "substation"
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
  impact?: string;
}

export interface CausalChain {
  path: string[];
  impact: string;
  etaMinutes?: number;
}

export interface KeyImpact {
  assetId?: string;
  assetName: string;
  description: string;
  timeHorizonMinutes?: number;
  severity: RiskLevel;
}

export interface ActionDependency {
  actionId: string;
  dependsOnActionId?: string;
  rule: string;
}

export interface UncertaintyItem {
  statement: string;
  requiredCheck: string;
}

export interface DataFreshnessItem {
  source: string;
  timestamp?: string;
  status: "fresh" | "stale" | "unconfirmed";
}

export interface RoleSpecificBriefings {
  operator: string;
  hospitalManager: string;
  fieldTeam: string;
  public: string;
}

export interface RecommendedAction {
  actionId: string;
  priority: RiskLevel;
  reason: string;
  targetAssetId?: string;
}

export interface ExplainRequest {
  incidentId: string;
  hazard: HazardContext;
  risk: RiskContext;
  affectedAssets: AffectedAsset[];
  cascade?: CascadeContext;
  causalChains?: CausalChain[];
  evidence: string[];
  uncertainties?: UncertaintyItem[];
  dataFreshness?: DataFreshnessItem[];
}

export interface ExplainResponse {
  incidentId: string;
  situationSummary: string;
  causalChains: CausalChain[];
  keyImpacts: KeyImpact[];
  recommendedActions: RecommendedAction[];
  actionDependencies: ActionDependency[];
  uncertainties: UncertaintyItem[];
  dataFreshness: DataFreshnessItem[];
  roleSpecificBriefings: RoleSpecificBriefings;
  confidence: number;
  /** Legacy top-level compatibility */
  explanation: string;
  /** Legacy top-level compatibility */
  impactSummary: string;
}
