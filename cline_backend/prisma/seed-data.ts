/**
 * ClimateShield DEMO dataset.
 * IMPORTANT: every geographic coordinate, measurement and event in this file is
 * SYNTHETIC DEMO data for a fictional municipal area ("Bayview Metro").
 * It is NOT real-world observation data.
 */

export const DEMO_SOURCE = 'SYNTHETIC_DEMO';

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000);
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000);
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);
export const time = { hoursAgo, daysAgo, minutesAgo };

const box = (lat: number, lon: number, delta = 0.012) => ({
  type: 'Polygon',
  coordinates: [
    [
      [lon - delta, lat - delta],
      [lon + delta, lat - delta],
      [lon + delta, lat + delta],
      [lon - delta, lat + delta],
      [lon - delta, lat - delta],
    ],
  ],
});

// ---------------- ZONES (4) ----------------

export interface ZoneSeed {
  id: string; name: string; code: string; description: string;
  latitude: number; longitude: number; riskLevel: string; population: number;
  boundaryGeoJson: object;
}

export const zones: ZoneSeed[] = [
  {
    id: 'zone_eb', name: 'East Basin', code: 'EB',
    description: 'Low-lying drainage basin with high flood recurrence (synthetic demo zone).',
    latitude: 13.062, longitude: 80.275, riskLevel: 'CRITICAL', population: 14200,
    boundaryGeoJson: box(13.062, 80.275),
  },
  {
    id: 'zone_nh', name: 'North Harbor', code: 'NH',
    description: 'Coastal harbor district exposed to surge and storm wind (synthetic demo zone).',
    latitude: 13.085, longitude: 80.292, riskLevel: 'HIGH', population: 21500,
    boundaryGeoJson: box(13.085, 80.292),
  },
  {
    id: 'zone_mt', name: 'Midtown', code: 'MT',
    description: 'Dense medical/grid corridor with heat and power stress (synthetic demo zone).',
    latitude: 13.045, longitude: 80.245, riskLevel: 'MODERATE', population: 28400,
    boundaryGeoJson: box(13.045, 80.245),
  },
  {
    id: 'zone_rc', name: 'Riverside Corridor', code: 'RC',
    description: 'Riverside lowlands with drainage and pumping dependency (synthetic demo zone).',
    latitude: 13.032, longitude: 80.262, riskLevel: 'HIGH', population: 9800,
    boundaryGeoJson: box(13.032, 80.262),
  },
  {
    id: 'zone_ktm', name: 'Kathmandu Valley Basin', code: 'KTM',
    description: 'Bagmati river corridor exposed to severe monsoonal flash flooding and riverbank breach.',
    latitude: 27.7172, longitude: 85.3140, riskLevel: 'CRITICAL', population: 45000,
    boundaryGeoJson: box(27.7172, 85.3140, 0.05),
  },
];

// ---------------- DEPARTMENTS (7) ----------------

export interface DepartmentSeed {
  id: string; name: string; code: string; type: string; contactPhone: string; status: string;
}

export const departments: DepartmentSeed[] = [
  { id: 'dept_pw', name: 'Public Works', code: 'PW', type: 'PUBLIC_WORKS', contactPhone: '+1-555-0101', status: 'ACTIVE' },
  { id: 'dept_fire', name: 'Fire & Rescue', code: 'FR', type: 'FIRE_RESCUE', contactPhone: '+1-555-0102', status: 'ACTIVE' },
  { id: 'dept_ems', name: 'Emergency Medical Services', code: 'EMS', type: 'EMS', contactPhone: '+1-555-0103', status: 'ACTIVE' },
  { id: 'dept_police', name: 'Police', code: 'PD', type: 'POLICE', contactPhone: '+1-555-0104', status: 'ACTIVE' },
  { id: 'dept_util', name: 'Utilities & Grid', code: 'UTL', type: 'UTILITIES', contactPhone: '+1-555-0105', status: 'ACTIVE' },
  { id: 'dept_water', name: 'Water Authority', code: 'WTR', type: 'WATER', contactPhone: '+1-555-0106', status: 'ACTIVE' },
  { id: 'dept_em', name: 'Emergency Management', code: 'EM', type: 'EMERGENCY_MANAGEMENT', contactPhone: '+1-555-0107', status: 'ACTIVE' },
];

// ---------------- USERS (5 demo accounts) ----------------

export interface UserSeed {
  id: string; name: string; email: string; role: string; departmentId: string | null; phone: string;
}

export const users: UserSeed[] = [
  { id: 'user_gov', name: 'Dana Whitfield', email: 'government@climateshield.demo', role: 'GOVERNMENT_OPERATOR', departmentId: 'dept_em', phone: '+1-555-0201' },
  { id: 'user_admin', name: 'Alex Morrow', email: 'admin@climateshield.demo', role: 'ADMIN', departmentId: 'dept_em', phone: '+1-555-0202' },
  { id: 'user_dispatch', name: 'Priya Sharma', email: 'dispatcher@climateshield.demo', role: 'DISPATCHER', departmentId: 'dept_em', phone: '+1-555-0203' },
  { id: 'user_field', name: 'Marcus Webb', email: 'field@climateshield.demo', role: 'FIELD_OPERATOR', departmentId: 'dept_pw', phone: '+1-555-0204' },
  { id: 'user_analyst', name: 'Jordan Lee', email: 'analyst@climateshield.demo', role: 'ANALYST', departmentId: 'dept_em', phone: '+1-555-0205' },
  // Citizen demo account (public-safety facing). No department. Uses the shared demo password.
  { id: 'user_citizen', name: 'Ravi Kumar', email: 'citizen@climateshield.demo', role: 'CITIZEN', departmentId: null, phone: '+1-555-0301' },
];

// ---------------- INFRASTRUCTURE ASSETS (18) ----------------

export interface AssetSeed {
  id: string; assetCode: string; name: string; type: string; zoneId: string;
  latitude: number; longitude: number; criticality: string; vulnerability: number;
  operationalStatus: string; description: string; metadata: Record<string, unknown>;
}

