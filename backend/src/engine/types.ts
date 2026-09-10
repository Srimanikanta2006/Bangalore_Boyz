import type { AssetType, HazardType, RiskLevel } from "../ai/schemas.ts";

export type { AssetType, HazardType, RiskLevel };

export type HazardSource = "simulated" | "sensor" | "forecast";

export type EdgeKind = "overflow" | "access" | "power_feed" | "adjacent";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  zoneId: string;
  vulnerability: number;
  historicalIncidentCount: number;
  lat?: number;
  lng?: number;
}

export interface GraphEdge {
  id: string;
  fromAssetId: string;
  toAssetId: string;
  kind: EdgeKind;
  delayMinutes: number;
  distanceKm?: number;
}

export interface InfrastructureGraph {
  zoneId: string;
  zoneName: string;
  assets: Asset[];
  edges: GraphEdge[];
}

export interface Hazard {
  id: string;
  type: HazardType;
  rainfallMmPerHour: number;
  source: HazardSource;
  timestamp: string;
  zoneId: string;
}

export interface RiskScore {
  assetId: string;
  score: number;
  level: RiskLevel;
  confidence: number;
  evidence: string[];
}

export interface CascadeEvent {
  eventId: string;
  sourceAssetId: string;
  path: string[];
  criticalAssetId: string;
  etaMinutes: number;
  impact: string;
  confidence: number;
}

export interface SimulationSnapshot {
  incidentId: string;
  hazard: Hazard;
  risks: RiskScore[];
  cascades: CascadeEvent[];
}

export interface SafeRoute {
  path: string[];
  distanceKm: number;
  avoidedHighRiskSegments: string[];
}
