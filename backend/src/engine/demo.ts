import { explainWithGeminiOrFallback } from "../ai/geminiProvider.ts";
import { toExplainRequest } from "./explainAdapter.ts";
import { simulateHazard } from "./hazardSimulator.ts";
import { PILOT_GRAPH } from "./pilotGraph.ts";
import { findSafeRoute } from "./routeEngine.ts";

const rainfall = Number(process.argv[2] ?? 40);
const snapshot = simulateHazard(rainfall);
const explainRequest = toExplainRequest(snapshot, PILOT_GRAPH);
const route = findSafeRoute(PILOT_GRAPH, snapshot.risks, "ST01", "H01");

console.log("================================================================================");
console.log("CLIMATESHIELD PERSON 2 - RISK / CASCADE / ROUTE ENGINE");
console.log("================================================================================");
console.log(`Incident: ${snapshot.incidentId}`);
console.log(`Hazard: ${snapshot.hazard.type} | ${snapshot.hazard.rainfallMmPerHour} mm/hr | source=${snapshot.hazard.source}`);
console.log("--------------------------------------------------------------------------------");
console.log("RISK SCORES:");
for (const risk of snapshot.risks) {
  console.log(`  ${risk.assetId.padEnd(4)}  ${String(risk.score).padStart(3)}  ${risk.level.padEnd(8)}  conf=${risk.confidence}`);
}
console.log("--------------------------------------------------------------------------------");
console.log("CASCADE PATHS (graph traversal):");
for (const cascade of snapshot.cascades) {
  console.log(`  ${cascade.eventId}: ${cascade.path.join(" -> ")}`);
  console.log(`    critical=${cascade.criticalAssetId}  eta=${cascade.etaMinutes}m  impact=${cascade.impact}`);
}
console.log("--------------------------------------------------------------------------------");
console.log("SAFE ROUTE ST01 -> H01:");
console.log(route ? `  ${route.path.join(" -> ")}  (${route.distanceKm} km)` : "  none");
if (route?.avoidedHighRiskSegments.length) {
  console.log(`  avoided: ${route.avoidedHighRiskSegments.join(", ")}`);
}
console.log("--------------------------------------------------------------------------------");
console.log("PERSON 4 EXPLAIN PAYLOAD:");
console.log(JSON.stringify(explainRequest, null, 2));
console.log("================================================================================");

// AI EXPLANATION LAYER
console.log("\nPASSING TO GEMINI AI LAYER...\n");

const result = await explainWithGeminiOrFallback(explainRequest);
const resp = result.response;

console.log("================================================================================");
console.log("AI EXPLANATION");
console.log("================================================================================");
console.log(`Provider: ${result.usedFallback ? "Deterministic Fallback" : "Gemini"}`);
if (result.modelUsed) console.log(`Model: ${result.modelUsed}`);
if (result.fallbackReason) console.log(`Fallback Reason: ${result.fallbackReason}`);
if (result.errorDetails) console.log(`Details: ${result.errorDetails}`);
console.log(`Incident ID: ${resp.incidentId} | Confidence: ${(resp.confidence * 100).toFixed(0)}%`);
console.log("--------------------------------------------------------------------------------");
console.log(`\nSITUATION SUMMARY:\n${resp.situationSummary}\n`);

console.log("CAUSAL CHAINS:");
resp.causalChains.forEach((chain, i) => {
  console.log(`  [Path ${i + 1}] ${chain.path.join(" -> ")}`);
  console.log(`           Impact: ${chain.impact} (ETA: ~${chain.etaMinutes} min)`);
});

console.log("\nRECOMMENDED ACTIONS:");
resp.recommendedActions.forEach((act, i) => {
  console.log(`  ${i + 1}. [${act.priority.toUpperCase()}] ${act.actionId}`);
  console.log(`     Reason: ${act.reason}`);
});

console.log("\nROLE-SPECIFIC BRIEFINGS:");
console.log(`  [OPERATOR]:\n  ${resp.roleSpecificBriefings.operator}\n`);
console.log(`  [HOSPITAL MANAGER]:\n  ${resp.roleSpecificBriefings.hospitalManager}\n`);
console.log(`  [FIELD TEAM]:\n  ${resp.roleSpecificBriefings.fieldTeam}\n`);
console.log(`  [PUBLIC]:\n  ${resp.roleSpecificBriefings.public}`);

if (resp.uncertainties?.length) {
  console.log("\nUNCERTAINTIES:");
  resp.uncertainties.forEach((u) => {
    console.log(`  - ${u.statement}`);
    console.log(`    Check: ${u.requiredCheck}`);
  });
}
console.log("================================================================================");
