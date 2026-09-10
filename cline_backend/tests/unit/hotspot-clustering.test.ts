import { describe, expect, it } from 'vitest';
import { clusterHistoricalEvents, type ClusterableEvent } from '../../src/services/hotspotClustering.service';

function ev(overrides: Partial<ClusterableEvent>): ClusterableEvent {
  return {
    id: `e_${Math.random().toString(36).slice(2)}`,
    latitude: 13.05,
    longitude: 80.28,
    hazardType: 'FLASH_FLOOD',
    severity: 'HIGH',
    occurredAt: new Date(),
    zoneId: 'zone_eb',
    zoneName: 'East Basin',
    ...overrides,
  };
}

describe('clusterHistoricalEvents (density-based spatial clustering)', () => {
  it('groups nearby same-hazard events into a single hotspot', () => {
    const events = [
      ev({ latitude: 13.050, longitude: 80.280 }),
      ev({ latitude: 13.051, longitude: 80.281 }), // ~150m away - same cluster
      ev({ latitude: 13.052, longitude: 80.279 }),
    ];
    const result = clusterHistoricalEvents(events);
    expect(result).toHaveLength(1);
    expect(result[0].eventCount).toBe(3);
    expect(result[0].dataQuality).toBe('DERIVED_FROM_HISTORY');
  });

  it('keeps far-apart events as separate hotspots', () => {
    const events = [
      ev({ latitude: 13.050, longitude: 80.280 }),
      ev({ latitude: 14.500, longitude: 81.500 }), // very far away
    ];
    const result = clusterHistoricalEvents(events);
    expect(result).toHaveLength(2);
    expect(result.every((h) => h.eventCount === 1)).toBe(true);
  });

  it('never merges different hazard types even at the same location', () => {
    const events = [
      ev({ latitude: 13.05, longitude: 80.28, hazardType: 'FLASH_FLOOD' }),
      ev({ latitude: 13.05, longitude: 80.28, hazardType: 'EXTREME_HEAT' }),
    ];
    const result = clusterHistoricalEvents(events);
    expect(result).toHaveLength(2);
    expect(new Set(result.map((h) => h.hazardType))).toEqual(new Set(['FLASH_FLOOD', 'EXTREME_HEAT']));
  });

  it('weighs recurrence higher for more, more-recent events (real, deterministic formula)', () => {
    const now = new Date();
    const oldDate = new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000); // >1 year ago
    const busyRecent = clusterHistoricalEvents([
      ev({ occurredAt: now }), ev({ occurredAt: now }), ev({ occurredAt: now }),
    ]);
    const quietOld = clusterHistoricalEvents([ev({ occurredAt: oldDate })]);
    expect(busyRecent[0].recurrenceScore).toBeGreaterThan(quietOld[0].recurrenceScore);
  });

  it('computes a real centroid (not a fabricated coordinate)', () => {
    const result = clusterHistoricalEvents([
      ev({ latitude: 13.000, longitude: 80.000 }),
      ev({ latitude: 13.010, longitude: 80.010 }), // ~1.5km away - within cluster radius
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].latitude).toBeCloseTo(13.005, 2);
    expect(result[0].longitude).toBeCloseTo(80.005, 2);
  });

  it('returns an empty array for no events', () => {
    expect(clusterHistoricalEvents([])).toEqual([]);
  });
});
