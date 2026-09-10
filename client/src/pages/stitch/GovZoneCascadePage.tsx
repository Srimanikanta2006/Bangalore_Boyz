import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GovHqLayout } from '../../components/stitch/GovHqLayout';
import { fetchZoneCascade, explainIncident, createTask } from '../../services/api';
import { 
  Waves, AlertTriangle, Hospital, Zap, ArrowRight, 
  Layers, Users, Shield, Radio, CheckCircle2, ChevronRight, Sparkles
} from 'lucide-react';

const POLL_INTERVAL_MS = 15000;
// Demo incident (Person 1 seed) used for the grounded AI explanation.
const DEMO_INCIDENT_ID = 'INC-204';

const chainColors = ['#ba1a1a', '#ea580c', '#316bf3', '#0090a9'];

export const GovZoneCascadePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const zoneId = id || 'EB';

  const [activeLayer, setActiveLayer] = useState<'hydro' | 'arterials' | 'egress'>('hydro');
  const [mitigationDispatched, setMitigationDispatched] = useState(false);

  // (c) Live zone cascade from GET /api/zones/:zoneId/cascade (15s poll).
  const [cascadeData, setCascadeData] = useState<any | null>(null);

  // (d) Grounded AI explanation from POST /api/incidents/:id/explain.
  const [explain, setExplain] = useState<any | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);

  // (e) Operator approval state — track which recommended actions were dispatched.
  const [approved, setApproved] = useState<Record<number, 'pending' | 'done' | 'error'>>({});

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await fetchZoneCascade(zoneId);
        if (active) setCascadeData(data);
      } catch {
        // Backend may be unreachable (401/offline) — keep last-known UI.
      }
    };
    load();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [zoneId]);

  // The verified AI fields live under `data.explanation` (see api.ts note).
  const explanation = explain?.explanation ?? null;
  const recommendedActions: any[] = explanation?.recommendedActions ?? [];

  // (c) Cascade chain: real DRAIN-07 -> RD-24 -> HOSP nodes when loaded, else mock.
  const fallbackChain = [
    { assetCode: 'DRAIN-07', asset: 'Bayou Culvert Flash Overflow', impact: 'OVERWHELMED', impactScore: 84 },
    { assetCode: 'RD-24', asset: 'Substation 9 Basin Infiltration', impact: 'INUNDATED', impactScore: 67 },
    { assetCode: 'HOSP-01', asset: 'Hospital Corridor Severed', impact: 'ACCESS_BLOCKED', impactScore: 42 },
  ];
  const chainNodes: any[] =
    cascadeData?.cascade?.length ? cascadeData.cascade : fallbackChain;

  const handleExplain = async () => {
    setExplainLoading(true);
    setExplainError(null);
    try {
      const data = await explainIncident(DEMO_INCIDENT_ID);
      setExplain(data);
    } catch (err) {
      setExplainError(err instanceof Error ? err.message : 'AI explanation unavailable');
    } finally {
      setExplainLoading(false);
    }
  };

  const priorityToTask = (p?: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
    const up = (p || '').toUpperCase();
    if (up === 'CRITICAL') return 'CRITICAL';
    if (up === 'HIGH') return 'HIGH';
    if (up === 'MEDIUM' || up === 'MODERATE') return 'MEDIUM';
    return 'LOW';
  };

  // (e) Human-in-the-loop: approve a single AI recommended action -> POST /api/tasks.
  const handleApprove = async (index: number, action: any) => {
    setApproved((prev) => ({ ...prev, [index]: 'pending' }));
    try {
      await createTask({
        title: action?.reason || action?.actionId || 'Operator-approved response action',
        incidentId: DEMO_INCIDENT_ID,
        priority: priorityToTask(action?.priority),
        description: `Approved from Zone ${zoneId} cascade AI recommendation (${action?.actionId ?? 'n/a'}).`,
      });
      setApproved((prev) => ({ ...prev, [index]: 'done' }));
    } catch {
      setApproved((prev) => ({ ...prev, [index]: 'error' }));
    }
  };

  const handleDispatchMitigation = () => {
    setMitigationDispatched(true);
    setTimeout(() => {
      navigate('/gov/response-center');
    }, 900);
  };

  return (
    <GovHqLayout activePath="/gov/zone-cascade/4B">
      <div className="flex flex-col xl:flex-row w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-[#f8f9ff]">
        {/* LEFT & CENTER CANVAS: Map Engine & Geospatial Telemetry */}
        <section className="relative flex-1 h-full min-w-0 flex flex-col bg-slate-900 overflow-hidden">
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center opacity-70"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80')` }}
          />

          {/* Tactical SVG Overlays */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 1200 800" preserveAspectRatio="none">
            <defs>
              <linearGradient id="cascadeGlow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0051d5" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#ba1a1a" stopOpacity="0.15" />
              </linearGradient>
            </defs>

            {/* Inundation Basin */}
            <polygon 
              points="340,180 580,210 720,380 610,590 380,560 270,390" 
              fill="url(#cascadeGlow)" 
              stroke="#ba1a1a" 
              strokeWidth="2" 
              strokeDasharray="6 4" 
            />

            {/* Flooded Arterials */}
            <path d="M 290 410 L 460 390 L 610 430 L 680 520" fill="none" stroke="#ba1a1a" strokeWidth="5" strokeLinecap="round" />
            <path d="M 460 390 L 490 280 L 590 230" fill="none" stroke="#ba1a1a" strokeWidth="5" strokeLinecap="round" />

            {/* Hospital Arterial Corridor */}
            <path d="M 310 240 L 490 280 L 730 310 L 820 280" fill="none" stroke="#0090a9" strokeWidth="4" strokeDasharray="8 6" />

            {/* Sensor Pings */}
            <circle cx="460" cy="390" r="18" fill="#ba1a1a" fillOpacity="0.3" className="animate-ping" />
            <circle cx="460" cy="390" r="6" fill="#ba1a1a" />
          </svg>

          {/* Top Overlay Strip */}
          <div className="relative z-20 flex items-center justify-between p-4 pointer-events-none">
            <div className="flex items-center gap-3 pointer-events-auto bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-xs border border-[#e5eeff] text-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#0b1c30]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a] animate-pulse" />
                <span>Bayou Crossing & Waterfront</span>
              </div>
              <span className="text-[#76777d]">|</span>
              <span className="font-mono text-[#45464d]">GRID #US-LA-EOC-{zoneId}</span>
              <span className="px-2 py-0.5 rounded bg-[#eff4ff] text-[#0051d5] font-semibold">
                Hydro-Sensors: 14/14 Online
              </span>
            </div>

            {/* Layer Switches */}
            <div className="flex items-center gap-1.5 pointer-events-auto bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-xs border border-[#e5eeff] text-xs font-semibold">
              <button 
                onClick={() => setActiveLayer('hydro')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeLayer === 'hydro' ? 'bg-[#0f172a] text-white' : 'text-[#45464d] hover:bg-[#eff4ff]'
                }`}
              >
                Hydrology
              </button>
              <button 
                onClick={() => setActiveLayer('arterials')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeLayer === 'arterials' ? 'bg-[#0f172a] text-white' : 'text-[#45464d] hover:bg-[#eff4ff]'
                }`}
              >
                Arterials
              </button>
              <button 
                onClick={() => setActiveLayer('egress')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeLayer === 'egress' ? 'bg-[#0f172a] text-white' : 'text-[#45464d] hover:bg-[#eff4ff]'
                }`}
              >
                Egress
              </button>
            </div>
          </div>

          {/* Floating Landmarks on Canvas */}
          <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-2 max-w-sm pointer-events-auto">
            <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-md border border-[#e5eeff] flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#ffdad6] text-[#93000a] flex items-center justify-center shrink-0">
                <Hospital className="w-4 h-4 text-[#ba1a1a]" />
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-[#0b1c30]">St. Jude Gate B</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a]">
                    COMPROMISED
                  </span>
                </div>
                <p className="text-[11px] text-[#45464d] mt-0.5 leading-snug">
                  Water ingress +18in across access ramp. Ambulance divert active.
                </p>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-xs border border-[#e5eeff] flex items-center justify-between text-xs">
              <span className="font-semibold text-[#0b1c30]">Sensor #4B-09 (Bayshore & 4th)</span>
              <span className="font-mono font-bold text-[#ba1a1a]">+48.2 cm/hr Peak</span>
            </div>
          </div>
        </section>

        {/* RIGHT CONTEXTUAL PANEL: Analytical Inspector (420px Fixed) */}
        <aside className="w-full xl:w-[420px] xl:min-w-[420px] xl:max-w-[420px] h-full bg-white border-l border-[#e5eeff] flex flex-col justify-between shadow-md z-30 overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-white border-b border-[#e5eeff]">
            <div className="flex items-center justify-between text-xs text-[#76777d] uppercase font-bold tracking-wider mb-1">
              <span>Zone Detail & Cascade Impact</span>
              <span className="font-mono text-[#0051d5]">SEC-{zoneId}</span>
            </div>
            <h1 className="text-lg font-bold text-[#0b1c30] leading-tight">
              Sector {zoneId}: Bayou Crossing Corridor
            </h1>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#e5eeff]">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a] text-xs font-bold uppercase">
                  {cascadeData?.riskLevel ?? 'CRITICAL'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#eff4ff] text-[#0090a9] text-xs font-semibold">
                  {cascadeData?.hazard?.type ? String(cascadeData.hazard.type).replace(/_/g, ' ') : 'Flood Inundation'}
                </span>
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-extrabold text-[#ba1a1a]">{cascadeData?.riskScore ?? 88}</span>
                <span className="text-xs text-[#76777d]">/100</span>
              </div>
            </div>
          </div>

          {/* Analytical Content */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {/* Contributing Factors */}
            <div className="p-3 bg-[#eff4ff] rounded-xl border border-[#d3e4fe]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-[#0b1c30]">Contributing Factors</span>
                <span className="text-[10px] font-mono text-[#0051d5]">Bayou Telemetry</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden flex bg-[#dce9ff] mb-2">
                <div className="bg-[#ba1a1a] h-full" style={{ width: '38%' }} />
                <div className="bg-[#0051d5] h-full" style={{ width: '26%' }} />
                <div className="bg-[#316bf3] h-full" style={{ width: '18%' }} />
                <div className="bg-[#76777d] h-full" style={{ width: '18%' }} />
              </div>
              <div className="space-y-1 text-[#45464d] text-[11px]">
                <div className="flex justify-between">
                  <span>Rainfall Influx (Surge)</span>
                  <span className="font-bold text-[#0b1c30]">38%</span>
                </div>
                <div className="flex justify-between">
                  <span>Sump Capacity Deficit</span>
                  <span className="font-bold text-[#0b1c30]">26%</span>
                </div>
                <div className="flex justify-between">
                  <span>Historical Flood Factor</span>
                  <span className="font-bold text-[#0b1c30]">18%</span>
                </div>
              </div>
            </div>

            {/* Cascade Failure Chain */}
            <div className="space-y-2">
              <span className="font-bold text-xs text-[#0b1c30] uppercase tracking-wider block">
                Cascade Failure Chain
              </span>

              {chainNodes.map((node, i) => {
                const color = chainColors[Math.min(i, chainColors.length - 1)];
                return (
                  <React.Fragment key={node.assetCode ?? i}>
                    {i > 0 && (
                      <div className="flex justify-center text-[#76777d]">
                        <ArrowRight className="w-4 h-4 rotate-90" />
                      </div>
                    )}
                    <div
                      className="p-3 rounded-xl bg-white shadow-xs flex items-start gap-2.5"
                      style={{ borderWidth: 1, borderStyle: 'solid', borderColor: color }}
                    >
                      <span
                        className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold shrink-0 mt-0.5"
                        style={{ backgroundColor: color }}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <span className="font-bold block" style={{ color }}>
                          {node.assetCode ? `${node.assetCode} · ` : ''}{node.asset}
                        </span>
                        <p className="text-[#45464d] text-[11px] mt-0.5">
                          Impact: {String(node.impact ?? node.impactType ?? 'IMPACTED').replace(/_/g, ' ')}
                          {node.impactScore != null ? ` (${node.impactScore}/100)` : ''}
                        </p>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Demographics Exposure */}
            <div className="p-3 bg-[#eff4ff] rounded-xl border border-[#d3e4fe] flex flex-col gap-1.5">
              <span className="font-bold text-xs text-[#0b1c30]">Population & Exposure</span>
              <div className="grid grid-cols-3 gap-2 text-center mt-1">
                <div className="bg-white p-2 rounded-lg border border-[#e5eeff]">
                  <span className="text-[10px] text-[#76777d] block font-semibold">Residents</span>
                  <span className="font-bold text-xs text-[#0b1c30]">{(cascadeData?.impact?.residents ?? 14200).toLocaleString()}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-[#e5eeff]">
                  <span className="text-[10px] text-[#76777d] block font-semibold">Mobility-Imp.</span>
                  <span className="font-bold text-xs text-[#dc2626]">1,840</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-[#e5eeff]">
                  <span className="text-[10px] text-[#76777d] block font-semibold">Elderly Beds</span>
                  <span className="font-bold text-xs text-[#0b1c30]">420</span>
                </div>
              </div>
            </div>

            {/* (d) Grounded AI Explanation (XAI) + (e) Operator Approval */}
            <div className="p-3 bg-white rounded-xl border border-[#d3e4fe] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#0b1c30] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#0051d5]" />
                  AI Situation Explanation
                </span>
                {explanation && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#eff4ff] text-[#0051d5] font-semibold">
                    {explain?.usedFallback ? 'DETERMINISTIC' : 'GEMINI'}
                    {explanation.confidence != null ? ` · ${Math.round(explanation.confidence * 100)}%` : ''}
                  </span>
                )}
              </div>

              {!explanation && (
                <button
                  type="button"
                  onClick={handleExplain}
                  disabled={explainLoading}
                  className="w-full h-9 rounded-lg bg-[#eff4ff] text-[#0051d5] font-semibold text-[11px] flex items-center justify-center gap-1.5 border border-[#d3e4fe] hover:bg-[#e5eeff] transition-colors disabled:opacity-60"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {explainLoading ? 'Generating…' : `Explain incident ${DEMO_INCIDENT_ID} with AI`}
                </button>
              )}

              {explainError && (
                <p className="text-[11px] text-[#ba1a1a] font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {explainError}
                </p>
              )}

              {explanation && (
                <>
                  <p className="text-[11px] text-[#45464d] leading-snug">
                    {explanation.situationSummary || explanation.impactSummary || explanation.explanation}
                  </p>

                  {recommendedActions.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] uppercase font-bold text-[#76777d] tracking-wider block">
                        Recommended Actions — operator approval required
                      </span>
                      {recommendedActions.map((action, i) => {
                        const state = approved[i];
                        return (
                          <div
                            key={action?.actionId ?? i}
                            className="p-2 rounded-lg bg-[#f8f9ff] border border-[#e5eeff] flex items-start justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <span className="font-semibold text-[11px] text-[#0b1c30] block">
                                {action?.reason || action?.actionId}
                              </span>
                              {action?.priority && (
                                <span className="text-[9px] font-bold uppercase text-[#b45309]">
                                  {action.priority} priority
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              data-action="approve-recommendation"
                              onClick={() => handleApprove(i, action)}
                              disabled={state === 'pending' || state === 'done'}
                              className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white transition-colors ${
                                state === 'done'
                                  ? 'bg-emerald-600'
                                  : state === 'error'
                                  ? 'bg-[#ba1a1a]'
                                  : 'bg-[#0f172a] hover:bg-[#1e293b]'
                              } disabled:opacity-70`}
                            >
                              {state === 'done'
                                ? 'Dispatched ✓'
                                : state === 'pending'
                                ? 'Dispatching…'
                                : state === 'error'
                                ? 'Retry'
                                : 'Approve'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-white border-t border-[#e5eeff] flex flex-col gap-2">
            <button 
              type="button"
              onClick={handleDispatchMitigation}
              disabled={mitigationDispatched}
              className={`w-full h-11 rounded-xl text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all ${
                mitigationDispatched ? 'bg-emerald-600' : 'bg-[#0f172a] hover:bg-[#1e293b]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>{mitigationDispatched ? 'Mitigation Dispatched' : 'Deploy Unified Mitigation Strategy'}</span>
            </button>
          </div>
        </aside>
      </div>
    </GovHqLayout>
  );
};
export default GovZoneCascadePage;
