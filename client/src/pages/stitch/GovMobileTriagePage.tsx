import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Radio, User, AlertOctagon, Timer, Zap, Map as MapIcon,
  ClipboardList, CheckSquare, RefreshCw,
} from 'lucide-react';
import {
  fetchResponseCenter, dispatchUnitToIncident,
  type ResponseCenterData, type ResponseIncidentCard,
} from '../../services/api';

const POLL_INTERVAL_MS = 15000;

function slaLabel(minutes: number | null): string {
  if (minutes == null) return 'No SLA';
  if (minutes <= 0) return 'OVERDUE';
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return h > 0 ? `${h}h ${m}m remaining` : `${m}m remaining`;
}

const GROUPS: { key: keyof ResponseCenterData['severityGroups']; dot: string; label: string }[] = [
  { key: 'CRITICAL', dot: 'bg-[#ba1a1a]', label: 'Critical Priority' },
  { key: 'HIGH', dot: 'bg-[#ea580c]', label: 'High Priority' },
  { key: 'MODERATE', dot: 'bg-[#d97706]', label: 'Moderate Priority' },
];

export const GovMobileTriagePage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ResponseCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'CRITICAL' | 'HIGH' | 'MODERATE'>('all');
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await fetchResponseCenter();
      setData(result);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  const handleDispatch = async (incident: ResponseIncidentCard) => {
    const unit = data?.availableUnits[0];
    if (!unit) {
      setDispatchError('No available units to dispatch.');
      return;
    }
    setDispatchingId(incident.id);
    setDispatchError(null);
    try {
      await dispatchUnitToIncident(incident.id, unit.id);
      await load();
    } catch (err) {
      setDispatchError((err as Error)?.message ?? 'Dispatch failed.');
    } finally {
      setDispatchingId(null);
    }
  };

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen flex flex-col font-sans pb-32">
      <header className="fixed top-0 inset-x-0 z-50 bg-[#f8f9ff]/85 backdrop-blur-xl border-b border-[#e5eeff] shadow-xs">
        <div className="h-20 px-4 flex flex-col justify-center gap-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0f172a] text-white flex items-center justify-center font-bold text-xs">GOV</div>
              <span className="font-bold text-base tracking-tight text-[#0b1c30]">Incidents</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#0f172a] flex items-center justify-center text-white">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full pt-20 px-4 gap-4">
        {/* Real Queue Telemetry */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-[#e5eeff] flex flex-col gap-2 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${loading ? 'bg-secondary animate-pulse' : 'bg-[#ba1a1a]'}`} />
              <span className="font-bold text-sm text-[#0b1c30]">Queue Telemetry</span>
            </div>
            <button onClick={load} className="text-xs text-[#45464d] font-mono flex items-center gap-1">
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="bg-[#eff4ff] p-2.5 rounded-xl flex flex-col border border-[#d3e4fe]">
              <span className="text-[10px] text-[#45464d] uppercase font-semibold">Active Events</span>
              <span className="text-xl font-extrabold text-[#0b1c30] mt-0.5">{data?.summary.activeIncidents ?? '—'}</span>
              <span className="text-[10px] text-[#ba1a1a] font-bold mt-0.5">{data?.summary.critical ?? 0} Crit</span>
            </div>
            <div className="bg-[#eff4ff] p-2.5 rounded-xl flex flex-col border border-[#d3e4fe]">
              <span className="text-[10px] text-[#45464d] uppercase font-semibold">Mean SLA Resp</span>
              <span className="text-xl font-extrabold text-[#0b1c30] mt-0.5">{data?.summary.avgResponseMinutes ?? '—'}<span className="text-xs font-normal">m</span></span>
            </div>
            <div className="bg-[#eff4ff] p-2.5 rounded-xl flex flex-col border border-[#d3e4fe]">
              <span className="text-[10px] text-[#45464d] uppercase font-semibold">Readiness</span>
              <span className="text-xl font-extrabold text-[#0b1c30] mt-0.5">{data?.summary.readinessPercent ?? '—'}%</span>
            </div>
          </div>
        </section>

        {/* Filter Tabs */}
        <section className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {(['all', 'CRITICAL', 'HIGH', 'MODERATE'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === f ? 'bg-[#0f172a] text-white shadow-xs' : 'bg-white text-[#45464d] hover:bg-[#eff4ff] border border-[#e5eeff]'
              }`}
            >
              {f === 'all' ? 'All Incidents' : f}
            </button>
          ))}
        </section>

        {dispatchError && <div className="rounded-xl bg-red-50 border border-red-200 text-red-800 px-3 py-2 text-xs">{dispatchError}</div>}

        {/* Real Incident Groups */}
        <div className="flex flex-col gap-4">
          {GROUPS.filter((g) => activeFilter === 'all' || activeFilter === g.key).map((group) => {
            const items = data?.severityGroups[group.key] ?? [];
            if (items.length === 0) return null;
            return (
              <section key={group.key} className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${group.dot}`} />
                    <h2 className="font-bold text-sm text-[#0b1c30]">{group.label}</h2>
                  </div>
                  <span className="text-[10px] text-[#45464d] bg-[#eff4ff] px-2.5 py-0.5 rounded-full font-bold">{items.length}</span>
                </div>

                {items.map((inc) => (
                  <article key={inc.id} className="bg-white rounded-2xl shadow-sm border border-[#e5eeff] relative overflow-hidden flex flex-col">
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${group.dot}`} />
                    <div className="p-4 pl-5 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col">
                          <span className="text-xs font-mono text-[#45464d]">#{inc.incidentCode} • {inc.type.replace(/_/g, ' ')}</span>
                          <h3 className="font-bold text-sm text-[#0b1c30] mt-0.5">{inc.title}</h3>
                        </div>
                        <span className="text-[10px] bg-[#ffdad6] text-[#93000a] px-2 py-0.5 rounded-full font-bold whitespace-nowrap flex items-center gap-1 font-mono">
                          <Timer className="w-3 h-3" />
                          {slaLabel(inc.slaMinutesRemaining)}
                        </span>
                      </div>

                      {inc.assetName && (
                        <div className="bg-[#eff4ff] rounded-xl p-2.5 flex items-center gap-2 border border-[#d3e4fe]">
                          <AlertOctagon className="w-4 h-4 text-[#ba1a1a] shrink-0" />
                          <p className="text-xs text-[#0b1c30] leading-tight">{inc.assetName} • {inc.zoneName ?? 'Unknown zone'}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-[#45464d] font-mono">
                          {inc.assignedUnits.length > 0 ? inc.assignedUnits.join(', ') : 'Unassigned'}
                        </span>
                        <button
                          onClick={() => handleDispatch(inc)}
                          disabled={dispatchingId === inc.id || inc.assignedUnits.length > 0}
                          className={`h-10 px-4 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-60 ${
                            inc.assignedUnits.length > 0 ? 'bg-emerald-600' : 'bg-[#0f172a] hover:bg-[#1e293b]'
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5 text-[#4cd7f6]" />
                          <span>{dispatchingId === inc.id ? 'Dispatching…' : inc.assignedUnits.length > 0 ? 'Assigned' : 'Dispatch Team'}</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </section>
            );
          })}

          {!loading && (data?.activeIncidents.length ?? 0) === 0 && (
            <div className="p-6 text-center text-sm text-[#76777d] bg-white rounded-2xl border border-[#e5eeff]">No active incidents.</div>
          )}
        </div>
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-t border-[#e5eeff] pb-safe shadow-md">
        <div className="flex justify-around items-center h-16 px-4 max-w-lg mx-auto">
          <Link to="/gov/mobile/map" className="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] gap-0.5 text-[#45464d] hover:text-[#0051d5] transition-colors">
            <MapIcon className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Map</span>
          </Link>
          <Link to="/gov/mobile/triage" className="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] gap-0.5 text-[#0051d5] font-bold">
            <ClipboardList className="w-5 h-5" />
            <span className="text-[11px]">Incidents</span>
          </Link>
          <Link to="/gov/mobile/tasks" className="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] gap-0.5 text-[#45464d] hover:text-[#0051d5] transition-colors">
            <CheckSquare className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Tasks</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};
export default GovMobileTriagePage;
