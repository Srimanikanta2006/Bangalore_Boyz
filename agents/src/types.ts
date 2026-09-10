/**
 * ClimateShield — Agent Layer Shared Schemas
 * ==========================================
 *
 * These are the structured JSON contracts that flow between the orchestrator
 * and the specialist agents. They are deliberately DECOUPLED from the backend's
 * Prisma/domain types: agents only ever receive already-VERIFIED facts produced
 * by the deterministic engine (risk + cascade), and only ever emit structured,
 * validated JSON. The deterministic engine remains the single source of truth;
 * agents interpret and plan, they never recompute risk or invent assets.
 *
 * Grounding rules enforced downstream (see agents + ValidationAgent):
 *  - No invented infrastructure assets (every targetAssetId must exist in facts).
 *  - No invented action IDs (only the controlled action catalog).
 *  - Confidence can never exceed the engine's own confidence for the incident.
 *  - Output is a PROPOSED plan for human/operator approval — never autonomous
 *    execution.
 */

export type RiskLevel = "low" | "medium" | "high" | "critical";

/** Priority vocabulary used by planned actions (aligned with RiskLevel). */
export type ActionPriority = RiskLevel;

// ---------------------------------------------------------------------------
// INPUT: Verified incident facts (produced by the deterministic engine).
// ---------------------------------------------------------------------------

export interface HazardFacts {
  type: string; // e.g. FLASH_FLOOD, EXTREME_HEAT (descriptive; risk is not derived here)
  severity: RiskLevel;
  rainfallRate?: number | null;
  temperature?: number | null;
  windSpeed?: number | null;
  waterDepth?: number | null;
}

export interface AssetFacts {
  id: string;
  assetCode: string;
  name: string;
  type: string; // DRAIN, ROAD, HOSPITAL, SUBSTATION, ...
}

export interface RiskFactor {
  name: string;
  contribution: number; // points contributed to the score
}

export interface BaseRiskFacts {
  score: number; // 0-100 (from the engine)
  level: RiskLevel;
  confidence: number; // 0-1 (engine confidence — the hard ceiling for the whole run)
  factors: RiskFactor[];
  explanation: string;
}

export interface CascadeNodeFacts {
  assetId: string;
  assetCode: string;
  name: string;
  type: string;
  depth: number; // 0 = root
  impactType: string; // OVERWHELMED, INUNDATED, ACCESS_BLOCKED, ...
  impactScore: number; // 0-100
  dependencyType?: string | null;
}

export interface AvailableUnitFacts {
  id: string;
  callsign: string;
  type: string; // PUMP_CREW, EMS, BARRIER_CREW, ...
  status: string; // AVAILABLE, ASSIGNED, ...
  departmentName?: string;
  etaMinutes?: number | null;
}

/** The complete, verified fact bundle the orchestrator feeds to the agents. */
export interface IncidentFacts {
  incidentId: string; // human code (INC-204) or db id
  title: string;
  severity: RiskLevel;
  zoneName?: string;
  hazard: HazardFacts | null;
  rootAsset: AssetFacts;
  baseRisk: BaseRiskFacts;
  cascadeNodes: CascadeNodeFacts[];
  availableUnits?: AvailableUnitFacts[];
}

// ---------------------------------------------------------------------------
// AGENT OUTPUTS (each specialist emits one of these).
// ---------------------------------------------------------------------------

export interface KeyImpact {
  assetId?: string;
  assetName: string;
  description: string;
  severity: RiskLevel;
  timeHorizonMinutes?: number;
}

/** RiskAnalystAgent output. */
export interface RiskAssessment {
  headline: string;
  severity: RiskLevel;
  score: number; // echoes the engine score (never recomputed)
  confidence: number; // <= engine confidence
  drivers: string[]; // human-readable factor explanations
  keyImpacts: KeyImpact[];
}

export interface CascadeLink {
  fromAssetCode: string;
  toAssetCode: string;
  impact: string;
  impactScore: number;
}

/** CascadeAgent output. */
export interface CascadeAnalysis {
  summary: string;
  criticalPath: string[]; // ordered asset codes, root -> deepest
  links: CascadeLink[];
  projectedFailures: string[]; // human-readable downstream failure statements
}

export interface PlanAction {
  actionId: string; // MUST be from the controlled action catalog
  priority: ActionPriority; // MUST be allowed for the action
  reason: string;
  targetAssetCode?: string; // MUST exist in the incident facts when present
  suggestedUnitCallsign?: string; // MUST be an available unit when present
}

export interface ActionDependency {
  actionId: string;
  dependsOnActionId: string;
  rule: string;
}

/** DispatchPlannerAgent output. */
export interface DispatchPlan {
  recommendedActions: PlanAction[];
  actionDependencies: ActionDependency[];
  rationale: string;
}

export interface RoleBriefings {
  operator: string;
  hospitalManager: string;
  fieldTeam: string;
  public: string;
}

/** CommsAgent output. */
export interface CommsBriefings {
  briefings: RoleBriefings;
}

// ---------------------------------------------------------------------------
// AGENT ENVELOPE — every agent returns this uniform result.
// ---------------------------------------------------------------------------

export type AgentName =
  | "risk-analyst"
  | "cascade"
  | "dispatch-planner"
  | "comms"
  | "validation";

export interface AgentResult<T> {
  agent: AgentName;
  data: T;
  /** true when the deterministic fallback produced this (LLM absent/failed/invalid). */
  usedFallback: boolean;
  fallbackReason?: string;
  attempts: number;
  startedAt: string;
  finishedAt: string;
  warnings: string[];
}

/** Context passed to each agent: the facts plus any upstream agent outputs. */
export interface AgentContext {
  facts: IncidentFacts;
  risk?: RiskAssessment;
  cascade?: CascadeAnalysis;
  dispatch?: DispatchPlan;
  comms?: CommsBriefings;
}

// ---------------------------------------------------------------------------
// FINAL OUTPUT — the integrated, validated response plan.
// ---------------------------------------------------------------------------

export interface ResponsePlan {
  incidentId: string;
  status: "PROPOSED";
  requiresOperatorApproval: true;
  generatedAt: string;
  confidence: number; // <= engine confidence
  riskAssessment: RiskAssessment;
  cascadeAnalysis: CascadeAnalysis;
  dispatch: DispatchPlan;
  comms: CommsBriefings;
  /** Which agents fell back to deterministic synthesis this run. */
  usedFallbackAgents: AgentName[];
  /** Validation/grounding warnings surfaced to the operator (never silently dropped). */
  warnings: string[];
  provenance: {
    engine: string;
    llmModel: string | null;
    factsIncidentId: string;
  };
}
