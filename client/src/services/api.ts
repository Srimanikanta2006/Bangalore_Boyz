import {
  Ward,
  Asset,
  WeatherReading,
  AssetRiskAssessment,
  Alert,
  Incident,
  ResponseTask,
  HistoricalRepeatLocation,
  SimulationScenario,
  CitySummaryStats,
  DataQualityStatus,
} from '../types';
import { getAuthToken } from '../lib/api';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// JWT header hook: attaches the SAME token the app's single auth system
// (lib/api.ts + AuthContext, populated by the real POST /api/auth/login) keeps
// in memory/localStorage. There is only one token store in the app - do not
// reintroduce a second one here.
function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Central transport wrapper. Merges caller headers with the auth header so the
// JWT (when present) is attached to every request. Endpoint shapes unchanged.
async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = {
    ...(init.headers as Record<string, string> | undefined),
    ...authHeaders(),
  };
  return fetch(input, { ...init, headers });
}

export async function fetchStats(): Promise<CitySummaryStats> {
  const res = await apiFetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchWards(): Promise<Ward[]> {
  const res = await apiFetch(`${API_BASE}/wards`);
  if (!res.ok) throw new Error('Failed to fetch wards');
  return res.json();
}

export async function fetchAssets(wardId?: string): Promise<Asset[]> {
  const url = wardId ? `${API_BASE}/assets?wardId=${wardId}` : `${API_BASE}/assets`;
  const res = await apiFetch(url);
  if (!res.ok) throw new Error('Failed to fetch assets');
  return res.json();
}

export async function createAsset(assetData: Omit<Asset, 'id'>): Promise<Asset> {
  const res = await apiFetch(`${API_BASE}/assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(assetData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create asset');
  }
  return res.json();
}

export async function fetchWeather(): Promise<{
  reading: WeatherReading;
  dataQuality: DataQualityStatus;
  activeScenarioId: string | null;
}> {
  const res = await apiFetch(`${API_BASE}/weather`);
  if (!res.ok) throw new Error('Failed to fetch weather');
  return res.json();
}

export async function refreshLiveWeather(): Promise<{ reading: WeatherReading }> {
  const res = await apiFetch(`${API_BASE}/weather/live`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to refresh live weather');
  return res.json();
}

export async function applyScenario(scenarioId: string): Promise<{ reading: WeatherReading }> {
  const res = await apiFetch(`${API_BASE}/weather/scenario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenarioId }),
  });
  if (!res.ok) throw new Error('Failed to apply scenario');
  return res.json();
}

export async function applyCustomWeather(overrides: Partial<WeatherReading>): Promise<{ reading: WeatherReading }> {
  const res = await apiFetch(`${API_BASE}/weather/custom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(overrides),
  });
  if (!res.ok) throw new Error('Failed to apply custom weather');
  return res.json();
}

export async function fetchScenarios(): Promise<SimulationScenario[]> {
  const res = await apiFetch(`${API_BASE}/scenarios`);
  if (!res.ok) throw new Error('Failed to fetch scenarios');
  return res.json();
}

export async function fetchRisks(): Promise<AssetRiskAssessment[]> {
  const res = await apiFetch(`${API_BASE}/risks`);
  if (!res.ok) throw new Error('Failed to fetch risks');
  return res.json();
}

export async function fetchAssetRisk(assetId: string): Promise<AssetRiskAssessment> {
  const res = await apiFetch(`${API_BASE}/risks/${assetId}`);
  if (!res.ok) throw new Error('Failed to fetch asset risk');
  return res.json();
}

export async function fetchAlerts(status?: Alert['status']): Promise<Alert[]> {
  const url = status ? `${API_BASE}/alerts?status=${status}` : `${API_BASE}/alerts`;
  const res = await apiFetch(url);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export async function updateAlertStatus(
  alertId: string,
  status: Alert['status'],
  actorName: string,
  notes?: string
): Promise<{ alert: Alert }> {
  const res = await apiFetch(`${API_BASE}/alerts/${alertId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, actorName, notes }),
  });
  if (!res.ok) throw new Error('Failed to update alert status');
  return res.json();
}

// Incidents
export async function fetchIncidents(status?: Incident['status']): Promise<Incident[]> {
  const url = status ? `${API_BASE}/incidents?status=${status}` : `${API_BASE}/incidents`;
  const res = await apiFetch(url);
  if (!res.ok) throw new Error('Failed to fetch incidents');
  return res.json();
}

