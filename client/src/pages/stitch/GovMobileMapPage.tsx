import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Radio, AlertTriangle, Timer, Send, Map as MapIcon,
  ClipboardList, CheckSquare, AlertOctagon, User, RefreshCw,
} from 'lucide-react';
import { fetchResponseCenter, dispatchUnitToIncident, type ResponseCenterData } from '../../services/api';

const POLL_INTERVAL_MS = 15000;

function slaLabel(minutes: number | null): string {
  if (minutes == null) return 'No SLA';
  if (minutes <= 0) return 'OVERDUE';
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export const GovMobileMapPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ResponseCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [dispatched, setDispatched] = useState(false);

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

  const topIncident = data?.activeIncidents[0] ?? null;
  const secondIncident = data?.activeIncidents[1] ?? null;

  const handleDispatch = async () => {
    if (!topIncident || dispatching) return;
    const unit = data?.availableUnits[0];
    if (!unit) {
      setDispatchError('No available units to dispatch.');
      return;
    }
    setDispatching(true);
    setDispatchError(null);
    try {
      await dispatchUnitToIncident(topIncident.id, unit.id);
      setDispatched(true);
      await load();
    } catch (err) {
      setDispatchError((err as Error)?.message ?? 'Dispatch failed.');
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen flex flex-col font-sans pb-32">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#f8f9ff]/85 backdrop-blur-xl border-b border-[#e5eeff] shadow-xs">
        <div className="h-20 px-4 flex flex-col justify-center gap-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0f172a] text-white flex items-center justify-center font-bold text-xs">GOV</div>
              <span className="font-bold text-base tracking-tight text-[#0b1c30]">Map</span>
            </div>
            <div className="flex items-center gap-2">
              {data && data.summary.critical > 0 && (
                <div className="flex items-center gap-1.5 bg-[#e5eeff] px-2.5 py-1 rounded-full text-xs font-semibold text-[#0b1c30]">
                  <span className="w-2 h-2 rounded-full bg-[#0051d5] animate-pulse" />
                  <span>{data.summary.critical} CRITICAL</span>
                </div>
              )}
              <div className="w-8 h-8 rounded-full bg-[#0f172a] flex items-center justify-center text-white">
                <User className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full pt-20">
        {/* Simplified decorative map viewport (chrome only) */}
        <div className="relative w-full h-[220px] bg-slate-900 overflow-hidden flex items-center justify-center">
          <span className="material-symbols-outlined text-white/20" style={{ fontSize: 56 }}>map</span>
          <div className="absolute top-3 inset-x-4 flex items-center justify-between gap-2 z-10">
            <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm text-xs">
              <span className="flex h-2 w-2 relative">
                <span className={`relative inline-flex rounded-full h-2 w-2 ${loading ? 'bg-secondary' : 'bg-[#ba1a1a]'}`} />
              </span>
              <span className="text-[#45464d]">{loading ? 'Syncing…' : `${data?.summary.activeIncidents ?? 0} active incidents`}</span>
            </div>
          </div>
        </div>

        {/* Real Incident Card Stack */}
        <div className="w-full px-4 -mt-10 relative z-20 flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-bold text-[#0b1c30]">Active Incidents</span>
            <span className="text-xs text-[#45464d] font-mono">{data?.summary.activeIncidents ?? 0} total</span>
          </div>

          {!loading && !topIncident && (
            <div className="p-6 text-center text-sm text-[#76777d] bg-white rounded-2xl border border-[#e5eeff]">No active incidents right now.</div>
          )}

          {topIncident && (
            <div className="relative w-full bg-white rounded-2xl shadow-lg border border-[#e5eeff] overflow-hidden flex flex-col">
              <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#ba1a1a]" />
              <div className="p-4 pl-5 flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a] text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]" />
                      {topIncident.severity}
                    </span>
                    <span className="text-xs text-[#45464d] font-mono">#{topIncident.incidentCode}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-[#ffdad6]/70 text-[#93000a] px-2 py-0.5 rounded-full text-xs font-mono font-bold">
                    <Timer className="w-3.5 h-3.5 text-[#ba1a1a] animate-pulse" />
                    <span>{slaLabel(topIncident.slaMinutesRemaining)}</span>
                  </div>
                </div>

                <div>
                  <h2 className="text-base font-bold text-[#0b1c30] leading-tight">{topIncident.title}</h2>
                  {topIncident.assetName && (
                    <p className="text-xs text-[#ba1a1a] font-medium flex items-center gap-1 mt-0.5">
                      <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                      {topIncident.assetName}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#eff4ff] p-2.5 rounded-xl border border-[#d3e4fe]">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#45464d] uppercase font-semibold">Zone</span>
                    <span className="text-xs font-bold text-[#0b1c30] truncate">{topIncident.zoneName ?? '—'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#45464d] uppercase font-semibold">Assigned</span>
                    <span className="text-xs font-bold text-[#0b1c30] truncate">
                      {topIncident.assignedUnits.length > 0 ? topIncident.assignedUnits.join(', ') : 'Unassigned'}
                    </span>
                  </div>
                </div>

                {dispatchError && <span className="text-xs text-red-700 font-semibold">{dispatchError}</span>}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => navigate('/gov/mobile/triage')}
                    className="flex-1 h-11 bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0b1c30] rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-[#d3e4fe]"
                  >
                    <span>View All Incidents</span>
                  </button>
                  <button
                    onClick={handleDispatch}
                    disabled={dispatching || dispatched || topIncident.assignedUnits.length > 0}
                    className={`flex-[1.4] h-11 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition-all disabled:opacity-60 ${
                      dispatched ? 'bg-emerald-600' : 'bg-[#0f172a] hover:bg-[#1e293b]'
                    }`}
                  >
                    {dispatching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-[#4cd7f6]" />}
                    <span>{dispatched || topIncident.assignedUnits.length > 0 ? 'Dispatched' : 'Quick Dispatch'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {secondIncident && (
            <div
              onClick={() => navigate('/gov/mobile/triage')}
              className="w-full bg-white p-3 rounded-xl shadow-xs border border-[#e5eeff] flex items-center justify-between cursor-pointer hover:bg-[#f8f9ff]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-[#316bf3]" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-[#0b1c30] truncate">#{secondIncident.incidentCode} • {secondIncident.title}</span>
                  <span className="text-[10px] text-[#45464d] font-mono truncate">{secondIncident.zoneName ?? '—'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Gov Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-t border-[#e5eeff] pb-safe shadow-md">
        <div className="flex justify-around items-center h-16 px-4 max-w-lg mx-auto">
          <Link to="/gov/mobile/map" className="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] gap-0.5 text-[#0051d5] font-bold">
            <MapIcon className="w-5 h-5" />
            <span className="text-[11px]">Map</span>
          </Link>
          <Link to="/gov/mobile/triage" className="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] gap-0.5 text-[#45464d] hover:text-[#0051d5] transition-colors">
            <ClipboardList className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Incidents</span>
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
export default GovMobileMapPage;
