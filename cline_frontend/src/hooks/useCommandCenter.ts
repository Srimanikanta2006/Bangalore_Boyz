import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  Asset,
  CascadeEvent,
  DashboardSummary,
  Hazard,
  ResponseAction,
  RiskScore,
  SimulationPhase,
} from '../types/domain';
import { api } from '../services/api';
import { generateExplanation } from '../services/explanationService';
import { nextStatus } from '../utils/responseTransitions';
import { SCENARIO_IDS } from '../data/constants';

interface CommandCenterState {
  loading: boolean;
  error: string | null;
  hazard: Hazard | null;
  summary: DashboardSummary | null;
  assets: Asset[];
  riskScores: RiskScore[];
  selectedAssetId: string | null;
  cascade: CascadeEvent | null;
  response: ResponseAction | null;
  explanation: string;
  explanationLoading: boolean;
  simulationPhase: SimulationPhase;
  simulating: boolean;
}

const INITIAL_STATE: CommandCenterState = {
  loading: true,
  error: null,
  hazard: null,
  summary: null,
  assets: [],
  riskScores: [],
  selectedAssetId: null,
  cascade: null,
  response: null,
  explanation: '',
  explanationLoading: false,
  simulationPhase: 'baseline',
  simulating: false,
};

/**
 * Single source of truth for command center state.
 * UI callbacks read the latest state via refs (no stale closures, no
 * duplicated fetches) and async selections are guarded by a token so
 * out-of-order responses can never overwrite a newer selection.
 */
export function useCommandCenter() {
  const [state, setState] = useState<CommandCenterState>(INITIAL_STATE);

  const stateRef = useRef(state);
  stateRef.current = state;

  const riskMap = useMemo(
    () => Object.fromEntries(state.riskScores.map((r) => [r.assetId, r])),
    [state.riskScores],
  );
  const assetMap = useMemo(
    () => Object.fromEntries(state.assets.map((a) => [a.id, a])),
    [state.assets],
  );
  const riskMapRef = useRef(riskMap);
  riskMapRef.current = riskMap;
  const assetMapRef = useRef(assetMap);
  assetMapRef.current = assetMap;

  const selectionToken = useRef(0);

  const loadData = useCallback(async () => {
    try {
      setState((s) => ({ ...s, loading: true, error: null }));
      const [hazard, summary, assets, riskScores, response] = await Promise.all([
        api.getActiveHazard(),
        api.getDashboardSummary(),
        api.getAssets(),
        api.getRiskScores(),
        api.getActiveResponse(),
      ]);
      setState((s) => ({
        ...s,
        loading: false,
        error: null,
        hazard,
        summary,
        assets,
        riskScores,
        response,
        simulationPhase: hazard.status === 'active' ? 'escalated' : 'baseline',
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load command center data',
      }));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectAsset = useCallback(async (assetId: string) => {
    const token = ++selectionToken.current;
    setState((s) => ({
      ...s,
      selectedAssetId: assetId,
      cascade: null,
      explanation: '',
      explanationLoading: true,
    }));

    try {
      const cascade = await api.getCascade(assetId);
      if (token !== selectionToken.current) return;
      setState((s) => ({ ...s, cascade }));

      const current = stateRef.current;
      if (cascade && current.hazard) {
        const explanation = await generateExplanation({
          hazard: current.hazard,
          cascade,
          riskScores: riskMapRef.current,
          assets: assetMapRef.current,
        });
        if (token !== selectionToken.current) return;
        setState((s) => ({ ...s, explanation, explanationLoading: false }));
      } else {
        setState((s) => ({ ...s, explanation: '', explanationLoading: false }));
      }
    } catch {
      if (token !== selectionToken.current) return;
      setState((s) => ({ ...s, explanation: '', explanationLoading: false }));
    }
  }, []);

  const simulateEscalation = useCallback(async () => {
    const current = stateRef.current;
    if (current.simulating || current.simulationPhase === 'escalated') return;
    setState((s) => ({ ...s, simulating: true, error: null }));
    try {
      await api.simulateRainfallEscalation();
      const [hazard, summary, riskScores, response] = await Promise.all([
        api.getActiveHazard(),
        api.getDashboardSummary(),
        api.getRiskScores(),
        api.getActiveResponse(),
      ]);
      setState((s) => ({
        ...s,
        hazard,
        summary,
        riskScores,
        response,
        simulationPhase: 'escalated',
        simulating: false,
      }));
      // Focus the primary incident so the cascade story is immediately visible.
      await selectAsset(SCENARIO_IDS.DRAIN_D07);
    } catch (err) {
      setState((s) => ({
        ...s,
        simulating: false,
        error: err instanceof Error ? err.message : 'Simulation failed',
      }));
    }
  }, [selectAsset]);

  const resetSimulation = useCallback(async () => {
    const current = stateRef.current;
    if (current.simulating) return;
    setState((s) => ({ ...s, simulating: true, error: null }));
    selectionToken.current += 1; // invalidate any in-flight selection loads
    setState((s) => ({
      ...s,
      selectedAssetId: null,
      cascade: null,
      response: null,
      explanation: '',
      explanationLoading: false,
    }));
    try {
      await api.resetSimulation();
      await loadData();
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : 'Reset failed',
      }));
    } finally {
      setState((s) => ({ ...s, simulating: false }));
    }
  }, [loadData]);

  const assignResponse = useCallback(async () => {
    const current = stateRef.current;
    if (!current.cascade || current.response) return;
    try {
      const response = await api.createResponseAction(current.cascade.id);
      const summary = await api.getDashboardSummary();
      setState((s) => ({ ...s, response, summary, error: null }));
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : 'Failed to assign response team',
      }));
    }
  }, []);

  const advanceResponse = useCallback(async () => {
    const current = stateRef.current;
    if (!current.response) return;
    const next = nextStatus(current.response.status);
    if (!next) return;
    try {
      const response = await api.updateResponseStatus(current.response.id, next);
      const summary = await api.getDashboardSummary();
      setState((s) => ({ ...s, response, summary, error: null }));
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : 'Failed to update response status',
      }));
    }
  }, []);

  const viewIncident = useCallback(() => {
    void selectAsset(SCENARIO_IDS.DRAIN_D07);
  }, [selectAsset]);

  return {
    ...state,
    riskMap,
    assetMap,
    loadData,
    selectAsset,
    simulateEscalation,
    resetSimulation,
    assignResponse,
    advanceResponse,
    viewIncident,
  };
}
