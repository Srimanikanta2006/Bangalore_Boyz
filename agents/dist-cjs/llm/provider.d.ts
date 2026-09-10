/**
 * LLM Provider Port
 * =================
 *
 * A minimal interface the agents depend on, so the multi-agent layer is not
 * hard-coupled to any single vendor. The default adapter targets Gemini
 * (consistent with cline_backend/src/ai/geminiProvider.ts), but any object
 * implementing `LlmProvider` can be injected — including a NullLlmProvider used
 * when no API key is configured, which forces every agent onto its deterministic
 * fallback. AI is therefore never a single point of failure.
 */
export interface LlmCompleteOptions {
    /** System-level instruction (grounding + safety framing). */
    system?: string;
    /** Low by default — these are structured, grounded tasks, not creative ones. */
    temperature?: number;
    timeoutMs?: number;
    /** Request strict JSON output when the provider supports it. */
    json?: boolean;
}
export interface LlmProvider {
    /** Human-readable model id for provenance, or null when no live model is used. */
    readonly model: string | null;
    /** true when the provider can actually reach a model (has credentials). */
    readonly available: boolean;
    /** Returns raw model text. Throws on any transport/HTTP/timeout error. */
    complete(prompt: string, options?: LlmCompleteOptions): Promise<string>;
}
/**
 * NullLlmProvider — used when GEMINI_API_KEY is absent. It reports itself as
 * unavailable so agents skip the LLM path entirely and synthesize deterministic
 * output. `complete` throws if ever called (it should not be).
 */
export declare class NullLlmProvider implements LlmProvider {
    readonly model: null;
    readonly available = false;
    complete(): Promise<string>;
}
