import { computeHotspots } from "./hotspotIntelligence.ts";
import { SAMPLE_HISTORICAL_INCIDENTS } from "./hotspotSampleData.ts";

console.log("================================================================================");
console.log("CLIMATESHIELD PERSON 4 - RECURRING HOTSPOT INTELLIGENCE");
console.log("================================================================================");
console.log(`Analyzing ${SAMPLE_HISTORICAL_INCIDENTS.length} historical incident records across pilot zone assets...\n`);

const hotspots = computeHotspots(SAMPLE_HISTORICAL_INCIDENTS);

console.log(`Discovered ${hotspots.length} verified recurring climate hotspots:\n`);

hotspots.forEach((hs, idx) => {
  console.log(`[HOTSPOT #${idx + 1}] ${hs.hotspotId}`);
  console.log(`  Asset: ${hs.assetName ?? hs.assetId} (${hs.assetId})`);
  console.log(`  Hazard: ${hs.hazardType.toUpperCase().replaceAll("_", " ")}`);
  console.log(`  Recurrence Score: ${hs.recurrenceScore}/100 | Severity: ${hs.severityScore}/100 | Confidence: ${(hs.confidence * 100).toFixed(0)}%`);
  console.log(`  History: ${hs.incidentCount} incidents over ${hs.timespanDays} days (Trend: ${hs.trend.toUpperCase()})`);
  console.log(`  Explanation: ${hs.explanation}`);
  console.log(`  Recommended Long-Term Intervention:`);
  console.log(`    - Action: [${hs.recommendedLongTermAction.horizon.toUpperCase()}] ${hs.recommendedLongTermAction.label}`);
  console.log(`    - Plan: ${hs.recommendedLongTermAction.description}`);
  console.log(`    - Rationale: ${hs.recommendedLongTermAction.rationale}`);
  console.log("--------------------------------------------------------------------------------");
});
console.log("================================================================================");
