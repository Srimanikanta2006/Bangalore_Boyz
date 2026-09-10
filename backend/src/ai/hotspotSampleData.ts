import type { HistoricalIncident } from "./hotspotTypes.ts";

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

/**
 * Sample historical climate incidents for pilot zone assets over the past 90 days.
 * Used for demonstrations and default seed data prior to Person 1 DB integration.
 */
export const SAMPLE_HISTORICAL_INCIDENTS: HistoricalIncident[] = [
  // Drain D07 (Chronic recurring heavy rainfall bottleneck)
  {
    incidentId: "HIST-D07-01",
    timestamp: new Date(now - 75 * day).toISOString(),
    assetId: "D07",
    assetName: "Drain D07",
    hazardType: "heavy_rainfall",
    severity: "high",
    riskScore: 78,
  },
  {
    incidentId: "HIST-D07-02",
    timestamp: new Date(now - 45 * day).toISOString(),
    assetId: "D07",
    assetName: "Drain D07",
    hazardType: "heavy_rainfall",
    severity: "high",
    riskScore: 82,
  },
  {
    incidentId: "HIST-D07-03",
    timestamp: new Date(now - 18 * day).toISOString(),
    assetId: "D07",
    assetName: "Drain D07",
    hazardType: "heavy_rainfall",
    severity: "critical",
    riskScore: 90,
  },
  {
    incidentId: "HIST-D07-04",
    timestamp: new Date(now - 4 * day).toISOString(),
    assetId: "D07",
    assetName: "Drain D07",
    hazardType: "heavy_rainfall",
    severity: "critical",
    riskScore: 94,
  },

  // Road R24 (Repeated flood ponding leading to hospital transit disruption)
  {
    incidentId: "HIST-R24-01",
    timestamp: new Date(now - 60 * day).toISOString(),
    assetId: "R24",
    assetName: "Road R24",
    hazardType: "flood",
    severity: "medium",
    riskScore: 55,
  },
  {
    incidentId: "HIST-R24-02",
    timestamp: new Date(now - 22 * day).toISOString(),
    assetId: "R24",
    assetName: "Road R24",
    hazardType: "flood",
    severity: "high",
    riskScore: 76,
  },
  {
    incidentId: "HIST-R24-03",
    timestamp: new Date(now - 5 * day).toISOString(),
    assetId: "R24",
    assetName: "Road R24",
    hazardType: "flood",
    severity: "critical",
    riskScore: 88,
  },

  // Substation S3 (Water ingress threat during major inundation)
  {
    incidentId: "HIST-S3-01",
    timestamp: new Date(now - 80 * day).toISOString(),
    assetId: "S3",
    assetName: "Substation S3",
    hazardType: "flood",
    severity: "medium",
    riskScore: 50,
  },
  {
    incidentId: "HIST-S3-02",
    timestamp: new Date(now - 12 * day).toISOString(),
    assetId: "S3",
    assetName: "Substation S3",
    hazardType: "flood",
    severity: "high",
    riskScore: 72,
  },

  // Hospital H01 (Extreme heat thermal vulnerability during summer peaks)
  {
    incidentId: "HIST-H01-01",
    timestamp: new Date(now - 85 * day).toISOString(),
    assetId: "H01",
    assetName: "Hospital A",
    hazardType: "extreme_heat",
    severity: "medium",
    riskScore: 48,
  },
  {
    incidentId: "HIST-H01-02",
    timestamp: new Date(now - 30 * day).toISOString(),
    assetId: "H01",
    assetName: "Hospital A",
    hazardType: "extreme_heat",
    severity: "high",
    riskScore: 74,
  },
  {
    incidentId: "HIST-H01-03",
    timestamp: new Date(now - 8 * day).toISOString(),
    assetId: "H01",
    assetName: "Hospital A",
    hazardType: "extreme_heat",
    severity: "critical",
    riskScore: 86,
  },

  // Isolated incident at ST01 (1 isolated low event -> should NOT be a hotspot)
  {
    incidentId: "HIST-ST01-01",
    timestamp: new Date(now - 50 * day).toISOString(),
    assetId: "ST01",
    assetName: "Shelter ST01",
    hazardType: "poor_air_quality",
    severity: "low",
    riskScore: 25,
  },
];
