import { api } from '../lib/api';

/** Response types mirror cline_backend GET /api/citizen/nearby. */

export type Severity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type SafetyLevel = 'SAFE' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type CorridorStatus = 'CLEAR' | 'CAUTION' | 'BLOCKED';
export type DataQuality = 'LIVE_OBSERVED' | 'FORECAST' | 'MODELED' | 'ESTIMATED' | 'SYNTHETIC_DEMO' | 'UNKNOWN';

export interface CitizenWard {
  id: string;
  name: string;
  code: string;
  riskLevel: Severity;
  population: number;
  boundaryDataQuality: 'REAL_GEOGRAPHIC' | 'SYNTHETIC_DEMO';
}

export interface CitizenWeather {
  provider: string;
  dataQuality: DataQuality;
  observedAt: string | null;
  freshnessSeconds: number | null;
  condition: string | null;
  temperatureC: number | null;
  apparentTemperatureC: number | null;
  humidityPercent: number | null;
  rainfallMmPerHour: number | null;
  windSpeedKmh: number | null;
  windDirectionCardinal: string | null;
  isDay: boolean | null;
  modeledSeverity: Severity | null;
  rainArrivalMinutes: number | null;
}

export interface CitizenAirQuality {
  provider: string;
  dataQuality: DataQuality;
  observedAt: string | null;
  usAqi: number | null;
  category: string | null;
  pm2_5: number | null;
  pm10: number | null;
  ozone: number | null;
  nitrogenDioxide: number | null;
}

export interface CitizenHazard {
  id: string;
  type: string;
  severity: Severity;
  status: string;
  startedAt: string;
  freshnessMinutes: number | null;
  source: string;
  dataQuality: DataQuality;
  zoneName: string | null;
  latitude: number | null;
  longitude: number | null;
  rainfallRate: number | null;
  waterDepth: number | null;
  temperature: number | null;
  windSpeed: number | null;
}

export interface CitizenInfrastructure {
  id: string;
  name: string;
  type: string;
  operationalStatus: string;
  distanceKm: number;
  latitude: number;
  longitude: number;
  capacity: number | null;
  source: string;
  dataQuality: DataQuality;
}

export interface CitizenNearby {
  location: { latitude: number; longitude: number };
  radiusKm: number;
  generatedAt: string;
  ward: CitizenWard | null;
  weather: CitizenWeather;
  airQuality: CitizenAirQuality | null;
  safety: { level: SafetyLevel; score: number; riskCount: number };
  corridorStatus: CorridorStatus;
  hazards: CitizenHazard[];
  infrastructure: CitizenInfrastructure[];
  notes: string[];
}

export interface NearbyParams {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  limit?: number;
  signal?: AbortSignal;
}

export function fetchCitizenNearby(params: NearbyParams): Promise<CitizenNearby> {
  const q = new URLSearchParams({
    latitude: String(params.latitude),
    longitude: String(params.longitude),
    radiusKm: String(params.radiusKm ?? 5),
    limit: String(params.limit ?? 15),
  }).toString();
  return api.get<CitizenNearby>(`/citizen/nearby?${q}`, { signal: params.signal });
}

export type AlertCategory = 'FLOOD' | 'HEAT' | 'STORM' | 'WEATHER' | 'CORRIDOR';

export interface CitizenAlert {
  id: string;
  category: AlertCategory;
  severity: Severity;
  title: string;
  description: string;
  source: string;
  dataQuality: DataQuality;
  issuedAt: string;
  freshnessMinutes: number | null;
  tags: string[];
}

export interface CitizenAlerts {
  location: { latitude: number; longitude: number };
  radiusKm: number;
  generatedAt: string;
  ward: { id: string; name: string; code: string } | null;
  count: number;
  alerts: CitizenAlert[];
  note: string;
}

export function fetchCitizenAlerts(params: NearbyParams): Promise<CitizenAlerts> {
  const q = new URLSearchParams({
    latitude: String(params.latitude),
    longitude: String(params.longitude),
    radiusKm: String(params.radiusKm ?? 5),
  }).toString();
  return api.get<CitizenAlerts>(`/citizen/alerts?${q}`, { signal: params.signal });
}

export interface CitizenHazardRaw {
  id: string;
  type: string;
  severity: Severity;
  status: string;
  rainfallRate: number | null;
  waterDepth: number | null;
  flowVelocity: number | null;
  temperature: number | null;
  windSpeed: number | null;
  durationMinutes: number | null;
  startedAt: string;
  freshnessMinutes: number | null;
  source: string;
  dataQuality: DataQuality;
}

