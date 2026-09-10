/**
 * ClimateShield Orchestration — public API.
 *
 * Programmatic entry point for the incident-response orchestrator. Consumers
 * (a backend controller, a CLI, or a test) supply verified IncidentFacts and
 * receive a PROPOSED ResponsePlan plus the persisted RunState.
 */

export {
  IncidentResponseOrchestrator,
  runIncidentResponse,
} from "./orchestrator.js";
export type {
  OrchestratorOptions,
  OrchestratorEvent,
  OrchestratorRunResult,
} from "./orchestrator.js";

export {
  createRunState,
  persistRunState,
  type RunState,
  type RunStatus,
  type AgentStateRecord,
  type AgentStatus,
} from "./state.js";
