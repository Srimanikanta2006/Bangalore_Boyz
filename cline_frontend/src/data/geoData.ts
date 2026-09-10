import type { GeoFeature, GeoFeatureCollection, RiskScore } from '../types/domain';
import { MOCK_ASSETS, MOCK_GRAPH_EDGES } from './mockData';
import { riskColor, riskLevelFromScore } from '../utils/riskColors';

interface SegmentDef {
  id: string;
  name: string;
  /** Owning asset (roads/drains carry risk color from their asset). */
  assetId: string | null;
  alternative?: boolean;
  coordinates: number[][];
}

const ROAD_DEFS: SegmentDef[] = [
  {
    id: 'R24-seg',
    name: 'Road R24',
    assetId: 'R24',
    coordinates: [[80.6442, 16.5088], [80.6465, 16.508], [80.6485, 16.5075], [80.6505, 16.5065], [80.6528, 16.5058]],
  },
  {
    id: 'R12-seg',
    name: 'Road R12',
    assetId: 'R12',
    coordinates: [[80.641, 16.5102], [80.643, 16.508], [80.646, 16.5045], [80.6502, 16.5115]],
  },
  {
    id: 'R31-seg',
    name: 'Road R31',
    assetId: 'R31',
    coordinates: [[80.6395, 16.5068], [80.6435, 16.5045], [80.651, 16.5032]],
  },
  {
    id: 'R7B-seg',
    name: 'Route 7B (Alternative)',
    assetId: null,
    alternative: true,
    coordinates: [[80.6442, 16.5088], [80.642, 16.506], [80.645, 16.504], [80.6528, 16.5058]],
  },
];

const DRAIN_DEFS: SegmentDef[] = [
  {
    id: 'D07-seg',
    name: 'Drain D07',
    assetId: 'D07',
    coordinates: [[80.6388, 16.5095], [80.6405, 16.5092], [80.6425, 16.5089], [80.6442, 16.5088]],
  },
  {
    id: 'D03-seg',
    name: 'Drain D03',
    assetId: 'D03',
    coordinates: [[80.6395, 16.5068], [80.6408, 16.508], [80.641, 16.5102]],
  },
  {
    id: 'D11-seg',
    name: 'Drain D11',
    assetId: 'D11',
    coordinates: [[80.638, 16.505], [80.6395, 16.5068]],
  },
];

function riskProps(
  riskMap: Record<string, RiskScore>,
  assetId: string | null,
): { riskScore: number; riskLevel: string; riskColorHex: string } {
  const risk = assetId ? riskMap[assetId] : undefined;
  const score = risk?.score ?? 0;
  const level = risk?.level ?? riskLevelFromScore(score);
  return { riskScore: score, riskLevel: level, riskColorHex: riskColor(level) };
}

function buildSegments(
  defs: SegmentDef[],
  kind: string,
  riskMap: Record<string, RiskScore>,
): GeoFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: defs.map((def) => ({
      type: 'Feature' as const,
      properties: {
        id: def.id,
        name: def.name,
        kind,
        alternative: def.alternative ?? false,
        assetId: def.assetId,
        ...riskProps(riskMap, def.assetId),
      },
      geometry: { type: 'LineString' as const, coordinates: def.coordinates },
    })),
  };
}

export function buildRoadSegments(riskMap: Record<string, RiskScore>): GeoFeatureCollection {
  return buildSegments(ROAD_DEFS, 'road', riskMap);
}

export function buildDrainSegments(riskMap: Record<string, RiskScore>): GeoFeatureCollection {
  return buildSegments(DRAIN_DEFS, 'drain', riskMap);
}

export const HAZARD_ZONE: GeoFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { id: 'hazard-zone', name: 'Heavy Rainfall Zone' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [80.636, 16.512],
            [80.655, 16.512],
            [80.655, 16.501],
            [80.636, 16.501],
            [80.636, 16.512],
          ],
        ],
      },
    },
  ],
};

/** Faint contextual dependency graph so the map reads as a network, not pins. */
export const DEPENDENCY_LINES: GeoFeatureCollection = {
  type: 'FeatureCollection',
  features: MOCK_GRAPH_EDGES.flatMap((edge) => {
    const source = MOCK_ASSETS.find((a) => a.id === edge.sourceAssetId);
    const target = MOCK_ASSETS.find((a) => a.id === edge.targetAssetId);
    if (!source || !target) return [];
    return [
      {
        type: 'Feature' as const,
        properties: { id: edge.id, dependencyType: edge.dependencyType },
        geometry: {
          type: 'LineString' as const,
          coordinates: [
            [source.lng, source.lat],
            [target.lng, target.lat],
          ],
        },
      },
    ];
  }),
};

export function buildAssetPoints(riskMap: Record<string, RiskScore>): GeoFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: MOCK_ASSETS.map((asset) => {
      const risk = riskMap[asset.id];
      const score = risk?.score ?? 0;
      const level = risk?.level ?? riskLevelFromScore(score);
      return {
        type: 'Feature' as const,
        properties: {
          id: asset.id,
          name: asset.name,
          type: asset.type,
          criticality: asset.criticality,
          shortCode: asset.shortCode,
          riskScore: score,
          riskLevel: level,
          riskColorHex: riskColor(level),
        },
        geometry: { type: 'Point' as const, coordinates: [asset.lng, asset.lat] },
      };
    }),
  };
}

export function buildCascadeLines(path: string[]): GeoFeatureCollection {
  const assetMap = Object.fromEntries(MOCK_ASSETS.map((a) => [a.id, a]));
  const features: GeoFeature[] = [];

  for (let i = 0; i < path.length - 1; i++) {
    const source = assetMap[path[i]];
    const target = assetMap[path[i + 1]];
    if (!source || !target) continue;
    features.push({
      type: 'Feature',
      properties: { id: `cascade-${path[i]}-${path[i + 1]}`, step: i },
      geometry: {
        type: 'LineString',
        coordinates: [
          [source.lng, source.lat],
          [target.lng, target.lat],
        ],
      },
    });
  }

  return { type: 'FeatureCollection', features };
}