export interface CitizenHazardZone {
  id: string;
  name: string;
  code: string;
  riskLevel: Severity;
  population: number;
}

export interface CitizenImpactedAsset {
  assetId: string;
  assetCode: string;
  name: string;
  type: string;
  operationalStatus: string;
  impactType: string;
  impactScore: number;
}

export interface CitizenHazardDetail {
  hazard: CitizenHazardRaw;
  zone: CitizenHazardZone;
  risk: { score: number; level: string; factors: { name: string; contribution: number }[] };
  corridor: {
    name: string;
    impactedRoads: CitizenImpactedAsset[];
    impactedFacilities: CitizenImpactedAsset[];
  };
  nearestCriticalFacility: CitizenImpactedAsset | null;
  impact: { blockedRoads: number; affectedFacilities: number; residents: number };
  contributingFactors: string[];
  recommendedActions: string[];
  note: string;
}

export function fetchCitizenHazardDetail(id: string, signal?: AbortSignal): Promise<CitizenHazardDetail> {
  return api.get<CitizenHazardDetail>(`/citizen/hazards/${encodeURIComponent(id)}`, { signal });
}

export type CitizenReportCategory =
  | 'FLASH_FLOOD'
  | 'ROAD_BLOCKED'
  | 'DOWNED_LINE'
  | 'EXTREME_HEAT'
  | 'WATER_MAIN'
  | 'LANDSLIDE_MUD'
  | 'STORM_DAMAGE'
  | 'OTHER';

export interface CitizenReportEvidence {
  id: string;
  mediaType: string;
  url: string;
  byteSize: number | null;
  createdAt: string;
}

export interface CitizenReport {
  id: string;
  reportCode: string;
  category: CitizenReportCategory;
  description: string | null;
  latitude: number;
  longitude: number;
  reportedSeverity: Severity | null;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'DISMISSED' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
  evidence: CitizenReportEvidence[];
  incident: { id: string; incidentCode: string; status: string } | null;
}

export interface SubmitCitizenReportInput {
  category: CitizenReportCategory;
  description?: string;
  latitude: number;
  longitude: number;
  reportedSeverity?: Severity;
  files?: File[];
}

export function submitCitizenReport(input: SubmitCitizenReportInput): Promise<CitizenReport> {
  const form = new FormData();
  form.set('category', input.category);
  if (input.description) form.set('description', input.description);
  form.set('latitude', String(input.latitude));
  form.set('longitude', String(input.longitude));
  if (input.reportedSeverity) form.set('reportedSeverity', input.reportedSeverity);
  for (const file of input.files ?? []) form.append('evidence', file);
  return api.post<CitizenReport>('/citizen/reports', form);
}

export function fetchMyCitizenReports(): Promise<CitizenReport[]> {
  return api.get<CitizenReport[]>('/citizen/reports');
}

export type SosThreat = 'MEDICAL' | 'FIRE_RESCUE' | 'FLOOD_BOAT' | 'HAZARD_GAS';

export interface SosEvent {
  id: string;
  sosCode: string;
  latitude: number;
  longitude: number;
  primaryThreat: SosThreat;
  peopleAffected: number | null;
  note: string | null;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'DISPATCHED' | 'RESOLVED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  incident: { id: string; incidentCode: string; status: string } | null;
  disclaimer: string;
}

export interface SubmitSosInput {
  latitude: number;
  longitude: number;
  primaryThreat: SosThreat;
  peopleAffected?: number;
  note?: string;
  tags?: string[];
}

export function submitSos(input: SubmitSosInput): Promise<SosEvent> {
  return api.post<SosEvent>('/citizen/sos', input);
}

/** Own SOS history — GET /api/citizen/sos (ownership-scoped server-side). */
export function fetchMySosEvents(): Promise<SosEvent[]> {
  return api.get<SosEvent[]>('/citizen/sos');
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface CandidateRouteInput {
  label?: string;
  distanceMeters?: number;
  durationSeconds?: number;
  points: RoutePoint[];
}

export interface ScoredRoute {
  label: string;
  distanceMeters: number | null;
  durationSeconds: number | null;
  riskScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  hazardZonesHit: { zoneId: string; zoneName: string; severity: Severity }[];
  blockedRoadsHit: { assetId: string; name: string; operationalStatus: string }[];
  sampledPoints: number;
  explanation: string;
}

export interface ScoreRoutesResult {
  routes: ScoredRoute[];
  recommendedIndex: number;
}

export function scoreRoutes(routes: CandidateRouteInput[]): Promise<ScoreRoutesResult> {
  return api.post<ScoreRoutesResult>('/citizen/routes/score', { routes });
}
