import { describe, expect, it } from 'vitest';
import { computeRisk, intensityBonus } from '../../src/services/risk.service';

describe('risk engine (deterministic, no AI)', () => {
  it('is deterministic - identical inputs produce identical output', () => {
    const input = {
      severity: 'CRITICAL' as const,
      hazardType: 'FLASH_FLOOD' as const,
      intensity: { rainfallRate: 65, waterDepth: 1.4, flowVelocity: 1.9 },
      vulnerability: 88,
      criticality: 'HIGH' as const,
      historicalCount: 3,
      telemetryFresh: true,
    };
    expect(computeRisk(input)).toEqual(computeRisk(input));
  });

  it('produces a CRITICAL score for a severe flood on a vulnerable, high-criticality asset with recurrence', () => {
    const result = computeRisk({
      severity: 'CRITICAL',
      hazardType: 'FLASH_FLOOD',
      intensity: { rainfallRate: 65, waterDepth: 1.4, flowVelocity: 1.9 },
      vulnerability: 88,
      criticality: 'HIGH',
      historicalCount: 3,
      telemetryFresh: true,
    });
    // hazard = min(1, 1.0 + 0.25) = 1.0; vuln 0.88; crit 0.8; hist 1.15
    expect(result.score).toBe(Math.min(100, Math.round(1.0 * 0.88 * 0.8 * 1.15 * 100)));
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.level).toBe('CRITICAL');
    expect(result.confidence).toBeLessThanOrEqual(0.95);
    expect(result.factors.length).toBeGreaterThanOrEqual(3);
    expect(result.explanation).toContain('deterministic risk score');
  });

  it('keeps a LOW severity baseline hazard in a low bucket', () => {
    const result = computeRisk({
      severity: 'LOW',
      hazardType: null,
      intensity: null,
      vulnerability: 20,
      criticality: 'LOW',
      historicalCount: 0,
    });
    // 0.25 * 0.2 * 0.3 * 1.0 = 0.015 -> 2
    expect(result.score).toBe(2);
    expect(result.level).toBe('LOW');
    expect(result.confidence).toBe(0.55);
  });

  it('caps the intensity bonus at 0.25', () => {
    const bonus = intensityBonus({ rainfallRate: 120, waterDepth: 3, temperature: 50, windSpeed: 140, flowVelocity: 4 });
    expect(bonus).toBe(0.25);
    expect(intensityBonus(null)).toBe(0);
  });

  it('normalizes every score into 0-100', () => {
    const extreme = computeRisk({
      severity: 'CRITICAL',
      hazardType: 'FLASH_FLOOD',
      intensity: { rainfallRate: 100, waterDepth: 2.5 },
      vulnerability: 100,
      criticality: 'CRITICAL',
      historicalCount: 10,
      telemetryFresh: true,
    });
    expect(extreme.score).toBeLessThanOrEqual(100);
    expect(extreme.score).toBe(100);
  });
});
