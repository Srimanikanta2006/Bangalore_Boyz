/**
 * Synthetic demo facts for INC-204 (Bayview Metro / East Basin scenario).
 *
 * SYNTHETIC_DEMO — these mirror the shape of the deterministic engine's
 * `getIncidentCascade` output so the orchestrator and tests can run fully
 * offline (no backend, no DB, no API key). The DRAIN-07 -> RD-24 -> GATE-B ->
 * HOSP-01 chain matches the values documented in cline_backend/docs/API.md.
 */
import type { IncidentFacts } from "../types";
export declare const incidentFixtureINC204: IncidentFacts;
