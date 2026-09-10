import { explainWithGeminiOrFallback } from "./geminiProvider.ts";
import type { ExplainRequest } from "./schemas.ts";

/**
 * ClimateShield Compound Cascade Incident Demo
 *
 * Models a multi-path cascade:
 * Cyclone-linked rainfall + high tide
 * → Drain D07 capacity bottleneck
 *   ├─ Path 1: Road R24 floods in 20 min → Ambulance transit to Hospital A disrupted
 *   └─ Path 2: Substation S3 threatened in 35 min → Backup power continuity risk to Hospital A
 */
const compoundIncident: ExplainRequest = {
  incidentId: "INC-COMPOUND-001",
  hazard: { type: "cyclone", severity: "critical" },
  risk: { score: 92, level: "critical", confidence: 0.94 },
  affectedAssets: [
    { id: "D07", type: "drain", name: "Drain D07", riskLevel: "critical" },
    { id: "R24", type: "road", name: "Road R24", riskLevel: "high" },
    { id: "S3", type: "substation", name: "Substation S3", riskLevel: "high" },
    { id: "Hospital-A", type: "hospital", name: "Hospital A", riskLevel: "critical" },
  ],
  causalChains: [
    {
      path: ["D07", "R24", "Hospital-A"],
      impact: "Ambulance access disruption",
      etaMinutes: 20,
    },
    {
      path: ["D07", "S3", "Hospital-A"],
      impact: "Power-continuity risk",
      etaMinutes: 35,
    },
  ],
  evidence: [
    "Cyclone-linked heavy rainfall + high tide prevent coastal drain discharge",
    "Drain D07 capacity bottleneck causing upstream ponding toward Road R24",
    "Road R24 surface inundation projected within 20 minutes",
    "Substation S3 perimeter at risk of water ingress within 35 minutes",
    "Hospital A depends on R24 for ambulances and S3 for primary grid feed",
  ],
  uncertainties: [
    {
      statement: "Substation water ingress is not yet confirmed.",
      requiredCheck: "Confirm substation status within 15 minutes.",
    },
  ],
  dataFreshness: [
    {
      source: "Doppler Radar & Coastal Tidal Telemetry",
      timestamp: new Date().toISOString(),
      status: "fresh",
    },
  ],
};

const result = await explainWithGeminiOrFallback(compoundIncident);
const resp = result.response;

console.log("================================================================================");
console.log("⚡ CLIMATESHIELD COMPOUND CASCADE & ROLE-SPECIFIC EXPLANATION LAYER");
console.log("================================================================================");
console.log(`Provider: ${result.usedFallback ? "Deterministic Fallback" : "Gemini"}`);
if (result.modelUsed) console.log(`Model: ${result.modelUsed}`);
if (result.fallbackReason) console.log(`Fallback Reason: ${result.fallbackReason}`);
if (result.errorDetails) console.log(`Details: ${result.errorDetails}`);
console.log(`Incident ID: ${resp.incidentId} | Confidence: ${(resp.confidence * 100).toFixed(0)}%`);
console.log("--------------------------------------------------------------------------------");
console.log(`\n📋 SITUATION SUMMARY:\n${resp.situationSummary}\n`);

console.log("🌊 COMPETING CASCADE PATHS:");
resp.causalChains.forEach((chain, i) => {
  console.log(`  [Path ${i + 1}] ${chain.path.join(" ➔ ")}`);
  console.log(`         Impact: ${chain.impact} (ETA: ~${chain.etaMinutes} min)`);
});

console.log("\n🏥 KEY ASSET IMPACTS:");
resp.keyImpacts.forEach((impact) => {
  console.log(`  • [${impact.severity.toUpperCase()}] ${impact.assetName}: ${impact.description} (Window: ~${impact.timeHorizonMinutes}m)`);
});

console.log("\n🎯 PRIORITIZED ACTION SEQUENCE:");
resp.recommendedActions.forEach((act, i) => {
  console.log(`  ${i + 1}. [${act.priority.toUpperCase()}] ${act.actionId}`);
  console.log(`     Reason: ${act.reason}`);
});

console.log("\n🔒 ACTION DEPENDENCIES & OPERATOR RULES:");
resp.actionDependencies.forEach((dep) => {
  console.log(`  ⚠️  Rule: ${dep.rule}`);
});

console.log("\n❓ UNCERTAINTIES & VERIFICATION CHECKS:");
resp.uncertainties.forEach((unc) => {
  console.log(`  • Uncertainty: ${unc.statement}`);
  console.log(`    Required Check: ${unc.requiredCheck}`);
});

console.log("\n📢 ROLE-SPECIFIC TAILORED BRIEFINGS:");
console.log(`  [OPERATOR]:\n  ${resp.roleSpecificBriefings.operator}\n`);
console.log(`  [HOSPITAL MANAGER]:\n  ${resp.roleSpecificBriefings.hospitalManager}\n`);
console.log(`  [FIELD DRAINAGE TEAM]:\n  ${resp.roleSpecificBriefings.fieldTeam}\n`);
console.log(`  [PUBLIC ADVISORY]:\n  ${resp.roleSpecificBriefings.public}`);
console.log("================================================================================");
