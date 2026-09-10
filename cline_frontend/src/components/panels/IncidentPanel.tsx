import { ArrowDown, Bot, Clock } from 'lucide-react';
import type {
  Asset,
  CascadeEvent,
  Hazard,
  ResponseAction,
  RiskScore,
} from '../../types/domain';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { statusActionLabel, statusLabel } from '../../utils/responseTransitions';
import { riskColor } from '../../utils/riskColors';
import { formatTimestamp } from '../../utils/format';

interface IncidentPanelProps {
  hazard: Hazard | null;
  selectedAsset: Asset | null;
  selectedRisk: RiskScore | null;
  cascade: CascadeEvent | null;
  assetMap: Record<string, Asset>;
  riskMap: Record<string, RiskScore>;
  explanation: string;
  explanationLoading: boolean;
  response: ResponseAction | null;
  simulationEscalated: boolean;
  onAssign: () => void;
  onAdvanceResponse: () => void;
  onSelectAsset: (assetId: string) => void;
}

const STATUS_STEPS = ['assigned', 'acknowledged', 'in_progress', 'completed'] as const;

const PANEL_CLASS =
  'flex h-[45%] w-full shrink-0 flex-col border-t border-cs-border bg-cs-panel lg:h-auto lg:w-[400px] lg:border-l lg:border-t-0';

function roleLabel(index: number, total: number): string {
  if (index === 0) return 'Failure origin';
  if (index === total - 1) return 'Critical service impact';
  return 'Propagation conduit';
}

