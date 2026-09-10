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
export interface HazardFacts {
    type: string;
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
    type: string;
}
export interface RiskFactor {
    name: string;
    contribution: number;
}
export interface BaseRiskFacts {
    score: number;
    level: RiskLevel;
    confidence: number;
    factors: RiskFactor[];
    explanation: string;
}
export interface CascadeNodeFacts {
    assetId: string;
    assetCode: string;
    name: string;
    type: string;
    depth: number;
    impactType: string;
    impactScore: number;
    dependencyType?: string | null;
}
export interface AvailableUnitFacts {
    id: string;
    callsign: string;
    type: string;
    status: string;
    departmentName?: string;
    etaMinutes?: number | null;
}
/** The complete, verified fact bundle the orchestrator feeds to the agents. */
export interface IncidentFacts {
    incidentId: string;
    title: string;
    severity: RiskLevel;
    zoneName?: string;
    hazard: HazardFacts | null;
    rootAsset: AssetFacts;
    baseRisk: BaseRiskFacts;
    cascadeNodes: CascadeNodeFacts[];
    availableUnits?: AvailableUnitFacts[];
}
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
    score: number;
    confidence: number;
    drivers: string[];
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
    criticalPath: string[];
    links: CascadeLink[];
    projectedFailures: string[];
}
export interface PlanAction {
    actionId: string;
    priority: ActionPriority;
    reason: string;
    targetAssetCode?: string;
    suggestedUnitCallsign?: string;
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
export type AgentName = "risk-analyst" | "cascade" | "dispatch-planner" | "comms" | "validation";
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
export interface ResponsePlan {
    incidentId: string;
    status: "PROPOSED";
    requiresOperatorApproval: true;
    generatedAt: string;
    confidence: number;
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
