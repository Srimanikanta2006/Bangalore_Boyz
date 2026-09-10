import type { Asset, Hazard, RiskLevel, RiskScore } from "./types.ts";

/** 60 mm/hr × vulnerability 1.0 × 3 historical events → 100. */
export const RISK_RAW_MAX = 180;

const CONFIDENCE_DETERMINISTIC = 0.9;

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

function vulnerabilityLabel(vulnerability: number): string {
  if (vulnerability >= 0.8) return "High";
  if (vulnerability >= 0.5) return "Medium";
  return "Low";
}

export function scoreAsset(asset: Asset, hazard: Hazard): RiskScore {
  const recurrence = Math.max(1, asset.historicalIncidentCount);
  const rainWeight = asset.type === "drain" ? 1 : asset.type === "road" ? 0.45 : 0.25;
  const raw = hazard.rainfallMmPerHour * asset.vulnerability * recurrence * rainWeight;
  const score = Math.max(0, Math.min(100, Math.round((raw / RISK_RAW_MAX) * 100)));
  const missingHistory = asset.historicalIncidentCount === 0;
  const confidence = missingHistory ? 0.75 : CONFIDENCE_DETERMINISTIC;

  return {
    assetId: asset.id,
    score,
    level: riskLevelFromScore(score),
    confidence,
    evidence: [
      `Rainfall = ${hazard.rainfallMmPerHour} mm/hr`,
      `${asset.name} vulnerability = ${vulnerabilityLabel(asset.vulnerability)} (${asset.vulnerability})`,
      `Historical incidents = ${asset.historicalIncidentCount}`,
      `Source = ${hazard.source}`,
    ],
  };
}

export function scoreGraph(assets: Asset[], hazard: Hazard): RiskScore[] {
  return assets.map((asset) => scoreAsset(asset, hazard));
}

export function isCascadeOrigin(score: RiskScore, asset: Asset): boolean {
  return asset.type === "drain" && (score.level === "high" || score.level === "critical");
}