export const assets: AssetSeed[] = [
  { id: 'asset_hosp_01', assetCode: 'HOSP-01', name: 'St. Jude Regional Medical Center', type: 'HOSPITAL', zoneId: 'zone_mt', latitude: 13.0472, longitude: 80.2471, criticality: 'CRITICAL', vulnerability: 78, operationalStatus: 'OPERATIONAL', description: 'Primary regional hospital; 340 beds, trauma center (demo facility).', metadata: { beds: 340, bedOccupancyPercent: 82, backupPower: true, failoverPower: true, evacuationStatus: 'OPEN', waterProximityM: 850 } },
  { id: 'asset_sub_09', assetCode: 'SUB-09', name: 'Midtown Electric Substation #09', type: 'SUBSTATION', zoneId: 'zone_mt', latitude: 13.0431, longitude: 80.2418, criticality: 'CRITICAL', vulnerability: 82, operationalStatus: 'DEGRADED', description: 'Primary feeder for the medical corridor (demo facility).', metadata: { failoverPower: true, backupPower: false, waterProximityM: 1200 } },
  { id: 'asset_pump_04', assetCode: 'PUMP-04', name: 'East Basin Pumping Station #4', type: 'PUMPING_STATION', zoneId: 'zone_eb', latitude: 13.0608, longitude: 80.2769, criticality: 'HIGH', vulnerability: 85, operationalStatus: 'COMPROMISED', description: 'Main stormwater evacuation for the East Basin catchment (demo facility).', metadata: { backupPower: true, waterProximityM: 40, capacity: 2400 } },
  { id: 'asset_brg_02', assetCode: 'BRG-02', name: 'Metro Causeway Bridge', type: 'BRIDGE', zoneId: 'zone_nh', latitude: 13.0872, longitude: 80.2938, criticality: 'CRITICAL', vulnerability: 64, operationalStatus: 'AT_RISK', description: 'Only causeway linking the harbor to the shelter network (demo structure).', metadata: { waterProximityM: 0 } },
  { id: 'asset_shel_12', assetCode: 'SHEL-12', name: 'North Harbor Evacuation Shelter #12', type: 'EVACUATION_SHELTER', zoneId: 'zone_nh', latitude: 13.0831, longitude: 80.2884, criticality: 'HIGH', vulnerability: 35, operationalStatus: 'OPERATIONAL', description: '800-person evacuation shelter (demo facility).', metadata: { capacity: 800, occupancyPercent: 34, evacuationStatus: 'OPEN' } },
  { id: 'asset_cool_03', assetCode: 'COOL-03', name: 'Midtown Cooling Center', type: 'COOLING_CENTER', zoneId: 'zone_mt', latitude: 13.0489, longitude: 80.2495, criticality: 'MEDIUM', vulnerability: 28, operationalStatus: 'OPERATIONAL', description: 'Municipal cooling center, 250 capacity (demo facility).', metadata: { capacity: 250, occupancyPercent: 61, backupPower: true } },
  { id: 'asset_drain_07', assetCode: 'DRAIN-07', name: 'East Basin Drain D07', type: 'DRAIN', zoneId: 'zone_eb', latitude: 13.0641, longitude: 80.2781, criticality: 'HIGH', vulnerability: 88, operationalStatus: 'COMPROMISED', description: 'Storm drain protecting arterial R24 and hospital access (demo asset).', metadata: { waterProximityM: 0 } },
  { id: 'asset_rd_24', assetCode: 'RD-24', name: 'East Basin Arterial Road R24', type: 'ROAD', zoneId: 'zone_eb', latitude: 13.0631, longitude: 80.2747, criticality: 'HIGH', vulnerability: 71, operationalStatus: 'DEGRADED', description: 'Primary ambulance corridor to St. Jude Gate B (demo road).', metadata: { lanes: 4 } },
  { id: 'asset_rd_31', assetCode: 'RD-31', name: 'Harbor Expressway', type: 'ROAD', zoneId: 'zone_nh', latitude: 13.0845, longitude: 80.2907, criticality: 'MEDIUM', vulnerability: 52, operationalStatus: 'AT_RISK', description: 'Six-lane expressway feeding the causeway (demo road).', metadata: { lanes: 6 } },
  { id: 'asset_rd_18', assetCode: 'RD-18', name: 'Harbor Service Road', type: 'ROAD', zoneId: 'zone_nh', latitude: 13.0827, longitude: 80.2855, criticality: 'LOW', vulnerability: 40, operationalStatus: 'OPERATIONAL', description: 'Two-lane service road used as causeway detour (demo road).', metadata: { lanes: 2, evacuationCorridor: true } },
  { id: 'asset_gate_b', assetCode: 'GATE-B', name: 'St. Jude Ambulance Gate B', type: 'AMBULANCE_GATE', zoneId: 'zone_mt', latitude: 13.0466, longitude: 80.2463, criticality: 'HIGH', vulnerability: 60, operationalStatus: 'DEGRADED', description: 'Primary emergency entrance of St. Jude (demo asset).', metadata: { ambulanceThroughputPerHour: 18 } },
  { id: 'asset_fs_07', assetCode: 'FS-07', name: 'Harbor Fire Station 7', type: 'FIRE_STATION', zoneId: 'zone_nh', latitude: 13.0862, longitude: 80.2866, criticality: 'HIGH', vulnerability: 30, operationalStatus: 'OPERATIONAL', description: 'Six-bay fire station covering the harbor (demo facility).', metadata: { bayCount: 6 } },
  { id: 'asset_gen_11', assetCode: 'GEN-11', name: 'Municipal Backup Generator G-11', type: 'GENERATOR', zoneId: 'zone_mt', latitude: 13.045, longitude: 80.244, criticality: 'HIGH', vulnerability: 42, operationalStatus: 'OPERATIONAL', description: 'Backup generation for the medical corridor (demo asset).', metadata: { fuelHours: 36, backupPower: true } },
  { id: 'asset_wtp_01', assetCode: 'WTP-01', name: 'East Basin Water Treatment Plant', type: 'WATER_TREATMENT', zoneId: 'zone_eb', latitude: 13.0672, longitude: 80.2813, criticality: 'CRITICAL', vulnerability: 55, operationalStatus: 'OPERATIONAL', description: 'Water treatment for the eastern districts (demo facility).', metadata: { waterReservePercent: 74, backupPower: true } },
  { id: 'asset_sub_12', assetCode: 'SUB-12', name: 'Harbor Substation #12', type: 'SUBSTATION', zoneId: 'zone_nh', latitude: 13.0854, longitude: 80.2849, criticality: 'HIGH', vulnerability: 48, operationalStatus: 'OPERATIONAL', description: 'Harbor grid feeder (demo facility).', metadata: { failoverPower: true, waterProximityM: 600 } },
  { id: 'asset_pump_02', assetCode: 'PUMP-02', name: 'Riverside Pumping Station #2', type: 'PUMPING_STATION', zoneId: 'zone_rc', latitude: 13.0338, longitude: 80.2637, criticality: 'MEDIUM', vulnerability: 46, operationalStatus: 'OPERATIONAL', description: 'Riverside stormwater pumping (demo facility).', metadata: { capacity: 1100 } },
  { id: 'asset_hosp_02', assetCode: 'HOSP-02', name: 'Riverside Community Clinic', type: 'HOSPITAL', zoneId: 'zone_rc', latitude: 13.0305, longitude: 80.2605, criticality: 'MEDIUM', vulnerability: 38, operationalStatus: 'OPERATIONAL', description: 'Community clinic, 60 beds (demo facility).', metadata: { beds: 60, bedOccupancyPercent: 41, backupPower: true } },
  { id: 'asset_shel_03', assetCode: 'SHEL-03', name: 'East Basin Shelter #3', type: 'EVACUATION_SHELTER', zoneId: 'zone_eb', latitude: 13.0653, longitude: 80.2724, criticality: 'MEDIUM', vulnerability: 32, operationalStatus: 'OPERATIONAL', description: '400-person shelter (demo facility).', metadata: { capacity: 400, occupancyPercent: 12, evacuationStatus: 'OPEN' } },
  { id: 'asset_cool_07', assetCode: 'COOL-07', name: 'North Harbor Cooling Center', type: 'COOLING_CENTER', zoneId: 'zone_nh', latitude: 13.0818, longitude: 80.2873, criticality: 'MEDIUM', vulnerability: 26, operationalStatus: 'OPERATIONAL', description: 'Harbor cooling center, 180 capacity (demo facility).', metadata: { capacity: 180, occupancyPercent: 22 } },
  { id: 'asset_ktm_hosp', assetCode: 'HOSP-KTM', name: 'Tribhuvan Medical Emergency Center', type: 'HOSPITAL', zoneId: 'zone_ktm', latitude: 27.6966, longitude: 85.3591, criticality: 'CRITICAL', vulnerability: 72, operationalStatus: 'OPERATIONAL', description: 'Central emergency hospital in Kathmandu Valley.', metadata: { beds: 500, occupancyPercent: 88, evacuationStatus: 'OPEN' } },
  { id: 'asset_ktm_shelter', assetCode: 'SHEL-KTM', name: 'Pashupati High-Ground Relief Center', type: 'EVACUATION_SHELTER', zoneId: 'zone_ktm', latitude: 27.7080, longitude: 85.3400, criticality: 'HIGH', vulnerability: 20, operationalStatus: 'OPERATIONAL', description: 'Safe elevated relief shelter above Bagmati flood basin.', metadata: { capacity: 1200, occupancyPercent: 45, evacuationStatus: 'OPEN' } },
  { id: 'asset_ktm_bridge', assetCode: 'BRG-KTM', name: 'Bagmati River Main Crossing Bridge', type: 'BRIDGE', zoneId: 'zone_ktm', latitude: 27.6830, longitude: 85.3080, criticality: 'CRITICAL', vulnerability: 90, operationalStatus: 'COMPROMISED', description: 'Primary bridge submerged by Bagmati river flash flood.', metadata: { waterDepthM: 2.1 } },
];

