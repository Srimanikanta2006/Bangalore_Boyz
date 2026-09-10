import assert from "node:assert/strict";
import test from "node:test";

import {
  computeHotspots,
  validateHistoricalIncident,
  validateHistoricalIncidents,
} from "./hotspotIntelligence.ts";
import type { HistoricalIncident } from "./hotspotTypes.ts";

const BASE_TIME = "2026-09-10T12:00:00.000Z";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(days: number): string {
  return new Date(Date.parse(BASE_TIME) - days * ONE_DAY_MS).toISOString();
}

test("no incidents produces no hotspots", () => {
  const result = computeHotspots([]);
  assert.deepEqual(result, []);
});

test("one isolated incident does not produce a false hotspot", () => {
  const incidents: HistoricalIncident[] = [
    {
      incidentId: "INC-ISO-01",
      timestamp: daysAgo(5),
      assetId: "D07",
      assetName: "Drain D07",
      hazardType: "heavy_rainfall",
      severity: "high",
    },
  ];
  const hotspots = computeHotspots(incidents, { referenceTimestamp: BASE_TIME });
  assert.equal(hotspots.length, 0);
});

test("repeated incidents produce a validated hotspot with long-term action", () => {
  const incidents: HistoricalIncident[] = [
    {
      incidentId: "INC-01",
      timestamp: daysAgo(30),
      assetId: "D07",
      assetName: "Drain D07",
      hazardType: "heavy_rainfall",
      severity: "high",
    },
    {
      incidentId: "INC-02",
      timestamp: daysAgo(10),
      assetId: "D07",
      assetName: "Drain D07",
      hazardType: "heavy_rainfall",
      severity: "critical",
    },
    {
      incidentId: "INC-03",
      timestamp: daysAgo(2),
      assetId: "D07",
      assetName: "Drain D07",
      hazardType: "heavy_rainfall",
      severity: "critical",
    },
  ];

  const hotspots = computeHotspots(incidents, { referenceTimestamp: BASE_TIME });
  assert.equal(hotspots.length, 1);
  const hs = hotspots[0];

  assert.equal(hs.hotspotId, "HOTSPOT-D07-HEAVY-RAINFALL");
  assert.equal(hs.assetId, "D07");
  assert.equal(hs.hazardType, "heavy_rainfall");
  assert.equal(hs.incidentCount, 3);
  assert.ok(hs.recurrenceScore > 50);
  assert.ok(hs.confidence >= 0.75);
  assert.match(hs.explanation, /Drain D07 recorded 3 heavy rainfall incidents/i);
  assert.ok(hs.recommendedLongTermAction);
  assert.equal(hs.recommendedLongTermAction.actionId, "drainage_capacity_upgrade");
});

test("repeated high-severity incidents yield higher score than low-severity", () => {
  const criticalIncidents: HistoricalIncident[] = [
    { incidentId: "C1", timestamp: daysAgo(20), assetId: "R24", hazardType: "flood", severity: "critical" },
    { incidentId: "C2", timestamp: daysAgo(10), assetId: "R24", hazardType: "flood", severity: "critical" },
    { incidentId: "C3", timestamp: daysAgo(2), assetId: "R24", hazardType: "flood", severity: "critical" },
  ];

  const lowIncidents: HistoricalIncident[] = [
    { incidentId: "L1", timestamp: daysAgo(20), assetId: "R31", hazardType: "flood", severity: "low" },
    { incidentId: "L2", timestamp: daysAgo(10), assetId: "R31", hazardType: "flood", severity: "low" },
    { incidentId: "L3", timestamp: daysAgo(2), assetId: "R31", hazardType: "flood", severity: "low" },
  ];

  const criticalHotspots = computeHotspots(criticalIncidents, { referenceTimestamp: BASE_TIME });
  const lowHotspots = computeHotspots(lowIncidents, { referenceTimestamp: BASE_TIME });

  assert.equal(criticalHotspots.length, 1);
  assert.equal(lowHotspots.length, 1);
  assert.ok(criticalHotspots[0].recurrenceScore > lowHotspots[0].recurrenceScore);
  assert.ok(criticalHotspots[0].severityScore > lowHotspots[0].severityScore);
});

