/**
 * Synthetic demo facts for INC-204 (Bayview Metro / East Basin scenario).
 *
 * SYNTHETIC_DEMO — these mirror the shape of the deterministic engine's
 * `getIncidentCascade` output so the orchestrator and tests can run fully
 * offline (no backend, no DB, no API key). The DRAIN-07 -> RD-24 -> GATE-B ->
 * HOSP-01 chain matches the values documented in cline_backend/docs/API.md.
 */

import type { IncidentFacts } from "../types";

export const incidentFixtureINC204: IncidentFacts = {
  incidentId: "INC-204",
  title: "Flash Inundation - East Basin Arterial Network",
  severity: "critical",
  zoneName: "East Basin",
  hazard: {
    type: "FLASH_FLOOD",
    severity: "critical",
    rainfallRate: 65,
    waterDepth: 1.4,
    temperature: null,
    windSpeed: null,
  },
  rootAsset: {
    id: "asset_drain_07",
    assetCode: "DRAIN-07",
    name: "East Basin Drain D07",
    type: "DRAIN",
  },
  baseRisk: {
    score: 81,
    level: "critical",
    confidence: 0.95,
    factors: [
      { name: "Rainfall & flood intensity", contribution: 26 },
      { name: "Asset vulnerability", contribution: 23 },
      { name: "Asset criticality", contribution: 21 },
      { name: "Historical recurrence", contribution: 11 },
    ],
    explanation:
      "CRITICAL FLASH_FLOOD exposure on a HIGH-criticality asset (vulnerability 88/100, 3 prior synthetic events) produces a deterministic risk score of 81/100 (CRITICAL).",
  },
  cascadeNodes: [
    {
      assetId: "asset_drain_07",
      assetCode: "DRAIN-07",
      name: "East Basin Drain D07",
      type: "DRAIN",
      depth: 0,
      impactType: "OVERWHELMED",
      impactScore: 81,
      dependencyType: null,
    },
    {
      assetId: "asset_rd_24",
      assetCode: "RD-24",
      name: "East Basin Arterial Road R24",
      type: "ROAD",
      depth: 1,
      impactType: "INUNDATED",
      impactScore: 66,
      dependencyType: "DRAINS_TO",
    },
    {
      assetId: "asset_gate_b",
      assetCode: "GATE-B",
      name: "St. Jude Ambulance Gate B",
      type: "AMBULANCE_GATE",
      depth: 2,
      impactType: "AMBULANCE_DELAYED",
      impactScore: 51,
      dependencyType: "ACCESS_VIA",
    },
    {
      assetId: "asset_hosp_01",
      assetCode: "HOSP-01",
      name: "St. Jude Regional Medical Center",
      type: "HOSPITAL",
      depth: 3,
      impactType: "ACCESS_BLOCKED",
      impactScore: 42,
      dependencyType: "SERVED_BY",
    },
  ],
  availableUnits: [
    {
      id: "unit_pump_1",
      callsign: "PW-DRAIN-A1",
      type: "PUMP_CREW",
      status: "AVAILABLE",
      departmentName: "Public Works",
      etaMinutes: 12,
    },
    {
      id: "unit_ems_2",
      callsign: "EMS-07",
      type: "EMS",
      status: "AVAILABLE",
      departmentName: "Emergency Medical Services",
      etaMinutes: 9,
    },
    {
      id: "unit_barrier_3",
      callsign: "BR-04",
      type: "BARRIER_CREW",
      status: "AVAILABLE",
      departmentName: "Public Works",
      etaMinutes: 15,
    },
  ],
};