// ---------------- ACTIVE HAZARDS (5) ----------------

export interface HazardSeed {
  id: string; type: string; severity: string; zoneId: string;
  rainfallRate?: number; waterDepth?: number; flowVelocity?: number;
  temperature?: number; windSpeed?: number; durationMinutes?: number;
  source: string; startedAt: Date; status: string;
}

export const hazards: HazardSeed[] = [
  {
    id: 'hz_ff_eb', type: 'FLASH_FLOOD', severity: 'CRITICAL', zoneId: 'zone_eb',
    rainfallRate: 65, waterDepth: 1.4, flowVelocity: 1.9, durationMinutes: 240,
    source: 'SENSOR', startedAt: hoursAgo(2), status: 'ACTIVE',
  },
  {
    id: 'hz_ktm_flood', type: 'FLASH_FLOOD', severity: 'CRITICAL', zoneId: 'zone_ktm',
    rainfallRate: 88, waterDepth: 2.1, flowVelocity: 2.4, durationMinutes: 360,
    source: 'SENSOR', startedAt: hoursAgo(1), status: 'ACTIVE',
  },
  {
    id: 'hz_flood_nh', type: 'FLOOD', severity: 'HIGH', zoneId: 'zone_nh',
    rainfallRate: 42, waterDepth: 0.8, flowVelocity: 1.1, durationMinutes: 300,
    source: 'WEATHER_API', startedAt: hoursAgo(3), status: 'ACTIVE',
  },
  {
    id: 'hz_heat_mt', type: 'EXTREME_HEAT', severity: 'HIGH', zoneId: 'zone_mt',
    temperature: 41.2, durationMinutes: 480,
    source: 'WEATHER_API', startedAt: hoursAgo(5), status: 'ACTIVE',
  },
  {
    id: 'hz_storm_rc', type: 'STORM', severity: 'MODERATE', zoneId: 'zone_rc',
    windSpeed: 62, rainfallRate: 18, durationMinutes: 150,
    source: 'WEATHER_API', startedAt: hoursAgo(4), status: 'ACTIVE',
  },
];

// ---------------- DEPENDENCY EDGES (15) ----------------
// The cascade graph lives HERE (in PostgreSQL), never in frontend code.

export interface EdgeSeed {
  sourceAssetId: string; targetAssetId: string; dependencyType: string;
  strength: number; description: string;
}

