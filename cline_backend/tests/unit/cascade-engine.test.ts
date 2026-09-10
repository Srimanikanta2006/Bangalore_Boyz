import { describe, expect, it } from 'vitest';
import { buildCascade, impactTypeFor, type CascadeAssetLite, type CascadeEdgeLite } from '../../src/services/cascade.service';

const asset = (id: string, code: string, type: CascadeAssetLite['type']): CascadeAssetLite => ({
  id, assetCode: code, name: code, type, criticality: 'HIGH',
  operationalStatus: 'OPERATIONAL', zoneId: 'zone_x', latitude: 13, longitude: 80,
});

const assets: CascadeAssetLite[] = [
  asset('drain', 'DRAIN-07', 'DRAIN'),
  asset('road', 'RD-24', 'ROAD'),
  asset('gate', 'GATE-B', 'AMBULANCE_GATE'),
  asset('hospital', 'HOSP-01', 'HOSPITAL'),
];

const edges: CascadeEdgeLite[] = [
  { sourceAssetId: 'drain', targetAssetId: 'road', dependencyType: 'DRAINS_INTO', strength: 0.9, description: null },
  { sourceAssetId: 'road', targetAssetId: 'gate', dependencyType: 'PROVIDES_ACCESS_TO', strength: 0.85, description: null },
  { sourceAssetId: 'gate', targetAssetId: 'hospital', dependencyType: 'SERVED_BY', strength: 0.9, description: null },
  // cycle back to the root - must never be traversed
  { sourceAssetId: 'hospital', targetAssetId: 'drain', dependencyType: 'SUPPORTS', strength: 0.5, description: null },
];

const fetchEdges = async (ids: string[]) => edges.filter((e) => ids.includes(e.sourceAssetId));
const fetchAssets = async (ids: string[]) => assets.filter((a) => ids.includes(a.id));

describe('cascade engine (dependency graph traversal)', () => {
  it('traverses the drain -> road -> gate -> hospital chain with increasing depth', async () => {
    const nodes = await buildCascade(assets[0], fetchEdges, fetchAssets, 'FLASH_FLOOD', 80);
    expect(nodes).toHaveLength(4);
    expect(nodes[0].assetCode).toBe('DRAIN-07');
    expect(nodes[0].depth).toBe(0);
    const road = nodes.find((n) => n.assetCode === 'RD-24');
    const gate = nodes.find((n) => n.assetCode === 'GATE-B');
    const hospital = nodes.find((n) => n.assetCode === 'HOSP-01');
    expect(road?.depth).toBe(1);
    expect(gate?.depth).toBe(2);
    expect(hospital?.depth).toBe(3);
    expect(road?.impactType).toBe('INUNDATED');
    expect(gate?.impactType).toBe('AMBULANCE_DELAYED');
    expect(hospital?.impactType).toBe('ACCESS_BLOCKED');
  });

  it('prevents cycles (hospital -> drain edge is ignored)', async () => {
    const nodes = await buildCascade(assets[0], fetchEdges, fetchAssets, 'FLOOD', 80);
    const drainNodes = nodes.filter((n) => n.assetCode === 'DRAIN-07');
    expect(drainNodes).toHaveLength(1);
    expect(nodes.length).toBeLessThanOrEqual(4);
  });

  it('decays impact score with depth and edge strength', async () => {
    const nodes = await buildCascade(assets[0], fetchEdges, fetchAssets, 'FLASH_FLOOD', 80);
    const road = nodes.find((n) => n.assetCode === 'RD-24')!;
    const hospital = nodes.find((n) => n.assetCode === 'HOSP-01')!;
    expect(road.impactScore).toBeGreaterThan(hospital.impactScore);
    expect(hospital.impactScore).toBeGreaterThanOrEqual(5);
  });

  it('respects maxDepth', async () => {
    const nodes = await buildCascade(assets[0], fetchEdges, fetchAssets, 'FLOOD', 80, 1);
    expect(nodes.every((n) => n.depth <= 1)).toBe(true);
  });

  it('maps impact types deterministically by hazard and asset type', () => {
    expect(impactTypeFor('DRAIN', 'FLASH_FLOOD')).toBe('OVERWHELMED');
    expect(impactTypeFor('SUBSTATION', 'POWER_FAILURE')).toBe('POWER_LOSS');
    expect(impactTypeFor('HOSPITAL', 'EXTREME_HEAT')).toBe('THERMAL_STRESS');
    expect(impactTypeFor('COOLING_CENTER', 'EXTREME_HEAT')).toBe('OVERCAPACITY');
    expect(impactTypeFor('GENERATOR', 'STORM')).toBe('BACKUP_ENGAGED');
    expect(impactTypeFor('WATER_TREATMENT', 'FLOOD')).toBe('DEGRADED');
  });
});
