import assert from "node:assert/strict";
import test from "node:test";

import { isAllowedActionPriority, isValidAction } from "./actionCatalog.ts";
import { buildFallbackExplanation } from "./fallback.ts";
import type { ExplainRequest } from "./schemas.ts";

const legacyIncident: ExplainRequest = {
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

const compoundIncident: ExplainRequest = {
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
  evidence: ["Severe cyclonic rainfall and high tide", "Substation S3 and Road R24 downstream of Drain D07"],
  uncertainties: [
    {
      statement: "Substation water ingress is not yet confirmed.",
      requiredCheck: "Confirm substation status within 15 minutes.",
    },
  ],
};

test("handles legacy single-path incidents gracefully", () => {
  const response = buildFallbackExplanation(legacyIncident);

  assert.equal(response.incidentId, "INC-001");
  assert.equal(response.causalChains.length, 1);
  assert.deepEqual(response.causalChains[0].path, ["Drain D07", "Road R24", "Hospital A"]);
  assert.ok(response.recommendedActions.some((a) => a.actionId === "dispatch_drainage_team"));
  assert.ok(response.roleSpecificBriefings.hospitalManager.length > 0);
  assert.equal(response.confidence, 0.9);
});

test("synthesizes compound cascade paths, dependencies, and role briefings", () => {
  const response = buildFallbackExplanation(compoundIncident);

  assert.equal(response.incidentId, "INC-COMPOUND-001");
  assert.match(response.situationSummary, /compound access-and-power continuity threat/i);
  assert.equal(response.causalChains.length, 2);

  // Key impacts include dual vulnerability for Hospital A
  const hospitalImpact = response.keyImpacts.find((k) => k.assetName === "Hospital A");
  assert.ok(hospitalImpact);
  assert.match(hospitalImpact.description, /dual vulnerability/i);

  // Action dependencies enforce rule before road closure
  const roadDep = response.actionDependencies.find((d) => d.actionId === "close_road");
  assert.ok(roadDep);
  assert.equal(roadDep.dependsOnActionId, "open_alternate_route");

  // Uncertainties preserved
  assert.equal(response.uncertainties.length, 1);
  assert.equal(response.uncertainties[0].statement, "Substation water ingress is not yet confirmed.");

  // Role-specific briefings
  assert.match(response.roleSpecificBriefings.hospitalManager, /ambulance access.*20 minutes/i);
  assert.match(response.roleSpecificBriefings.fieldTeam, /Drain D07/);
  assert.match(response.roleSpecificBriefings.public, /Road R24/);
});

test("never accepts an action outside the controlled catalog", () => {
  assert.equal(isValidAction("deploy_50_workers_and_shutdown_city"), false);
  assert.equal(isAllowedActionPriority("dispatch_drainage_team", "medium"), false);
  assert.equal(isAllowedActionPriority("dispatch_drainage_team", "critical"), true);
});
