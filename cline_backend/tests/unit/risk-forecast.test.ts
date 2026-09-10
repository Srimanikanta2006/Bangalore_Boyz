import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../../src/db/prisma', () => ({
  prisma: { weatherSnapshot: { findMany: vi.fn() } },
}));

import { prisma } from '../../src/db/prisma';
import { forecastZoneRiskTrend } from '../../src/services/riskForecast.service';

function snapshot(hoursAgo: number, rainfall: number) {
  return { createdAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000), rainfallMmPerHour: rainfall };
}

describe('forecastZoneRiskTrend (real OLS linear regression, no fabrication)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns INSUFFICIENT_DATA honestly when fewer than 3 samples exist', async () => {
    (prisma.weatherSnapshot.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([snapshot(2, 5), snapshot(1, 6)]);
    const result = await forecastZoneRiskTrend('zone_x');
    expect(result.dataQuality).toBe('INSUFFICIENT_DATA');
    expect(result.forecastedRainfallMmPerHour).toBeNull();
  });

  it('detects a rising trend from real, monotonically-increasing readings', async () => {
    (prisma.weatherSnapshot.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      snapshot(4, 10), snapshot(3, 20), snapshot(2, 30), snapshot(1, 40), snapshot(0, 50),
    ]);
    const result = await forecastZoneRiskTrend('zone_x', 2);
    expect(result.dataQuality).toBe('FORECAST');
    expect(result.trendDirection).toBe('INCREASING');
    expect(result.forecastedRainfallMmPerHour!).toBeGreaterThan(result.currentRainfallMmPerHour!);
  });

  it('detects a falling trend from real, monotonically-decreasing readings', async () => {
    (prisma.weatherSnapshot.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      snapshot(4, 50), snapshot(3, 40), snapshot(2, 30), snapshot(1, 20), snapshot(0, 10),
    ]);
    const result = await forecastZoneRiskTrend('zone_x', 2);
    expect(result.trendDirection).toBe('DECREASING');
    expect(result.forecastedRainfallMmPerHour!).toBeLessThan(result.currentRainfallMmPerHour!);
  });

  it('reports STABLE for flat/near-flat real readings', async () => {
    (prisma.weatherSnapshot.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      snapshot(4, 0.1), snapshot(3, 0.1), snapshot(2, 0.1), snapshot(1, 0.1), snapshot(0, 0.1),
    ]);
    const result = await forecastZoneRiskTrend('zone_x');
    expect(result.trendDirection).toBe('STABLE');
  });

  it('never forecasts negative rainfall', async () => {
    (prisma.weatherSnapshot.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      snapshot(4, 20), snapshot(3, 10), snapshot(2, 5), snapshot(1, 1), snapshot(0, 0),
    ]);
    const result = await forecastZoneRiskTrend('zone_x', 24);
    expect(result.forecastedRainfallMmPerHour!).toBeGreaterThanOrEqual(0);
  });

  it('translates the forecast through the same intensity-bonus rules as the live risk engine', async () => {
    (prisma.weatherSnapshot.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      snapshot(4, 20), snapshot(3, 40), snapshot(2, 60), snapshot(1, 80), snapshot(0, 100),
    ]);
    const result = await forecastZoneRiskTrend('zone_x', 1);
    expect(result.forecastedIntensityBonus).toBeGreaterThan(0);
    expect(result.forecastedIntensityBonus).toBeGreaterThanOrEqual(result.currentIntensityBonus!);
  });
});
