/**
 * ClimateShield Rescue Tactical Engine
 * Core state & logic for tactical response missions, field units, and hazard navigation.
 */

export interface Mission {
  id: string;
  missionCode: string;
  title: string;
  status: "ASSIGNED" | "EN_ROUTE" | "ON_SCENE" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  unitCallsign: string;
  assignedTeamId: string;
  targetSector: string;
  targetAssetId: string;
  latitude: number;
  longitude: number;
  etaMinutes: number;
  hazardSeverity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  waterDepthMm: number;
  currentVelocityMs: number;
  equipmentManifest: string[];
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface TacticalUnit {
  id: string;
  callsign: string;
  name: string;
  type: "HAZMAT" | "WATER_RESCUE" | "HEAVY_BARRIER" | "EMS_TACTICAL" | "MUTUAL_AID";
  status: "AVAILABLE" | "DEPLOYED" | "STANDBY" | "MAINTENANCE";
  teamSize: number;
  capacity: number;
  currentLocation: string;
  latitude: number;
  longitude: number;
}

export interface MissionStatusReportInput {
  missionId: string;
  status: Mission["status"];
  waterDepthMm?: number;
  passable?: boolean;
  notes?: string;
  equipmentUsed?: string[];
}

// In-Memory Mission Store
const missionsStore: Map<string, Mission> = new Map([
  [
    "MSN-402",
    {
      id: "MSN-402",
      missionCode: "MSN-402",
      title: "Tactical Extraction & Barrier Placement — Substation #09",
      status: "EN_ROUTE",
      priority: "CRITICAL",
      unitCallsign: "EM-MA1",
      assignedTeamId: "team_alpha_01",
      targetSector: "Sector 04-B (Midtown)",
      targetAssetId: "SUB-09",
      latitude: 13.087,
      longitude: 80.291,
      etaMinutes: 14,
      hazardSeverity: "HIGH",
      waterDepthMm: 450,
      currentVelocityMs: 1.8,
      equipmentManifest: [
        "High-Capacity Submersible Pump (800 L/min)",
        "Abrasive Water Barrier Baffles (40m)",
        "Telemetry Submersible Probe Array",
        "Kevlar Tactical Rescue Harnesses (x6)"
      ],
      description: "Deploy water barriers to isolate Substation #09 power grid from basin overflow and clear emergency ambulance route R24.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  [
    "MSN-388",
    {
      id: "MSN-388",
      missionCode: "MSN-388",
      title: "Arterial R24 Barrier Placement",
      status: "ASSIGNED",
      priority: "HIGH",
      unitCallsign: "PW-BAR-1",
      assignedTeamId: "team_beta_04",
      targetSector: "East Basin Drainage Corridor",
      targetAssetId: "R24",
      latitude: 13.062,
      longitude: 80.275,
      etaMinutes: 22,
      hazardSeverity: "HIGH",
      waterDepthMm: 320,
      currentVelocityMs: 1.1,
      equipmentManifest: [
        "Rapid Deploy Flood Barriers (100m)",
        "Mobile Diesel Pump Unit",
        "High-Visibility Marker Lights"
      ],
      description: "Erect water baffles to divert overflow away from St. Jude Hospital entrance gate C.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
]);

// In-Memory Units Store
const unitsStore: Map<string, TacticalUnit> = new Map([
  [
    "unit_command_1",
    {
      id: "unit_command_1",
      callsign: "EM-MA1",
      name: "EOC Mutual Aid 1",
      type: "MUTUAL_AID",
      status: "DEPLOYED",
      teamSize: 8,
      capacity: 6,
      currentLocation: "En route to Substation #09",
      latitude: 13.062,
      longitude: 80.275
    }
  ],
  [
    "unit_bar_1",
    {
      id: "unit_bar_1",
      callsign: "PW-BAR-1",
      name: "Public Works Barrier Unit 1",
      type: "HEAVY_BARRIER",
      status: "DEPLOYED",
      teamSize: 6,
      capacity: 4,
      currentLocation: "Staging East EOC",
      latitude: 13.07,
      longitude: 80.28
    }
  ]
]);

export function getMissions(): Mission[] {
  return Array.from(missionsStore.values());
}

export function getMissionById(id: string): Mission | undefined {
  return missionsStore.get(id) || Array.from(missionsStore.values()).find(m => m.missionCode === id);
}

export function updateMissionStatus(input: MissionStatusReportInput): Mission | undefined {
  const mission = getMissionById(input.missionId);
  if (!mission) return undefined;

  mission.status = input.status;
  if (input.waterDepthMm !== undefined) {
    mission.waterDepthMm = input.waterDepthMm;
  }
  mission.updatedAt = new Date().toISOString();
  missionsStore.set(mission.id, mission);
  return mission;
}

export function getTacticalUnits(): TacticalUnit[] {
  return Array.from(unitsStore.values());
}

export function getTacticalNavigation(missionId: string) {
  const mission = getMissionById(missionId) || getMissions()[0];
  return {
    missionId: mission.id,
    missionTitle: mission.title,
    currentPosition: [13.062, 80.275],
    targetPosition: [mission.latitude, mission.longitude],
    waterDepthMm: mission.waterDepthMm,
    safePassable: mission.waterDepthMm < 600,
    hazardSeverity: mission.hazardSeverity,
    etaText: `${mission.etaMinutes} min remaining`,
    routePath: [
      { name: "Checkpoint Alpha (EOC Depot)", lat: 13.062, lng: 80.275, hazard: "NONE" },
      { name: "Highridge Bypass (Elevated Corridor)", lat: 13.075, lng: 80.282, hazard: "LIGHT_PRECIPITATION" },
      { name: "Sector 04-B Substation #09 Entrance", lat: mission.latitude, lng: mission.longitude, hazard: "WATERLOGGING_RISING" }
    ]
  };
}

export function getCommandConsoleSummary() {
  const missions = getMissions();
  const units = getTacticalUnits();
  return {
    activeMissions: missions.filter(m => m.status !== "COMPLETED").length,
    unitsDeployed: units.filter(u => u.status === "DEPLOYED").length,
    criticalIncidents: missions.filter(m => m.priority === "CRITICAL").length,
    satLinkStatus: "ONLINE (LEO Sat-Link 04)",
    tacticalAlerts: [
      "Water depth at Arterial R24 approaching 0.45m threshold",
      "Substation #09 thermal load high — mobile pump required",
      "St. Jude Ambulance Gate C clear — Highridge route recommended"
    ]
  };
}
