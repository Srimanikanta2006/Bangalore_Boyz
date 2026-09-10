import assert from "node:assert/strict";
import test from "node:test";

import { PILOT_GRAPH } from "./pilotGraph.ts";
import { riskLevelFromScore, scoreAsset } from "./riskEngine.ts";
import type { Hazard } from "./types.ts";

function hazard(rainfallMmPerHour: number): Hazard {
  return {
    id: "HZ-test",
    type: "heavy_rainfall",
    rainfallMmPerHour,
    source: "simulated",
    timestamp: new Date().toISOString(),
    zoneId: "zone-c",
  };
}

test("D07 is HIGH at 40 mm/hr", () => {
  const drain = PILOT_GRAPH.assets.find((asset) => asset.id === "D07");
  assert.ok(drain);
  const risk = scoreAsset(drain, hazard(40));
  assert.equal(risk.level, "high");
  assert.ok(risk.score >= 50 && risk.score < 75);
  assert.equal(risk.confidence, 0.9);
  assert.ok(risk.evidence.some((item) => item.includes("40 mm/hr")));
  assert.ok(risk.evidence.some((item) => item.includes("Historical incidents = 3")));
});

test("D07 stays below HIGH at 30 mm/hr", () => {
  const drain = PILOT_GRAPH.assets.find((asset) => asset.id === "D07");
  assert.ok(drain);
  const risk = scoreAsset(drain, hazard(30));
  assert.equal(risk.level, "medium");
});

test("D07 is CRITICAL at 60 mm/hr", () => {
  const drain = PILOT_GRAPH.assets.find((asset) => asset.id === "D07");
  assert.ok(drain);
  const risk = scoreAsset(drain, hazard(60));
  assert.equal(risk.level, "critical");
});

test("risk bands", () => {
  assert.equal(riskLevelFromScore(24), "low");
  assert.equal(riskLevelFromScore(25), "medium");
  assert.equal(riskLevelFromScore(50), "high");
  assert.equal(riskLevelFromScore(75), "critical");
});
