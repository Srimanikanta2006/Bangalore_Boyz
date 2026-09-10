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
  center: [number, number]; // [lat, lng]
  boundaries: [number, number][]; // Polygon coordinates
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
  historicalIncidentCount?: number;
  drainageQuality?: 'Poor' | 'Moderate' | 'Good';
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
  isStale?: boolean;
  dataQuality?: 'GOOD' | 'DEGRADED' | 'STALE';
  lastUpdatedMinutesAgo?: number;
}

export interface RiskFactorWeights {
  hazardContribution: number;      // 0 - 100
  exposureContribution: number;    // 0 - 100
  vulnerabilityContribution: number; // 0 - 100
  resilienceMitigation: number;    // 0 - 100
}

export interface FloodRiskAssessment {
  score: number; // 0 - 100
  level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  projectedInundationDepthCm: number;
  drainageDeficitMmHr: number;
  factors: RiskFactorWeights;
  explanation: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface HeatRiskAssessment {
  score: number; // 0 - 100
  level: 'LOW' | 'ADVISORY' | 'WARNING' | 'EMERGENCY';
  apparentTempC: number;
  wetBulbGlobeTempC: number;
  heatStrainIndex: number;
  factors: RiskFactorWeights;
  explanation: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
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
  compositeRiskScore: number; // 0 - 100
  compositeLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  primaryThreat: 'FLOOD' | 'HEAT' | 'COMPOUND' | 'NONE';
  calculatedAt: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
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
  status: 'NEW' | 'ACKNOWLEDGED' | 'ESCALATED' | 'RESOLVED';
  incidentId?: string;
  dispatchedAt?: string;
  resolvedAt?: string;
  actionHistory: Array<{
    timestamp: string;
    action: string;
    actor: string;
    notes?: string;
  }>;
}

export interface ResponseTask {
  id: string;
  incidentId: string;
  title: string;
  assignedTeam: string;
  assignedPerson: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  dueTime: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ESCALATED';
  completedAt?: string;
  escalatedAt?: string;
  escalationLevel: 0 | 1 | 2; // 0: Normal, 1: Supervisor, 2: District Command
  notes?: string;
}

export interface IncidentTimelineEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  actor: string;
  type:
    | 'RISK_CALCULATED'
    | 'ALERT_GENERATED'
    | 'MANAGER_NOTIFIED'
    | 'INCIDENT_ACKNOWLEDGED'
    | 'TEAM_ASSIGNED'
    | 'TASK_COMPLETED'
    | 'ACTION_TAKEN'
    | 'ESCALATED'
    | 'RESOLVED';
}

export interface Incident {
  id: string;
  incidentNumber: number;
  hazardType: 'FLOOD' | 'HEAT' | 'COMPOUND';
  title: string;
  assetId: string;
  assetName: string;
  wardId: string;
  wardName: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  status: 'DETECTED' | 'ACKNOWLEDGED' | 'RESPONDING' | 'RESOLVED' | 'CLOSED';
  assignedTeam: string;
  leadResponder: string;
  createdAt: string;
  resolvedAt?: string;
  tasks: ResponseTask[];
  timeline: IncidentTimelineEvent[];
  notes?: string;
}

export interface HistoricalRepeatLocation {
  id?: string;
  name?: string;
  assetId: string;
  assetName: string;
  wardName: string;
  assetType: AssetType;
  hazardType: 'FLOOD' | 'HEAT';
  totalIncidentsLast12m: number;
  averageSeverity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  recurringTrigger: string;
  averageResolutionHours: number;
  elevationM: number;
  drainageQuality: 'Poor' | 'Moderate' | 'Good';
  pastIncidents: Array<{
    date: string;
    peakRiskScore: number;
    triggerValue: string;
    impactSummary: string;
    resolutionTimeHours: number;
  }>;
}

export interface SimulationScenario {
  id: string;
  name: string;
  category: 'FLOOD' | 'HEAT' | 'COMPOUND' | 'CLEAR';
  description: string;
  weatherOverrides: Partial<WeatherReading>;
}
