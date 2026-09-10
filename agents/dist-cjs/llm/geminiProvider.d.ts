/**
 * Gemini LLM adapter (implements LlmProvider).
 *
 * Thin fetch wrapper around the Gemini generateContent endpoint. Mirrors the
 * grounding/safety posture of cline_backend/src/ai/geminiProvider.ts:
 *  - JSON-only responses, low temperature.
 *  - Hard timeout via AbortController.
 *  - No dependency beyond the global `fetch` (Node 18+/20+).
 *
 * It performs NO validation of the content itself — each agent validates and
 * falls back on its own. This class only handles transport.
 */
import type { LlmCompleteOptions, LlmProvider } from "./provider";
export declare const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
export interface GeminiProviderConfig {
    apiKey?: string;
    model?: string;
    fetchFn?: typeof fetch;
}
export declare class GeminiProvider implements LlmProvider {
    readonly model: string;
    readonly available: boolean;
    private readonly apiKey;
    private readonly fetchFn;
    constructor(config?: GeminiProviderConfig);
    complete(prompt: string, options?: LlmCompleteOptions): Promise<string>;
}
/**
 * Factory: returns a live GeminiProvider when GEMINI_API_KEY is present,
 * otherwise a NullLlmProvider (deterministic-only mode).
 */
export declare function createDefaultProvider(config?: GeminiProviderConfig): LlmProvider;
