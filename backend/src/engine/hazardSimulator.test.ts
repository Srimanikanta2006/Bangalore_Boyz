import assert from "node:assert/strict";
import test from "node:test";

import { simulateHazard } from "./hazardSimulator.ts";

test("40 mm/hr simulation marks source simulated and starts the compound cascade", () => {
  const snapshot = simulateHazard(40);
  assert.equal(snapshot.hazard.source, "simulated");
  assert.equal(snapshot.hazard.rainfallMmPerHour, 40);
  const drain = snapshot.risks.find((risk) => risk.assetId === "D07");
  assert.equal(drain?.level, "high");
  assert.ok(snapshot.cascades.length >= 2);
  assert.ok(snapshot.cascades.some((event) => event.path.join(">") === "D07>R24>H01"));
});

test("10 mm/hr does not originate a cascade", () => {
  const snapshot = simulateHazard(10);
  const drain = snapshot.risks.find((risk) => risk.assetId === "D07");
  assert.equal(drain?.level, "low");
  assert.equal(snapshot.cascades.length, 0);
});

test("rejects invalid rainfall", () => {
  assert.throws(() => simulateHazard(-1), /non-negative/);
});
