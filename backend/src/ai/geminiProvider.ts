import { buildFallbackExplanation } from "./fallback.ts";
import type { ExplainRequest, ExplainResponse } from "./schemas.ts";
import { validateExplainResponse } from "./validation.ts";

export interface GeminiProviderOptions {
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
}

export interface ExplanationResult {
  response: ExplainResponse;
  usedFallback: boolean;
  fallbackReason?:
    | "missing_api_key"
    | "provider_error"
    | "invalid_model_response"
    | "schema_validation_failed"
    | "action_safety_violation";
  modelUsed?: string;
  errorDetails?: string;
}

const DEFAULT_TIMEOUT_MS = 45_000;

/** Default safe model if none specified in GEMINI_MODEL or options */
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

/**
 * Resolves the Gemini model name to use.
 * Precedence: options.model -> process.env.GEMINI_MODEL -> DEFAULT_GEMINI_MODEL
 */
export function resolveModel(preferredModel?: string): string {
  if (preferredModel && preferredModel.trim().length > 0) {
    return preferredModel.trim();
  }
  const envModel = process.env.GEMINI_MODEL?.trim();
  if (envModel && envModel.length > 0) {
    return envModel;
  }
  return DEFAULT_GEMINI_MODEL;
}

function createPrompt(request: ExplainRequest): string {
  return `You are ClimateShield's compound cascade explanation and operator-assistance layer.
You must adhere strictly to these safety and grounding rules:
1. Use ONLY the verified incident facts supplied below.
2. Do NOT invent environmental measurements, hazard facts, or sensor readings.
3. Do NOT invent infrastructure assets or unverified relationships.
4. Do NOT recalculate or invent risk scores.
5. Do NOT invent action IDs. Only recommend action IDs from the controlled action catalog below.
6. Represent uncertainties and data freshness honestly without claiming certainty unsupported by verified evidence.
7. The output is decision-support for human/operator approval, not autonomous execution.

Controlled action IDs:
- dispatch_drainage_team (allowed priorities: high, critical)
- close_road (allowed priorities: high, critical)
- open_alternate_route (allowed priorities: medium, high, critical)
- pre_position_ambulance (allowed priorities: high, critical)
- notify_facility (allowed priorities: medium, high, critical)
- issue_local_advisory (allowed priorities: medium, high, critical)

Return ONLY valid JSON matching this schema:
{
  "incidentId": "string",
  "situationSummary": "string",
  "causalChains": [
    { "path": ["string"], "impact": "string", "etaMinutes": 0 }
  ],
  "keyImpacts": [
    { "assetId": "string", "assetName": "string", "description": "string", "timeHorizonMinutes": 0, "severity": "low|medium|high|critical" }
  ],
  "recommendedActions": [
    { "actionId": "string", "priority": "low|medium|high|critical", "reason": "string", "targetAssetId": "string" }
  ],
  "actionDependencies": [
    { "actionId": "string", "dependsOnActionId": "string", "rule": "string" }
  ],
  "uncertainties": [
    { "statement": "string", "requiredCheck": "string" }
  ],
  "roleSpecificBriefings": {
    "operator": "string",
    "hospitalManager": "string",
    "fieldTeam": "string",
    "public": "string"
  },
  "confidence": 0,
  "explanation": "string",
  "impactSummary": "string"
}

Constraint: "incidentId" must exactly match "${request.incidentId}".
Constraint: "confidence" must be a number between 0 and ${request.risk.confidence}.

Verified incident facts:
${JSON.stringify(request, null, 2)}`;
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
 * Calls Gemini to synthesize compound cascade explanations, action dependencies,
 * and role-specific briefings. Uses centralized model config and safely falls back
 * to deterministic synthesis if anything fails.
 */
export async function explainWithGeminiOrFallback(
  request: ExplainRequest,
  options: GeminiProviderOptions = {},
): Promise<ExplanationResult> {
  try {
    (process as unknown as { loadEnvFile?: () => void }).loadEnvFile?.();
  } catch {
    // ignore if no .env file
  }

  const apiKey = (options.apiKey ?? process.env.GEMINI_API_KEY ?? "").trim();
  if (!apiKey) {
    return {
      response: buildFallbackExplanation(request),
      usedFallback: true,
      fallbackReason: "missing_api_key",
    };
  }

  const fetchFn = options.fetchFn ?? fetch;
  const model = resolveModel(options.model);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetchFn(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: "You are ClimateShield AI. Explain verified compound climate-risk cascades and return safe JSON only." }],
          },
          contents: [{ role: "user", parts: [{ text: createPrompt(request) }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
        }),
      },
    );
    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      throw new Error(`HTTP ${response.status} on model '${model}': ${errBody}`);
    }

    const text = extractText(await response.json());
    if (!text) {
      return {
        response: buildFallbackExplanation(request),
        usedFallback: true,
        fallbackReason: "invalid_model_response",
        modelUsed: model,
        errorDetails: "Empty text candidate returned from Gemini.",
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
        modelUsed: model,
        errorDetails: `JSON parse failed on output: ${text.slice(0, 200)}`,
      };
    }

    const validation = validateExplainResponse(parsed);
    if (!validation.success) {
      return {
        response: buildFallbackExplanation(request),
        usedFallback: true,
        fallbackReason: "invalid_model_response",
        modelUsed: model,
        errorDetails: `Schema validation failed: ${validation.errors.join("; ")}`,
      };
    }

    if (validation.data.incidentId !== request.incidentId) {
      return {
        response: buildFallbackExplanation(request),
        usedFallback: true,
        fallbackReason: "invalid_model_response",
        modelUsed: model,
        errorDetails: `Incident ID mismatch: expected ${request.incidentId}, got ${validation.data.incidentId}`,
      };
    }

    if (validation.data.confidence > request.risk.confidence) {
      return {
        response: buildFallbackExplanation(request),
        usedFallback: true,
        fallbackReason: "invalid_model_response",
        modelUsed: model,
        errorDetails: `Confidence ${validation.data.confidence} exceeds risk confidence ${request.risk.confidence}`,
      };
    }

    return { response: validation.data, usedFallback: false, modelUsed: model };
  } catch (err: unknown) {
    const errorDetails = controller.signal.aborted
      ? `Request timed out after ${(options.timeoutMs ?? DEFAULT_TIMEOUT_MS) / 1000}s.`
      : err instanceof Error
      ? err.message
      : String(err);
    return {
      response: buildFallbackExplanation(request),
      usedFallback: true,
      fallbackReason: "provider_error",
      modelUsed: model,
      errorDetails,
    };
  } finally {
    clearTimeout(timeout);
  }
}
