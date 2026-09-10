export type AssetType =
  | 'HOSPITAL'
  | 'POWER_SUBSTATION'
  | 'METRO_STATION'
  | 'STORMWATER_PUMP'
  | 'WATER_TREATMENT'
  | 'RESIDENTIAL_SETTLEMENT'
  | 'INDUSTRIAL_PARK'
  | 'CRITICAL_ROAD_JUNCTION';

export type CriticalityLevel = 1 | 2 | 3 | 4 | 5;

export interface Ward {
  id: string;
  name: string;
  code: string;
  center: [number, number];
  boundaries: [number, number][];
  population: number;
  areaKm2: number;
  avgElevationM: number;
  drainageCapacityMmHr: number;
  imperviousSurfacePct: number;
  treeCanopyPct: number;
  criticalAssetsCount?: number;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  wardId: string;
  wardName: string;
  location: {
    lat: number;
    lng: number;
  };
  elevationM: number;
  drainageCapacityMmHr: number;
  imperviousPct: number;
  criticality: CriticalityLevel;
  hasBackupPower: boolean;
  basementEquipment: boolean;
  hasDewateringPumps: boolean;
  populationServed: number;
  contactTeam: string;
  emergencyContact: string;
  status: 'OPERATIONAL' | 'AT_RISK' | 'DISRUPTED' | 'PROTECTED';
}

export interface WeatherReading {
  timestamp: string;
  source: 'LIVE_API' | 'SIMULATION' | 'CACHED_FALLBACK';
  cityName: string;
  temperatureC: number;
  apparentTempC: number;
  relativeHumidityPct: number;
  precipitationRateMmHr: number;
  precipitationAccumulation24hMm: number;
  windSpeedKmh: number;
  uvIndex: number;
  soilMoisturePct: number;
  waterGaugeLevelM?: number;
  status: 'NORMAL' | 'HEAVY_RAIN' | 'CLOUDBURST' | 'HEATWAVE' | 'SEVERE_HEAT';
}

export interface RiskFactorWeights {
  hazardContribution: number;
  exposureContribution: number;
  vulnerabilityContribution: number;
  resilienceMitigation: number;
}

export interface FloodRiskAssessment {
  score: number;
  level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  projectedInundationDepthCm: number;
  drainageDeficitMmHr: number;
  factors: RiskFactorWeights;
  explanation: string;
}

export interface HeatRiskAssessment {
  score: number;
  level: 'LOW' | 'ADVISORY' | 'WARNING' | 'EMERGENCY';
  apparentTempC: number;
  wetBulbGlobeTempC: number;
  heatStrainIndex: number;
  factors: RiskFactorWeights;
  explanation: string;
}

export interface AssetRiskAssessment {
  assetId: string;
  assetName: string;
  assetType: AssetType;
  wardId: string;
  wardName: string;
  criticality: CriticalityLevel;
  location: { lat: number; lng: number };
  floodRisk: FloodRiskAssessment;
  heatRisk: HeatRiskAssessment;
  compositeRiskScore: number;
  compositeLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  primaryThreat: 'FLOOD' | 'HEAT' | 'COMPOUND' | 'NONE';
  calculatedAt: string;
}

export interface ActionPlaybookSOP {
  sopId: string;
  title: string;
  primaryAction: string;
  tacticalSteps: string[];
  equipmentRequired: string[];
  assignedTeam: string;
  prioritySlaMinutes: number;
}

export interface Alert {
  id: string;
  timestamp: string;
  assetId: string;
  assetName: string;
  wardId: string;
  wardName: string;
  hazardType: 'FLOOD' | 'HEAT' | 'COMPOUND';
  severity: 'WARNING' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  triggerMetrics: {
    rainfallMmHr?: number;
    tempC?: number;
    apparentTempC?: number;
    drainDeficit?: number;
    inundationDepthCm?: number;
    compositeScore: number;
  };
  sop: ActionPlaybookSOP;
  status: 'TRIGGERED' | 'ACKNOWLEDGED' | 'DISPATCHED' | 'IN_PROGRESS' | 'RESOLVED';
  dispatchedAt?: string;
  resolvedAt?: string;
  actionHistory: Array<{
    timestamp: string;
    action: string;
    actor: string;
    notes?: string;
  }>;
}

export interface SimulationScenario {
  id: string;
  name: string;
  category: 'FLOOD' | 'HEAT' | 'COMPOUND' | 'CLEAR';
  description: string;
  weatherOverrides: Partial<WeatherReading>;
}

export interface CitySummaryStats {
  cityName: string;
  weather: WeatherReading;
  cityResilienceIndex: number;
  totalAssets: number;
  criticalCount: number;
  highRiskCount: number;
  activeAlertsCount: number;
  dispatchedActionsCount: number;
  lastUpdated: string;
}