export const dependencyEdges: EdgeSeed[] = [
  { sourceAssetId: 'asset_drain_07', targetAssetId: 'asset_rd_24', dependencyType: 'DRAINS_INTO', strength: 0.9, description: 'D07 evacuates stormwater from the R24 corridor; failure inundates the road.' },
  { sourceAssetId: 'asset_rd_24', targetAssetId: 'asset_gate_b', dependencyType: 'PROVIDES_ACCESS_TO', strength: 0.85, description: 'R24 is the primary ambulance corridor to Gate B.' },
  { sourceAssetId: 'asset_gate_b', targetAssetId: 'asset_hosp_01', dependencyType: 'SERVED_BY', strength: 0.9, description: 'Gate B is the primary emergency entrance of St. Jude.' },
  { sourceAssetId: 'asset_sub_09', targetAssetId: 'asset_hosp_01', dependencyType: 'POWERED_BY', strength: 0.95, description: 'Primary feeder for St. Jude Regional Medical Center.' },
  { sourceAssetId: 'asset_sub_09', targetAssetId: 'asset_pump_04', dependencyType: 'POWERED_BY', strength: 0.8, description: 'Primary feeder for East Basin Pumping Station #4.' },
  { sourceAssetId: 'asset_pump_04', targetAssetId: 'asset_drain_07', dependencyType: 'SUPPORTS', strength: 0.75, description: 'P-04 evacuates the D07 catchment.' },
  { sourceAssetId: 'asset_gen_11', targetAssetId: 'asset_hosp_01', dependencyType: 'POWERED_BY', strength: 0.6, description: 'Backup generator for the medical center.' },
  { sourceAssetId: 'asset_wtp_01', targetAssetId: 'asset_hosp_01', dependencyType: 'SUPPLIES_WATER_TO', strength: 0.7, description: 'Process water supply for hospital operations.' },
  { sourceAssetId: 'asset_sub_12', targetAssetId: 'asset_fs_07', dependencyType: 'POWERED_BY', strength: 0.8, description: 'Feeder for Harbor Fire Station 7.' },
  { sourceAssetId: 'asset_rd_31', targetAssetId: 'asset_brg_02', dependencyType: 'PROVIDES_ACCESS_TO', strength: 0.7, description: 'Expressway feeds the causeway.' },
  { sourceAssetId: 'asset_brg_02', targetAssetId: 'asset_shel_12', dependencyType: 'PROVIDES_ACCESS_TO', strength: 0.65, description: 'Causeway is the shelter evacuation route.' },
  { sourceAssetId: 'asset_sub_09', targetAssetId: 'asset_cool_03', dependencyType: 'POWERED_BY', strength: 0.5, description: 'Cooling center feeder.' },
  { sourceAssetId: 'asset_sub_12', targetAssetId: 'asset_cool_07', dependencyType: 'POWERED_BY', strength: 0.5, description: 'Harbor cooling center feeder.' },
  { sourceAssetId: 'asset_wtp_01', targetAssetId: 'asset_pump_02', dependencyType: 'SUPPLIES_WATER_TO', strength: 0.4, description: 'Process water for Riverside pumping.' },
  { sourceAssetId: 'asset_sub_09', targetAssetId: 'asset_gate_b', dependencyType: 'POWERED_BY', strength: 0.4, description: 'Gate lighting and signals feeder.' },
];

// ---------------- RESPONSE UNITS (12) ----------------

export interface UnitSeed {
  id: string; name: string; callsign: string; type: string; departmentId: string;
  status: string; latitude: number; longitude: number; teamSize: number;
  capacity?: number; specialization?: string; etaMinutes?: number;
}

export const units: UnitSeed[] = [
  { id: 'unit_pump_1', name: 'Drain Crew Alpha', callsign: 'PW-DRAIN-A1', type: 'PUMP_CREW', departmentId: 'dept_pw', status: 'AVAILABLE', latitude: 13.0581, longitude: 80.2702, teamSize: 5, capacity: 2, specialization: 'Storm drain clearing', etaMinutes: 12 },
  { id: 'unit_pump_2', name: 'Pump Crew Bravo', callsign: 'PW-PUMP-B2', type: 'PUMP_CREW', departmentId: 'dept_pw', status: 'AVAILABLE', latitude: 13.0665, longitude: 80.2821, teamSize: 4, capacity: 1, specialization: 'Pump station restart', etaMinutes: 18 },
  { id: 'unit_barrier_1', name: 'Barrier Crew One', callsign: 'PW-BAR-1', type: 'BARRIER_CREW', departmentId: 'dept_pw', status: 'ON_SCENE', latitude: 13.0466, longitude: 80.2463, teamSize: 6, capacity: 3, specialization: 'Flood barrier deployment', etaMinutes: 8 },
  { id: 'unit_heavy_1', name: 'Heavy Equipment Unit 1', callsign: 'PW-HVY-1', type: 'HEAVY_EQUIPMENT', departmentId: 'dept_pw', status: 'ON_SCENE', latitude: 13.0845, longitude: 80.2907, teamSize: 3, capacity: 1, specialization: 'Debris and clearance', etaMinutes: 20 },
  { id: 'unit_pump_9', name: 'Pump Crew Nine', callsign: 'PW-PUMP-9', type: 'PUMP_CREW', departmentId: 'dept_pw', status: 'OFFLINE', latitude: 13.0555, longitude: 80.2688, teamSize: 4, capacity: 1, specialization: 'Pump station maintenance', etaMinutes: 45 },
  { id: 'unit_fire_3', name: 'Fire Engine 3', callsign: 'FR-E3', type: 'FIRE_RESCUE', departmentId: 'dept_fire', status: 'AVAILABLE', latitude: 13.0862, longitude: 80.2866, teamSize: 6, capacity: 2, specialization: 'Water rescue', etaMinutes: 9 },
  { id: 'unit_rescue_5', name: 'Rescue Squad 5', callsign: 'FR-R5', type: 'FIRE_RESCUE', departmentId: 'dept_fire', status: 'AVAILABLE', latitude: 13.0839, longitude: 80.2851, teamSize: 4, capacity: 1, specialization: 'Swiftwater rescue', etaMinutes: 14 },
  { id: 'unit_ems_12', name: 'Ambulance 12', callsign: 'EMS-A12', type: 'EMS', departmentId: 'dept_ems', status: 'AVAILABLE', latitude: 13.0498, longitude: 80.2488, teamSize: 3, capacity: 2, specialization: 'Advanced life support', etaMinutes: 7 },
  { id: 'unit_ems_15', name: 'Ambulance 15', callsign: 'EMS-A15', type: 'EMS', departmentId: 'dept_ems', status: 'AVAILABLE', latitude: 13.0819, longitude: 80.2879, teamSize: 3, capacity: 2, specialization: 'Patient evacuation', etaMinutes: 11 },
  { id: 'unit_police_7', name: 'Patrol 7', callsign: 'PD-P7', type: 'POLICE', departmentId: 'dept_police', status: 'AVAILABLE', latitude: 13.0637, longitude: 80.2752, teamSize: 2, capacity: 4, specialization: 'Perimeter and traffic control', etaMinutes: 6 },
  { id: 'unit_grid_2', name: 'Grid Crew 2', callsign: 'UTL-G2', type: 'UTILITY', departmentId: 'dept_util', status: 'EN_ROUTE', latitude: 13.0441, longitude: 80.2424, teamSize: 5, capacity: 1, specialization: 'Transformer repair', etaMinutes: 16 },
  { id: 'unit_command_1', name: 'EOC Mutual Aid 1', callsign: 'EM-MA1', type: 'MUTUAL_AID', departmentId: 'dept_em', status: 'AVAILABLE', latitude: 13.0402, longitude: 80.2511, teamSize: 8, capacity: 6, specialization: 'Command & logistics', etaMinutes: 25 },
];

