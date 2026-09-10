import assert from "node:assert/strict";
import test from "node:test";

import { isAllowedActionPriority, isValidAction } from "./actionCatalog.ts";
import { buildFallbackExplanation } from "./fallback.ts";
import type { ExplainRequest } from "./schemas.ts";

const drainageHospitalIncident: ExplainRequest = {
  incidentId: "INC-001",
  hazard: { type: "heavy_rainfall", severity: "high" },
  risk: { score: 82, level: "critical", confidence: 0.91 },
  affectedAssets: [
    { id: "D07", type: "drain", name: "Drain D07", riskLevel: "high" },
    { id: "R24", type: "road", name: "Road R24", riskLevel: "high" },
    { id: "Hospital-A", type: "hospital", name: "Hospital A", riskLevel: "critical" },
  ],
  cascade: { path: ["D07", "R24", "Hospital-A"], etaMinutes: 25 },
  evidence: ["Rainfall threshold exceeded", "Hospital A depends on R24 for ambulance access"],
};

test("returns bounded recommendations for the drainage-to-hospital scenario", () => {
  const response = buildFallbackExplanation(drainageHospitalIncident);

  assert.equal(response.incidentId, "INC-001");
  assert.match(response.explanation, /Drain D07 â Road R24 â Hospital A/);
  assert.deepEqual(response.recommendedActions, [
    {
      actionId: "dispatch_drainage_team",
      priority: "critical",
      reason: "Inspect or clear the verified high-risk drainage location before the cascade progresses.",
    },
    {
      actionId: "notify_facility",
      priority: "high",
      reason: "The verified cascade may disrupt access to the affected healthcare facility.",
    },
  ]);
  assert.equal(response.confidence, 0.9);
});

test("never accepts an action outside the controlled catalog", () => {
  assert.equal(isValidAction("deploy_50_workers_and_shutdown_city"), false);
  assert.equal(isAllowedActionPriority("dispatch_drainage_team", "medium"), false);
  assert.equal(isAllowedActionPriority("dispatch_drainage_team", "critical"), true);
});

