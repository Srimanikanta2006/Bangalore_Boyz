import { API_MODE } from '../data/constants';
import type {
  Asset,
  CascadeEvent,
  DashboardSummary,
  GraphEdge,
  Hazard,
  ResponseAction,
  RiskScore,
} from '../types/domain';
import * as mockApi from './mockApi';

export type { ApiMode } from '../data/constants';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

/**
 * Service boundary: UI components only ever talk to this object.
 * MOCK mode uses in-memory mock services; BACKEND mode talks to the
 * future Node/Express + Prisma API with the same signatures.
 */
export const api = {
  mode: API_MODE,

  getActiveHazard(): Promise<Hazard> {
    if (API_MODE === 'MOCK') return mockApi.getActiveHazard();
    return fetchJson('/api/hazards/active');
  },

  getDashboardSummary(): Promise<DashboardSummary> {
    if (API_MODE === 'MOCK') return mockApi.getDashboardSummary();
    return fetchJson('/api/dashboard/summary');
  },

  getAssets(): Promise<Asset[]> {
    if (API_MODE === 'MOCK') return mockApi.getAssets();
    return fetchJson('/api/assets');
  },

  getAssetById(id: string): Promise<Asset | null> {
    if (API_MODE === 'MOCK') return mockApi.getAssetById(id);
    return fetchJson(`/api/assets/${id}`);
  },

  getGraphEdges(): Promise<GraphEdge[]> {
    if (API_MODE === 'MOCK') return mockApi.getGraphEdges();
    return fetchJson('/api/graph/edges');
  },

  getRiskScores(): Promise<RiskScore[]> {
    if (API_MODE === 'MOCK') return mockApi.getRiskScores();
    return fetchJson('/api/risk-scores');
  },

  getAssetRisk(assetId: string): Promise<RiskScore | null> {
    if (API_MODE === 'MOCK') return mockApi.getAssetRisk(assetId);
    return fetchJson(`/api/assets/${assetId}/risk`);
  },

  getCascade(assetId: string): Promise<CascadeEvent | null> {
    if (API_MODE === 'MOCK') return mockApi.getCascade(assetId);
    return fetchJson(`/api/cascades/${assetId}`);
  },

  getActiveResponse(): Promise<ResponseAction | null> {
    if (API_MODE === 'MOCK') return mockApi.getActiveResponse();
    return fetchJson('/api/responses');
  },

  createResponseAction(cascadeEventId: string): Promise<ResponseAction> {
    if (API_MODE === 'MOCK') return mockApi.createResponseAction(cascadeEventId);
    return fetchJson('/api/responses', {
      method: 'POST',
      body: JSON.stringify({ cascadeEventId }),
    });
  },

  updateResponseStatus(responseId: string, status: ResponseAction['status']): Promise<ResponseAction> {
    if (API_MODE === 'MOCK') return mockApi.updateResponseStatus(responseId, status);
    return fetchJson(`/api/responses/${responseId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  simulateRainfallEscalation(): Promise<void> {
    if (API_MODE === 'MOCK') return mockApi.simulateRainfallEscalation();
    return fetchJson('/api/simulation/escalate', { method: 'POST' }).then(() => undefined);
  },

  resetSimulation(): Promise<void> {
    if (API_MODE === 'MOCK') return mockApi.resetSimulation();
    return fetchJson('/api/simulation/reset', { method: 'POST' }).then(() => undefined);
  },
};