// ---------------- INCIDENTS (12) ----------------

export interface IncidentSeed {
  id: string; incidentCode: string; title: string; description: string;
  type: string; severity: string; status: string; zoneId: string;
  hazardId?: string; primaryAssetId?: string; reportedAt: Date;
  acknowledgedAt?: Date; resolvedAt?: Date; slaDeadline: Date; createdById?: string;
}

export const incidents: IncidentSeed[] = [
  {
    id: 'inc_204', incidentCode: 'INC-204', title: 'Flash Inundation - East Basin Arterial Network',
    description: 'Intense rainfall (65 mm/hr synthetic) has overwhelmed Drain D07; water is accumulating on arterial R24 toward the Midtown medical corridor.',
    type: 'FLOODING', severity: 'CRITICAL', status: 'NEW', zoneId: 'zone_eb',
    hazardId: 'hz_ff_eb', primaryAssetId: 'asset_drain_07',
    reportedAt: minutesAgo(40), slaDeadline: minutesAgo(40 - 120), createdById: 'user_gov',
  },
  {
    id: 'inc_203', incidentCode: 'INC-203', title: 'Substation #09 Transformer Thermal Overload',
    description: 'Thermal load 87% (synthetic telemetry) under the ongoing heat event; failover to G-11 prepared.',
    type: 'POWER_FAILURE', severity: 'CRITICAL', status: 'ACKNOWLEDGED', zoneId: 'zone_mt',
    hazardId: 'hz_heat_mt', primaryAssetId: 'asset_sub_09',
    reportedAt: hoursAgo(3), acknowledgedAt: hoursAgo(2.6), slaDeadline: hoursAgo(3 - 4), createdById: 'user_gov',
  },
  {
    id: 'inc_202', incidentCode: 'INC-202', title: 'Hospital Gate B Access Degradation',
    description: 'Approach lane degradation slowing ambulance throughput at St. Jude Gate B.',
    type: 'MEDICAL_ACCESS', severity: 'HIGH', status: 'IN_PROGRESS', zoneId: 'zone_mt',
    primaryAssetId: 'asset_gate_b',
    reportedAt: hoursAgo(3.4), acknowledgedAt: hoursAgo(3.1), slaDeadline: hoursAgo(3.4 - 4), createdById: 'user_gov',
  },
  {
    id: 'inc_197', incidentCode: 'INC-197', title: 'Harbor Expressway Lane Submersion',
    description: 'Coastal flood water across lanes 2-3 of RD-31; causeway access at risk.',
    type: 'ROAD_BLOCKAGE', severity: 'HIGH', status: 'IN_PROGRESS', zoneId: 'zone_nh',
    hazardId: 'hz_flood_nh', primaryAssetId: 'asset_rd_31',
    reportedAt: hoursAgo(2.3), acknowledgedAt: hoursAgo(2.2), slaDeadline: hoursAgo(2.3 - 4), createdById: 'user_dispatch',
  },
  {
    id: 'inc_201', incidentCode: 'INC-201', title: 'Causeway Bridge Deck Vibration Alert',
    description: 'Structural monitoring flags elevated vibration under storm loading.',
    type: 'INFRASTRUCTURE_FAILURE', severity: 'MODERATE', status: 'NEW', zoneId: 'zone_nh',
    hazardId: 'hz_flood_nh', primaryAssetId: 'asset_brg_02',
    reportedAt: hoursAgo(1.4), slaDeadline: hoursAgo(1.4 - 8), createdById: 'user_gov',
  },
  {
    id: 'inc_200', incidentCode: 'INC-200', title: 'Shelter #12 Capacity Surge',
    description: 'Evacuation intake rising faster than projected (synthetic occupancy trend).',
    type: 'EVACUATION', severity: 'MODERATE', status: 'ACKNOWLEDGED', zoneId: 'zone_nh',
    primaryAssetId: 'asset_shel_12',
    reportedAt: hoursAgo(6.2), acknowledgedAt: hoursAgo(5.9), slaDeadline: hoursAgo(6.2 - 8), createdById: 'user_gov',
  },
  {
    id: 'inc_199', incidentCode: 'INC-199', title: 'Cooling Center COOL-03 HVAC Load',
    description: 'HVAC at 61% occupancy under the heat advisory; monitor backup power.',
    type: 'HEAT_EMERGENCY', severity: 'LOW', status: 'NEW', zoneId: 'zone_mt',
    hazardId: 'hz_heat_mt', primaryAssetId: 'asset_cool_03',
    reportedAt: hoursAgo(1.1), slaDeadline: hoursAgo(1.1 - 24), createdById: 'user_gov',
  },
  {
    id: 'inc_198', incidentCode: 'INC-198', title: 'Riverside Pumping Station #2 Sensor Fault',
    description: 'Water-level sensor intermittently reporting stale values.',
    type: 'DRAINAGE_FAILURE', severity: 'MODERATE', status: 'NEW', zoneId: 'zone_rc',
    hazardId: 'hz_storm_rc', primaryAssetId: 'asset_pump_02',
    reportedAt: hoursAgo(2.8), slaDeadline: hoursAgo(2.8 - 8), createdById: 'user_dispatch',
  },
  {
    id: 'inc_196', incidentCode: 'INC-196', title: 'Heat Advisory - Outdoor Crew Suspension',
    description: 'Field rotations suspended during peak heat hours.',
    type: 'HEAT_EMERGENCY', severity: 'LOW', status: 'RESOLVED', zoneId: 'zone_mt',
    hazardId: 'hz_heat_mt',
    reportedAt: hoursAgo(26), acknowledgedAt: hoursAgo(25.7), resolvedAt: hoursAgo(21), slaDeadline: hoursAgo(26 - 24), createdById: 'user_gov',
  },
  {
    id: 'inc_195', incidentCode: 'INC-195', title: 'WTP-01 Intake Turbidity Spike',
    description: 'Turbidity above threshold after storm runoff; treatment adjusted.',
    type: 'INFRASTRUCTURE_FAILURE', severity: 'HIGH', status: 'RESOLVED', zoneId: 'zone_eb',
    hazardId: 'hz_ff_eb', primaryAssetId: 'asset_wtp_01',
    reportedAt: hoursAgo(28), acknowledgedAt: hoursAgo(27.8), resolvedAt: hoursAgo(22), slaDeadline: hoursAgo(28 - 4), createdById: 'user_gov',
  },
  {
    id: 'inc_194', incidentCode: 'INC-194', title: 'Drain D07 Debris Blockage',
    description: 'Recurring debris blockage cleared by pump crew.',
    type: 'DRAINAGE_FAILURE', severity: 'MODERATE', status: 'CLOSED', zoneId: 'zone_eb',
    primaryAssetId: 'asset_drain_07',
    reportedAt: hoursAgo(50), acknowledgedAt: hoursAgo(49.6), resolvedAt: hoursAgo(47), slaDeadline: hoursAgo(50 - 8), createdById: 'user_gov',
  },
  {
    id: 'inc_193', incidentCode: 'INC-193', title: 'Cooling Center Overflow - Midtown',
    description: 'Cooling center COOL-03 exceeded comfortable capacity during last heat peak.',
    type: 'HEAT_EMERGENCY', severity: 'MODERATE', status: 'RESOLVED', zoneId: 'zone_mt',
    hazardId: 'hz_heat_mt', primaryAssetId: 'asset_cool_03',
    reportedAt: hoursAgo(52), acknowledgedAt: hoursAgo(51.8), resolvedAt: hoursAgo(49), slaDeadline: hoursAgo(52 - 8), createdById: 'user_gov',
  },
];

