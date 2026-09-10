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
  modelUsed?: string;
  errorDetails?: string;
}

const DEFAULT_TIMEOUT_MS = 15_000;

const CANDIDATE_MODELS = [
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash",
  "gemini-2.0-flash-exp",
  "gemini-2.0-flash",
  "gemini-1.5-flash-002",
  "gemini-1.5-flash-001",
  "gemini-1.5-pro-latest",
  "gemini-1.5-pro",
  "gemini-pro",
];

export async function listAvailableModels(
  apiKey: string,
  fetchFn: typeof fetch = fetch,
): Promise<string[]> {
  try {
    const res = await fetchFn("https://generativelanguage.googleapis.com/v1beta/models", {
      headers: { "x-goog-api-key": apiKey },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      models?: Array<{ name: string; supportedGenerationMethods?: string[] }>;
    };
    return (data.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => m.name.replace(/^models\//, ""));
  } catch {
    return [];
  }
}

async function resolveModel(
  apiKey: string,
  preferredModel?: string,
  fetchFn: typeof fetch = fetch,
): Promise<string> {
  if (preferredModel) return preferredModel;

  // Query Google API to find which models this key actually has access to
  const available = await listAvailableModels(apiKey, fetchFn);
  if (available.length > 0) {
    for (const candidate of CANDIDATE_MODELS) {
      if (available.includes(candidate)) return candidate;
    }
    return available[0];
  }

  // Default fallback if list is unavailable
  return "gemini-1.5-flash-latest";
}

function createPrompt(request: ExplainRequest): string {
  return `You are ClimateShield's compound cascade explanation and operator-assistance layer.
Use ONLY the verified incident facts below. Do not invent assets, measurements, unverified causal links, or action IDs.

Your job is to organize the verified facts into:
1. Competing cascade paths and which impact happens first
2. Which asset is most critical (especially compound dual vulnerabilities)
3. Safest sequence of human-approved actions from the controlled catalog
4. Explicit operational dependencies between actions (e.g., do not close road until alternate route is verified)
5. Uncertainties and required verification checks
6. Distinct role-specific briefings tailored to Operator, Hospital Manager, Field Drainage Team, and the Public

Controlled action IDs: dispatch_drainage_team, close_road, open_alternate_route, pre_position_ambulance, notify_facility, issue_local_advisory.

Return only JSON with this exact shape:
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

The incidentId must match "${request.incidentId}". confidence must be between 0 and ${request.risk.confidence}.

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
 * Calls Gemini to synthesize compound cascade explanations, action dependencies,
 * and role-specific briefings. Auto-detects supported models for the API key and
 * safely falls back to deterministic synthesis if anything fails.
 */
export async function explainWithGeminiOrFallback(
  request: ExplainRequest,
  options: GeminiProviderOptions = {},
): Promise<ExplanationResult> {
  const apiKey = (options.apiKey ?? process.env.GEMINI_API_KEY ?? "").trim();
  if (!apiKey) {
    return {
      response: buildFallbackExplanation(request),
      usedFallback: true,
      fallbackReason: "missing_api_key",
    };
  }

  const fetchFn = options.fetchFn ?? fetch;
  const model = await resolveModel(apiKey, options.model, fetchFn);

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
            parts: [{ text: "You explain verified compound climate-risk cascades and return safe JSON only." }],
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
    const errorDetails = err instanceof Error ? err.message : String(err);
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
