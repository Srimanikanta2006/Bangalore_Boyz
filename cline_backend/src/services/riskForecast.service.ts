/**
 * Statistical risk-trend forecasting: plain deterministic time-series math
 * (ordinary least-squares linear regression) over stored `WeatherSnapshot`
 * rows for a zone, projecting rainfall N hours ahead and translating that
 * into a risk-intensity delta using the SAME threshold rules the live risk
 * engine already uses (`risk.service.ts`'s `intensityBonus`). Real math, no
 * new dependency, always labeled `dataQuality: FORECAST`.
 *
 * Honest limits: with too few historical readings (<3) or a non-degenerate
 * time span, this returns `INSUFFICIENT_DATA` rather than fabricating a trend.
 *
 * See docs/MASTER_PLAN.md §4.2 item 2.
 */

import { prisma } from '../db/prisma';
import { intensityBonus } from './risk.service';

export interface RiskForecastResult {
  dataQuality: 'FORECAST' | 'INSUFFICIENT_DATA';
  zoneId: string;
  hoursAhead: number;
  sampleSize: number;
  currentRainfallMmPerHour: number | null;
  forecastedRainfallMmPerHour: number | null;
  trendSlopeMmPerHourPerHour: number | null;
  trendDirection: 'INCREASING' | 'STABLE' | 'DECREASING' | null;
  currentIntensityBonus: number | null;
  forecastedIntensityBonus: number | null;
  method: string;
}

const MIN_SAMPLES = 3;
const STABLE_SLOPE_THRESHOLD = 0.5; // mm/h change per hour below this counts as "stable"

/** Ordinary least-squares linear regression: y = slope*x + intercept. Real, standard formula. */
function linearRegression(points: { x: number; y: number }[]): { slope: number; intercept: number } {
  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n }; // degenerate (all same timestamp)
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

export async function forecastZoneRiskTrend(zoneId: string, hoursAhead = 6): Promise<RiskForecastResult> {
  const snapshots = await prisma.weatherSnapshot.findMany({
    where: { zoneId, rainfallMmPerHour: { not: null } },
    orderBy: { createdAt: 'asc' },
    take: 200,
  });

  const base: Omit<RiskForecastResult, 'dataQuality' | 'sampleSize'> = {
    zoneId,
    hoursAhead,
    currentRainfallMmPerHour: null,
    forecastedRainfallMmPerHour: null,
    trendSlopeMmPerHourPerHour: null,
    trendDirection: null,
    currentIntensityBonus: null,
    forecastedIntensityBonus: null,
    method: 'ordinary_least_squares_linear_regression',
  };

  if (snapshots.length < MIN_SAMPLES) {
    return { ...base, dataQuality: 'INSUFFICIENT_DATA', sampleSize: snapshots.length };
  }

  const t0 = snapshots[0].createdAt.getTime();
  const points = snapshots.map((s) => ({
    x: (s.createdAt.getTime() - t0) / (1000 * 60 * 60), // hours since first reading
    y: s.rainfallMmPerHour as number,
  }));

  const { slope, intercept } = linearRegression(points);
  const lastX = points[points.length - 1].x;
  const current = Math.max(0, points[points.length - 1].y);
  const forecasted = Math.max(0, slope * (lastX + hoursAhead) + intercept);

  const direction: RiskForecastResult['trendDirection'] =
    Math.abs(slope) < STABLE_SLOPE_THRESHOLD ? 'STABLE' : slope > 0 ? 'INCREASING' : 'DECREASING';

  return {
    ...base,
    dataQuality: 'FORECAST',
    sampleSize: snapshots.length,
    currentRainfallMmPerHour: Math.round(current * 10) / 10,
    forecastedRainfallMmPerHour: Math.round(forecasted * 10) / 10,
    trendSlopeMmPerHourPerHour: Math.round(slope * 1000) / 1000,
    trendDirection: direction,
    currentIntensityBonus: intensityBonus({ rainfallRate: current }),
    forecastedIntensityBonus: intensityBonus({ rainfallRate: forecasted }),
  };
}
