export type HazardType = 'heavy_rainfall' | 'heat_wave' | 'flood';
export type AssetType = 'drain' | 'road' | 'hospital' | 'substation' | 'school' | 'pump_station';
export type CriticalityLevel = 'critical' | 'high' | 'medium' | 'low' | 'normal';
export type DependencyType = 'drainage' | 'access' | 'power' | 'water';
export type ResponseStatus = 'pending' | 'assigned' | 'acknowledged' | 'in_progress' | 'completed';
export type ActionType = 'pre_position_ambulance' | 'deploy_pump' | 'close_road' | 'evacuate';
export type SimulationPhase = 'baseline' | 'escalated';

export interface Hazard {
  id: string;
  type: HazardType;
  zoneId: string;
  intensity: number;
  startedAt: string;
  source: string;
  label: string;
  rainfallMmHr?: number;
  severity: number;
  status: 'active' | 'monitoring' | 'inactive';
}

export interface Asset {
  id: string;
  zoneId: string;
  name: string;
  type: AssetType;
  criticality: CriticalityLevel;
  lat: number;
  lng: number;
  shortCode: string;
}

export interface GraphEdge {
  id: string;
  sourceAssetId: string;
  targetAssetId: string;
  dependencyType: DependencyType;
  baseRiskWeight: number;
  distanceMeters: number;
}

export interface RiskScore {
  assetId: string;
  hazardId: string;
  score: number;
  confidence: number;
  evidence: string[];
  computedAt: string;
  level: CriticalityLevel;
}

export interface CascadeEvent {
  id: string;
  hazardId: string;
  path: string[];
  criticalAssetId: string;
  etaMinutes: number;
  explanation: string;
  recommendedActions: RecommendedAction[];
  criticalService: string;
  impactDescription: string;
  alternativeRoute?: string;
}

export interface RecommendedAction {
  actionType: ActionType;
  label: string;
  team: string;
  priority: CriticalityLevel;
}

export interface ResponseAction {
  id: string;
  cascadeEventId: string;
  actionType: ActionType;
  assignedTeam: string;
  status: ResponseStatus;
  createdAt: string | null;
  acknowledgedAt: string | null;
  completedAt: string | null;
  targetAssetId: string;
  description: string;
}

export interface DashboardSummary {
  activeHazards: number;
  assetsAtRisk: number;
  criticalAssets: number;
  activeResponses: number;
  servicesAtRisk: number;
}

export interface ExplanationFacts {
  hazard: Hazard;
  cascade: CascadeEvent;
  riskScores: Record<string, RiskScore>;
  assets: Record<string, Asset>;
}

export interface GeoFeatureCollection {
  type: 'FeatureCollection';
  features: GeoFeature[];
}

export interface GeoFeature {
  type: 'Feature';
  properties: Record<string, unknown>;
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon';
    coordinates: number[] | number[][] | number[][][];
  };
}
