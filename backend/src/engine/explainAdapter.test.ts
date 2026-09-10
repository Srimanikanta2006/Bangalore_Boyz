import assert from "node:assert/strict";
import test from "node:test";

import { toExplainRequest } from "./explainAdapter.ts";
import { simulateHazard } from "./hazardSimulator.ts";
import { PILOT_GRAPH } from "./pilotGraph.ts";

test("adapter emits Person 4 ExplainRequest with both causal chains", () => {
  const snapshot = simulateHazard(40);
  const request = toExplainRequest(snapshot, PILOT_GRAPH);
  assert.ok(request.incidentId.startsWith("INC-"));
  assert.equal(request.hazard.type, "heavy_rainfall");
  assert.ok(request.affectedAssets.some((asset) => asset.id === "H01"));
  assert.equal(request.causalChains?.length, 2);
  assert.deepEqual(request.causalChains?.[0]?.path, ["D07", "R24", "H01"]);
  assert.ok(request.evidence.length > 0);
  assert.equal(request.dataFreshness?.[0]?.status, "fresh");
  assert.ok(request.uncertainties?.some((item) => item.statement.includes("S3")));
});
