import type {
  Asset,
  CascadeEvent,
  DashboardSummary,
  GraphEdge,
  Hazard,
  ResponseAction,
  RiskScore,
  SimulationPhase,
} from '../types/domain';
import { isAtRiskLevel, riskLevelFromScore } from '../utils/riskColors';
import { SCENARIO_IDS } from './constants';

interface RiskTemplateEntry {
  score: number;
  confidence: number;
  evidence: string[];
}

/*
 * Centralized mock scenario: Vijayawada central basin.
 * Baseline = hazard watch (moderate rainfall, elevated drain risk, no cascade).
 * Escalated = the primary demo scenario (47 mm/hr, D07 critical,
 * cascade D07 -> R24 -> HOSP-A, ambulance access threatened).
 * Escalated scores are tuned so exactly 7 assets are at risk and exactly
 * 3 are critical (D07 91, R24 84, HOSP-A 78).
 */
const BASELINE_RISK: Record<string, RiskTemplateEntry> = {
  D07: {
    score: 42,
    confidence: 0.72,
    evidence: [
      'Rainfall 28 mm/hr sustained over central basin',
      'D07 flow at 68% of crest — below overflow threshold',
      'PUMP-01 sump level nominal',
    ],
  },
  R24: {
    score: 28,
    confidence: 0.68,
    evidence: [
      'Downstream of D07 overflow point',
      'Minor surface ponding (2 cm) at KM 0+400 low point',
    ],
  },
  'HOSP-A': {
    score: 12,
    confidence: 0.85,
    evidence: ['Access corridor R24 passable', 'Emergency wing operating normally'],
  },
  D03: { score: 35, confidence: 0.7, evidence: ['Sheet flow within design capacity'] },
  R12: { score: 22, confidence: 0.65, evidence: ['Storm drains clearing normally'] },
  'SUB-02': { score: 18, confidence: 0.8, evidence: ['Plinth 40 cm above projected flood line'] },
  'SCH-05': { score: 20, confidence: 0.75, evidence: ['Yard drainage functioning'] },
  'PUMP-01': {
    score: 38,
    confidence: 0.71,
    evidence: ['Sump at 44% — pumps on standby', 'Inflow rising with sustained rainfall'],
  },
  R31: { score: 25, confidence: 0.66, evidence: ['Normal traffic flow, no ponding reported'] },
  D11: { score: 30, confidence: 0.69, evidence: ['Culvert flow at 55% capacity'] },
};

const ESCALATED_RISK: Record<string, RiskTemplateEntry> = {
  D07: {
    score: 91,
    confidence: 0.94,
    evidence: [
      'Rainfall 47 mm/hr — 1.3x D07 design capacity',
      'D07 flow at 94% of crest — overflow imminent',
      'PUMP-01 sump at 78%, one pump lagging',
    ],
  },
  R24: {
    score: 84,
    confidence: 0.91,
    evidence: [
      'Receives D07 overflow at KM 0+400',
      'Projected 40 cm accumulation at low point',
      'Ambulance corridor at risk of closure',
    ],
  },
  'HOSP-A': {
    score: 78,
    confidence: 0.89,
    evidence: [
      'Sole emergency corridor R24 projected impassable',
      'Emergency wing depends on R24 for ambulance access',
    ],
  },
  D03: { score: 52, confidence: 0.82, evidence: ['Backflow rising at downstream junction'] },
  R12: { score: 41, confidence: 0.78, evidence: ['Stormwater sheet flow across carriageway'] },
  'SUB-02': { score: 22, confidence: 0.8, evidence: ['Plinth still above projected flood line'] },
  'SCH-05': { score: 24, confidence: 0.74, evidence: ['Yard ponding beginning at north gate'] },
  'PUMP-01': {
    score: 64,
    confidence: 0.86,
    evidence: ['Sump at 78% under 47 mm/hr inflow', 'One pump lagging — duty cycle maxed'],
  },
  R31: { score: 28, confidence: 0.79, evidence: ['Passable — no closure projected'] },
  D11: { score: 58, confidence: 0.83, evidence: ['Ring culvert at 81% capacity — monitor'] },
};

export const MOCK_HAZARD_BASELINE: Hazard = {
  id: SCENARIO_IDS.HAZARD,
  type: 'heavy_rainfall',
  zoneId: SCENARIO_IDS.ZONE,
  intensity: 0.62,
  startedAt: new Date().toISOString(),
  source: 'IMD Radar + Municipal Sensors (simulated feed)',
  label: 'Heavy Rainfall',
  rainfallMmHr: 28,
  severity: 62,
  status: 'monitoring',
};

export const MOCK_HAZARD_ESCALATED: Hazard = {
  ...MOCK_HAZARD_BASELINE,
  intensity: 0.91,
  rainfallMmHr: 47,
  severity: 91,
  status: 'active',
};

