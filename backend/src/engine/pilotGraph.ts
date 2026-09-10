import type { InfrastructureGraph } from "./types.ts";

/**
 * Temporary Zone C pilot graph. Swap this for Person 1's GET /api/graph later.
 * Dependency edges are team-modeled, not OSM-derived.
 */
export const PILOT_GRAPH: InfrastructureGraph = {
  zoneId: "zone-c",
  zoneName: "Zone C",
  assets: [
    {
      id: "D07",
      name: "Drain D07",
      type: "drain",
      zoneId: "zone-c",
      vulnerability: 0.85,
      historicalIncidentCount: 3,
      lat: 12.9352,
      lng: 77.6241,
    },
    {
      id: "R24",
      name: "Road R24",
      type: "road",
      zoneId: "zone-c",
      vulnerability: 0.7,
      historicalIncidentCount: 2,
      lat: 12.9361,
      lng: 77.626,
    },
    {
      id: "R31",
      name: "Road R31",
      type: "road",
      zoneId: "zone-c",
      vulnerability: 0.4,
      historicalIncidentCount: 0,
      lat: 12.937,
      lng: 77.6224,
    },
    {
      id: "ST01",
      name: "Staging Point ST01",
      type: "building",
      zoneId: "zone-c",
      vulnerability: 0.2,
      historicalIncidentCount: 0,
      lat: 12.9344,
      lng: 77.623,
    },
    {
      id: "S3",
      name: "Substation S3",
      type: "substation",
      zoneId: "zone-c",
      vulnerability: 0.75,
      historicalIncidentCount: 1,
      lat: 12.9348,
      lng: 77.6272,
    },
    {
      id: "H01",
      name: "Hospital A",
      type: "hospital",
      zoneId: "zone-c",
      vulnerability: 0.8,
      historicalIncidentCount: 1,
      lat: 12.9382,
      lng: 77.6281,
    },
  ],
  edges: [
    { id: "e-d07-r24", fromAssetId: "D07", toAssetId: "R24", kind: "overflow", delayMinutes: 20, distanceKm: 0.4 },
    { id: "e-r24-h01", fromAssetId: "R24", toAssetId: "H01", kind: "access", delayMinutes: 0, distanceKm: 0.6 },
    { id: "e-d07-s3", fromAssetId: "D07", toAssetId: "S3", kind: "overflow", delayMinutes: 35, distanceKm: 0.5 },
    { id: "e-s3-h01", fromAssetId: "S3", toAssetId: "H01", kind: "power_feed", delayMinutes: 0, distanceKm: 0.7 },
    { id: "e-st01-r24", fromAssetId: "ST01", toAssetId: "R24", kind: "adjacent", delayMinutes: 8, distanceKm: 0.8 },
    { id: "e-st01-r31", fromAssetId: "ST01", toAssetId: "R31", kind: "adjacent", delayMinutes: 10, distanceKm: 1.1 },
    { id: "e-r31-h01", fromAssetId: "R31", toAssetId: "H01", kind: "access", delayMinutes: 12, distanceKm: 1.4 },
  ],
};

export function assetById(graph: InfrastructureGraph, id: string) {
  return graph.assets.find((asset) => asset.id === id);
}

export function outgoingEdges(graph: InfrastructureGraph, fromAssetId: string) {
  return graph.edges.filter((edge) => edge.fromAssetId === fromAssetId);
}
