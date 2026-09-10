import { validatePhotoTriageResponse, type PhotoTriageResponse } from './photoTriageSchemas';
import { resolveModel } from './geminiProvider';

/**
 * Gemini VISION photo triage for citizen hazard-report evidence photos.
 *
 * Same grounding/safety guarantees as the incident explain layer:
 *  - Low temperature, JSON-only output, strict schema validation.
 *  - The model is instructed to classify ONLY what is visible in the photo -
 *    never invent a location, severity score, or authoritative fact.
 *  - The result is always stored as a clearly-labeled, non-authoritative
 *    ADDITIONAL signal (mirrors how citizen-reported severity is already
 *    labeled non-authoritative) - it never overrides the citizen's own
 *    category or any deterministic engine value.
 *  - ANY failure (missing key, HTTP error, timeout, bad JSON, invalid
 *    schema) returns null. AI triage is a bonus signal, never a blocker:
 *    the report submission always succeeds regardless of this outcome.
 */

export interface PhotoTriageResult {
  response: PhotoTriageResponse;
  usedFallback: boolean;
  fallbackReason?: 'missing_api_key' | 'provider_error' | 'invalid_model_response' | 'schema_validation_failed';
  modelUsed?: string;
}

export interface PhotoTriageOptions {
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
}

const DEFAULT_TIMEOUT_MS = 30_000;

const PROMPT = `You are ClimateShield's citizen-photo triage assistant.
Rules:
1. Classify ONLY what is visibly present in the photo - do not invent a location, timestamp, or severity score.
2. If the photo does not clearly show a climate hazard, say so honestly in the caption and use waterDepthEstimate "UNKNOWN".
3. This is a non-authoritative, supplementary signal for a human operator - never a final determination.

Return ONLY valid JSON matching this schema:
{
  "waterDepthEstimate": "NONE|ANKLE|KNEE|WAIST|SUBMERGED|UNKNOWN",
  "visibleHazards": ["string"],
  "caption": "string (<=300 chars, describe only what is visible)",
  "confidence": 0.0
}`;

function extractText(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const candidate = (payload as { candidates?: unknown[] }).candidates?.[0];
  if (!candidate || typeof candidate !== 'object') return undefined;
  const parts = (candidate as { content?: { parts?: unknown[] } }).content?.parts;
  if (!Array.isArray(parts)) return undefined;
  const text = parts
    .map((part) => (part && typeof part === 'object' ? (part as { text?: unknown }).text : undefined))
    .filter((v): v is string => typeof v === 'string')
    .join('');
  return text || undefined;
}

/** Returns null on ANY failure - never throws, never blocks the citizen report submission. */
export async function triagePhotoWithGeminiOrNull(
  imageBase64: string,
  mimeType: string,
  options: PhotoTriageOptions = {},
): Promise<PhotoTriageResult | null> {
  const apiKey = (options.apiKey ?? process.env.GEMINI_API_KEY ?? '').trim();
  if (!apiKey) return null; // No key configured - silently skip, this is an optional enhancement.

  const fetchFn = options.fetchFn ?? fetch;
  const model = resolveModel(options.model);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetchFn(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: 'You are ClimateShield AI. Classify only what is visible in citizen hazard photos and return safe JSON only.' }] },
          contents: [
            {
              role: 'user',
              parts: [{ text: PROMPT }, { inlineData: { mimeType, data: imageBase64 } }],
            },
          ],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
        }),
      },
    );
    if (!response.ok) return null;

    const text = extractText(await response.json());
    if (!text) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return null;
    }

    const validation = validatePhotoTriageResponse(parsed);
    if (!validation.success) return null;

    return { response: validation.data, usedFallback: false, modelUsed: model };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
