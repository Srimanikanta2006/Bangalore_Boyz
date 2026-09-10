import assert from "node:assert/strict";
import test from "node:test";

import { explainWithGeminiOrFallback, resolveModel, DEFAULT_GEMINI_MODEL } from "./geminiProvider.ts";
import type { ExplainRequest } from "./schemas.ts";

const request: ExplainRequest = {
  incidentId: "INC-001",
  hazard: { type: "heavy_rainfall", severity: "high" },
  risk: { score: 82, level: "critical", confidence: 0.91 },
  affectedAssets: [
    { id: "D07", type: "drain", name: "Drain D07", riskLevel: "high" },
    { id: "Hospital-A", type: "hospital", name: "Hospital A", riskLevel: "critical" },
  ],
  cascade: { path: ["D07", "Hospital-A"], etaMinutes: 25 },
  evidence: ["Rainfall threshold exceeded"],
};

test("resolves model using centralized config hierarchy", () => {
  // 1. Explicit preferred model takes top precedence
  assert.equal(resolveModel("gemini-1.5-pro"), "gemini-1.5-pro");

  // 2. Fallback to default when no options or env var
  const originalEnv = process.env.GEMINI_MODEL;
  delete process.env.GEMINI_MODEL;
  assert.equal(resolveModel(), DEFAULT_GEMINI_MODEL);

  // 3. Environment variable takes precedence over default
  process.env.GEMINI_MODEL = "gemini-2.0-flash";
  assert.equal(resolveModel(), "gemini-2.0-flash");

  // Restore env
  if (originalEnv !== undefined) {
    process.env.GEMINI_MODEL = originalEnv;
  } else {
    delete process.env.GEMINI_MODEL;
  }
});

test("uses the deterministic fallback when no API key is configured", async () => {
  const result = await explainWithGeminiOrFallback(request, { apiKey: "" });
  assert.equal(result.usedFallback, true);
  assert.equal(result.fallbackReason, "missing_api_key");
});

test("accepts valid Gemini JSON without contacting the network", async () => {
  const modelResponse = {
    incidentId: "INC-001",
    situationSummary: "Compound risk: heavy rainfall threatens Drain D07 and hospital access.",
    causalChains: [
      { path: ["Drain D07", "Hospital A"], impact: "Access disruption", etaMinutes: 25 },
    ],
    keyImpacts: [
      { assetId: "Hospital-A", assetName: "Hospital A", description: "Access disruption", severity: "critical" },
    ],
    recommendedActions: [
      { actionId: "dispatch_drainage_team", priority: "critical", reason: "Drain D07 is high risk." },
      { actionId: "notify_facility", priority: "high", reason: "Hospital access is at risk." },
    ],
    actionDependencies: [
      { actionId: "dispatch_drainage_team", rule: "Dispatch drainage team immediately." },
    ],
    uncertainties: [
      { statement: "Inundation rate is modeled.", requiredCheck: "Verify with field gauge within 15 min." },
    ],
    dataFreshness: [
      { source: "Rain Gauge", status: "fresh" },
    ],
    roleSpecificBriefings: {
      operator: "Prioritize Drain D07 clearance.",
      hospitalManager: "Hospital access may be impacted in 25 minutes.",
      fieldTeam: "Clear Drain D07 to protect hospital access.",
      public: "Avoid local low-lying roads.",
    },
    confidence: 0.88,
    explanation: "Heavy rainfall threatens Drain D07 and hospital access.",
    impactSummary: "Hospital A access may be disrupted.",
  };
  const fetchFn: typeof fetch = async () =>
    new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(modelResponse) }] } }] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

  const result = await explainWithGeminiOrFallback(request, { apiKey: "test-key", fetchFn });
  assert.equal(result.usedFallback, false);
  assert.deepEqual(result.response, modelResponse);
});

test("falls back when Gemini proposes an unapproved action ID", async () => {
  const fetchFn: typeof fetch = async () =>
    new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    incidentId: "INC-001",
                    situationSummary: "Unsafe output.",
                    recommendedActions: [
                      { actionId: "shut_down_city", priority: "critical", reason: "Not in catalog." },
                    ],
                    confidence: 0.8,
                    roleSpecificBriefings: {
                      operator: "op",
                      hospitalManager: "hm",
                      fieldTeam: "ft",
                      public: "pub",
                    },
                  }),
                },
              ],
            },
          },
        ],
      }),
      { status: 200 },
    );

  const result = await explainWithGeminiOrFallback(request, { apiKey: "test-key", fetchFn });
  assert.equal(result.usedFallback, true);
  assert.equal(result.fallbackReason, "invalid_model_response");
});

test("falls back gracefully on HTTP error status from provider", async () => {
  const fetchFn: typeof fetch = async () =>
    new Response("API Quota Exceeded or Invalid Key", {
      status: 403,
      headers: { "content-type": "text/plain" },
    });

  const result = await explainWithGeminiOrFallback(request, { apiKey: "bad-key", fetchFn });
  assert.equal(result.usedFallback, true);
  assert.equal(result.fallbackReason, "provider_error");
  assert.ok(result.errorDetails?.includes("HTTP 403"));
});

test("falls back gracefully on malformed non-JSON provider text", async () => {
  const fetchFn: typeof fetch = async () =>
    new Response(
      JSON.stringify({
        candidates: [{ content: { parts: [{ text: "Sorry, I cannot answer as JSON." }] } }],
      }),
      { status: 200 },
    );

  const result = await explainWithGeminiOrFallback(request, { apiKey: "test-key", fetchFn });
  assert.equal(result.usedFallback, true);
  assert.equal(result.fallbackReason, "invalid_model_response");
  assert.ok(result.errorDetails?.includes("JSON parse failed"));
});

test("falls back when model returns mismatched incidentId", async () => {
  const fetchFn: typeof fetch = async () =>
    new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    incidentId: "WRONG-INCIDENT-999",
                    situationSummary: "Flooding summary.",
                    confidence: 0.8,
                    recommendedActions: [
                      { actionId: "dispatch_drainage_team", priority: "critical", reason: "Clear drain" },
                    ],
                    roleSpecificBriefings: {
                      operator: "op",
                      hospitalManager: "hm",
                      fieldTeam: "ft",
                      public: "pub",
                    },
                  }),
                },
              ],
            },
          },
        ],
      }),
      { status: 200 },
    );

  const result = await explainWithGeminiOrFallback(request, { apiKey: "test-key", fetchFn });
  assert.equal(result.usedFallback, true);
  assert.equal(result.fallbackReason, "invalid_model_response");
  assert.ok(result.errorDetails?.includes("Incident ID mismatch"));
});

test("falls back when model returns confidence exceeding input risk confidence", async () => {
  const fetchFn: typeof fetch = async () =>
    new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    incidentId: "INC-001",
                    situationSummary: "Flooding summary.",
                    confidence: 0.99, // request.risk.confidence is 0.91
                    recommendedActions: [
                      { actionId: "dispatch_drainage_team", priority: "critical", reason: "Clear drain" },
                    ],
                    roleSpecificBriefings: {
                      operator: "op",
                      hospitalManager: "hm",
                      fieldTeam: "ft",
                      public: "pub",
                    },
                  }),
                },
              ],
            },
          },
        ],
      }),
      { status: 200 },
    );

  const result = await explainWithGeminiOrFallback(request, { apiKey: "test-key", fetchFn });
  assert.equal(result.usedFallback, true);
  assert.equal(result.fallbackReason, "invalid_model_response");
  assert.ok(result.errorDetails?.includes("exceeds risk confidence"));
});
