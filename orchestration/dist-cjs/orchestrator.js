"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncidentResponseOrchestrator = void 0;
exports.runIncidentResponse = runIncidentResponse;
const agents_1 = require("../../agents/dist-cjs/index.js");
const state_js_1 = require("./state.js");
class IncidentResponseOrchestrator {
    llm;
    maxAttempts;
    persist;
    onEvent;
    constructor(options = {}) {
        this.llm = options.llm ?? (0, agents_1.createDefaultProvider)();
        this.maxAttempts = options.maxAttemptsPerAgent ?? 2;
        this.persist = options.persist ?? true;
        this.onEvent = options.onEvent;
    }
    async run(facts) {
        const state = (0, state_js_1.createRunState)(facts.incidentId, this.llm.model);
        state.status = "running";
        (0, state_js_1.touch)(state);
        const ctx = { facts };
        const usedFallbackAgents = [];
        const aggregatedWarnings = [];
        const agentOpts = { llm: this.llm, maxAttempts: this.maxAttempts };
        // ---- Stage 1: Risk analysis -----------------------------------------
        const risk = await new agents_1.RiskAnalystAgent(agentOpts).run(ctx);
        this.record(state, risk, usedFallbackAgents, aggregatedWarnings);
        ctx.risk = risk.data;
        // ---- Stage 2: Cascade analysis --------------------------------------
        const cascade = await new agents_1.CascadeAgent(agentOpts).run(ctx);
        this.record(state, cascade, usedFallbackAgents, aggregatedWarnings);
        ctx.cascade = cascade.data;
        // ---- Stage 3: Dispatch planning (needs risk + cascade) --------------
        const dispatch = await new agents_1.DispatchPlannerAgent(agentOpts).run(ctx);
        this.record(state, dispatch, usedFallbackAgents, aggregatedWarnings);
        ctx.dispatch = dispatch.data;
        // ---- Stage 4: Communications (needs dispatch) -----------------------
        const comms = await new agents_1.CommsAgent(agentOpts).run(ctx);
        this.record(state, comms, usedFallbackAgents, aggregatedWarnings);
        ctx.comms = comms.data;
        // ---- Stage 5: Validation + integration (deterministic) --------------
        const validation = new agents_1.ValidationAgent().integrate({
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
        (0, state_js_1.touch)(state);
        const persistedTo = this.persist ? await (0, state_js_1.persistRunState)(state) : null;
        return { plan: validation.data, state, persistedTo };
    }
    record(state, result, usedFallbackAgents, aggregatedWarnings) {
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
        (0, state_js_1.touch)(state);
        this.onEvent?.({
            runId: state.runId,
            stage: result.agent,
            status: rec.status,
            usedFallback: rec.usedFallback,
            attempts: rec.attempts,
        });
    }
}
exports.IncidentResponseOrchestrator = IncidentResponseOrchestrator;
/** Convenience wrapper for a one-shot planning run. */
async function runIncidentResponse(facts, options) {
    return new IncidentResponseOrchestrator(options).run(facts);
}
