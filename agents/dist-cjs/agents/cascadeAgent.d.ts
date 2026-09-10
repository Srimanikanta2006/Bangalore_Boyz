/**
 * CascadeAgent
 * ============
 * Turns the verified dependency-cascade nodes into an ordered critical path and
 * human-readable projected failures. It only ever references assets present in
 * the facts — the critical path and links are validated against the fact set.
 */
import { BaseAgent } from "./baseAgent";
import type { AgentContext, AgentName, CascadeAnalysis } from "../types";
export declare class CascadeAgent extends BaseAgent<CascadeAnalysis> {
    readonly name: AgentName;
    protected buildPrompt(ctx: AgentContext): string;
    protected parseAndValidate(raw: string, ctx: AgentContext): CascadeAnalysis;
    private coerceLinks;
    protected deterministic(ctx: AgentContext): CascadeAnalysis;
}
