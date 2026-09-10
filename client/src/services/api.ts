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

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// JWT header hook: if localStorage has 'cs_token', attach it as a Bearer token
// to every outgoing request. No login UI this round.
function authHeaders(): Record<string, string> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('cs_token') : null;
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
