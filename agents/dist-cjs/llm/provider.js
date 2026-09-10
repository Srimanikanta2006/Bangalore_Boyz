"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NullLlmProvider = void 0;
/**
 * NullLlmProvider — used when GEMINI_API_KEY is absent. It reports itself as
 * unavailable so agents skip the LLM path entirely and synthesize deterministic
 * output. `complete` throws if ever called (it should not be).
 */
class NullLlmProvider {
    model = null;
    available = false;
    async complete() {
        throw new Error("NullLlmProvider has no model configured.");
    }
}
exports.NullLlmProvider = NullLlmProvider;
