import { describe, expect, it } from 'vitest';
import { severityForParams } from '../../src/services/simulator.service';

describe('simulator severity derivation (deterministic)', () => {
  it('treats the spec example (FLASH_FLOOD, 65mm/hr, 75% drainage) as CRITICAL', () => {
    // effectiveRainfall = 65 * (100/75) = 86.7 -> CRITICAL
    expect(severityForParams({ scenarioType: 'FLASH_FLOOD', rainfallRate: 65, drainageThroughput: 75, temperature: 28.4 })).toBe('CRITICAL');
  });

  it('amplifies rainfall when drainage throughput drops', () => {
    expect(severityForParams({ scenarioType: 'FLASH_FLOOD', rainfallRate: 60, drainageThroughput: 50 })).toBe('CRITICAL');
  });

  it('keeps a light storm MODERATE/LOW', () => {
    const severity = severityForParams({ scenarioType: 'FLASH_FLOOD', rainfallRate: 25, drainageThroughput: 100 });
    expect(['LOW', 'MODERATE']).toContain(severity);
  });

  it('derives heat severity from temperature', () => {
    expect(severityForParams({ scenarioType: 'EXTREME_HEAT', temperature: 45 })).toBe('CRITICAL');
    expect(severityForParams({ scenarioType: 'EXTREME_HEAT', temperature: 41 })).toBe('HIGH');
    expect(severityForParams({ scenarioType: 'EXTREME_HEAT', temperature: 30 })).toBe('LOW');
  });

  it('adds tidal surge to the effective water load', () => {
    expect(severityForParams({ scenarioType: 'ATMOSPHERIC_RIVER', rainfallRate: 50, tidalSurge: 2.5 })).toBe('CRITICAL');
  });

  it('is deterministic', () => {
    const params = { scenarioType: 'STORM' as const, windSpeed: 75 };
    expect(severityForParams(params)).toBe(severityForParams(params));
  });
});
