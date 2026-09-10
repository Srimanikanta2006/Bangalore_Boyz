/**
 * End-to-end orchestrator demo (offline).
 *
 * Runs the full 5-agent pipeline against the synthetic INC-204 fixture and
 * prints the resulting PROPOSED response plan. Works with NO API key
 * (deterministic fallback) and with GEMINI_API_KEY set (live Gemini agents).
 *
 *   npm --prefix orchestration run demo
 */

import { incidentFixtureINC204 } from "@climateshield/agents";
import { runIncidentResponse } from "./index.js";

async function main(): Promise<void> {
  const { plan, state, persistedTo } = await runIncidentResponse(incidentFixtureINC204, {
    onEvent: (e) =>
      console.log(
        `  • ${e.stage.padEnd(16)} ${e.status.padEnd(10)} (attempts=${e.attempts}, fallback=${e.usedFallback})`,
      ),
  });

  console.log("\n=== ClimateShield Incident Response Orchestrator ===");
  console.log(`Run:        ${state.runId}`);
  console.log(`Incident:   ${plan.incidentId} — status ${plan.status}`);
  console.log(`LLM model:  ${plan.provenance.llmModel ?? "none (deterministic fallback)"}`);
  console.log(`Confidence: ${plan.confidence} (<= engine ${incidentFixtureINC204.baseRisk.confidence})`);
  console.log(`Approval:   requiresOperatorApproval = ${plan.requiresOperatorApproval}`);
  console.log(`Fell back:  ${plan.usedFallbackAgents.join(", ") || "none"}`);

  console.log("\n-- Risk --");
  console.log(`  ${plan.riskAssessment.headline}`);

  console.log("\n-- Cascade critical path --");
  console.log(`  ${plan.cascadeAnalysis.criticalPath.join(" -> ")}`);

  console.log("\n-- Recommended actions (operator approval required) --");
  for (const a of plan.dispatch.recommendedActions) {
    console.log(
      `  [${a.priority.toUpperCase()}] ${a.actionId}` +
        `${a.targetAssetCode ? ` @ ${a.targetAssetCode}` : ""}` +
        `${a.suggestedUnitCallsign ? ` (unit ${a.suggestedUnitCallsign})` : ""}`,
    );
    console.log(`        ${a.reason}`);
  }

  console.log("\n-- Public advisory --");
  console.log(`  ${plan.comms.briefings.public}`);

  if (plan.warnings.length) {
    console.log("\n-- Warnings --");
    for (const w of plan.warnings) console.log(`  ! ${w}`);
  }

  console.log(`\nRun state persisted to: ${persistedTo ?? "(not persisted)"}`);
}

main().catch((err) => {
  console.error("Orchestrator demo failed:", err);
  process.exit(1);
});