test("old incidents receive lower recurrence score due to recency decay", () => {
  const recentIncidents: HistoricalIncident[] = [
    { incidentId: "R1", timestamp: daysAgo(15), assetId: "D07", hazardType: "heavy_rainfall", severity: "high" },
    { incidentId: "R2", timestamp: daysAgo(5), assetId: "D07", hazardType: "heavy_rainfall", severity: "high" },
  ];

  const oldIncidents: HistoricalIncident[] = [
    { incidentId: "O1", timestamp: daysAgo(365), assetId: "D07", hazardType: "heavy_rainfall", severity: "high" },
    { incidentId: "O2", timestamp: daysAgo(350), assetId: "D07", hazardType: "heavy_rainfall", severity: "high" },
  ];

  const recentHotspots = computeHotspots(recentIncidents, { referenceTimestamp: BASE_TIME });
  const oldHotspots = computeHotspots(oldIncidents, { referenceTimestamp: BASE_TIME });

  assert.equal(recentHotspots.length, 1);
  assert.equal(oldHotspots.length, 1);
  assert.ok(recentHotspots[0].recurrenceScore > oldHotspots[0].recurrenceScore);
});

test("different hazards at the same asset produce separate distinct hotspots", () => {
  const incidents: HistoricalIncident[] = [
    { incidentId: "F1", timestamp: daysAgo(20), assetId: "H01", assetName: "Hospital A", hazardType: "flood", severity: "high" },
    { incidentId: "F2", timestamp: daysAgo(5), assetId: "H01", assetName: "Hospital A", hazardType: "flood", severity: "high" },
    { incidentId: "H1", timestamp: daysAgo(18), assetId: "H01", assetName: "Hospital A", hazardType: "extreme_heat", severity: "high" },
    { incidentId: "H2", timestamp: daysAgo(4), assetId: "H01", assetName: "Hospital A", hazardType: "extreme_heat", severity: "critical" },
  ];

  const hotspots = computeHotspots(incidents, { referenceTimestamp: BASE_TIME });
  assert.equal(hotspots.length, 2);

  const floodHotspot = hotspots.find((h) => h.hazardType === "flood");
  const heatHotspot = hotspots.find((h) => h.hazardType === "extreme_heat");

  assert.ok(floodHotspot);
  assert.ok(heatHotspot);
  assert.equal(floodHotspot.assetId, "H01");
  assert.equal(heatHotspot.assetId, "H01");
  assert.notEqual(floodHotspot.hotspotId, heatHotspot.hotspotId);
  assert.equal(floodHotspot.recommendedLongTermAction.actionId, "flood_barrier_installation");
  assert.ok(
    heatHotspot.recommendedLongTermAction.actionId === "urban_canopy_expansion" ||
    heatHotspot.recommendedLongTermAction.actionId === "heat_mitigation",
  );
});

test("detects increasing recurrence trend", () => {
  // 1 incident in early window, 3 incidents clustered in recent window
  const incidents: HistoricalIncident[] = [
    { incidentId: "T1", timestamp: daysAgo(80), assetId: "R24", hazardType: "flood", severity: "medium" },
    { incidentId: "T2", timestamp: daysAgo(15), assetId: "R24", hazardType: "flood", severity: "high" },
    { incidentId: "T3", timestamp: daysAgo(10), assetId: "R24", hazardType: "flood", severity: "high" },
    { incidentId: "T4", timestamp: daysAgo(5), assetId: "R24", hazardType: "flood", severity: "critical" },
  ];

  const hotspots = computeHotspots(incidents, { referenceTimestamp: BASE_TIME });
  assert.equal(hotspots.length, 1);
  assert.equal(hotspots[0].trend, "increasing");
  assert.match(hotspots[0].explanation, /accelerating recurrence trend/i);
});

