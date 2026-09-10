import assert from "node:assert/strict";
import test from "node:test";

import { PILOT_GRAPH } from "./pilotGraph.ts";
import { findSafeRoute } from "./routeEngine.ts";
import type { RiskScore } from "./types.ts";

test("avoids high-risk R24 between ST01 and H01", () => {
  const risks: RiskScore[] = [
    { assetId: "R24", score: 70, level: "high", confidence: 0.9, evidence: [] },
    { assetId: "R31", score: 10, level: "low", confidence: 0.9, evidence: [] },
    { assetId: "H01", score: 70, level: "high", confidence: 0.9, evidence: [] },
    { assetId: "ST01", score: 5, level: "low", confidence: 0.9, evidence: [] },
  ];
  const route = findSafeRoute(PILOT_GRAPH, risks, "ST01", "H01");
  assert.ok(route);
  assert.deepEqual(route.path, ["ST01", "R31", "H01"]);
  assert.ok(route.avoidedHighRiskSegments.includes("R24"));
  assert.equal(route.path.includes("R24"), false);
});

test("returns null for unknown nodes", () => {
  assert.equal(findSafeRoute(PILOT_GRAPH, [], "NOPE", "H01"), null);
});
