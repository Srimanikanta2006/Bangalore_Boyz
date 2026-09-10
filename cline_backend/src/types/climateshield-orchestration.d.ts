/**
 * Ambient type declaration for `@climateshield/orchestration` — used ONLY by
 * the TypeScript compiler. See climateshield-agents.d.ts for the full
 * rationale (avoids tsc transitively parsing orchestration/src/state.ts's
 * `import.meta.url`, which is invalid under cline_backend's `module:
 * commonjs`). Runtime behavior is unaffected: orchestrate.service.ts loads
 * the REAL package via dynamic `import()`. Zero changes to orchestration/.
 *
 * Kept in sync (by hand) with orchestration/src/{orchestrator,state}.ts and
 * agents/src/types.ts's `ResponsePlan`.
 */
declare module "@climateshield/orchestration" {
  import type { IncidentFacts, LlmProvider } from "@climateshield/agents";

  export type AgentName = "risk-analyst" | "cascade" | "dispatch-planner" | "comms" | "validation";

  export interface RiskAssessment {
    headline: string;
    severity: string;
    score: number;
    confidence: number;
    drivers: string[];
    keyImpacts: unknown[];
  }

  export interface CascadeAnalysis {
    summary: string;
    criticalPath: string[];
    links: unknown[];
    projectedFailures: string[];
  }

  export interface PlanAction {
    actionId: string;
    priority: string;
    reason: string;
    targetAssetCode?: string;
    suggestedUnitCallsign?: string;
  }

  export interface DispatchPlan {
    recommendedActions: PlanAction[];
    actionDependencies: unknown[];
    rationale: string;
  }

  export interface CommsBriefings {
    briefings: {
      operator: string;
      hospitalManager: string;
      fieldTeam: string;
      public: string;
    };
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
    usedFallbackAgents: AgentName[];
    warnings: string[];
    provenance: {
      engine: string;
      llmModel: string | null;
      factsIncidentId: string;
    };
  }

  export interface AgentStateRecord {
    agent: AgentName;
    status: "pending" | "running" | "succeeded" | "fell_back" | "failed";
    attempts: number;
    usedFallback: boolean;
    fallbackReason?: string;
    startedAt?: string;
    finishedAt?: string;
    warnings: string[];
  }

  export interface RunState {
    runId: string;
    incidentId: string;
    status: "created" | "running" | "completed" | "failed";
    createdAt: string;
    updatedAt: string;
    llmModel: string | null;
    agents: Record<AgentName, AgentStateRecord>;
    warnings: string[];
    plan: ResponsePlan | null;
  }

  export interface OrchestratorOptions {
    llm?: LlmProvider;
    maxAttemptsPerAgent?: number;
    persist?: boolean;
    onEvent?: (event: {
      runId: string;
      stage: AgentName;
      status: AgentStateRecord["status"];
      usedFallback: boolean;
      attempts: number;
    }) => void;
  }

  export interface OrchestratorRunResult {
    plan: ResponsePlan;
    state: RunState;
    persistedTo: string | null;
  }

  export function runIncidentResponse(
    facts: IncidentFacts,
    options?: OrchestratorOptions,
  ): Promise<OrchestratorRunResult>;
}