test("detects decreasing recurrence trend", () => {
  // 3 incidents in early window, 1 incident in recent window
  const incidents: HistoricalIncident[] = [
    { incidentId: "T1", timestamp: daysAgo(80), assetId: "R24", hazardType: "flood", severity: "high" },
    { incidentId: "T2", timestamp: daysAgo(70), assetId: "R24", hazardType: "flood", severity: "high" },
    { incidentId: "T3", timestamp: daysAgo(60), assetId: "R24", hazardType: "flood", severity: "high" },
    { incidentId: "T4", timestamp: daysAgo(5), assetId: "R24", hazardType: "flood", severity: "low" },
  ];

  const hotspots = computeHotspots(incidents, { referenceTimestamp: BASE_TIME });
  assert.equal(hotspots.length, 1);
  assert.equal(hotspots[0].trend, "decreasing");
  assert.match(hotspots[0].explanation, /decelerating recurrence trend/i);
});

test("marks trend as insufficient_data when fewer than 3 incidents", () => {
  const incidents: HistoricalIncident[] = [
    { incidentId: "T1", timestamp: daysAgo(30), assetId: "D07", hazardType: "heavy_rainfall", severity: "high" },
    { incidentId: "T2", timestamp: daysAgo(5), assetId: "D07", hazardType: "heavy_rainfall", severity: "high" },
  ];

  const hotspots = computeHotspots(incidents, { referenceTimestamp: BASE_TIME });
  assert.equal(hotspots.length, 1);
  assert.equal(hotspots[0].trend, "insufficient_data");
});

test("output is completely deterministic for identical input", () => {
  const incidents: HistoricalIncident[] = [
    { incidentId: "D1", timestamp: daysAgo(40), assetId: "D07", hazardType: "heavy_rainfall", severity: "high" },
    { incidentId: "D2", timestamp: daysAgo(20), assetId: "D07", hazardType: "heavy_rainfall", severity: "critical" },
    { incidentId: "D3", timestamp: daysAgo(5), assetId: "D07", hazardType: "heavy_rainfall", severity: "critical" },
  ];

  const run1 = computeHotspots(incidents, { referenceTimestamp: BASE_TIME });
  const run2 = computeHotspots(incidents, { referenceTimestamp: BASE_TIME });

  assert.deepEqual(run1, run2);
});

test("validates historical incident input and rejects malformed entries", () => {
  const valid = validateHistoricalIncident({
    incidentId: "INC-V01",
    timestamp: "2026-09-01T08:00:00Z",
    assetId: "D07",
    hazardType: "heavy_rainfall",
    severity: "high",
  });
  assert.equal(valid.success, true);

  const badDate = validateHistoricalIncident({
    incidentId: "INC-B01",
    timestamp: "invalid-date-format",
    assetId: "D07",
    hazardType: "heavy_rainfall",
    severity: "high",
  });
  assert.equal(badDate.success, false);

  const badHazard = validateHistoricalIncident({
    incidentId: "INC-B02",
    timestamp: "2026-09-01T08:00:00Z",
    assetId: "D07",
    hazardType: "alien_invasion",
    severity: "high",
  });
  assert.equal(badHazard.success, false);

  const badSeverity = validateHistoricalIncident({
    incidentId: "INC-B03",
    timestamp: "2026-09-01T08:00:00Z",
    assetId: "D07",
    hazardType: "heavy_rainfall",
    severity: "apocalyptic",
  });
  assert.equal(badSeverity.success, false);

  // Batch validation filters bad records
  const batch = validateHistoricalIncidents([
    { incidentId: "OK", timestamp: "2026-09-01T08:00:00Z", assetId: "D07", hazardType: "flood", severity: "low" },
    { incidentId: "BAD", timestamp: "bad", assetId: "D07", hazardType: "flood", severity: "low" },
  ]);
  assert.equal(batch.length, 1);
  assert.equal(batch[0].incidentId, "OK");
});