// ---------------- SEEDED TASKS (4, with full lifecycle history) ----------------

export interface TaskSeed {
  id: string; taskCode: string; title: string; description: string;
  incidentId: string; assetId?: string; assignedUnitId: string; assignedDepartmentId: string;
  createdById: string; status: string; priority: string; slaDeadline: Date;
  createdAt: Date; acknowledgedAt?: Date; startedAt?: Date; completedAt?: Date; verifiedAt?: Date;
}

export const tasks: TaskSeed[] = [
  {
    id: 'task_001', taskCode: 'TASK-001', title: 'Respond to INC-202: Hospital Gate B Access Degradation',
    description: 'Deploy flood barriers to restore ambulance throughput at Gate B.',
    incidentId: 'inc_202', assetId: 'asset_gate_b', assignedUnitId: 'unit_barrier_1', assignedDepartmentId: 'dept_pw',
    createdById: 'user_gov', status: 'IN_PROGRESS', priority: 'HIGH', slaDeadline: hoursAgo(3.4 - 4),
    createdAt: hoursAgo(3), acknowledgedAt: hoursAgo(2.83), startedAt: hoursAgo(2.58),
  },
  {
    id: 'task_002', taskCode: 'TASK-002', title: 'Respond to INC-197: Harbor Expressway Lane Submersion',
    description: 'Clear debris and pump lanes 2-3 of RD-31.',
    incidentId: 'inc_197', assetId: 'asset_rd_31', assignedUnitId: 'unit_heavy_1', assignedDepartmentId: 'dept_pw',
    createdById: 'user_dispatch', status: 'IN_PROGRESS', priority: 'HIGH', slaDeadline: hoursAgo(2.3 - 4),
    createdAt: hoursAgo(2.2), acknowledgedAt: hoursAgo(2.1), startedAt: hoursAgo(1.9),
  },
  {
    id: 'task_003', taskCode: 'TASK-003', title: 'Respond to INC-203: Substation #09 Transformer Thermal Overload',
    description: 'Inspect transformer, verify cooling and prepare failover to G-11.',
    incidentId: 'inc_203', assetId: 'asset_sub_09', assignedUnitId: 'unit_grid_2', assignedDepartmentId: 'dept_util',
    createdById: 'user_gov', status: 'ACKNOWLEDGED', priority: 'CRITICAL', slaDeadline: hoursAgo(3 - 4),
    createdAt: hoursAgo(2.8), acknowledgedAt: hoursAgo(2.6),
  },
  {
    id: 'task_004', taskCode: 'TASK-004', title: 'Respond to INC-200: Shelter #12 Capacity Surge',
    description: 'EMS support for evacuation intake at Shelter #12.',
    incidentId: 'inc_200', assetId: 'asset_shel_12', assignedUnitId: 'unit_ems_15', assignedDepartmentId: 'dept_ems',
    createdById: 'user_gov', status: 'COMPLETED', priority: 'MEDIUM', slaDeadline: hoursAgo(6.2 - 8),
    createdAt: hoursAgo(6), acknowledgedAt: hoursAgo(5.8), startedAt: hoursAgo(5.5), completedAt: hoursAgo(4.6), verifiedAt: hoursAgo(4.2),
  },
];

export interface TaskHistorySeed {
  taskId: string; fromStatus: string | null; toStatus: string;
  changedById: string; note: string; createdAt: Date;
}

export const taskHistory: TaskHistorySeed[] = [
  { taskId: 'task_001', fromStatus: null, toStatus: 'ASSIGNED', changedById: 'user_gov', note: 'Dispatched PW-BAR-1 to INC-202', createdAt: hoursAgo(3) },
  { taskId: 'task_001', fromStatus: 'ASSIGNED', toStatus: 'ACKNOWLEDGED', changedById: 'user_field', note: 'Crew acknowledged en route', createdAt: hoursAgo(2.83) },
  { taskId: 'task_001', fromStatus: 'ACKNOWLEDGED', toStatus: 'IN_PROGRESS', changedById: 'user_field', note: 'Barrier deployment started at Gate B', createdAt: hoursAgo(2.58) },
  { taskId: 'task_002', fromStatus: null, toStatus: 'ASSIGNED', changedById: 'user_dispatch', note: 'Dispatched PW-HVY-1 to INC-197', createdAt: hoursAgo(2.2) },
  { taskId: 'task_002', fromStatus: 'ASSIGNED', toStatus: 'ACKNOWLEDGED', changedById: 'user_field', note: 'Acknowledged', createdAt: hoursAgo(2.1) },
  { taskId: 'task_002', fromStatus: 'ACKNOWLEDGED', toStatus: 'IN_PROGRESS', changedById: 'user_field', note: 'Lane clearance in progress', createdAt: hoursAgo(1.9) },
  { taskId: 'task_003', fromStatus: null, toStatus: 'ASSIGNED', changedById: 'user_gov', note: 'Dispatched UTL-G2 to INC-203', createdAt: hoursAgo(2.8) },
  { taskId: 'task_003', fromStatus: 'ASSIGNED', toStatus: 'ACKNOWLEDGED', changedById: 'user_field', note: 'Grid crew rolling to Substation #09', createdAt: hoursAgo(2.6) },
  { taskId: 'task_004', fromStatus: null, toStatus: 'ASSIGNED', changedById: 'user_gov', note: 'Dispatched EMS-A15 to INC-200', createdAt: hoursAgo(6) },
  { taskId: 'task_004', fromStatus: 'ASSIGNED', toStatus: 'ACKNOWLEDGED', changedById: 'user_field', note: 'Acknowledged', createdAt: hoursAgo(5.8) },
  { taskId: 'task_004', fromStatus: 'ACKNOWLEDGED', toStatus: 'IN_PROGRESS', changedById: 'user_field', note: 'Shelter intake support started', createdAt: hoursAgo(5.5) },
  { taskId: 'task_004', fromStatus: 'IN_PROGRESS', toStatus: 'COMPLETED', changedById: 'user_field', note: 'Intake stabilized at 34% capacity', createdAt: hoursAgo(4.6) },
];

