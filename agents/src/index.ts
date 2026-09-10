/**
 * ClimateShield Agent Layer — public API.
 *
 * The orchestration/ package imports specialist agents, shared schemas, the LLM
 * provider port, and the controlled action catalog from here.
 */

export * from "./types";
export * from "./util";
export * from "./actionCatalog";

export * from "./llm/provider";
export * from "./llm/geminiProvider";

export { BaseAgent } from "./agents/baseAgent";
export type { BaseAgentOptions } from "./agents/baseAgent";
export { RiskAnalystAgent } from "./agents/riskAnalystAgent";
export { CascadeAgent } from "./agents/cascadeAgent";
export { DispatchPlannerAgent } from "./agents/dispatchPlannerAgent";
export { CommsAgent } from "./agents/commsAgent";
export { ValidationAgent } from "./agents/validationAgent";
export type { ValidationInput } from "./agents/validationAgent";

export { incidentFixtureINC204 } from "./fixtures/incidentFacts";
