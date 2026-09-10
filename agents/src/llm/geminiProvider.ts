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
import { NullLlmProvider } from "./provider";

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_TIMEOUT_MS = 45_000;

export interface GeminiProviderConfig {
  apiKey?: string;
  model?: string;
  fetchFn?: typeof fetch;
}

function resolveModel(preferred?: string): string {
  if (preferred && preferred.trim()) return preferred.trim();
  const envModel = process.env.GEMINI_MODEL?.trim();
  if (envModel) return envModel;
  return DEFAULT_GEMINI_MODEL;
}

function extractText(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const candidate = (payload as { candidates?: unknown[] }).candidates?.[0];
  if (!candidate || typeof candidate !== "object") return undefined;
  const parts = (candidate as { content?: { parts?: unknown[] } }).content?.parts;
  if (!Array.isArray(parts)) return undefined;
  const text = parts
    .map((p) => (p && typeof p === "object" ? (p as { text?: unknown }).text : undefined))
    .filter((v): v is string => typeof v === "string")
    .join("");
  return text || undefined;
}

export class GeminiProvider implements LlmProvider {
  readonly model: string;
  readonly available: boolean;
  private readonly apiKey: string;
  private readonly fetchFn: typeof fetch;

  constructor(config: GeminiProviderConfig = {}) {
    this.apiKey = (config.apiKey ?? process.env.GEMINI_API_KEY ?? "").trim();
    this.model = resolveModel(config.model);
    this.fetchFn = config.fetchFn ?? fetch;
    this.available = this.apiKey.length > 0;
  }

  async complete(prompt: string, options: LlmCompleteOptions = {}): Promise<string> {
    if (!this.available) {
      throw new Error("GeminiProvider: missing GEMINI_API_KEY.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );

    try {
      const res = await this.fetchFn(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          this.model,
        )}:generateContent`,
        {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": this.apiKey },
          signal: controller.signal,
          body: JSON.stringify({
            systemInstruction: options.system
              ? { parts: [{ text: options.system }] }
              : undefined,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: options.json === false ? "text/plain" : "application/json",
              temperature: options.temperature ?? 0.1,
            },
          }),
        },
      );

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Gemini HTTP ${res.status} on '${this.model}': ${body.slice(0, 200)}`);
      }

      const text = extractText(await res.json());
      if (!text) throw new Error("Gemini returned an empty text candidate.");
      return text;
    } catch (err: unknown) {
      if (controller.signal.aborted) {
        throw new Error(
          `Gemini request timed out after ${(options.timeoutMs ?? DEFAULT_TIMEOUT_MS) / 1000}s.`,
        );
      }
      throw err instanceof Error ? err : new Error(String(err));
    } finally {
      clearTimeout(timeout);
    }
  }
}

/**
 * Factory: returns a live GeminiProvider when GEMINI_API_KEY is present,
 * otherwise a NullLlmProvider (deterministic-only mode).
 */
export function createDefaultProvider(config: GeminiProviderConfig = {}): LlmProvider {
  const provider = new GeminiProvider(config);
  if (provider.available) return provider;
  return new NullLlmProvider();
}