// ---------------- TELEMETRY READINGS (28) ----------------

export interface TelemetrySeed {
  assetId: string; metric: string; value: number; unit: string;
  source: string; timestamp: Date;
}

export const telemetryReadings: TelemetrySeed[] = [
  { assetId: 'asset_drain_07', metric: 'water_depth', value: 1.42, unit: 'm', source: 'SENSOR', timestamp: minutesAgo(10) },
  { assetId: 'asset_drain_07', metric: 'rainfall', value: 66, unit: 'mm/hr', source: 'SENSOR', timestamp: minutesAgo(10) },
  { assetId: 'asset_drain_07', metric: 'water_depth', value: 1.21, unit: 'm', source: 'SENSOR', timestamp: hoursAgo(1.2) },
  { assetId: 'asset_pump_04', metric: 'pump_runtime', value: 18.4, unit: 'h', source: 'SENSOR', timestamp: minutesAgo(15) },
  { assetId: 'asset_pump_04', metric: 'power_load', value: 91, unit: '%', source: 'SENSOR', timestamp: minutesAgo(15) },
  { assetId: 'asset_pump_04', metric: 'water_depth', value: 1.1, unit: 'm', source: 'SENSOR', timestamp: minutesAgo(15) },
  { assetId: 'asset_sub_09', metric: 'power_load', value: 87, unit: '%', source: 'SENSOR', timestamp: minutesAgo(12) },
  { assetId: 'asset_sub_09', metric: 'thermal_load', value: 0.74, unit: 'index', source: 'SENSOR', timestamp: minutesAgo(12) },
  { assetId: 'asset_sub_09', metric: 'power_load', value: 83, unit: '%', source: 'SENSOR', timestamp: hoursAgo(2.1) },
  { assetId: 'asset_hosp_01', metric: 'occupancy', value: 82, unit: '%', source: 'SENSOR', timestamp: minutesAgo(20) },
  { assetId: 'asset_hosp_01', metric: 'thermal_load', value: 0.31, unit: 'index', source: 'SENSOR', timestamp: minutesAgo(20) },
  { assetId: 'asset_hosp_01', metric: 'water_reserve', value: 68, unit: '%', source: 'SENSOR', timestamp: minutesAgo(25) },
  { assetId: 'asset_rd_24', metric: 'water_depth', value: 0.35, unit: 'm', source: 'SENSOR', timestamp: minutesAgo(18) },
  { assetId: 'asset_gate_b', metric: 'water_depth', value: 0.12, unit: 'm', source: 'SENSOR', timestamp: minutesAgo(18) },
  { assetId: 'asset_brg_02', metric: 'wind_speed', value: 62, unit: 'km/h', source: 'WEATHER_API', timestamp: minutesAgo(30) },
  { assetId: 'asset_brg_02', metric: 'water_depth', value: 0.4, unit: 'm', source: 'SENSOR', timestamp: minutesAgo(30) },
  { assetId: 'asset_shel_12', metric: 'occupancy', value: 34, unit: '%', source: 'SENSOR', timestamp: minutesAgo(35) },
  { assetId: 'asset_cool_03', metric: 'temperature', value: 24, unit: '°C', source: 'SENSOR', timestamp: minutesAgo(22) },
  { assetId: 'asset_cool_03', metric: 'occupancy', value: 61, unit: '%', source: 'SENSOR', timestamp: minutesAgo(22) },
  { assetId: 'asset_wtp_01', metric: 'water_reserve', value: 74, unit: '%', source: 'SENSOR', timestamp: minutesAgo(28) },
  { assetId: 'asset_sub_12', metric: 'power_load', value: 54, unit: '%', source: 'SENSOR', timestamp: minutesAgo(26) },
  { assetId: 'asset_rd_31', metric: 'water_depth', value: 0.22, unit: 'm', source: 'SENSOR', timestamp: minutesAgo(16) },
  { assetId: 'asset_gen_11', metric: 'power_load', value: 12, unit: '%', source: 'SENSOR', timestamp: minutesAgo(40) },
  { assetId: 'asset_cool_07', metric: 'temperature', value: 22.5, unit: '°C', source: 'SENSOR', timestamp: minutesAgo(33) },
  { assetId: 'asset_pump_02', metric: 'pump_runtime', value: 6.2, unit: 'h', source: 'SENSOR', timestamp: minutesAgo(24) },
  { assetId: 'asset_hosp_02', metric: 'occupancy', value: 41, unit: '%', source: 'SENSOR', timestamp: minutesAgo(30) },
  { assetId: 'asset_shel_03', metric: 'occupancy', value: 12, unit: '%', source: 'SENSOR', timestamp: minutesAgo(38) },
  { assetId: 'asset_fs_07', metric: 'power_load', value: 38, unit: '%', source: 'SENSOR', timestamp: minutesAgo(29) },
];

// ---------------- HISTORICAL EVENTS (13, all SYNTHETIC_DEMO) ----------------

export interface HistoricalSeed {
  assetId?: string; zoneId: string; hazardType: string; severity: string;
  occurredAt: Date; resolvedAt?: Date; outcome: string;
}

