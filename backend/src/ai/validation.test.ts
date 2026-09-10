import assert from "node:assert/strict";
import test from "node:test";

import { buildFallbackExplanation } from "./fallback.ts";
import { validateExplainRequest, validateExplainResponse, validateRecommendedActions } from "./validation.ts";

const validRequest = {
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

const compoundRequest = {
  incidentId: "INC-COMPOUND-001",
  hazard: { type: "cyclone", severity: "critical" },
  risk: { score: 92, level: "critical", confidence: 0.94 },
  affectedAssets: [
    { id: "D07", type: "drain", name: "Drain D07", riskLevel: "critical" },
    { id: "R24", type: "road", name: "Road R24", riskLevel: "high" },
    { id: "S3", type: "substation", name: "Substation S3", riskLevel: "high" },
    { id: "Hospital-A", type: "hospital", name: "Hospital A", riskLevel: "critical" },
  ],
  causalChains: [
    { path: ["D07", "R24", "Hospital-A"], impact: "Ambulance access disruption", etaMinutes: 20 },
    { path: ["D07", "S3", "Hospital-A"], impact: "Power-continuity risk", etaMinutes: 35 },
  ],
  evidence: ["Cyclone rainfall + high tide"],
  uncertainties: [
    { statement: "Substation water ingress not confirmed", requiredCheck: "Confirm within 15 min" },
  ],
  dataFreshness: [
    { source: "Doppler Radar", status: "fresh" },
  ],
};

test("accepts a complete verified incident request", () => {
  const result = validateExplainRequest(validRequest);
  assert.equal(result.success, true);
});

test("accepts a compound multi-path verified incident request", () => {
  const result = validateExplainRequest(compoundRequest);
  assert.equal(result.success, true);
});

test("rejects invalid risk score (> 100 or < 0)", () => {
  const resultHigh = validateExplainRequest({
    ...validRequest,
    risk: { score: 105, level: "critical", confidence: 0.9 },
  });
  assert.equal(resultHigh.success, false);
  if (!resultHigh.success) {
    assert.ok(resultHigh.errors.some((e) => e.includes("risk.score")));
  }

  const resultLow = validateExplainRequest({
    ...validRequest,
    risk: { score: -5, level: "low", confidence: 0.5 },
  });
  assert.equal(resultLow.success, false);
});

test("rejects invalid confidence (> 1 or < 0)", () => {
  const result = validateExplainRequest({
    ...validRequest,
    risk: { score: 80, level: "high", confidence: 1.5 },
  });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(result.errors.some((e) => e.includes("risk.confidence")));
  }
});

test("rejects missing or empty evidence array", () => {
  const resultEmpty = validateExplainRequest({
    ...validRequest,
    evidence: [],
  });
  assert.equal(resultEmpty.success, false);
  if (!resultEmpty.success) {
    assert.ok(resultEmpty.errors.some((e) => e.includes("evidence")));
  }

  const resultMissing = validateExplainRequest({
    ...validRequest,
    evidence: undefined,
  });
  assert.equal(resultMissing.success, false);
});

test("rejects malformed affected assets", () => {
  const result = validateExplainRequest({
    ...validRequest,
    affectedAssets: [{ id: "D07", type: "invented_type", name: "Drain D07", riskLevel: "high" }],
  });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(result.errors.some((e) => e.includes("affectedAssets[0].type")));
  }
});

test("rejects malformed cascade path", () => {
  const result = validateExplainRequest({
    ...validRequest,
    cascade: { path: [] },
  });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(result.errors.some((e) => e.includes("cascade")));
  }
});

test("rejects invented action IDs and invalid action priorities", () => {
  const result = validateRecommendedActions([
    { actionId: "deploy_50_workers_and_shutdown_city", priority: "critical", reason: "Not allowed" },
    { actionId: "dispatch_drainage_team", priority: "medium", reason: "Wrong priority for dispatch" },
  ]);
  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(result.errors.some((e) => e.includes("controlled catalog")));
    assert.ok(result.errors.some((e) => e.includes("priority is not allowed")));
  }
});

test("accepts valid recommended actions from catalog with allowed priorities", () => {
  const result = validateRecommendedActions([
    { actionId: "dispatch_drainage_team", priority: "critical", reason: "Clear D07" },
    { actionId: "open_alternate_route", priority: "high", reason: "Bypass R24" },
  ]);
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.length, 2);
  }
});

test("accepts the deterministic fallback response for compound incidents", () => {
  const request = validateExplainRequest(compoundRequest);
  assert.equal(request.success, true);
  if (!request.success) return;

  const response = buildFallbackExplanation(request.data);
  const validated = validateExplainResponse(response);
  assert.equal(validated.success, true);
});

test("rejects response missing mandatory role-specific briefings", () => {
  const badResponse = {
    incidentId: "INC-001",
    situationSummary: "Flooding risk",
    confidence: 0.8,
    recommendedActions: [
      { actionId: "dispatch_drainage_team", priority: "critical", reason: "Clear drain" },
    ],
    roleSpecificBriefings: {
      operator: "Alert operator",
      // missing hospitalManager, fieldTeam, public
    },
  };
  const result = validateExplainResponse(badResponse);
  assert.equal(result.success, false);
});

test("rejects response with invalid confidence range", () => {
  const badResponse = {
    incidentId: "INC-001",
    situationSummary: "Flooding risk",
    confidence: 1.2,
    recommendedActions: [
      { actionId: "dispatch_drainage_team", priority: "critical", reason: "Clear drain" },
    ],
    roleSpecificBriefings: {
      operator: "op",
      hospitalManager: "hm",
      fieldTeam: "ft",
      public: "pub",
    },
  };
  const result = validateExplainResponse(badResponse);
  assert.equal(result.success, false);
});
