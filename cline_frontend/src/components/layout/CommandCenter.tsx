import { AlertCircle, Loader2 } from 'lucide-react';
import { useCommandCenter } from '../../hooks/useCommandCenter';
import { ActiveResponseBar } from '../response/ActiveResponseBar';
import { CommandMap } from '../map/CommandMap';
import { IncidentPanel } from '../panels/IncidentPanel';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { SimulationControls } from './SimulationControls';
import { SummaryStrip } from './SummaryStrip';
import { Button } from '../ui/Button';

export function CommandCenter() {
  const {
    loading,
    error,
    hazard,
    summary,
    assets,
    riskMap,
    assetMap,
    selectedAssetId,
    cascade,
    response,
    explanation,
    explanationLoading,
    simulationPhase,
    simulating,
    loadData,
    selectAsset,
    simulateEscalation,
    resetSimulation,
    assignResponse,
    advanceResponse,
    viewIncident,
  } = useCommandCenter();

  const selectedAsset = selectedAssetId ? assetMap[selectedAssetId] ?? null : null;
  const selectedRisk = selectedAssetId ? riskMap[selectedAssetId] ?? null : null;
  const escalated = simulationPhase === 'escalated';

  // Full-screen states only for the very first load / hard failure — refreshes
  // (e.g. after simulation reset) keep the command center mounted.
  if (loading && !hazard) {
    return (
      <div className="flex h-screen items-center justify-center bg-cs-bg">
        <div className="flex flex-col items-center gap-3" role="status">
          <Loader2 className="h-8 w-8 animate-spin text-cs-primary" aria-hidden="true" />
          <span className="text-sm text-cs-textDim">Loading command center…</span>
        </div>
      </div>
    );
  }

  if (error && !hazard) {
    return (
      <div className="flex h-screen items-center justify-center bg-cs-bg">
        <div className="rounded-lg border border-cs-critical/40 bg-cs-panel p-6 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-cs-critical" aria-hidden="true" />
          <p className="mb-4 text-sm text-cs-text">{error}</p>
          <Button onClick={loadData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-cs-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header hazard={hazard} simulationPhase={simulationPhase} />

        {error && hazard && (
          <div
            className="flex items-center justify-between gap-3 border-b border-cs-critical/40 bg-cs-critical/10 px-4 py-2 lg:px-6"
            role="alert"
          >
            <span className="flex items-center gap-2 text-xs text-cs-critical">
              <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {error}
            </span>
            <Button variant="danger" size="sm" onClick={loadData}>
              Retry
            </Button>
          </div>
        )}

        <SummaryStrip summary={summary} />

        <div className="relative flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="relative min-h-[340px] flex-1 lg:min-h-0">
            <SimulationControls
              phase={simulationPhase}
              simulating={simulating}
              onSimulate={simulateEscalation}
              onReset={resetSimulation}
            />
            <CommandMap
              assets={assets}
              riskMap={riskMap}
              selectedAssetId={selectedAssetId}
              cascade={cascade}
              simulationEscalated={escalated}
              onSelectAsset={selectAsset}
            />
          </div>
          <IncidentPanel
            hazard={hazard}
            selectedAsset={selectedAsset}
            selectedRisk={selectedRisk}
            cascade={cascade}
            assetMap={assetMap}
            riskMap={riskMap}
            explanation={explanation}
            explanationLoading={explanationLoading}
            response={response}
            simulationEscalated={escalated}
            onAssign={assignResponse}
            onAdvanceResponse={advanceResponse}
            onSelectAsset={selectAsset}
          />
        </div>

        <ActiveResponseBar
          response={response}
          assetMap={assetMap}
          onViewIncident={viewIncident}
        />
      </div>
    </div>
  );
}
