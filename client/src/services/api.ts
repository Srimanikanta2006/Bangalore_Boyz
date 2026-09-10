import {
  Ward,
  Asset,
  WeatherReading,
  AssetRiskAssessment,
  Alert,
  SimulationScenario,
  CitySummaryStats,
} from '../types';

const API_BASE = '/api';

export async function fetchStats(): Promise<CitySummaryStats> {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchWards(): Promise<Ward[]> {
  const res = await fetch(`${API_BASE}/wards`);
  if (!res.ok) throw new Error('Failed to fetch wards');
  return res.json();
}

export async function fetchAssets(wardId?: string): Promise<Asset[]> {
  const url = wardId ? `${API_BASE}/assets?wardId=${wardId}` : `${API_BASE}/assets`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch assets');
  return res.json();
}

export async function createAsset(assetData: Omit<Asset, 'id'>): Promise<Asset> {
  const res = await fetch(`${API_BASE}/assets`, {
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

export async function fetchWeather(): Promise<{ reading: WeatherReading; activeScenarioId: string | null }> {
  const res = await fetch(`${API_BASE}/weather`);
  if (!res.ok) throw new Error('Failed to fetch weather');
  return res.json();
}

export async function refreshLiveWeather(): Promise<{ reading: WeatherReading }> {
  const res = await fetch(`${API_BASE}/weather/live`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to refresh live weather');
  return res.json();
}

export async function applyScenario(scenarioId: string): Promise<{ reading: WeatherReading }> {
  const res = await fetch(`${API_BASE}/weather/scenario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenarioId }),
  });
  if (!res.ok) throw new Error('Failed to apply scenario');
  return res.json();
}

export async function applyCustomWeather(overrides: Partial<WeatherReading>): Promise<{ reading: WeatherReading }> {
  const res = await fetch(`${API_BASE}/weather/custom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(overrides),
  });
  if (!res.ok) throw new Error('Failed to apply custom weather');
  return res.json();
}

export async function fetchScenarios(): Promise<SimulationScenario[]> {
  const res = await fetch(`${API_BASE}/scenarios`);
  if (!res.ok) throw new Error('Failed to fetch scenarios');
  return res.json();
}

export async function fetchRisks(): Promise<AssetRiskAssessment[]> {
  const res = await fetch(`${API_BASE}/risks`);
  if (!res.ok) throw new Error('Failed to fetch risks');
  return res.json();
}

export async function fetchAssetRisk(assetId: string): Promise<AssetRiskAssessment> {
  const res = await fetch(`${API_BASE}/risks/${assetId}`);
  if (!res.ok) throw new Error('Failed to fetch asset risk');
  return res.json();
}

export async function fetchAlerts(): Promise<Alert[]> {
  const res = await fetch(`${API_BASE}/alerts`);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export async function updateAlertStatus(
  alertId: string,
  status: Alert['status'],
  actorName: string,
  notes?: string
): Promise<{ alert: Alert }> {
  const res = await fetch(`${API_BASE}/alerts/${alertId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, actorName, notes }),
  });
  if (!res.ok) throw new Error('Failed to update alert status');
  return res.json();
}
