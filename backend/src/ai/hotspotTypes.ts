import type { HazardType, RiskLevel } from "./schemas.ts";

export type HotspotTrend = "increasing" | "stable" | "decreasing" | "insufficient_data";

export type LongTermActionId =
  | "drainage_capacity_upgrade"
  | "drainage_maintenance"
  | "road_drainage_improvement"
  | "heat_mitigation"
  | "air_quality_monitoring"
  | "infrastructure_reinforcement"
  | "flood_barrier_installation"
  | "permeable_pavement_retrofit"
  | "urban_canopy_expansion";

export interface HistoricalIncident {
  incidentId: string;
  timestamp: string; // ISO 8601
  assetId: string;
  assetName?: string;
  hazardType: HazardType;
  severity: RiskLevel;
  riskScore?: number;
  resolved?: boolean;
  metadata?: Record<string, unknown>;
}

export interface LongTermActionRecommendation {
  actionId: LongTermActionId;
  label: string;
  description: string;
  horizon: "short_term_maintenance" | "medium_term_retrofit" | "long_term_capital";
  rationale: string;
}

export interface Hotspot {
  hotspotId: string;
  assetId: string;
  assetName?: string;
  hazardType: HazardType;
  incidentCount: number;
  recurrenceScore: number; // 0 - 100
  severityScore: number; // 0 - 100
  lastIncidentAt: string;
  firstIncidentAt: string;
  timespanDays: number;
  trend: HotspotTrend;
  confidence: number; // 0 - 1
  explanation: string;
  recommendedLongTermAction: LongTermActionRecommendation;
}

export interface HotspotConfig {
  /** Minimum recurring incidents before an asset is deemed a hotspot (default: 2) */
  minIncidentCount?: number;
  /** Minimum recurrence score (0-100) to qualify as a hotspot (default: 15) */
  minRecurrenceScore?: number;
  /** Reference timestamp (ISO string or unix ms) to compute recency against (default: Date.now()) */
  referenceTimestamp?: string | number;
  /** Half-life in days for recency exponential decay (default: 90 days) */
  halfLifeDays?: number;
}

export interface IncidentValidationRejection {
  index: number;
  incidentId?: string;
  errors: string[];
}

export interface IncidentBatchValidationResult {
  valid: HistoricalIncident[];
  rejections: IncidentValidationRejection[];
}
