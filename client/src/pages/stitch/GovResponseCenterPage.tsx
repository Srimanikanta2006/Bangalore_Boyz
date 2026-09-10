import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GovHqLayout } from '../../components/stitch/GovHqLayout';
import {
  Timer, MapPin, ArrowRight, CheckCircle2, Layers,
} from 'lucide-react';
import {
  fetchResponseCenter, dispatchUnitToIncident,
  type ResponseCenterData, type ResponseIncidentCard,
} from '../../services/api';

const POLL_INTERVAL_MS = 15000;

const SEVERITY_STYLE: Record<string, { bg: string; text: string; bar: string }> = {
  CRITICAL: { bg: 'bg-[#ffdad6]', text: 'text-[#93000a]', bar: '#ba1a1a' },
  HIGH: { bg: 'bg-[#ffedd5]', text: 'text-[#c2410c]', bar: '#ea580c' },
  MODERATE: { bg: 'bg-[#fef3c7]', text: 'text-[#b45309]', bar: '#d97706' },
  LOW: { bg: 'bg-[#dcfce7]', text: 'text-[#15803d]', bar: '#16a34a' },
};

function slaLabel(minutes: number | null): string {
  if (minutes == null) return 'No SLA';
  if (minutes < 0) return `${Math.abs(minutes)}m overdue`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m remaining` : `${m}m remaining`;
}

function elapsedLabel(reportedAt: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(reportedAt).getTime()) / 60000));
  return mins < 60 ? `+${mins}m elapsed` : `+${Math.round(mins / 60)}h elapsed`;
}

export const GovResponseCenterPage: React.FC = () => {
  const navigate = useNavigate();

  const [data, setData] = useState<ResponseCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dispatchTarget, setDispatchTarget] = useState<string | null>(null); // incident id with the picker open
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [dispatching, setDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await fetchResponseCenter();
      setData(result);
      setError(null);
    } catch (err) {
      setError((err as Error)?.message ?? 'Failed to load the response center.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  const openAssign = (incident: ResponseIncidentCard) => {
    setDispatchTarget(incident.id);
    setSelectedUnitId(data?.availableUnits[0]?.id ?? '');
    setDispatchError(null);
  };

  const confirmAssign = async (incident: ResponseIncidentCard) => {
    if (!selectedUnitId) {
      setDispatchError('Select a unit to dispatch.');
      return;
    }
    setDispatching(true);
    setDispatchError(null);
    try {
      await dispatchUnitToIncident(incident.id, selectedUnitId);
      setDispatchTarget(null);
      setSuccessToast(`Unit dispatched to #${incident.incidentCode}`);
      setTimeout(() => setSuccessToast(null), 3000);
      await load();
    } catch (err) {
      setDispatchError((err as Error)?.message ?? 'Dispatch failed.');
    } finally {
      setDispatching(false);
    }
  };

  const incidents = data?.activeIncidents ?? [];

  return (
    <GovHqLayout activePath="/gov/response-center">
      <div className="flex flex-col w-full">
        {/* Top Command Telemetry Ribbon — real, live-computed */}
        <div className="w-full bg-white border-b border-[#e5eeff] px-6 py-3 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6 flex-wrap text-xs">
              <div className="flex items-baseline gap-2">
                <span className="text-[#76777d] uppercase font-bold text-[10px]">Active Incidents</span>
                <span className="text-xl font-extrabold text-[#0b1c30]">{data?.summary.activeIncidents ?? '—'}</span>
                {data && data.summary.critical > 0 && (
                  <span className="text-[#ba1a1a] font-bold font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] animate-ping" />
                    {data.summary.critical} P1 Critical
                  </span>
                )}
              </div>
              <div className="h-6 w-px bg-[#e5eeff]" />
              <div className="flex items-baseline gap-2">
                <span className="text-[#76777d] uppercase font-bold text-[10px]">Assigned Units</span>
                <span className="text-xl font-extrabold text-[#0051d5]">{data?.summary.assignedUnits ?? '—'}</span>
                <span className="text-[#45464d]">/ {data ? data.summary.assignedUnits + data.availableUnits.length : '—'} tracked</span>
              </div>
              <div className="h-6 w-px bg-[#e5eeff]" />
              <div className="flex items-baseline gap-2">
                <span className="text-[#76777d] uppercase font-bold text-[10px]">Unassigned</span>
                <span className="text-xl font-extrabold text-[#ba1a1a]">{data?.summary.unassignedIncidents ?? '—'}</span>
                {data && data.summary.unassignedIncidents > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#ffdad6] text-[#93000a] font-bold">
                    Triage Bottleneck
                  </span>
                )}
              </div>
              <div className="h-6 w-px bg-[#e5eeff]" />
              <div className="flex items-baseline gap-2">
                <span className="text-[#76777d] uppercase font-bold text-[10px]">Mean Resp Time</span>
                <span className="text-xl font-extrabold text-[#0b1c30]">
                  {data?.summary.avgResponseMinutes ?? '—'}<span className="text-xs font-normal">m</span>
                </span>
                {data?.summary.slaCompliancePercent != null && (
                  <span className="text-emerald-600 font-bold text-[11px]">{data.summary.slaCompliancePercent}% SLA compliance</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/gov/overview')}
                className="px-3.5 py-1.5 rounded-xl bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0b1c30] text-xs font-semibold flex items-center gap-1.5 border border-[#d3e4fe]"
              >
                <Layers className="w-3.5 h-3.5 text-[#0051d5]" />
                <span>Overview</span>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="m-6 rounded-xl bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">{error}</div>
        )}

        {/* Operational Split Workspace */}
        <div className="p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Incident Priority Queues (Left & Center: 8 Cols) */}
          <div className="xl:col-span-8 flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-bold text-base text-[#0b1c30]">Response Dispatch Matrix</h2>
              <span className="text-xs text-[#76777d] font-mono">
                {loading ? 'Loading…' : `${incidents.length} active incidents`}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {!loading && incidents.length === 0 && (
                <div className="p-6 text-center text-sm text-[#76777d] bg-white rounded-2xl border border-[#e5eeff]">
                  No active incidents.
                </div>
              )}
              {incidents.map((inc) => {
                const style = SEVERITY_STYLE[inc.severity] ?? SEVERITY_STYLE.MODERATE;
                const isPicking = dispatchTarget === inc.id;
                return (
                  <article
                    key={inc.id}
                    className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white rounded-2xl shadow-sm border border-[#e5eeff] hover:border-[#0051d5] transition-all overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: style.bar }} />

                    <div className="flex flex-col gap-1 pl-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-mono font-bold text-[#0b1c30]">#{inc.incidentCode}</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${style.bg} ${style.text}`}>
                          {inc.type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[#76777d]">•</span>
                        <span className="text-[#45464d]">{inc.zoneName ?? 'Unknown zone'}</span>
                        <span className="text-[#ba1a1a] font-mono font-bold ml-auto flex items-center gap-1">
                          <Timer className="w-3.5 h-3.5" />
                          {slaLabel(inc.slaMinutesRemaining)}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-[#0b1c30] mt-0.5 leading-snug">{inc.title}</h3>

                      <div className="flex items-center gap-3 text-xs text-[#45464d] mt-1 flex-wrap">
                        {inc.assetName && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#0051d5]" />
                            {inc.assetName}
                          </span>
                        )}
                        <span>•</span>
                        <span className="font-semibold text-[#0b1c30]">
                          {inc.assignedUnits.length > 0 ? inc.assignedUnits.join(', ') : 'Unassigned'}
                        </span>
                        <span className="text-[#76777d]">{elapsedLabel(inc.reportedAt)}</span>
                      </div>

                      {isPicking && (
                        <div className="mt-2 flex flex-col gap-2 bg-[#eff4ff] rounded-xl p-3">
                          <select
                            className="h-9 rounded-lg border border-[#d3e4fe] px-2 text-xs font-semibold text-[#0b1c30] bg-white"
                            value={selectedUnitId}
                            onChange={(e) => setSelectedUnitId(e.target.value)}
                          >
                            {(data?.availableUnits ?? []).length === 0 && <option value="">No units available</option>}
                            {(data?.availableUnits ?? []).map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.callsign} — {u.name} ({u.type}){u.etaMinutes != null ? ` · ETA ${u.etaMinutes}m` : ''}
                              </option>
                            ))}
                          </select>
                          {dispatchError && <span className="text-xs text-red-700 font-semibold">{dispatchError}</span>}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => confirmAssign(inc)}
                              disabled={dispatching || !selectedUnitId}
                              className="h-8 px-3 rounded-lg bg-[#0f172a] text-white text-xs font-bold disabled:opacity-60"
                            >
                              {dispatching ? 'Dispatching…' : 'Confirm Dispatch'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDispatchTarget(null)}
                              className="h-8 px-3 rounded-lg bg-white border border-[#d3e4fe] text-xs font-semibold text-[#0b1c30]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {!isPicking && (
                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openAssign(inc)}
                          className="h-10 px-4 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-sm transition-all bg-[#0f172a] hover:bg-[#1e293b]"
                        >
                          <span>Assign Team</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>

          {/* Right Tactical Deployment HUD (4 Cols) — real unit roster */}
          <aside className="xl:col-span-4 flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#e5eeff] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#0b1c30]">Available Units</span>
                <span className="text-[10px] font-mono text-[#0051d5] font-bold">
                  {data?.availableUnits.length ?? 0} READY
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                {(data?.availableUnits ?? []).slice(0, 6).map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-2 rounded-xl bg-[#eff4ff]">
                    <span className="font-bold text-[#0b1c30]">{u.callsign} ({u.name})</span>
                    <span className="text-[#0051d5] font-mono font-semibold">{u.type}</span>
                  </div>
                ))}
                {(data?.availableUnits ?? []).length === 0 && !loading && (
                  <div className="p-2 text-center text-[#76777d]">No units currently available.</div>
                )}
              </div>

              {(data?.hotspots.length ?? 0) > 0 && (
                <>
                  <div className="h-px bg-[#e5eeff] my-1" />
                  <span className="font-bold text-xs text-[#0b1c30]">Recurring Hotspots</span>
                  <div className="space-y-1.5 text-xs">
                    {data!.hotspots.slice(0, 3).map((h) => (
                      <div key={h.id} className="flex items-center justify-between p-2 rounded-xl bg-[#fff7ed]">
                        <span className="font-semibold text-[#0b1c30] truncate">{h.name}</span>
                        <span className="text-[#c2410c] font-mono font-bold">{h.eventCount}x</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={() => navigate('/gov/overview')}
                className="w-full py-2.5 rounded-xl bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0051d5] font-bold text-xs transition-colors border border-[#d3e4fe]"
              >
                Open Overview Dashboard
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#0f172a] text-white px-4 py-2.5 rounded-full shadow-xl text-xs font-semibold flex items-center gap-2 border border-white/20 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}
    </GovHqLayout>
  );
};
export default GovResponseCenterPage;
