"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAgent = void 0;
const util_1 = require("../util");
class BaseAgent {
    llm;
    maxAttempts;
    temperature;
    timeoutMs;
    constructor(opts) {
        this.llm = opts.llm;
        this.maxAttempts = Math.max(1, opts.maxAttempts ?? 2);
        this.temperature = opts.temperature ?? 0.1;
        this.timeoutMs = opts.timeoutMs ?? 45_000;
    }
    /** Grounding/safety system instruction shared by all agents. */
    systemInstruction() {
        return [
            "You are a ClimateShield incident-response specialist agent.",
            "Use ONLY the verified facts provided. Do not invent assets, measurements,",
            "sensor readings, hazards, or risk scores. Do not recompute risk. Your output",
            "is decision-support for human operator approval, never autonomous execution.",
            "Return ONLY valid JSON matching the requested schema.",
        ].join(" ");
    }
    async run(ctx) {
        const startedAt = (0, util_1.nowIso)();
        const warnings = [];
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
                        finishedAt: (0, util_1.nowIso)(),
                        warnings,
                    };
                }
                catch (err) {
                    warnings.push(`attempt ${attempts} failed: ${err instanceof Error ? err.message : String(err)}`);
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
            finishedAt: (0, util_1.nowIso)(),
            warnings,
        };
    }
}
exports.BaseAgent = BaseAgent;
