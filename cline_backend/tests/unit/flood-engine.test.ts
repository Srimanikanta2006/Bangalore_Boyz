import { describe, expect, it } from 'vitest';
import { normalizeFloodResponse, buildFloodUrl } from '../../src/services/flood.service';

describe('flood.service — GloFAS river discharge (deterministic)', () => {
  it('flags elevated discharge when current >= 1.3x the trailing mean', () => {
    // 29 days at ~10 m3/s, then a spike to 15 m3/s (1.5x).
    const history = Array.from({ length: 29 }, () => 10);
    const payload = { daily: { time: [...history.map((_, i) => i), 29], river_discharge: [...history, 15] } };
    const result = normalizeFloodResponse(payload, 13.0, 80.2);
    expect(result).not.toBeNull();
    expect(result!.currentM3s).toBe(15);
    expect(result!.trailingMeanM3s).toBe(10);
    expect(result!.ratioToTrailingMean).toBe(1.5);
    expect(result!.elevated).toBe(true);
    expect(result!.explanation).toMatch(/exceeds/);
  });

  it('does not flag elevated discharge for normal variation', () => {
    const history = Array.from({ length: 29 }, () => 10);
    const payload = { daily: { river_discharge: [...history, 11] } }; // 1.1x, below 1.3x threshold
    const result = normalizeFloodResponse(payload, 13.0, 80.2);
    expect(result!.elevated).toBe(false);
    expect(result!.ratioToTrailingMean).toBe(1.1);
  });

  it('handles trailing nulls by walking back to the last real value', () => {
    const payload = { daily: { river_discharge: [10, 10, 10, null, null] } };
    const result = normalizeFloodResponse(payload, 13.0, 80.2);
    expect(result!.currentM3s).toBe(10);
    expect(result!.sampleDays).toBe(2);
  });

  it('returns null when no discharge data is present (never fabricates)', () => {
    expect(normalizeFloodResponse({ daily: { river_discharge: [] } }, 0, 0)).toBeNull();
    expect(normalizeFloodResponse({}, 0, 0)).toBeNull();
    expect(normalizeFloodResponse(null, 0, 0)).toBeNull();
  });

  it('builds a well-formed Open-Meteo flood API URL', () => {
    const url = buildFloodUrl(13.06, 80.27);
    expect(url).toContain('flood-api.open-meteo.com/v1/flood');
    expect(url).toContain('latitude=13.06');
    expect(url).toContain('longitude=80.27');
    expect(url).toContain('daily=river_discharge');
  });
});
