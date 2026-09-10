/**
 * Incident Response Orchestrator
 * ==============================
 *
 *            IncidentFacts (verified engine output)
 *                          |
 *                          v
 *                   ORCHESTRATOR
 *        routing • state • retries • error handling • completion
 *                          |
 *        +---------+-------+-------+---------+
 *        v         v               v         v
 *   RiskAnalyst  Cascade     DispatchPlanner  Comms      (specialist agents)
 *        \_________\_____________/___________/
 *                          |
 *                          v
 *                    ValidationAgent      (grounding guard + integration)
 *                          |
 *                          v
 *                 ResponsePlan (PROPOSED, requires operator approval)
 *
 * Dependency ordering:
 *   risk-analyst -> cascade -> dispatch-planner (needs risk+cascade)
 *   -> comms (needs dispatch) -> validation (needs all).
 *
 * Guarantees:
 *  - Specialist agents never throw (they degrade to deterministic fallback), so
 *    the orchestrator always reaches a completed plan.
 *  - Every step is recorded in a persisted RunState (not LLM memory).
 *  - The output is always a PROPOSED plan requiring human approval.
 */
import type { AgentName, IncidentFacts, LlmProvider, ResponsePlan } from "@climateshield/agents";
import { type AgentStateRecord, type RunState } from "./state.js";
export interface OrchestratorOptions {
    /** Inject a provider (tests). Defaults to Gemini-or-Null from env. */
    llm?: LlmProvider;
    /** Max LLM attempts per agent before deterministic fallback. */
    maxAttemptsPerAgent?: number;
    /** Persist the run to .runs/<id>.json (default true). */
    persist?: boolean;
    /** Optional observability hook fired after each stage. */
    onEvent?: (event: OrchestratorEvent) => void;
}
export interface OrchestratorEvent {
    runId: string;
    stage: AgentName;
    status: AgentStateRecord["status"];
    usedFallback: boolean;
    attempts: number;
}
export interface OrchestratorRunResult {
    plan: ResponsePlan;
    state: RunState;
    persistedTo: string | null;
}
export declare class IncidentResponseOrchestrator {
    private readonly llm;
    private readonly maxAttempts;
    private readonly persist;
    private readonly onEvent?;
    constructor(options?: OrchestratorOptions);
    run(facts: IncidentFacts): Promise<OrchestratorRunResult>;
    private record;
}
/** Convenience wrapper for a one-shot planning run. */
export declare function runIncidentResponse(facts: IncidentFacts, options?: OrchestratorOptions): Promise<OrchestratorRunResult>;
