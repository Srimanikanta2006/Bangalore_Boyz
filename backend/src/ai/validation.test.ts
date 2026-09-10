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

test("accepts a complete verified incident", () => {
  const result = validateExplainRequest(validRequest);
  assert.equal(result.success, true);
});

test("rejects unsafe or incomplete incident data", () => {
  const result = validateExplainRequest({
    ...validRequest,
    risk: { score: 120, level: "dangerous", confidence: 2 },
    affectedAssets: [{ id: "D07", type: "unknown_asset", name: "Drain D07", riskLevel: "high" }],
    evidence: [],
  });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(result.errors.some((error) => error.includes("risk.score")));
    assert.ok(result.errors.some((error) => error.includes("risk.confidence")));
    assert.ok(result.errors.some((error) => error.includes("affectedAssets[0].type")));
    assert.ok(result.errors.some((error) => error.includes("evidence")));
  }
});

test("rejects invented action IDs and invalid action priorities", () => {
  const result = validateRecommendedActions([
    { actionId: "deploy_50_workers_and_shutdown_city", priority: "critical", reason: "Not allowed" },
    { actionId: "dispatch_drainage_team", priority: "medium", reason: "Wrong priority" },
  ]);
  assert.equal(result.success, false);
});

test("accepts the deterministic fallback response", () => {
  const request = validateExplainRequest(validRequest);
  assert.equal(request.success, true);
  if (!request.success) return;

  const response = buildFallbackExplanation(request.data);
  assert.equal(validateExplainResponse(response).success, true);
});

