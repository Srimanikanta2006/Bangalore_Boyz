import { describe, expect, it } from 'vitest';
import { toExplainRequest, type IncidentCascadeFacts } from '../../src/ai/explainAdapter';
import { validateExplainRequest, validateExplainResponse } from '../../src/ai/validation';
import { buildFallbackExplanation } from '../../src/ai/fallback';
import { explainWithGeminiOrFallback } from '../../src/ai/geminiProvider';
import { isValidAction, isAllowedActionPriority } from '../../src/ai/actionCatalog';

/** Demo-shaped verified facts: Drain D07 -> Road R24 -> Hospital H01. */
function demoFacts(): IncidentCascadeFacts {
  return {
    incident: {
      id: 'inc_123',
      incidentCode: 'INC-2026-001',
      title: 'D07 drainage overflow threatening hospital access',
      severity: 'CRITICAL',
      status: 'NEW',
      zoneName: 'Zone C',
    },
    hazard: { type: 'FLOOD', severity: 'CRITICAL', rainfallRate: 72, temperature: 26 },
    rootAsset: { id: 'D07', assetCode: 'D07', name: 'Drain D07', type: 'DRAIN' },
    baseRisk: {
      score: 92,
      level: 'CRITICAL',
      confidence: 0.9,
      factors: [
        { name: 'Rainfall & flood intensity', contribution: 40 },
        { name: 'Asset vulnerability', contribution: 30 },
        { name: 'Asset criticality', contribution: 22 },
      ],
      explanation: 'CRITICAL FLOOD exposure on a HIGH-criticality asset produces a deterministic risk score of 92/100 (CRITICAL).',
    },
    nodes: [
      { assetId: 'D07', assetCode: 'D07', name: 'Drain D07', type: 'DRAIN', depth: 0, impactType: 'OVERWHELMED', impactScore: 92, explanation: 'root', dependencyType: null },
      { assetId: 'R24', assetCode: 'R24', name: 'Road R24', type: 'ROAD', depth: 1, impactType: 'INUNDATED', impactScore: 80, explanation: 'D07 -> R24', dependencyType: 'DRAINS_TO' },
      { assetId: 'H01', assetCode: 'H01', name: 'Hospital H01', type: 'HOSPITAL', depth: 2, impactType: 'ACCESS_BLOCKED', impactScore: 70, explanation: 'R24 -> H01', dependencyType: 'ACCESS_VIA' },
    ],
  };
}

describe('explainAdapter (engine facts -> grounded ExplainRequest)', () => {
  it('produces a request that passes AI-layer validation', () => {
    const req = toExplainRequest(demoFacts());
    const result = validateExplainRequest(req);
    expect(result.success).toBe(true);
  });

  it('grounds every affected asset in a real cascade node (no invented assets)', () => {
    const req = toExplainRequest(demoFacts());
    expect(req.affectedAssets.map((a) => a.id).sort()).toEqual(['D07', 'H01', 'R24']);
    expect(req.affectedAssets.find((a) => a.id === 'H01')?.type).toBe('hospital');
  });

  it('never claims more confidence than the engine supplied', () => {
    const req = toExplainRequest(demoFacts());
    expect(req.risk.confidence).toBeLessThanOrEqual(0.9);
    expect(req.risk.score).toBe(92);
  });

  it('is deterministic aside from the freshness timestamp', () => {
    const a = toExplainRequest(demoFacts());
    const b = toExplainRequest(demoFacts());
    const strip = (r: ReturnType<typeof toExplainRequest>) => ({ ...r, dataFreshness: undefined });
    expect(strip(a)).toEqual(strip(b));
  });

  it('throws when there is nothing assessable to explain', () => {
    const empty = { ...demoFacts(), rootAsset: null, baseRisk: null, nodes: [] };
    expect(() => toExplainRequest(empty)).toThrow();
  });
});

describe('deterministic fallback', () => {
  it('produces a valid ExplainResponse with only controlled-catalog actions', () => {
    const req = toExplainRequest(demoFacts());
    const res = buildFallbackExplanation(req);
    const validated = validateExplainResponse(res);
    expect(validated.success).toBe(true);
    for (const action of res.recommendedActions) {
      expect(isValidAction(action.actionId)).toBe(true);
      expect(isAllowedActionPriority(action.actionId, action.priority)).toBe(true);
    }
  });

  it('preserves the incident id', () => {
    const req = toExplainRequest(demoFacts());
    expect(buildFallbackExplanation(req).incidentId).toBe('INC-2026-001');
  });
});

describe('geminiProvider', () => {
  it('falls back deterministically when no API key is configured', async () => {
    const req = toExplainRequest(demoFacts());
    const result = await explainWithGeminiOrFallback(req, { apiKey: '' });
    expect(result.usedFallback).toBe(true);
    expect(result.fallbackReason).toBe('missing_api_key');
    expect(result.response.incidentId).toBe('INC-2026-001');
  });

  it('falls back (not throws) when the provider errors', async () => {
    const req = toExplainRequest(demoFacts());
    const result = await explainWithGeminiOrFallback(req, {
      apiKey: 'test-key',
      fetchFn: (async () => {
        throw new Error('network down');
      }) as unknown as typeof fetch,
    });
    expect(result.usedFallback).toBe(true);
    expect(result.fallbackReason).toBe('provider_error');
    expect(validateExplainResponse(result.response).success).toBe(true);
  });
});
