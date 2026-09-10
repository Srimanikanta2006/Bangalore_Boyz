import assert from "node:assert/strict";
import test from "node:test";

import { explainWithGeminiOrFallback } from "./geminiProvider.ts";
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

test("falls back when Gemini proposes an unapproved action", async () => {
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
