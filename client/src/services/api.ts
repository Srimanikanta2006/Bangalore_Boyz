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

function getApiBase(): string {
  const raw = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (!raw) return '/api';
  const clean = raw.replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
}

const API_BASE = getApiBase();

// JWT header hook: if localStorage has 'cs_token', attach it as a Bearer token
// to every outgoing request. No login UI this round.
function authHeaders(): Record<string, string> {
  const token =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('cs_auth_token') || localStorage.getItem('cs_token')
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Central transport wrapper. Merges caller headers with the auth header so the
// JWT (when present) is attached to every request. Endpoint shapes unchanged.
async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = {
    ...(init.headers as Record<string, string> | undefined),
    ...authHeaders(),
  };
  const res = await fetch(input, { ...init, headers });
  if (res.status === 401 && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cs:session_expired'));
  }
  return res;
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

// (a) Auth — POST /api/auth/login. Stores the JWT under 'cs_token' on success.
export interface LoginResult {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    departmentId?: string;
    departmentName?: string;
  };
  token: string;
  tokenType: string;
  expiresIn: string;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const data = await requestEnvelope<LoginResult>('/auth/login', jsonInit('POST', { email, password }));
  if (data?.token && typeof localStorage !== 'undefined') {
    localStorage.setItem('cs_auth_token', data.token);
    localStorage.setItem('cs_token', data.token);
  }
  return data;
}

// (b) Government dashboard — GET /api/government/overview.
export async function fetchGovernmentOverview(): Promise<any> {
  return requestEnvelope<any>('/government/overview');
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
