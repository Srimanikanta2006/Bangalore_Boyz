import type { HazardType, Severity } from '@prisma/client';

// ---------- Overview dashboard ----------

export interface HazardSummary {
  id: string;
  type: HazardType;
  severity: Severity;
  status: string;
  zoneId: string;
  zoneName: string;
  startedAt: Date;
  rainfallRate: number | null;
  waterDepth: number | null;
  temperature: number | null;
  windSpeed: number | null;
}

export interface RecentIncidentSummary {
  id: string;
  incidentCode: string;
  title: string;
  severity: Severity;
  status: string;
  type: string;
  zoneName: string;
  assetName: string | null;
  reportedAt: Date;
  slaDeadline: Date | null;
  assignedUnits: string[];
}

export interface OverviewMetrics {
  dataQuality: 'SYNTHETIC_DEMO';
  resilienceIndex: number;
  resilienceLevel: 'STRONG' | 'GUARDED' | 'MODERATE_CAUTION' | 'CRITICAL_ALERT';
  resilienceFormula: string;
  resilienceTrend: { direction: 'IMPROVING' | 'STABLE' | 'DECLINING'; delta: number; description: string };
  activeThreats: number;
  monitoredZones: number;
  criticalInfrastructure: { total: number; compromised: number; degraded: number };
  mobility: { index: number; status: 'FLUID' | 'DEGRADED' | 'SEVERE'; blockedRoads: number };
  grid: { status: 'STABLE' | 'STRAINED' | 'COMPROMISED'; loadPercent: number | null; note: string };
  precipitation: { value: number; unit: 'mm/hr'; source: string } | null;
  heat: { value: number; unit: string; source: string } | null;
  activeIncidents: number;
  criticalIncidents: number;
  resourceReadiness: { percent: number; availableUnits: number; totalUnits: number };
  recentCriticalIncidents: RecentIncidentSummary[];
  activeHazards: HazardSummary[];
}

// ---------- Response Center ----------

export interface IncidentCard {
  id: string;
  incidentCode: string;
  title: string;
  description: string | null;
  severity: Severity;
  status: string;
  type: string;
  zoneId: string;
  zoneName: string | null;
  assetName: string | null;
  reportedAt: Date;
  slaDeadline: Date | null;
  slaMinutesRemaining: number | null;
  assignedUnits: string[];
  taskCodes: string[];
}

export interface UnitCard {
  id: string;
  name: string;
  callsign: string;
  type: string;
  status: string;
  departmentName: string | null;
  departmentId: string | null;
  teamSize: number;
  etaMinutes: number | null;
  latitude: number | null;
  longitude: number | null;
  specialization: string | null;
}

export interface HotspotCard {
  id: string;
  name: string;
  zoneId: string;
  zoneName: string | null;
  hazardType: HazardType;
  eventCount: number;
  severityScore: number;
  recurrenceScore: number;
  lastOccurredAt: Date | null;
  latitude: number;
  longitude: number;
  description: string | null;
}

export interface TelemetrySummary {
  rainfallMmPerHour: number | null;
  maxWaterDepthM: number | null;
  maxTemperatureC: number | null;
  maxPumpRuntimeHours: number | null;
  maxPowerLoadPercent: number | null;
  updatedAt: Date | null;
}

export interface ResponseCenterData {
  summary: {
    activeIncidents: number;
    critical: number;
    high: number;
    moderate: number;
    unassignedIncidents: number;
    assignedUnits: number;
    readinessPercent: number;
    avgResponseMinutes: number | null;
    slaCompliancePercent: number | null;
    targetResolutionHours: Record<Severity, number>;
  };
  severityGroups: { CRITICAL: IncidentCard[]; HIGH: IncidentCard[]; MODERATE: IncidentCard[]; LOW: IncidentCard[] };
  activeIncidents: IncidentCard[];
  unassignedIncidents: IncidentCard[];
  availableUnits: UnitCard[];
  telemetry: TelemetrySummary;
  hotspots: HotspotCard[];
}

// ---------- Cascade / risk ----------

export interface CascadeNodeDto {
  assetId: string;
  assetCode: string;
  name: string;
  type: string;
  criticality: string;
  operationalStatus: string;
  depth: number;
  impactType: string;
  impactScore: number;
  explanation: string;
  dependencyType: string | null;
  edgeStrength: number | null;
}

export interface RiskFactorDto {
  name: string;
  contribution: number;
}

export interface RiskAssessmentDto {
  score: number;
  level: string;
  confidence: number;
  factors: RiskFactorDto[];
  explanation: string;
  components: {
    hazard: number;
    vulnerability: number;
    criticality: number;
    historical: number;
  };
}

// ---------- Zone cascade (Zone Detail screen) ----------

export interface ZoneCascadeData {
  zone: {
    id: string;
    name: string;
    code: string;
    riskLevel: string;
    description: string | null;
    latitude: number;
    longitude: number;
    population: number;
  };
  hazard: {
    id: string;
    type: string;
    severity: string;
    rainfallRate: number | null;
    temperature: number | null;
    startedAt: Date | null;
  } | null;
  riskScore: number;
  riskLevel: string;
  riskFactors: RiskFactorDto[];
  contributingFactors: string[];
  impact: {
    blockedRoads: number;
    affectedFacilities: number;
    residents: number;
  };
  cascade: { asset: string; assetCode: string; impact: string; depth: number; impactScore: number }[];
  impactedInfrastructure: {
    assetId: string;
    assetCode: string;
    name: string;
    type: string;
    operationalStatus: string;
    impactType: string;
    impactScore: number;
  }[];
  affectedRoads: string[];
  affectedFacilities: string[];
  recommendedResponseActions: string[];
}

// ---------- Response plan (Zone Detail "Create Response Plan") ----------

export interface ResponsePlanAction {
  action: string;
  rationale: string;
  priority: string;
  suggestedUnitTypes: string[];
}

export interface ResponsePlanData {
  zoneId: string;
  zoneName: string;
  generatedAt: Date;
  status: 'PROPOSED';
  note: string;
  riskScore: number;
  riskLevel: string;
  severity: string;
  hazardType: string | null;
  priority: string;
  etaMinutes: number;
  affectedAssets: {
    assetCode: string;
    name: string;
    type: string;
    operationalStatus: string;
    impactType: string;
  }[];
  recommendedActions: ResponsePlanAction[];
  recommendedUnits: {
    unitId: string;
    name: string;
    callsign: string;
    type: string;
    departmentName: string | null;
    etaMinutes: number | null;
    teamSize: number;
  }[];
  cascadeSummary: string[];
}

// ---------- Simulator ----------

export interface SimulationDamageEstimate {
  totalUsd: number;
  residentialUsd: number;
  infrastructureUsd: number;
}

export interface SimulationResultDto {
  id: string;
  zoneId: string | null;
  zoneName: string | null;
  riskScore: number;
  riskLevel: string;
  affectedAssets: number;
  affectedRoads: number;
  estimatedPopulation: number;
  estimatedDamage: SimulationDamageEstimate | null;
  recommendedActions: string[];
}

export interface SimulationDto {
  id: string;
  name: string;
  scenarioType: string;
  status: string;
  parameters: Record<string, unknown>;
  createdBy: string | null;
  createdAt: Date;
  completedAt: Date | null;
  results: SimulationResultDto[];
  summary: {
    worstZone: string | null;
    maxRiskScore: number;
    totalAffectedAssets: number;
    totalAffectedRoads: number;
    totalPopulationExposed: number;
    totalDamageUsd: number;
  };
}

