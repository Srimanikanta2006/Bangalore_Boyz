/**
 * Orchestrator tests (node:test, run via tsx).
 *
 *   npm --prefix orchestration test
 *
 * Covers three regimes:
 *  1. Deterministic (no LLM): full pipeline still yields a valid PROPOSED plan.
 *  2. Live-LLM mock: agents accept valid model JSON (usedFallback === false).
 *  3. Grounding: invalid actions / invented assets are rejected; confidence is
 *     capped at the engine's confidence.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  NullLlmProvider,
  incidentFixtureINC204,
  isValidActionId,
  type AgentName,
  type LlmProvider,
  type LlmCompleteOptions,
} from "@climateshield/agents";
import { runIncidentResponse } from "../src/index.js";

const SPECIALISTS: AgentName[] = ["risk-analyst", "cascade", "dispatch-planner", "comms"];

/** A scriptable LLM provider: routes each agent prompt to a canned JSON reply. */
class MockLlmProvider implements LlmProvider {
  readonly model = "mock-model";
  readonly available = true;
  constructor(private readonly responder: (prompt: string) => string) {}
  async complete(prompt: string, _options?: LlmCompleteOptions): Promise<string> {
    return this.responder(prompt);
  }
}

function validResponder(prompt: string): string {
  if (prompt.includes("risk assessment")) {
    return JSON.stringify({
      headline: "Critical flash-flood risk at East Basin Drain D07.",
      severity: "critical",
      score: 81,
      confidence: 0.9,
      drivers: ["Rainfall & flood intensity: +26", "Asset vulnerability: +23"],
      keyImpacts: [
        { assetName: "St. Jude Regional Medical Center", description: "Access blocked.", severity: "high" },
      ],
    });
  }
  if (prompt.includes("failure cascade")) {
    return JSON.stringify({
      summary: "Drain overwhelm propagates to hospital access loss.",
      criticalPath: ["DRAIN-07", "RD-24", "GATE-B", "HOSP-01"],
      links: [{ fromAssetCode: "DRAIN-07", toAssetCode: "RD-24", impact: "INUNDATED", impactScore: 66 }],
      projectedFailures: ["D07 -> R24: inundated."],
    });
  }
  if (prompt.includes("response actions")) {
    return JSON.stringify({
      recommendedActions: [
        { actionId: "dispatch_drainage_team", priority: "critical", reason: "Clear D07.", targetAssetCode: "DRAIN-07", suggestedUnitCallsign: "PW-DRAIN-A1" },
        { actionId: "pre_position_ambulance", priority: "high", reason: "Stage EMS.", targetAssetCode: "HOSP-01", suggestedUnitCallsign: "EMS-07" },
      ],
      actionDependencies: [],
      rationale: "Prioritise highest-impact assets.",
    });
  }
  if (prompt.includes("role-specific briefings")) {
    return JSON.stringify({
      operator: "INC-204 critical; approve drainage + EMS staging.",
      hospitalManager: "Prepare for ambulance diversion.",
      fieldTeam: "Deploy to DRAIN-07; confirm depth on arrival.",
      public: "Avoid East Basin arterial routes. Not an all-clear.",
    });
  }
  return "{}";
}

test("deterministic pipeline yields a valid PROPOSED plan with no LLM", async () => {
  const { plan, state } = await runIncidentResponse(incidentFixtureINC204, {
    llm: new NullLlmProvider(),
    persist: false,
  });

  assert.equal(plan.status, "PROPOSED");
  assert.equal(plan.requiresOperatorApproval, true);
  assert.deepEqual(plan.cascadeAnalysis.criticalPath, ["DRAIN-07", "RD-24", "GATE-B", "HOSP-01"]);
  assert.ok(plan.dispatch.recommendedActions.length >= 1);
  for (const a of plan.dispatch.recommendedActions) {
    assert.ok(isValidActionId(a.actionId), `action ${a.actionId} must be in the catalog`);
  }
  // Confidence never exceeds the engine's confidence.
  assert.ok(plan.confidence <= incidentFixtureINC204.baseRisk.confidence);
  assert.equal(plan.confidence, 0.95);
  // Every specialist fell back (no model available).
  assert.deepEqual([...plan.usedFallbackAgents].sort(), [...SPECIALISTS].sort());
  assert.equal(state.status, "completed");
});

test("live-LLM mock: specialists accept valid model JSON (no fallback)", async () => {
  const { plan, state } = await runIncidentResponse(incidentFixtureINC204, {
    llm: new MockLlmProvider(validResponder),
    persist: false,
  });

  for (const agent of SPECIALISTS) {
    assert.equal(state.agents[agent].usedFallback, false, `${agent} should not fall back`);
  }
  assert.equal(plan.usedFallbackAgents.length, 0);
  assert.equal(plan.provenance.llmModel, "mock-model");
  assert.equal(plan.cascadeAnalysis.criticalPath[0], "DRAIN-07");
  assert.equal(plan.dispatch.recommendedActions.length, 2);
});

test("grounding: invalid actions/assets rejected and confidence capped", async () => {
  const responder = (prompt: string): string => {
    if (prompt.includes("risk assessment")) {
      // confidence 0.99 exceeds engine 0.95 -> must be capped.
      return JSON.stringify({
        headline: "Overconfident risk headline.",
        severity: "critical",
        score: 81,
        confidence: 0.99,
        drivers: ["driver a"],
        keyImpacts: [],
      });
    }
    if (prompt.includes("response actions")) {
      return JSON.stringify({
        recommendedActions: [
          { actionId: "launch_drone_strike", priority: "critical", reason: "not in catalog", targetAssetCode: "DRAIN-07" },
          { actionId: "close_road", priority: "low", reason: "disallowed priority", targetAssetCode: "RD-24" },
          { actionId: "dispatch_drainage_team", priority: "critical", reason: "invented asset", targetAssetCode: "GHOST-99" },
          { actionId: "dispatch_drainage_team", priority: "critical", reason: "valid", targetAssetCode: "DRAIN-07" },
        ],
        actionDependencies: [],
        rationale: "mixed validity",
      });
    }
    return validResponder(prompt);
  };

  const { plan } = await runIncidentResponse(incidentFixtureINC204, {
    llm: new MockLlmProvider(responder),
    persist: false,
  });

  // Only the single valid action survives grounding.
  assert.equal(plan.dispatch.recommendedActions.length, 1);
  assert.equal(plan.dispatch.recommendedActions[0].actionId, "dispatch_drainage_team");
  assert.equal(plan.dispatch.recommendedActions[0].targetAssetCode, "DRAIN-07");
  // Confidence capped to engine confidence.
  assert.ok(plan.confidence <= incidentFixtureINC204.baseRisk.confidence);
  assert.equal(plan.confidence, 0.95);
});
