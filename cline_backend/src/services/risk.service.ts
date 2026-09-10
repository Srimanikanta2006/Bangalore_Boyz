import type { Criticality, HazardType, InfrastructureAsset, Severity } from '@prisma/client';
import type { DbClient } from '../db/prisma';
import { CRITICALITY_WEIGHTS, SEVERITY_WEIGHTS, riskLevelFromScore } from '../utils/risk';
import type { RiskAssessmentDto, RiskFactorDto } from '../types/domain';

/**
 * DETERMINISTIC RISK ENGINE - the single source of truth for risk math.
 * No AI/LLM is involved. Transparent formula (documented in docs/API.md):
 *
 *   risk = hazardSeverityComponent
 *        x assetVulnerability
 *        x assetCriticality
 *        x historicalRecurrenceFactor
 *
 * normalized to 0-100.
 */

export interface RiskIntensity {
  rainfallRate?: number | null;
  waterDepth?: number | null;
  temperature?: number | null;
  windSpeed?: number | null;
  flowVelocity?: number | null;
}

export interface RiskInput {
  severity: Severity;
  hazardType?: HazardType | null;
  intensity?: RiskIntensity | null;
  vulnerability: number;
  criticality: Criticality;
  historicalCount: number;
  telemetryFresh?: boolean;
}

export type RiskAssessment = RiskAssessmentDto;

export type HazardLike = { id?: string; type: HazardType; severity: Severity } & RiskIntensity;

const round2 = (n: number) => Math.round(n * 100) / 100;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Intensity adds at most +0.25 on top of the base severity weight. */
const INTENSITY_RULES: { field: keyof RiskIntensity; thresholds: [number, number][] }[] = [
  { field: 'rainfallRate', thresholds: [[70, 0.25], [50, 0.15], [30, 0.08]] },
  { field: 'waterDepth', thresholds: [[1.5, 0.2], [1.0, 0.12]] },
  { field: 'temperature', thresholds: [[44, 0.25], [40, 0.15], [35, 0.08]] },
  { field: 'windSpeed', thresholds: [[90, 0.2], [70, 0.12]] },
  { field: 'flowVelocity', thresholds: [[2.0, 0.15], [1.5, 0.1]] },
];

export function intensityBonus(intensity?: RiskIntensity | null): number {
  if (!intensity) return 0;
  let bonus = 0;
  for (const rule of INTENSITY_RULES) {
    const value = intensity[rule.field];
    if (value == null) continue;
    for (const [threshold, points] of rule.thresholds) {
      if (value >= threshold) {
        bonus += points;
        break;
      }
    }
  }
  return Math.min(0.25, round2(bonus));
}

function hazardFactorLabel(hazardType?: HazardType | null): string {
  switch (hazardType) {
    case 'FLOOD':
    case 'FLASH_FLOOD':
    case 'DRAINAGE_OVERFLOW':
      return 'Rainfall & flood intensity';
    case 'EXTREME_HEAT':
      return 'Heat load';
    case 'STORM':
    case 'HIGH_WIND':
      return 'Wind & storm intensity';
    case 'POWER_FAILURE':
      return 'Grid stress';
    default:
      return 'Hazard severity';
  }
}

export function computeRisk(input: RiskInput): RiskAssessment {
  const severityWeight = SEVERITY_WEIGHTS[input.severity] ?? 0.5;
  const bonus = intensityBonus(input.intensity);
  const hazardComponent = Math.min(1, round2(severityWeight + bonus));
  const vulnerabilityComponent = clamp(input.vulnerability, 0, 100) / 100;
  const criticalityComponent = CRITICALITY_WEIGHTS[input.criticality] ?? 0.55;
  const historicalComponent = 1 + Math.min(0.25, Math.max(0, input.historicalCount) * 0.05);

  const raw = hazardComponent * vulnerabilityComponent * criticalityComponent * historicalComponent;
  const score = Math.min(100, Math.round(raw * 100));
  const level = riskLevelFromScore(score);

  const hasIntensity =
    !!input.intensity && Object.values(input.intensity).some((v) => v != null);
  const confidence = round2(
    Math.min(
      0.95,
      0.55 +
        (input.hazardType ? 0.15 : 0) +
        (hasIntensity ? 0.1 : 0) +
        (input.historicalCount > 0 ? 0.1 : 0) +
        (input.telemetryFresh ? 0.1 : 0),
    ),
  );

  const weights = {
    hazard: hazardComponent,
    vulnerability: vulnerabilityComponent,
    criticality: criticalityComponent,
    historical: Math.max(0.05, (historicalComponent - 1) / 0.25),
  };
  const weightSum = weights.hazard + weights.vulnerability + weights.criticality + weights.historical;
  const factors: RiskFactorDto[] = [
    { name: hazardFactorLabel(input.hazardType), contribution: Math.round((score * weights.hazard) / weightSum) },
    { name: 'Asset vulnerability', contribution: Math.round((score * weights.vulnerability) / weightSum) },
    { name: 'Asset criticality', contribution: Math.round((score * weights.criticality) / weightSum) },
    { name: 'Historical recurrence', contribution: Math.round((score * weights.historical) / weightSum) },
  ].filter((f) => f.contribution > 0);

  const explanation =
    `${input.severity} ${input.hazardType ?? 'baseline'} exposure on a ${input.criticality}-criticality asset ` +
    `(vulnerability ${clamp(input.vulnerability, 0, 100)}/100, ${Math.max(0, input.historicalCount)} prior synthetic events) ` +
    `produces a deterministic risk score of ${score}/100 (${level}).`;

  return {
    score,
    level,
    confidence,
    factors,
    explanation,
    components: {
      hazard: hazardComponent,
      vulnerability: round2(vulnerabilityComponent),
      criticality: criticalityComponent,
      historical: round2(historicalComponent),
    },
  };
}

/** Number of prior (synthetic demo) events for this asset or its zone. */
export async function historicalCountFor(
  client: DbClient,
  asset: Pick<InfrastructureAsset, 'id' | 'zoneId'>,
): Promise<number> {
  return client.historicalEvent.count({
    where: { OR: [{ assetId: asset.id }, { zoneId: asset.zoneId }] },
  });
}

/** Full DB-backed assessment for one asset under a given (or absent) hazard. */
export async function assessAssetRisk(
  client: DbClient,
  asset: Pick<InfrastructureAsset, 'id' | 'zoneId' | 'vulnerability' | 'criticality'>,
  hazard?: HazardLike | null,
  telemetryFresh = false,
): Promise<RiskAssessment> {
  const historicalCount = await historicalCountFor(client, asset);
  return computeRisk({
    severity: hazard?.severity ?? 'LOW',
    hazardType: hazard?.type ?? null,
    intensity: hazard ?? null,
    vulnerability: asset.vulnerability,
    criticality: asset.criticality,
    historicalCount,
    telemetryFresh,
  });
}

/** Persists a computed assessment (audit trail of risk snapshots). */
export async function persistRiskScore(
  client: DbClient,
  assetId: string,
  hazardId: string | null,
  assessment: RiskAssessment,
) {
  return client.riskScore.create({
    data: {
      assetId,
      hazardId: hazardId ?? undefined,
      score: assessment.score,
      confidence: assessment.confidence,
      vulnerabilityComponent: assessment.components.vulnerability,
      hazardComponent: assessment.components.hazard,
      historicalComponent: assessment.components.historical,
      explanation: assessment.explanation,
    },
  });
}
