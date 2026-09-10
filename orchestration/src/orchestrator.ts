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

import {
  CascadeAgent,
  CommsAgent,
  DispatchPlannerAgent,
  RiskAnalystAgent,
  ValidationAgent,
  createDefaultProvider,
} from "@climateshield/agents";
import type {
  AgentContext,
  AgentName,
  AgentResult,
  IncidentFacts,
  LlmProvider,
  ResponsePlan,
} from "@climateshield/agents";
import {
  createRunState,
  persistRunState,
  touch,
  type AgentStateRecord,
  type RunState,
} from "./state.js";

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

export class IncidentResponseOrchestrator {
  private readonly llm: LlmProvider;
  private readonly maxAttempts: number;
  private readonly persist: boolean;
  private readonly onEvent?: (event: OrchestratorEvent) => void;

  constructor(options: OrchestratorOptions = {}) {
    this.llm = options.llm ?? createDefaultProvider();
    this.maxAttempts = options.maxAttemptsPerAgent ?? 2;
    this.persist = options.persist ?? true;
    this.onEvent = options.onEvent;
  }

  async run(facts: IncidentFacts): Promise<OrchestratorRunResult> {
    const state = createRunState(facts.incidentId, this.llm.model);
    state.status = "running";
    touch(state);

    const ctx: AgentContext = { facts };
    const usedFallbackAgents: AgentName[] = [];
    const aggregatedWarnings: string[] = [];

    const agentOpts = { llm: this.llm, maxAttempts: this.maxAttempts };

    // ---- Stage 1: Risk analysis -----------------------------------------
    const risk = await new RiskAnalystAgent(agentOpts).run(ctx);
    this.record(state, risk, usedFallbackAgents, aggregatedWarnings);
    ctx.risk = risk.data;

    // ---- Stage 2: Cascade analysis --------------------------------------
    const cascade = await new CascadeAgent(agentOpts).run(ctx);
    this.record(state, cascade, usedFallbackAgents, aggregatedWarnings);
    ctx.cascade = cascade.data;

    // ---- Stage 3: Dispatch planning (needs risk + cascade) --------------
    const dispatch = await new DispatchPlannerAgent(agentOpts).run(ctx);
    this.record(state, dispatch, usedFallbackAgents, aggregatedWarnings);
    ctx.dispatch = dispatch.data;

    // ---- Stage 4: Communications (needs dispatch) -----------------------
    const comms = await new CommsAgent(agentOpts).run(ctx);
    this.record(state, comms, usedFallbackAgents, aggregatedWarnings);
    ctx.comms = comms.data;

    // ---- Stage 5: Validation + integration (deterministic) --------------
    const validation = new ValidationAgent().integrate({
      facts,
      risk: risk.data,
      cascade: cascade.data,
      dispatch: dispatch.data,
      comms: comms.data,
      usedFallbackAgents,
      llmModel: this.llm.model,
      priorWarnings: aggregatedWarnings,
    });
    this.record(state, validation, usedFallbackAgents, aggregatedWarnings);

    // ---- Completion -----------------------------------------------------
    state.plan = validation.data;
    state.warnings = validation.data.warnings;
    state.status = "completed";
    touch(state);

    const persistedTo = this.persist ? await persistRunState(state) : null;

    return { plan: validation.data, state, persistedTo };
  }

  private record<T>(
    state: RunState,
    result: AgentResult<T>,
    usedFallbackAgents: AgentName[],
    aggregatedWarnings: string[],
  ): void {
    const rec = state.agents[result.agent];
    rec.attempts = result.attempts;
    rec.usedFallback = result.usedFallback;
    rec.fallbackReason = result.fallbackReason;
    rec.startedAt = result.startedAt;
    rec.finishedAt = result.finishedAt;
    rec.warnings = result.warnings;
    // Validation is deterministic by design; treat as a success, not a failure.
    rec.status =
      result.agent === "validation"
        ? "succeeded"
        : result.usedFallback
        ? "fell_back"
        : "succeeded";

    if (result.usedFallback && result.agent !== "validation") {
      usedFallbackAgents.push(result.agent);
    }
    for (const w of result.warnings) {
      aggregatedWarnings.push(`[${result.agent}] ${w}`);
    }

    touch(state);
    this.onEvent?.({
      runId: state.runId,
      stage: result.agent,
      status: rec.status,
      usedFallback: rec.usedFallback,
      attempts: rec.attempts,
    });
  }
}

/** Convenience wrapper for a one-shot planning run. */
export async function runIncidentResponse(
  facts: IncidentFacts,
  options?: OrchestratorOptions,
): Promise<OrchestratorRunResult> {
  return new IncidentResponseOrchestrator(options).run(facts);
}