export const MOCK_ASSETS: Asset[] = [
  { id: 'D07', zoneId: SCENARIO_IDS.ZONE, name: 'Drain D07', type: 'drain', criticality: 'high', lat: 16.5088, lng: 80.6442, shortCode: 'D07' },
  { id: 'R24', zoneId: SCENARIO_IDS.ZONE, name: 'Road R24', type: 'road', criticality: 'high', lat: 16.5075, lng: 80.6485, shortCode: 'R24' },
  { id: 'HOSP-A', zoneId: SCENARIO_IDS.ZONE, name: 'District Hospital A', type: 'hospital', criticality: 'critical', lat: 16.5058, lng: 80.6528, shortCode: 'HOSP-A' },
  { id: 'D03', zoneId: SCENARIO_IDS.ZONE, name: 'Drain D03', type: 'drain', criticality: 'medium', lat: 16.5102, lng: 80.641, shortCode: 'D03' },
  { id: 'R12', zoneId: SCENARIO_IDS.ZONE, name: 'Road R12', type: 'road', criticality: 'medium', lat: 16.5045, lng: 80.646, shortCode: 'R12' },
  { id: 'SUB-02', zoneId: SCENARIO_IDS.ZONE, name: 'Substation SUB-02', type: 'substation', criticality: 'critical', lat: 16.5028, lng: 80.6435, shortCode: 'SUB-02' },
  { id: 'SCH-05', zoneId: SCENARIO_IDS.ZONE, name: 'Govt School SCH-05', type: 'school', criticality: 'medium', lat: 16.5115, lng: 80.6502, shortCode: 'SCH-05' },
  { id: 'PUMP-01', zoneId: SCENARIO_IDS.ZONE, name: 'Pump Station PUMP-01', type: 'pump_station', criticality: 'high', lat: 16.5095, lng: 80.6388, shortCode: 'PUMP-01' },
  { id: 'R31', zoneId: SCENARIO_IDS.ZONE, name: 'Road R31', type: 'road', criticality: 'medium', lat: 16.5032, lng: 80.651, shortCode: 'R31' },
  { id: 'D11', zoneId: SCENARIO_IDS.ZONE, name: 'Drain D11', type: 'drain', criticality: 'medium', lat: 16.5068, lng: 80.6395, shortCode: 'D11' },
];

export const MOCK_GRAPH_EDGES: GraphEdge[] = [
  { id: 'E01', sourceAssetId: 'D07', targetAssetId: 'R24', dependencyType: 'drainage', baseRiskWeight: 0.85, distanceMeters: 420 },
  { id: 'E02', sourceAssetId: 'R24', targetAssetId: 'HOSP-A', dependencyType: 'access', baseRiskWeight: 0.92, distanceMeters: 680 },
  { id: 'E03', sourceAssetId: 'D03', targetAssetId: 'R12', dependencyType: 'drainage', baseRiskWeight: 0.6, distanceMeters: 350 },
  { id: 'E04', sourceAssetId: 'PUMP-01', targetAssetId: 'D07', dependencyType: 'water', baseRiskWeight: 0.55, distanceMeters: 520 },
  { id: 'E05', sourceAssetId: 'SUB-02', targetAssetId: 'HOSP-A', dependencyType: 'power', baseRiskWeight: 0.7, distanceMeters: 890 },
  { id: 'E06', sourceAssetId: 'D11', targetAssetId: 'R31', dependencyType: 'drainage', baseRiskWeight: 0.58, distanceMeters: 410 },
  { id: 'E07', sourceAssetId: 'R12', targetAssetId: 'SCH-05', dependencyType: 'access', baseRiskWeight: 0.45, distanceMeters: 720 },
];

export const MOCK_CASCADE: CascadeEvent = {
  id: SCENARIO_IDS.CASCADE,
  hazardId: SCENARIO_IDS.HAZARD,
  path: ['D07', 'R24', 'HOSP-A'],
  criticalAssetId: 'HOSP-A',
  etaMinutes: 18,
  explanation: '',
  recommendedActions: [
    {
      actionType: 'pre_position_ambulance',
      label: 'Pre-position Ambulance Team B',
      team: 'Team B',
      priority: 'critical',
    },
  ],
  criticalService: 'Emergency Ambulance Access',
  impactDescription: 'Road R24 becomes inaccessible. Ambulance access to the emergency wing is threatened.',
  alternativeRoute: 'Route 7B',
};

function buildRiskScores(phase: SimulationPhase): RiskScore[] {
  const template = phase === 'escalated' ? ESCALATED_RISK : BASELINE_RISK;
  return MOCK_ASSETS.map((asset) => {
    const entry = template[asset.id] ?? { score: 8, confidence: 0.6, evidence: ['No elevated risk signals'] };
    return {
      assetId: asset.id,
      hazardId: SCENARIO_IDS.HAZARD,
      score: entry.score,
      confidence: entry.confidence,
      evidence: entry.evidence,
      computedAt: new Date().toISOString(),
      level: riskLevelFromScore(entry.score),
    };
  });
}

export function getMockRiskScores(phase: SimulationPhase): RiskScore[] {
  return buildRiskScores(phase);
}

/** Derived from the risk scores themselves — no duplicated hardcoded counts. */
export function getMockDashboardSummary(phase: SimulationPhase): DashboardSummary {
  const scores = buildRiskScores(phase);
  return {
    activeHazards: 1,
    assetsAtRisk: scores.filter((s) => isAtRiskLevel(s.level)).length,
    criticalAssets: scores.filter((s) => s.level === 'critical').length,
    activeResponses: 0,
    servicesAtRisk: phase === 'escalated' ? 1 : 0,
  };
}

export function getMockHazard(phase: SimulationPhase): Hazard {
  return phase === 'escalated' ? MOCK_HAZARD_ESCALATED : MOCK_HAZARD_BASELINE;
}

export function createAssignedResponse(): ResponseAction {
  const now = new Date().toISOString();
  return {
    id: SCENARIO_IDS.RESPONSE,
    cascadeEventId: SCENARIO_IDS.CASCADE,
    actionType: 'pre_position_ambulance',
    assignedTeam: 'Team B',
    status: 'assigned',
    createdAt: now,
    acknowledgedAt: null,
    completedAt: null,
    targetAssetId: 'HOSP-A',
    description: 'Pre-position Ambulance',
  };
}