export async function fetchIncidentById(id: string): Promise<Incident> {
  const res = await apiFetch(`${API_BASE}/incidents/${id}`);
  if (!res.ok) throw new Error('Failed to fetch incident');
  return res.json();
}

export async function createIncident(data: {
  assetId: string;
  hazardType: 'FLOOD' | 'HEAT' | 'COMPOUND';
  title: string;
  assignedTeam: string;
  leadResponder: string;
  notes?: string;
  taskTitles: string[];
}): Promise<{ message: string; incident: Incident }> {
  const res = await apiFetch(`${API_BASE}/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create response incident');
  }
  return res.json();
}

// Tasks
export async function fetchTasks(): Promise<ResponseTask[]> {
  const res = await apiFetch(`${API_BASE}/tasks`);
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

export async function updateTaskStatus(
  taskId: string,
  status: ResponseTask['status'],
  notes?: string
): Promise<{ task: ResponseTask; incident: Incident }> {
  const res = await apiFetch(`${API_BASE}/tasks/${taskId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, notes }),
  });
  if (!res.ok) throw new Error('Failed to update task status');
  return res.json();
}

export async function escalateTask(taskId: string, actor: string = 'Supervisor'): Promise<{ task: ResponseTask }> {
  const res = await apiFetch(`${API_BASE}/tasks/${taskId}/escalate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actor }),
  });
  if (!res.ok) throw new Error('Failed to escalate task');
  return res.json();
}

// History
export async function fetchHistory(): Promise<HistoricalRepeatLocation[]> {
  const res = await apiFetch(`${API_BASE}/history`);
  if (!res.ok) throw new Error('Failed to fetch historical repeat locations');
  return res.json();
}

// Data Quality
export async function fetchDataQuality(): Promise<DataQualityStatus> {
  const res = await apiFetch(`${API_BASE}/data-quality`);
  if (!res.ok) throw new Error('Failed to fetch data quality');
  return res.json();
}

export async function toggleStaleData(): Promise<{ isStale: boolean; quality: DataQualityStatus }> {
  const res = await apiFetch(`${API_BASE}/data-quality/toggle-stale`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to toggle stale simulation');
  return res.json();
}

// ===========================================================================
// cline_backend contract client (docs/API.md)
// ---------------------------------------------------------------------------
// The canonical backend (:4000) wraps every response in a success envelope:
//   success: { "success": true, "data": ... }
//   error:   { "success": false, "error": { "code", "message", "details" } }
// `requestEnvelope` unwraps `.data` and surfaces the backend error message.
// All requests reuse `apiFetch`, so the JWT ('cs_token') hook applies here too.
// ===========================================================================

async function requestEnvelope<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(`${API_BASE}${path}`, init);
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok || (body && body.success === false)) {
    const message =
      body?.error?.message || body?.error?.code || `Request failed (HTTP ${res.status})`;
    throw new Error(message);
  }
  // Unwrap the success envelope; tolerate a bare payload just in case.
  return (body && typeof body === 'object' && 'data' in body ? body.data : body) as T;
}

function jsonInit(method: string, payload?: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: payload !== undefined ? JSON.stringify(payload) : undefined,
  };
}

// NOTE: login lives in one place only - `auth/authService.ts` (via `useAuth().login()`
// in AuthContext), which is what LoginPage.tsx calls. Do not add a second login()
// here; it would create a second, unsynchronized token store (this was a real
// regression that has been fixed - see docs/MASTER_PLAN.md §7b).

// (b) Government dashboard — GET /api/government/overview.
export async function fetchGovernmentOverview(): Promise<any> {
  return requestEnvelope<any>('/government/overview');
}

/** Static, fully-cited historical reference (Cyclone Hudhud, 2014) — never live/computed. */
export interface HudhudCaseStudy {
  dataQuality: 'REAL_HISTORICAL_REFERENCE';
  event: { name: string; landfallDate: string; landfallLocation: string; peakWindSpeedKmh: [number, number]; stormSurgeMeters: number; peakRainfall24hMm: number; peakRainfallStation: string };
  impact: { totalDeaths: number; andhraPradeshDeaths: number; housesDamaged: number; croplandDamagedHectares: number; livestockLost: number; powerPolesDown: number; roadsAffectedKm: number; reliefCampEvacuees: number; airportClosureDays: number };
  response: { operationName: string; navyTeams: number; armyTeams: number; coastGuardShips: number; iafAircraft: number; ndrfTeams: number };
  citations: { label: string; url: string }[];
}
export async function fetchDisasterIntelligence(): Promise<{ hudhud2014: HudhudCaseStudy }> {
  return requestEnvelope<{ hudhud2014: HudhudCaseStudy }>('/analytics/disaster-intelligence');
}

export interface ActiveHazard {
  id: string; type: string; severity: string; status: string; zone: { id: string; name: string; code: string } | null;
}
export async function fetchActiveHazards(): Promise<{ items: ActiveHazard[] }> {
  return requestEnvelope<{ items: ActiveHazard[] }>('/hazards?activeOnly=true&limit=10');
}

/** Downloads a Hazard as a valid CAP 1.2 XML file (protocol-compatibility export, see
 *  cline_backend/src/services/capExport.service.ts). Uses fetch (not a plain <a href>)
 *  because auth is a Bearer header, not a cookie. */
/** Statistical (real linear regression) rainfall/risk trend forecast for a zone. */
export interface ZoneRiskForecast {
  dataQuality: 'FORECAST' | 'INSUFFICIENT_DATA';
  hoursAhead: number;
  sampleSize: number;
  currentRainfallMmPerHour: number | null;
  forecastedRainfallMmPerHour: number | null;
  trendDirection: 'INCREASING' | 'STABLE' | 'DECREASING' | null;
  method: string;
}
export async function fetchZoneRiskForecast(zoneId: string, hoursAhead = 6): Promise<ZoneRiskForecast> {
  return requestEnvelope<ZoneRiskForecast>(`/zones/${zoneId}/risk-forecast?hoursAhead=${hoursAhead}`);
}

export async function downloadHazardCapXml(hazardId: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/hazards/${hazardId}/cap.xml`);
  if (!res.ok) throw new Error(`Failed to export CAP XML (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `climateshield-cap-alert-${hazardId}.xml`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export interface LiveWeather {
  provider: string;
  dataQuality: 'LIVE_OBSERVED' | 'FORECAST';
  observedAt: string | null;
  fetchedAt: string;
  temperatureC: number | null;
  apparentTemperatureC: number | null;
  humidityPercent: number | null;
  precipitationMm: number | null;
  rainfallMmPerHour: number | null;
  windSpeedKmh: number | null;
  windDirectionCardinal: string | null;
  weatherCondition: string | null;
}

/**
 * Current provider observation. The backend owns the provider call and its
 * short cache; the browser never needs an external-weather API key.
 */
export async function fetchLiveWeather(latitude: number, longitude: number): Promise<LiveWeather> {
  const params = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude) });
  return requestEnvelope<LiveWeather>(`/weather/current?${params.toString()}`);
}

// Location overview — GET /api/location/overview?latitude=&longitude=&radiusKm=
// One coordinate -> live weather (Open-Meteo) + containing zone + nearby real
// infrastructure + weather-derived (MODELED) risk/severity. Everything is either
// LIVE_OBSERVED or explicitly MODELED; nothing synthetic is presented as live.
export type Severity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface LocationOverview {
  location: { latitude: number; longitude: number };
  radiusKm: number;
  weather: LiveWeather & {
    derivedAssessment: {
      dataQuality: 'MODELED';
      floodSeverity: Severity | null;
      heatSeverity: Severity | null;
      windSeverity: Severity | null;
      overallSeverity: Severity | null;
      explanation: string | null;
    };
    zone: { id: string; name: string; code: string; boundaryDataQuality: string } | null;
  };
  zone: { id: string; name: string; code: string } | null;
  nearbyAssets: Array<{
    id: string; assetCode: string; name: string; type: string;
    latitude: number; longitude: number; distanceKm: number;
    criticality: string; operationalStatus: string; source: string;
    dataQuality: string; zoneName: string;
  }>;
  hazards: Array<{ id: string; type: string; severity: Severity; status: string; dataQuality: string }>;
  risk: {
    dataQuality: 'MODELED';
    model: string;
    assets: Array<{ assetId: string; assetCode: string; name: string; type: string; distanceKm: number; risk: any }>;
  };
  cascade: any | null;
}

export async function fetchLocationOverview(
  latitude: number,
  longitude: number,
  radiusKm = 5
): Promise<LocationOverview> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    radiusKm: String(radiusKm),
  });
  return requestEnvelope<LocationOverview>(`/location/overview?${params.toString()}`);
}

// (c) Zone cascade — GET /api/zones/:zoneId/cascade (accepts zone id or code).
export async function fetchZoneCascade(zoneId: string): Promise<any> {
  return requestEnvelope<any>(`/zones/${encodeURIComponent(zoneId)}/cascade`);
}

// (d) AI explanation — POST /api/incidents/:id/explain.
// NOTE: this endpoint is NOT in docs/API.md. Shape verified against backend
// source (explain.service.ts): the AI fields the UI renders — situationSummary,
// causalChains, keyImpacts, recommendedActions, roleSpecificBriefings,
// confidence — live under `data.explanation` (not at the top level).
export async function explainIncident(incidentId: string): Promise<any> {
  return requestEnvelope<any>(`/incidents/${encodeURIComponent(incidentId)}/explain`, jsonInit('POST'));
}

// (e) Operator approval — POST /api/tasks (manual task creation; GOV role).
export interface CreateTaskPayload {
  title: string;
  incidentId?: string;
  assetId?: string;
  assignedUnitId?: string;
  assignedDepartmentId?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description?: string;
  slaDeadline?: string;
}

export async function createTask(payload: CreateTaskPayload): Promise<any> {
  return requestEnvelope<any>('/tasks', jsonInit('POST', payload));
}

// (f) Response Center — GET /api/response-center. Real, live-computed dispatch board.
export interface ResponseIncidentCard {
  id: string;
  incidentCode: string;
  title: string;
  description: string | null;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  status: string;
  type: string;
  zoneId: string;
  zoneName: string | null;
  assetName: string | null;
  reportedAt: string;
  slaDeadline: string | null;
  slaMinutesRemaining: number | null;
  assignedUnits: string[];
  taskCodes: string[];
}

export interface ResponseUnitCard {
  id: string;
  name: string;
  callsign: string;
  type: string;
  status: string;
  departmentId: string | null;
  departmentName: string | null;
  teamSize: number;
  etaMinutes: number | null;
  latitude: number | null;
  longitude: number | null;
  specialization: string | null;
}

export interface ResponseCenterData {
  summary: {
    activeIncidents: number;
    critical: number;
    high: number;
    moderate: number;
    unassignedIncidents: number;
    assignedUnits: number;
    readinessPercent: number;
    avgResponseMinutes: number | null;
    slaCompliancePercent: number | null;
    targetResolutionHours: Record<string, number>;
  };
  severityGroups: Record<'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW', ResponseIncidentCard[]>;
  activeIncidents: ResponseIncidentCard[];
  unassignedIncidents: ResponseIncidentCard[];
  availableUnits: ResponseUnitCard[];
  telemetry: {
    rainfallMmPerHour: number | null;
    maxWaterDepthM: number | null;
    maxTemperatureC: number | null;
    maxPumpRuntimeHours: number | null;
    maxPowerLoadPercent: number | null;
    updatedAt: string | null;
  };
  hotspots: Array<{ id: string; name: string; zoneName: string | null; eventCount: number; recurrenceScore: number }>;
}

export async function fetchResponseCenter(): Promise<ResponseCenterData> {
  return requestEnvelope<ResponseCenterData>('/response-center');
}

/** POST /api/incidents/:incidentId/dispatch { unitId } — real dispatch, transactional on the backend. */
export async function dispatchUnitToIncident(incidentId: string, unitId: string): Promise<any> {
  return requestEnvelope<any>(`/incidents/${encodeURIComponent(incidentId)}/dispatch`, jsonInit('POST', { unitId }));
}

// (g) Simulator — POST /api/simulations. Real deterministic scenario math (risk.service reused, no fake numbers).
export type ScenarioType = 'ATMOSPHERIC_RIVER' | 'FLASH_FLOOD' | 'EXTREME_HEAT' | 'STORM' | 'CUSTOM';

export interface CreateSimulationPayload {
  name?: string;
  scenarioType: ScenarioType;
  rainfallRate?: number;
  stormDuration?: number;
  drainageThroughput?: number;
  tidalSurge?: number;
  temperature?: number;
  zoneId?: string;
}

export interface SimulationResult {
  id: string;
  zoneId: string | null;
  zoneName: string | null;
  riskScore: number;
  riskLevel: string;
  affectedAssets: number;
  affectedRoads: number;
  estimatedPopulation: number;
  estimatedDamage: { totalUsd: number; residentialUsd: number; infrastructureUsd: number } | null;
  recommendedActions: string[];
}

export interface SimulationDto {
  id: string;
  name: string;
  scenarioType: string;
  status: string;
  parameters: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
  completedAt: string | null;
  results: SimulationResult[];
  summary: {
    worstZone: string | null;
    maxRiskScore: number;
    totalAffectedAssets: number;
    totalAffectedRoads: number;
    totalPopulationExposed: number;
    totalDamageUsd: number;
  };
}

export async function createSimulation(payload: CreateSimulationPayload): Promise<SimulationDto> {
  return requestEnvelope<SimulationDto>('/simulations', jsonInit('POST', payload));
}

// (h) Tasks — real Task/Incident/ResponseUnit data (Rescue + Government Mobile pages).
export type TaskStatusValue = 'ASSIGNED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface TaskDto {
  id: string;
  taskCode: string;
  title: string;
  description: string | null;
  status: TaskStatusValue;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  incident: { id: string; incidentCode: string; title: string; severity: string; status: string } | null;
  asset: { id: string; assetCode: string; name: string; type: string; operationalStatus: string } | null;
  assignedUnit: { id: string; callsign: string; name: string; type: string; status: string; departmentName: string | null } | null;
  assignedDepartment: { id: string; name: string } | null;
  createdByName: string | null;
  slaDeadline: string | null;
  slaMinutesRemaining: number | null;
  createdAt: string;
  acknowledgedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  verifiedAt: string | null;
}

export interface TaskHistoryEntry {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  createdAt: string;
  changedBy: { id: string; name: string; role: string } | null;
}

export async function fetchFieldTasks(query: { status?: TaskStatusValue; priority?: string; limit?: number } = {}): Promise<{ items: TaskDto[]; pagination: unknown }> {
  const params = new URLSearchParams();
  if (query.status) params.set('status', query.status);
  if (query.priority) params.set('priority', query.priority);
  params.set('limit', String(query.limit ?? 50));
  return requestEnvelope<{ items: TaskDto[]; pagination: unknown }>(`/tasks?${params.toString()}`);
}

export async function fetchTaskDetail(idOrCode: string): Promise<TaskDto & { history: TaskHistoryEntry[] }> {
  return requestEnvelope<TaskDto & { history: TaskHistoryEntry[] }>(`/tasks/${encodeURIComponent(idOrCode)}`);
}

export async function updateFieldTaskStatus(idOrCode: string, status: TaskStatusValue, note?: string): Promise<any> {
  return requestEnvelope<any>(`/tasks/${encodeURIComponent(idOrCode)}/status`, jsonInit('PATCH', { status, note }));
}

// (i) Incident cascade (reused by Rescue Hazard Detail — real risk/cascade for the mission's incident).
export async function fetchIncidentCascade(incidentId: string): Promise<any> {
  return requestEnvelope<any>(`/incidents/${encodeURIComponent(incidentId)}/cascade`);
}

// (j) Task verification — GOVERNMENT_ROLES only, real state-machine terminal step.
export async function verifyTask(idOrCode: string, note?: string): Promise<any> {
  return requestEnvelope<any>(`/tasks/${encodeURIComponent(idOrCode)}/verify`, jsonInit('POST', { note }));
}

// (k) Infrastructure assets — real vulnerability/criticality/telemetry/risk scoring (Critical Asset Monitor).
export interface InfrastructureAssetCard {
  id: string;
  assetCode: string;
  name: string;
  type: string;
  zone: { id: string; name: string; code: string } | null;
  latitude: number;
  longitude: number;
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  vulnerability: number;
  operationalStatus: 'OPERATIONAL' | 'DEGRADED' | 'AT_RISK' | 'COMPROMISED' | 'OFFLINE';
  description: string | null;
  failoverPower: boolean | null;
  backupPower: boolean | null;
  waterProximityM: number | null;
  evacuationStatus: string | null;
  beds: number | null;
  bedOccupancyPercent: number | null;
  capacity: number | null;
  occupancyPercent: number | null;
  telemetry: Record<string, { value: number; unit: string; timestamp: string }>;
  telemetryDelayMinutes: number | null;
  risk: { score: number; level: string };
  activeIncidents: number;
  activeTasks: number;
}

export async function fetchInfrastructureAssets(query: { limit?: number; facilityType?: string; status?: string } = {}): Promise<{ items: InfrastructureAssetCard[]; pagination: unknown }> {
  const params = new URLSearchParams();
  params.set('limit', String(query.limit ?? 100));
  if (query.facilityType) params.set('facilityType', query.facilityType);
  if (query.status) params.set('status', query.status);
  return requestEnvelope<{ items: InfrastructureAssetCard[]; pagination: unknown }>(`/infrastructure?${params.toString()}`);
}
