import { describe, expect, it } from 'vitest';
import {
  computeSafety,
  computeCorridorStatus,
  rainArrivalMinutes,
  worstRank,
} from '../../src/services/citizen.service';

describe('citizen safety index', () => {
  it('is SAFE with no drivers', () => {
    expect(computeSafety({ hazardSeverities: [], weatherOverall: null, zoneRiskLevel: null })).toEqual({
      level: 'SAFE',
      score: 12,
      riskCount: 0,
    });
  });

  it('tracks the worst driver across hazards, weather, and zone risk', () => {
    const r = computeSafety({ hazardSeverities: ['MODERATE', 'HIGH'], weatherOverall: 'CRITICAL', zoneRiskLevel: 'LOW' });
    expect(r.level).toBe('CRITICAL');
    expect(r.score).toBe(92);
    expect(r.riskCount).toBe(3); // 2 hazards + 1 weather driver
  });

  it('uses zone risk level even when no live hazards exist', () => {
    const r = computeSafety({ hazardSeverities: [], weatherOverall: null, zoneRiskLevel: 'HIGH' });
    expect(r.level).toBe('HIGH');
    expect(r.riskCount).toBe(0);
  });

  it('ignores malformed zone risk values', () => {
    expect(worstRank(['LOW'])).toBe(1);
    expect(computeSafety({ hazardSeverities: [], weatherOverall: null, zoneRiskLevel: 'NONSENSE' }).level).toBe('SAFE');
  });
});

describe('corridor status', () => {
  it('is BLOCKED when a road is compromised/offline', () => {
    expect(computeCorridorStatus([{ operationalStatus: 'COMPROMISED' }], false)).toBe('BLOCKED');
    expect(computeCorridorStatus([{ operationalStatus: 'OFFLINE' }], false)).toBe('BLOCKED');
  });

  it('is CAUTION on active flooding or degraded roads', () => {
    expect(computeCorridorStatus([], true)).toBe('CAUTION');
    expect(computeCorridorStatus([{ operationalStatus: 'AT_RISK' }], false)).toBe('CAUTION');
    expect(computeCorridorStatus([{ operationalStatus: 'DEGRADED' }], false)).toBe('CAUTION');
  });

  it('is CLEAR when everything is operational and no flooding', () => {
    expect(computeCorridorStatus([{ operationalStatus: 'OPERATIONAL' }], false)).toBe('CLEAR');
  });
});

describe('rain arrival', () => {
  const now = Date.parse('2026-01-01T00:00:00Z');
  it('returns minutes to the first meaningful rain hour', () => {
    const forecast = [
      { time: '2026-01-01T00:30:00Z', rainfallMmPerHour: 0 },
      { time: '2026-01-01T01:00:00Z', rainfallMmPerHour: 1.2 },
    ];
    expect(rainArrivalMinutes(forecast, now)).toBe(60);
  });

  it('returns null when no rain is forecast', () => {
    expect(rainArrivalMinutes([{ time: '2026-01-01T02:00:00Z', rainfallMmPerHour: 0 }], now)).toBeNull();
  });
});