export const historicalEvents: HistoricalSeed[] = [
  { assetId: 'asset_drain_07', zoneId: 'zone_eb', hazardType: 'FLASH_FLOOD', severity: 'HIGH', occurredAt: daysAgo(270), resolvedAt: daysAgo(270 - 0.25), outcome: 'D07 overtopped; arterial flooding for 4 hours (synthetic record).' },
  { assetId: 'asset_rd_24', zoneId: 'zone_eb', hazardType: 'FLASH_FLOOD', severity: 'CRITICAL', occurredAt: daysAgo(640), resolvedAt: daysAgo(640 - 0.3), outcome: 'R24 submerged 0.6m; hospital access delayed (synthetic record).' },
  { zoneId: 'zone_eb', hazardType: 'FLOOD', severity: 'MODERATE', occurredAt: daysAgo(990), resolvedAt: daysAgo(990 - 0.2), outcome: 'East Basin collector overflow (synthetic record).' },
  { assetId: 'asset_brg_02', zoneId: 'zone_nh', hazardType: 'FLOOD', severity: 'HIGH', occurredAt: daysAgo(450), resolvedAt: daysAgo(450 - 0.5), outcome: 'Causeway deck splash; single-lane closure (synthetic record).' },
  { zoneId: 'zone_nh', hazardType: 'STORM', severity: 'MODERATE', occurredAt: daysAgo(820), resolvedAt: daysAgo(820 - 0.4), outcome: 'Waterfront wind damage (synthetic record).' },
  { zoneId: 'zone_mt', hazardType: 'EXTREME_HEAT', severity: 'HIGH', occurredAt: daysAgo(240), resolvedAt: daysAgo(240 - 1), outcome: 'Grid peak load; rolling brownout risk (synthetic record).' },
  { assetId: 'asset_cool_03', zoneId: 'zone_mt', hazardType: 'EXTREME_HEAT', severity: 'MODERATE', occurredAt: daysAgo(610), resolvedAt: daysAgo(610 - 0.6), outcome: 'Cooling center overcapacity (synthetic record).' },
  { assetId: 'asset_sub_09', zoneId: 'zone_mt', hazardType: 'POWER_FAILURE', severity: 'HIGH', occurredAt: daysAgo(430), resolvedAt: daysAgo(430 - 0.12), outcome: 'Transformer fault; hospital on backup power 90 minutes (synthetic record).' },
  { zoneId: 'zone_rc', hazardType: 'FLOOD', severity: 'HIGH', occurredAt: daysAgo(330), resolvedAt: daysAgo(330 - 0.7), outcome: 'Riverside lowland inundation (synthetic record).' },
  { assetId: 'asset_pump_02', zoneId: 'zone_rc', hazardType: 'DRAINAGE_OVERFLOW', severity: 'MODERATE', occurredAt: daysAgo(700), resolvedAt: daysAgo(700 - 0.3), outcome: 'Pump sensor fault delayed response (synthetic record).' },
  { zoneId: 'zone_nh', hazardType: 'FLOOD', severity: 'CRITICAL', occurredAt: daysAgo(1180), resolvedAt: daysAgo(1180 - 1.2), outcome: 'Harbor surge drill record (synthetic).' },
  { zoneId: 'zone_eb', hazardType: 'EXTREME_HEAT', severity: 'MODERATE', occurredAt: daysAgo(545), resolvedAt: daysAgo(545 - 0.8), outcome: 'Heat stress on outdoor crews (synthetic record).' },
  { zoneId: 'zone_rc', hazardType: 'FLOOD', severity: 'MODERATE', occurredAt: daysAgo(1050), resolvedAt: daysAgo(1050 - 0.5), outcome: 'Minor lowland flooding (synthetic record).' },
];

// ---------------- HOTSPOTS (6) ----------------

export interface HotspotSeed {
  zoneId: string; name: string; latitude: number; longitude: number;
  hazardType: string; eventCount: number; severityScore: number; recurrenceScore: number;
  lastOccurredAt: Date; description: string;
}

export const hotspots: HotspotSeed[] = [
  { zoneId: 'zone_eb', name: 'East Basin Flood Corridor', latitude: 13.0635, longitude: 80.2765, hazardType: 'FLASH_FLOOD', eventCount: 9, severityScore: 88, recurrenceScore: 0.86, lastOccurredAt: daysAgo(270), description: 'Recurring flash-flood corridor around Drain D07 / arterial R24 (synthetic).' },
  { zoneId: 'zone_nh', name: 'North Harbor Waterfront', latitude: 13.0868, longitude: 80.2925, hazardType: 'FLOOD', eventCount: 7, severityScore: 76, recurrenceScore: 0.72, lastOccurredAt: daysAgo(450), description: 'Coastal surge exposure along the causeway (synthetic).' },
  { zoneId: 'zone_mt', name: 'Midtown Power Corridor', latitude: 13.0436, longitude: 80.2422, hazardType: 'POWER_FAILURE', eventCount: 5, severityScore: 71, recurrenceScore: 0.58, lastOccurredAt: daysAgo(430), description: 'Substation #09 thermal overload recurrence (synthetic).' },
  { zoneId: 'zone_mt', name: 'Midtown Medical District', latitude: 13.0478, longitude: 80.2482, hazardType: 'EXTREME_HEAT', eventCount: 4, severityScore: 62, recurrenceScore: 0.47, lastOccurredAt: daysAgo(240), description: 'Heat-driven demand around the medical campus (synthetic).' },
  { zoneId: 'zone_rc', name: 'Riverside Lowlands', latitude: 13.0318, longitude: 80.2632, hazardType: 'FLOOD', eventCount: 6, severityScore: 74, recurrenceScore: 0.68, lastOccurredAt: daysAgo(330), description: 'Riverine flooding in low-lying blocks (synthetic).' },
  { zoneId: 'zone_eb', name: 'East Basin Drainage Network', latitude: 13.0612, longitude: 80.2792, hazardType: 'DRAINAGE_OVERFLOW', eventCount: 5, severityScore: 69, recurrenceScore: 0.61, lastOccurredAt: daysAgo(640), description: 'Drain/pump system overflow cluster (synthetic).' },
];

// ---------------- NOTIFICATIONS (2) ----------------

export interface NotificationSeed {
  userId: string; type: string; title: string; message: string; severity: string;
}

export const notifications: NotificationSeed[] = [
  {
    userId: 'user_gov', type: 'INCIDENT_ALERT', severity: 'CRITICAL',
    title: 'INC-204 CRITICAL - Flash Inundation East Basin',
    message: 'East Basin arterial network flash flooding; Drain D07 compromised. SLA 2 hours (synthetic demo alert).',
  },
  {
    userId: 'user_gov', type: 'HAZARD_ADVISORY', severity: 'HIGH',
    title: 'Extreme heat advisory - Midtown',
    message: 'Peak synthetic temperature 41.2°C; cooling centers open and monitored.',
  },
];
