import assert from "node:assert/strict";
import test from "node:test";

import { propagateCascades } from "./cascadeEngine.ts";
import { PILOT_GRAPH } from "./pilotGraph.ts";
import type { InfrastructureGraph, RiskScore } from "./types.ts";

function risk(assetId: string, level: RiskScore["level"] = "high"): RiskScore {
  return { assetId, score: 60, level, confidence: 0.9, evidence: [] };
}

test("traverses GraphEdge paths D07 → R24 → H01 and D07 → S3 → H01", () => {
  const events = propagateCascades(PILOT_GRAPH, ["D07"], new Map([["D07", risk("D07")]]));
  const paths = events.map((event) => event.path.join(">")).sort();
  assert.deepEqual(paths, ["D07>R24>H01", "D07>S3>H01"]);
  const access = events.find((event) => event.path.includes("R24"));
  const power = events.find((event) => event.path.includes("S3"));
  assert.equal(access?.etaMinutes, 20);
  assert.equal(access?.criticalAssetId, "H01");
  assert.equal(access?.impact, "Ambulance access disruption");
  assert.equal(power?.etaMinutes, 35);
  assert.equal(power?.impact, "Power-continuity risk");
});

test("disconnected origin yields no cascade", () => {
  const isolated: InfrastructureGraph = {
    zoneId: "x",
    zoneName: "x",
    assets: [{ id: "D07", name: "Drain D07", type: "drain", zoneId: "x", vulnerability: 1, historicalIncidentCount: 1 }],
    edges: [],
  };
  const events = propagateCascades(isolated, ["D07"], new Map([["D07", risk("D07")]]));
  assert.equal(events.length, 0);
});

test("missing destination asset is skipped", () => {
  const broken: InfrastructureGraph = {
    ...PILOT_GRAPH,
    edges: [{ id: "bad", fromAssetId: "D07", toAssetId: "MISSING", kind: "overflow", delayMinutes: 10 }],
  };
  const events = propagateCascades(broken, ["D07"], new Map([["D07", risk("D07")]]));
  assert.equal(events.length, 0);
});

test("unknown origin is ignored", () => {
  const events = propagateCascades(PILOT_GRAPH, ["NOPE"], new Map());
  assert.equal(events.length, 0);
});
