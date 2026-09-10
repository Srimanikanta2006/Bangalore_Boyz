import type { ExplanationFacts } from '../types/domain';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Phase 1 mock "AI" layer: converts already-computed facts into concise
 * operator language. Risk scores, paths, ETA and actions all come from the
 * deterministic domain data — this service never invents infrastructure facts.
 * Replaceable by a real LLM endpoint later (facts in, wording out).
 */
export async function generateExplanation(facts: ExplanationFacts): Promise<string> {
  await delay(350);

  const { hazard, cascade, riskScores, assets } = facts;
  const [originId, conduitId, impactId] = cascade.path;
  const origin = assets[originId];
  const conduit = assets[conduitId];
  const impact = assets[impactId];
  const originScore = riskScores[originId]?.score ?? 0;
  const conduitScore = riskScores[conduitId]?.score ?? 0;
  const impactScore = riskScores[impactId]?.score ?? 0;
  const action = cascade.recommendedActions[0];

  const parts: string[] = [];

  parts.push(
    `Sustained ${hazard.label.toLowerCase()} at ${hazard.rainfallMmHr ?? hazard.severity} mm/hr has pushed ${
      origin?.name ?? originId
    } to ${originScore}/100 (critical) — overflow is projected within minutes.`,
  );

  if (conduit) {
    parts.push(
      `${conduit.name} sits directly in the overflow path (risk ${conduitScore}/100) and is expected to become impassable at its low point.`,
    );
  }

  if (impact) {
    parts.push(
      `${impact.name} (risk ${impactScore}/100) relies on this corridor for ${cascade.criticalService.toLowerCase()}; impact is estimated in about ${cascade.etaMinutes} minutes.`,
    );
  }

  if (cascade.alternativeRoute) {
    parts.push(`${cascade.alternativeRoute} remains passable but adds transit time.`);
  }

  if (action) {
    parts.push(`${action.label} before impact to preserve service coverage.`);
  }

  return parts.join(' ');
}
