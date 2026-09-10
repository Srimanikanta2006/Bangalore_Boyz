import type {
  Asset,
  CascadeEvent,
  DashboardSummary,
  GraphEdge,
  Hazard,
  ResponseAction,
  RiskScore,
  SimulationPhase,
} from '../types/domain';
import {
  createAssignedResponse,
  getMockDashboardSummary,
  getMockHazard,
  getMockRiskScores,
  MOCK_ASSETS,
  MOCK_CASCADE,
  MOCK_GRAPH_EDGES,
} from '../data/mockData';
import { canTransition } from '../utils/responseTransitions';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let simulationPhase: SimulationPhase = 'baseline';
let currentResponse: ResponseAction | null = null;

export function getSimulationPhase(): SimulationPhase {
  return simulationPhase;
}

export async function getActiveHazard(): Promise<Hazard> {
  await delay(150);
  return getMockHazard(simulationPhase);
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  await delay(100);
  const summary = getMockDashboardSummary(simulationPhase);
  return {
    ...summary,
    activeResponses: currentResponse && currentResponse.status !== 'completed' ? 1 : 0,
  };
}

export async function getAssets(): Promise<Asset[]> {
  await delay(120);
  return MOCK_ASSETS;
}

export async function getAssetById(id: string): Promise<Asset | null> {
  await delay(80);
  return MOCK_ASSETS.find((a) => a.id === id) ?? null;
}

export async function getGraphEdges(): Promise<GraphEdge[]> {
  await delay(80);
  return MOCK_GRAPH_EDGES;
}

export async function getRiskScores(): Promise<RiskScore[]> {
  await delay(100);
  return getMockRiskScores(simulationPhase);
}

export async function getAssetRisk(assetId: string): Promise<RiskScore | null> {
  await delay(80);
  const scores = getMockRiskScores(simulationPhase);
  return scores.find((s) => s.assetId === assetId) ?? null;
}

export async function getCascade(assetId: string): Promise<CascadeEvent | null> {
  await delay(120);
  if (simulationPhase !== 'escalated') return null;
  // The cascade is returned for any asset on the propagation path
  // (D07, R24, HOSP-A) so the incident workflow is reachable from each node.
  return MOCK_CASCADE.path.includes(assetId) ? MOCK_CASCADE : null;
}

export async function getActiveResponse(): Promise<ResponseAction | null> {
  await delay(80);
  return currentResponse;
}

export async function createResponseAction(cascadeEventId: string): Promise<ResponseAction> {
  await delay(200);
  if (currentResponse) return currentResponse;
  currentResponse = createAssignedResponse();
  currentResponse.cascadeEventId = cascadeEventId;
  return currentResponse;
}

export async function updateResponseStatus(
  responseId: string,
  status: ResponseAction['status'],
): Promise<ResponseAction> {
  await delay(180);
  if (!currentResponse || currentResponse.id !== responseId) {
    throw new Error('Response not found');
  }
  if (!canTransition(currentResponse.status, status)) {
    throw new Error(`Invalid response transition: ${currentResponse.status} -> ${status}`);
  }
  const now = new Date().toISOString();
  currentResponse = { ...currentResponse, status };
  if (status === 'acknowledged') currentResponse.acknowledgedAt = now;
  if (status === 'completed') currentResponse.completedAt = now;
  return currentResponse;
}

export async function simulateRainfallEscalation(): Promise<void> {
  await delay(300);
  simulationPhase = 'escalated';
}

export async function resetSimulation(): Promise<void> {
  await delay(200);
  simulationPhase = 'baseline';
  currentResponse = null;
}
