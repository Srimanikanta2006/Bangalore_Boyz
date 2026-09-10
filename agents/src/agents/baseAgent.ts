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
import { nowIso } from "../util";

export interface BaseAgentOptions {
  llm: LlmProvider;
  maxAttempts?: number;
  temperature?: number;
  timeoutMs?: number;
}

export abstract class BaseAgent<T> {
  abstract readonly name: AgentName;

  protected readonly llm: LlmProvider;
  protected readonly maxAttempts: number;
  protected readonly temperature: number;
  protected readonly timeoutMs: number;

  constructor(opts: BaseAgentOptions) {
    this.llm = opts.llm;
    this.maxAttempts = Math.max(1, opts.maxAttempts ?? 2);
    this.temperature = opts.temperature ?? 0.1;
    this.timeoutMs = opts.timeoutMs ?? 45_000;
  }

  /** Grounding/safety system instruction shared by all agents. */
  protected systemInstruction(): string {
    return [
      "You are a ClimateShield incident-response specialist agent.",
      "Use ONLY the verified facts provided. Do not invent assets, measurements,",
      "sensor readings, hazards, or risk scores. Do not recompute risk. Your output",
      "is decision-support for human operator approval, never autonomous execution.",
      "Return ONLY valid JSON matching the requested schema.",
    ].join(" ");
  }

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

  async run(ctx: AgentContext): Promise<AgentResult<T>> {
    const startedAt = nowIso();
    const warnings: string[] = [];
    let attempts = 0;

    if (this.llm.available) {
      const prompt = this.buildPrompt(ctx);
      for (let i = 0; i < this.maxAttempts; i++) {
        attempts++;
        try {
          const text = await this.llm.complete(prompt, {
            system: this.systemInstruction(),
            temperature: this.temperature,
            timeoutMs: this.timeoutMs,
            json: true,
          });
          const data = this.parseAndValidate(text, ctx);
          return {
            agent: this.name,
            data,
            usedFallback: false,
            attempts,
            startedAt,
            finishedAt: nowIso(),
            warnings,
          };
        } catch (err) {
          warnings.push(
            `attempt ${attempts} failed: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    }

    // No LLM, or every attempt failed -> deterministic fallback (never throws).
    const data = this.deterministic(ctx);
    return {
      agent: this.name,
      data,
      usedFallback: true,
      fallbackReason: this.llm.available
        ? "all_llm_attempts_failed"
        : "no_llm_configured",
      attempts,
      startedAt,
      finishedAt: nowIso(),
      warnings,
    };
  }
}
