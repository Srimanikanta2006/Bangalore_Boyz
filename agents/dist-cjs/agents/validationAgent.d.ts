/**
 * ValidationAgent (integration + grounding guard)
 * ==============================================
 *
 * This is the final, DETERMINISTIC stage. It never calls an LLM. It:
 *  1. Re-validates every planned action against the controlled catalog, the
 *     verified asset set, and the available units (defence in depth — even if an
 *     upstream agent's own validation was bypassed).
 *  2. Enforces the global confidence ceiling (engine confidence).
 *  3. Verifies action dependencies reference actions that are actually present.
 *  4. Integrates the specialist outputs into a single PROPOSED ResponsePlan that
 *     always requires operator approval.
 *
 * Every correction is surfaced as a warning — nothing is silently dropped.
 */
import type { AgentName, AgentResult, CascadeAnalysis, CommsBriefings, DispatchPlan, IncidentFacts, ResponsePlan, RiskAssessment } from "../types";
export interface ValidationInput {
    facts: IncidentFacts;
    risk: RiskAssessment;
    cascade: CascadeAnalysis;
    dispatch: DispatchPlan;
    comms: CommsBriefings;
    usedFallbackAgents: AgentName[];
    llmModel: string | null;
    priorWarnings: string[];
}
export declare class ValidationAgent {
    readonly name: AgentName;
    integrate(input: ValidationInput): AgentResult<ResponsePlan>;
}