export function IncidentPanel({
  hazard,
  selectedAsset,
  selectedRisk,
  cascade,
  assetMap,
  riskMap,
  explanation,
  explanationLoading,
  response,
  simulationEscalated,
  onAssign,
  onAdvanceResponse,
  onSelectAsset,
}: IncidentPanelProps) {
  const showCascade = Boolean(cascade && simulationEscalated);
  const nextActionLabel = response ? statusActionLabel(response.status) : null;

  if (!selectedAsset) {
    const priorityAssets = Object.values(assetMap)
      .map((asset) => ({ asset, risk: riskMap[asset.id] }))
      .filter((entry): entry is { asset: Asset; risk: RiskScore } => Boolean(entry.risk))
      .sort((a, b) => b.risk.score - a.risk.score)
      .slice(0, 5);

    return (
      <aside className={PANEL_CLASS} aria-label="Incident panel">
        <div className="flex-1 overflow-y-auto">
          <div className="border-b border-cs-border px-5 py-4">
            <span className="text-[10px] font-medium uppercase tracking-widest text-cs-textDim">
              Situation Overview
            </span>
            <h2 className="mt-1 text-lg font-semibold text-cs-text">
              {hazard?.label ?? 'Monitoring'}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-cs-textDim">
              Select an infrastructure asset on the map to inspect its risk state, dependencies and
              cascade analysis.
            </p>
          </div>

          <div className="border-b border-cs-border px-5 py-4">
            <h3 className="mb-3 text-[10px] font-medium uppercase tracking-widest text-cs-textDim">
              Priority Assets
            </h3>
            <div className="space-y-1.5">
              {priorityAssets.map(({ asset, risk }) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => onSelectAsset(asset.id)}
                  className="flex w-full items-center justify-between rounded border border-cs-border bg-cs-panelAlt/60 px-3 py-2 text-left transition-colors hover:border-cs-primary/50 hover:bg-cs-panelAlt"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-cs-text">{asset.name}</span>
                    <span className="font-mono text-[10px] text-cs-textDim">{asset.id}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="font-mono text-xs" style={{ color: riskColor(risk.level) }}>
                      {risk.score}
                    </span>
                    <Badge level={risk.level} />
                  </span>
                </button>
              ))}
            </div>
          </div>

          {simulationEscalated && (
            <div className="px-5 py-4">
              <p className="text-xs text-cs-primary">
                Select Drain D07 to open the primary incident cascade.
              </p>
            </div>
          )}
        </div>
      </aside>
    );
  }

  const stepIndex = response
    ? STATUS_STEPS.indexOf(response.status as (typeof STATUS_STEPS)[number])
    : -1;

  return (
    <aside className={PANEL_CLASS} aria-label="Incident panel">
      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-cs-border px-5 py-4">
          <span className="text-[10px] font-medium uppercase tracking-widest text-cs-textDim">
            Incident
          </span>
          {showCascade && hazard ? (
            <>
              <h2 className="mt-1 text-lg font-semibold text-cs-text">{hazard.label}</h2>
              <div className="mt-2 flex items-center gap-2">
                <Badge level={selectedRisk?.level ?? 'critical'} />
                <span className="font-mono text-sm text-cs-text">
                  {selectedRisk?.score ?? hazard.severity}
                </span>
                <span className="text-[10px] uppercase text-cs-textDim">Computed</span>
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-1 text-lg font-semibold text-cs-text">{selectedAsset.name}</h2>
              <div className="mt-2 flex items-center gap-2">
                <Badge level={selectedRisk?.level ?? 'normal'} />
                {selectedRisk && (
                  <span className="font-mono text-sm text-cs-text">{selectedRisk.score}</span>
                )}
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-[10px] uppercase tracking-wider text-cs-textDim">
                <span>{selectedAsset.type.replace('_', ' ')}</span>
                <span aria-hidden="true">·</span>
                <span>Criticality: {selectedAsset.criticality}</span>
              </div>
            </>
          )}
        </div>

        {showCascade && cascade && (
          <section className="border-b border-cs-border px-5 py-4">
            <h3 className="mb-3 text-[10px] font-medium uppercase tracking-widest text-cs-textDim">
              Cascade
            </h3>
            <div className="space-y-1">
              {cascade.path.map((assetId, i) => {
                const asset = assetMap[assetId];
                const nodeRisk = riskMap[assetId];
                const isLast = i === cascade.path.length - 1;
                return (
                  <div key={assetId}>
                    {i > 0 && (
                      <div className="flex justify-center py-0.5">
                        <ArrowDown className="h-4 w-4 text-cs-critical" aria-hidden="true" />
                      </div>
                    )}
                    <div
                      className={`rounded border px-3 py-2 ${
                        i === 0
                          ? 'border-cs-critical/50 bg-cs-critical/10'
                          : isLast
                            ? 'border-cs-high/50 bg-cs-high/10'
                            : 'border-cs-border bg-cs-panelAlt'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium text-cs-text">{asset?.name ?? assetId}</div>
                        {nodeRisk && (
                          <span
                            className="font-mono text-xs font-semibold"
                            style={{ color: riskColor(nodeRisk.level) }}
                          >
                            {nodeRisk.score}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center justify-between">
                        <span className="font-mono text-[10px] text-cs-textDim">{assetId}</span>
                        <span className="text-[9px] uppercase tracking-wider text-cs-textDim">
                          {roleLabel(i, cascade.path.length)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {showCascade && cascade && (
          <section className="border-b border-cs-border px-5 py-4">
            <h3 className="mb-2 text-[10px] font-medium uppercase tracking-widest text-cs-textDim">
              Critical Impact
            </h3>
            <p className="text-sm font-semibold text-cs-critical">{cascade.criticalService}</p>
            <p className="mt-2 text-xs leading-relaxed text-cs-textDim">
              {cascade.impactDescription}
            </p>
            {cascade.alternativeRoute && (
              <p className="mt-2 text-xs text-cs-primary">
                Alternative route: {cascade.alternativeRoute}
              </p>
            )}
          </section>
        )}

        {showCascade && cascade && (
          <section className="border-b border-cs-border px-5 py-4">
            <h3 className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-cs-textDim">
              <Clock className="h-3 w-3" aria-hidden="true" /> ETA
            </h3>
            <p className="font-mono text-2xl font-semibold text-cs-critical">{cascade.etaMinutes} min</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-cs-textDim">
              Estimated time to service impact
            </p>
          </section>
        )}

        {showCascade && (
          <section className="border-b border-cs-border px-5 py-4">
            <h3 className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-cs-textDim">
              <Bot className="h-3 w-3" aria-hidden="true" /> AI-Assisted Situation Analysis
            </h3>
            {explanationLoading ? (
              <div className="animate-pulse space-y-2" role="status" aria-label="Generating analysis">
                <div className="h-3 rounded bg-cs-border" />
                <div className="h-3 w-4/5 rounded bg-cs-border" />
                <div className="h-3 w-3/5 rounded bg-cs-border" />
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-cs-textDim">{explanation}</p>
            )}
            <p className="mt-2 text-[9px] uppercase tracking-wider text-cs-muted">
              Grounded on computed cascade data
            </p>
          </section>
        )}

        {showCascade && cascade && (
          <section className="border-b border-cs-border px-5 py-4">
            <h3 className="mb-2 text-[10px] font-medium uppercase tracking-widest text-cs-textDim">
              Recommended Action
            </h3>
            <p className="text-sm font-medium text-cs-primary">{cascade.recommendedActions[0]?.label}</p>
            {cascade.recommendedActions[0] && (
              <p className="mt-1 text-[10px] uppercase tracking-wider text-cs-textDim">
                {cascade.recommendedActions[0].team} · Priority: {cascade.recommendedActions[0].priority}
              </p>
            )}
          </section>
        )}

        {!showCascade && selectedRisk && (
          <section className="border-b border-cs-border px-5 py-4">
            <h3 className="mb-2 text-[10px] font-medium uppercase tracking-widest text-cs-textDim">
              Risk Assessment
            </h3>
            <p className="font-mono text-xl font-semibold text-cs-text">{selectedRisk.score}/100</p>
            <p className="mt-2 text-xs text-cs-textDim">
              Confidence: {(selectedRisk.confidence * 100).toFixed(0)}%
            </p>
            <ul className="mt-2 space-y-1">
              {selectedRisk.evidence.map((e) => (
                <li key={e} className="text-xs text-cs-textDim">
                  • {e}
                </li>
              ))}
            </ul>
          </section>
        )}

        {showCascade && (
          <section className="px-5 py-4">
            <h3 className="mb-3 text-[10px] font-medium uppercase tracking-widest text-cs-textDim">
              Response
            </h3>

            {!response ? (
              <Button onClick={onAssign} className="w-full">
                {cascade?.recommendedActions[0]
                  ? `Assign ${cascade.recommendedActions[0].team}`
                  : 'Assign Response Team'}
              </Button>
            ) : (
              <>
                <div className="mb-4 flex items-center gap-1" aria-hidden="true">
                  {STATUS_STEPS.map((step, i) => {
                    const currentIndex = STATUS_STEPS.indexOf(step);
                    const isActive = currentIndex <= stepIndex;
                    return (
                      <div key={step} className="flex flex-1 items-center">
                        <div
                          className={`h-1.5 flex-1 rounded-full ${
                            isActive ? 'bg-cs-primary' : 'bg-cs-border'
                          }`}
                        />
                        {i < STATUS_STEPS.length - 1 && <div className="w-1" />}
                      </div>
                    );
                  })}
                </div>
                <div className="mb-3 flex items-center justify-between" aria-live="polite">
                  <span className="text-xs text-cs-textDim">Status</span>
                  <span
                    className={`text-xs font-medium ${
                      response.status === 'completed' ? 'text-cs-low' : 'text-cs-primary'
                    }`}
                  >
                    {statusLabel(response.status)}
                  </span>
                </div>
                {response.status !== 'completed' && nextActionLabel && (
                  <Button onClick={onAdvanceResponse} className="w-full">
                    {nextActionLabel}
                  </Button>
                )}
                <div className="mt-3 space-y-1 font-mono text-[10px] text-cs-textDim">
                  {response.createdAt && <div>CREATED · {formatTimestamp(response.createdAt)}</div>}
                  {response.acknowledgedAt && (
                    <div>ACKNOWLEDGED · {formatTimestamp(response.acknowledgedAt)}</div>
                  )}
                  {response.completedAt && <div>COMPLETED · {formatTimestamp(response.completedAt)}</div>}
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </aside>
  );
}
