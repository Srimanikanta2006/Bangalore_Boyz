/**
 * BaseAgent
 * =========
 *
 * Uniform lifecycle for every specialist agent:
 *
 *   run(ctx):
 *     if LLM available:
 *       for attempt in 1..maxAttempts:
 *         text   = llm.complete(prompt)
 *         parsed = parseAndValidate(text)   // agent-specific
 *         if ok -> return { data, usedFallback: false }
 *       // all attempts exhausted -> deterministic fallback
 *     return { data: deterministic(ctx), usedFallback: true }
 *
 * Guarantees:
 *  - An agent NEVER throws out of `run`: any failure degrades to the
 *    deterministic fallback, so the orchestrator always gets a result.
 *  - Every result records attempts, timing, warnings, and fallback provenance.
 */
import type { LlmProvider } from "../llm/provider";
import type { AgentContext, AgentName, AgentResult } from "../types";
export interface BaseAgentOptions {
    llm: LlmProvider;
    maxAttempts?: number;
    temperature?: number;
    timeoutMs?: number;
}
export declare abstract class BaseAgent<T> {
    abstract readonly name: AgentName;
    protected readonly llm: LlmProvider;
    protected readonly maxAttempts: number;
    protected readonly temperature: number;
    protected readonly timeoutMs: number;
    constructor(opts: BaseAgentOptions);
    /** Grounding/safety system instruction shared by all agents. */
    protected systemInstruction(): string;
    /** Build the user prompt for this agent from the current context. */
    protected abstract buildPrompt(ctx: AgentContext): string;
    /**
     * Parse + validate raw model text into the agent's typed output.
     * MUST throw on any invalid/incomplete output so the run loop can retry or
     * fall back. It must also enforce grounding (no invented ids, etc.).
     */
    protected abstract parseAndValidate(raw: string, ctx: AgentContext): T;
    /** Deterministic synthesis from verified facts. Never throws. */
    protected abstract deterministic(ctx: AgentContext): T;
    run(ctx: AgentContext): Promise<AgentResult<T>>;
}
