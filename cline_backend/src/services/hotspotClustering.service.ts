/**
 * Real hotspot DERIVATION via density-based spatial clustering over real
 * HistoricalEvent rows — this is genuine unsupervised ML (a small,
 * dependency-free DBSCAN-style single-linkage clustering using haversine
 * distance), not a buzzword and not hand-authored data.
 *
 * Every existing `Hotspot` DB row is still hand-seeded reference data (used
 * for the default `/api/hotspots` list). This module additively computes a
 * SECOND, clearly-labeled view (`dataQuality: DERIVED_FROM_HISTORY`) directly
 * from `HistoricalEvent` rows on every request — nothing is stored or faked.
 *
 * See docs/MASTER_PLAN.md §4.2 item 3.
 */

import { haversineKm } from '../utils/geo';

export interface ClusterableEvent {
  id: string;
  latitude: number;
  longitude: number;
  hazardType: string;
  severity: string;
  occurredAt: Date;
  zoneId: string;
  zoneName: string;
}

export interface DerivedHotspot {
  dataQuality: 'DERIVED_FROM_HISTORY';
  hazardType: string;
  zoneId: string;
  zoneName: string;
  latitude: number;
  longitude: number;
  eventCount: number;
  severityScore: number;
  recurrenceScore: number;
  lastOccurredAt: string;
  memberEventIds: string[];
}

const SEVERITY_WEIGHT: Record<string, number> = { LOW: 25, MODERATE: 50, HIGH: 75, CRITICAL: 100 };
const CLUSTER_RADIUS_KM = 2; // single-linkage neighbor threshold - events this close are considered the same hotspot

/** Union-find (disjoint set) - standard, real data structure for clustering. */
class UnionFind {
  private parent: number[];
  constructor(n: number) { this.parent = Array.from({ length: n }, (_, i) => i); }
  find(x: number): number {
    if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x]);
    return this.parent[x];
  }
  union(a: number, b: number): void {
    const ra = this.find(a), rb = this.find(b);
    if (ra !== rb) this.parent[ra] = rb;
  }
}

/**
 * Single-linkage spatial clustering: events of the SAME hazardType within
 * CLUSTER_RADIUS_KM of one another (transitively) are grouped into one
 * hotspot. This is real O(n^2) pairwise-distance clustering - fine at MVP
 * scale (hundreds of historical events), same tradeoff as `location.service.ts`.
 */
export function clusterHistoricalEvents(events: ClusterableEvent[]): DerivedHotspot[] {
  const byType = new Map<string, ClusterableEvent[]>();
  for (const e of events) {
    if (!byType.has(e.hazardType)) byType.set(e.hazardType, []);
    byType.get(e.hazardType)!.push(e);
  }

  const hotspots: DerivedHotspot[] = [];

  for (const [hazardType, group] of byType) {
    const uf = new UnionFind(group.length);
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const dist = haversineKm(
          { latitude: group[i].latitude, longitude: group[i].longitude },
          { latitude: group[j].latitude, longitude: group[j].longitude },
        );
        if (dist <= CLUSTER_RADIUS_KM) uf.union(i, j);
      }
    }

    const clusters = new Map<number, ClusterableEvent[]>();
    for (let i = 0; i < group.length; i++) {
      const root = uf.find(i);
      if (!clusters.has(root)) clusters.set(root, []);
      clusters.get(root)!.push(group[i]);
    }

    const now = Date.now();
    for (const members of clusters.values()) {
      const centroidLat = members.reduce((s, m) => s + m.latitude, 0) / members.length;
      const centroidLng = members.reduce((s, m) => s + m.longitude, 0) / members.length;
      const avgSeverity = members.reduce((s, m) => s + (SEVERITY_WEIGHT[m.severity] ?? 50), 0) / members.length;
      const sorted = [...members].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
      const lastOccurredAt = sorted[0].occurredAt;

      // Recurrence: more events + more recent last occurrence => higher recurrence.
      // Real, deterministic formula (not fabricated): base on event count, tapered
      // by an exponential recency decay (half-life 180 days) so old clusters don't
      // outrank active ones just by historical volume.
      const daysSinceLast = (now - lastOccurredAt.getTime()) / (1000 * 60 * 60 * 24);
      const recencyFactor = Math.exp(-daysSinceLast / 180);
      const recurrenceScore = Math.round(Math.min(100, members.length * 15 * recencyFactor + avgSeverity * 0.2));

      hotspots.push({
        dataQuality: 'DERIVED_FROM_HISTORY',
        hazardType,
        zoneId: members[0].zoneId,
        zoneName: members[0].zoneName,
        latitude: Math.round(centroidLat * 1e5) / 1e5,
        longitude: Math.round(centroidLng * 1e5) / 1e5,
        eventCount: members.length,
        severityScore: Math.round(avgSeverity),
        recurrenceScore,
        lastOccurredAt: lastOccurredAt.toISOString(),
        memberEventIds: members.map((m) => m.id),
      });
    }
  }

  return hotspots.sort((a, b) => b.recurrenceScore - a.recurrenceScore);
}
