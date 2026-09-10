import { buildFallbackExplanation } from "./fallback.ts";
import type { ExplainRequest, ExplainResponse } from "./schemas.ts";
import { validateExplainResponse } from "./validation.ts";

export interface ExplanationProvider {
  explain(request: ExplainRequest): Promise<ExplainResponse>;
}

export interface GeminiProviderOptions {
  /** Keep this secret in an environment variable; never commit it. */
  apiKey?: string;
  /** Choose an available Gemini model in deployment configuration. */
  model?: string;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
}

export interface ExplanationResult {
  response: ExplainResponse;
  usedFallback: boolean;
  fallbackReason?: "missing_api_key" | "provider_error" | "invalid_model_response";
}

const DEFAULT_MODEL = "gemini-2.0-flash";
const DEFAULT_TIMEOUT_MS = 8_000;

function createPrompt(request: ExplainRequest): string {
  return `You are ClimateShield's operator-assistance component. Use ONLY the verified incident facts below.

Do not calculate risk, add assets, add measurements, add cascade relationships, or create action IDs. Do not say that an action has been executed. Recommend only these action IDs: dispatch_drainage_team, close_road, open_alternate_route, pre_position_ambulance, notify_facility, issue_local_advisory.

Return only JSON with this exact shape:
{
  "incidentId": "string",
  "explanation": "string",
  "impactSummary": "string",
  "recommendedActions": [{ "actionId": "string", "priority": "low|medium|high|critical", "reason": "string" }],
  "confidence": 0
}

The incidentId must match the input. confidence must be between 0 and the supplied risk confidence. Be concise and operator-facing.

Verified incident facts:
${JSON.stringify(request)}`;
}

function extractText(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const candidate = (payload as { candidates?: unknown[] }).candidates?.[0];
  if (!candidate || typeof candidate !== "object") return undefined;
  const parts = (candidate as { content?: { parts?: unknown[] } }).content?.parts;
  if (!Array.isArray(parts)) return undefined;
  const text = parts
    .map((part) => (part && typeof part === "object" ? (part as { text?: unknown }).text : undefined))
    .filter((value): value is string => typeof value === "string")
    .join("");
  return text || undefined;
}

/**
 * Calls Gemini only after verified facts exist. Provider failures and malformed
 * responses always return the deterministic fallback instead of failing the incident.
 */
export async function explainWithGeminiOrFallback(
  request: ExplainRequest,
  options: GeminiProviderOptions = {},
): Promise<ExplanationResult> {
  const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      response: buildFallbackExplanation(request),
      usedFallback: true,
      fallbackReason: "missing_api_key",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const response = await (options.fetchFn ?? fetch)(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(options.model ?? DEFAULT_MODEL)}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: "You explain verified climate-risk facts and return safe JSON only." }],
          },
          contents: [{ role: "user", parts: [{ text: createPrompt(request) }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
        }),
      },
    );
    if (!response.ok) throw new Error(`Gemini returned HTTP ${response.status}.`);

    const text = extractText(await response.json());
    if (!text) {
      return {
        response: buildFallbackExplanation(request),
        usedFallback: true,
        fallbackReason: "invalid_model_response",
      };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return {
        response: buildFallbackExplanation(request),
        usedFallback: true,
        fallbackReason: "invalid_model_response",
      };
    }

    const validation = validateExplainResponse(parsed);
    if (
      !validation.success ||
      validation.data.incidentId !== request.incidentId ||
      validation.data.confidence > request.risk.confidence
    ) {
      return {
        response: buildFallbackExplanation(request),
        usedFallback: true,
        fallbackReason: "invalid_model_response",
      };
    }
    return { response: validation.data, usedFallback: false };
  } catch {
    return {
      response: buildFallbackExplanation(request),
      usedFallback: true,
      fallbackReason: "provider_error",
    };
  } finally {
    clearTimeout(timeout);
  }
}

