/**
 * RiskAnalystAgent
 * ================
 * Interprets the engine's verified risk facts into an operator-facing risk
 * assessment. It NEVER recomputes the score — it echoes the engine score/level
 * and caps its confidence at the engine's confidence.
 */
import { BaseAgent } from "./baseAgent";
import type { AgentContext, AgentName, RiskAssessment } from "../types";
export declare class RiskAnalystAgent extends BaseAgent<RiskAssessment> {
    readonly name: AgentName;
    protected buildPrompt(ctx: AgentContext): string;
    protected parseAndValidate(raw: string, ctx: AgentContext): RiskAssessment;
    private coerceKeyImpacts;
    protected deterministic(ctx: AgentContext): RiskAssessment;
}
