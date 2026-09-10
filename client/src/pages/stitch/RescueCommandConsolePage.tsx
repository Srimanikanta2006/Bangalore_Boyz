import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, User, LayoutGrid, Radar, Layers, FileText, Settings,
  AlertTriangle, Navigation, ChevronRight, Shield,
} from 'lucide-react';
import { fetchFieldTasks, fetchTaskDetail, type TaskDto } from '../../services/api';

const POLL_INTERVAL_MS = 15000;
const ACTIVE_STATUSES = ['ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS'] as const;

function slaLabel(minutes: number | null): string {
  if (minutes == null) return 'No SLA';
  if (minutes <= 0) return 'OVERDUE';
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return h > 0 ? `${h}h ${m}m SLA` : `${m}m SLA`;
}

export const RescueCommandConsolePage: React.FC = () => {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [selectedTaskCode, setSelectedTaskCode] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<(TaskDto & { history: unknown[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const results = await Promise.all(ACTIVE_STATUSES.map((status) => fetchFieldTasks({ status })));
      const merged = results.flatMap((r) => r.items);
      merged.sort((a, b) => (a.slaMinutesRemaining ?? Infinity) - (b.slaMinutesRemaining ?? Infinity));
      setTasks(merged);
      if (!selectedTaskCode && merged[0]) setSelectedTaskCode(merged[0].taskCode);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (!selectedTaskCode) return;
    fetchTaskDetail(selectedTaskCode).then(setSelectedDetail).catch(() => setSelectedDetail(null));
  }, [selectedTaskCode]);

  const criticalCount = tasks.filter((t) => t.priority === 'CRITICAL').length;
  const filtered = tasks.filter((t) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return t.title.toLowerCase().includes(q) || t.taskCode.toLowerCase().includes(q) || (t.assignedUnit?.callsign.toLowerCase().includes(q) ?? false);
  });

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen flex flex-col font-sans">
      {/* Top Header */}
      <header className="fixed top-0 inset-x-0 z-50 h-14 bg-white/95 backdrop-blur-md border-b border-[#e5eeff] shadow-xs">
        <div className="h-14 px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-[#0f172a] text-white flex items-center justify-center font-bold">CS</div>
              <span className="font-bold text-base tracking-tight text-[#0b1c30] shrink-0">ClimateShield</span>
            </div>
            <div className="h-4 w-px bg-[#c6c6cd] shrink-0" />
            <div className="hidden md:flex items-center gap-1 text-[#45464d] text-xs shrink-0">
              <span>Rescue Operations Command</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#0b1c30] font-semibold">Active Task Matrix</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={() => navigate('/rescue/tactical')} className="px-3 py-1.5 rounded-lg bg-[#eff4ff] hover:bg-[#dce9ff] text-xs font-semibold text-[#0051d5] transition-colors">
              Mobile View
            </button>
            <div className="w-8 h-8 rounded-full bg-[#0f172a] flex items-center justify-center text-white">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>
      </header>

      {/* Left Icon Rail */}
      <aside className="fixed left-0 top-14 bottom-0 w-16 bg-white border-r border-[#e5eeff] z-40 flex flex-col items-center py-4 justify-between shadow-xs">
        <nav className="flex flex-col items-center gap-2 w-full px-2">
          <button title="Tactical Matrix" className="w-10 h-10 flex items-center justify-center bg-[#0f172a] text-white rounded-xl shadow-xs">
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button onClick={() => selectedTaskCode && navigate(`/rescue/mission/${selectedTaskCode}`)} title="Mission Queue" className="w-10 h-10 flex items-center justify-center text-[#45464d] hover:text-[#0b1c30] hover:bg-[#eff4ff] rounded-xl transition-colors">
            <Radar className="w-5 h-5" />
          </button>
          <button onClick={() => selectedDetail?.incident && navigate(`/rescue/hazard/${selectedDetail.incident.id}`)} title="Hazard Intel" className="w-10 h-10 flex items-center justify-center text-[#45464d] hover:text-[#0b1c30] hover:bg-[#eff4ff] rounded-xl transition-colors">
            <AlertTriangle className="w-5 h-5" />
          </button>
          <button onClick={() => selectedTaskCode && navigate(`/rescue/report/${selectedTaskCode}`)} title="Sitrep Reports" className="w-10 h-10 flex items-center justify-center text-[#45464d] hover:text-[#0b1c30] hover:bg-[#eff4ff] rounded-xl transition-colors">
            <FileText className="w-5 h-5" />
          </button>
        </nav>
        <div className="flex flex-col items-center gap-2">
          <button onClick={() => navigate('/login')} title="Exit to Roles" className="w-10 h-10 flex items-center justify-center rounded-xl text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Two Column Layout: Real Task Queue + Real Task Detail */}
      <div className="pl-16 pt-14 h-screen overflow-hidden flex">
        {/* COLUMN 1: Real Active Task Queue */}
        <aside className="w-80 shrink-0 bg-white border-r border-[#e5eeff] flex flex-col shadow-xs z-20">
          <div className="p-3 bg-[#eff4ff]/60 border-b border-[#e5eeff]">
            <div className="relative w-full mb-2.5">
              <Search className="w-4 h-4 absolute left-3 top-3 text-[#76777d]" />
              <input
                placeholder="Filter by task, unit, callsign…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-white text-xs text-[#0b1c30] border border-[#d3e4fe] focus:outline-none focus:ring-1 focus:ring-[#0051d5]"
              />
            </div>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5 text-[#0b1c30]">
                <span className={`w-2 h-2 rounded-full ${loading ? 'bg-secondary animate-pulse' : 'bg-[#ba1a1a] animate-ping'}`} />
                ACTIVE TASKS ({tasks.length})
              </span>
              {criticalCount > 0 && (
                <span className="bg-[#ffdad6] text-[#93000a] px-2 py-0.5 rounded-full text-[10px]">{criticalCount} CRITICAL</span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {!loading && filtered.length === 0 && (
              <div className="p-4 text-center text-xs text-[#76777d]">No active tasks match.</div>
            )}
            {filtered.map((task) => {
              const selected = selectedTaskCode === task.taskCode;
              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskCode(task.taskCode)}
                  className={`relative rounded-xl p-3 cursor-pointer transition-all border ${
                    selected ? 'bg-[#eff4ff] border-[#0051d5] shadow-xs' : 'bg-white border-[#e5eeff] hover:bg-[#f8f9ff]'
                  }`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${
                    task.priority === 'CRITICAL' ? 'bg-[#ba1a1a]' : task.priority === 'HIGH' ? 'bg-[#316bf3]' : 'bg-[#c6c6cd]'
                  }`} />
                  <div className="pl-1.5">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono text-xs font-bold text-[#0051d5]">#{task.taskCode}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        task.priority === 'CRITICAL' ? 'bg-[#ffdad6] text-[#93000a]' : task.priority === 'HIGH' ? 'bg-[#dbe1ff] text-[#00174b]' : 'bg-[#e5eeff] text-[#45464d]'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-[#0b1c30] leading-snug">{task.title}</h4>
                    {task.incident?.title && <p className="text-[11px] text-[#45464d] truncate mt-0.5">{task.incident.title}</p>}
                    <div className="mt-2 pt-2 border-t border-[#e5eeff] flex items-center justify-between text-[11px]">
                      <span className="text-[#ba1a1a] font-bold font-mono">{slaLabel(task.slaMinutesRemaining)}</span>
                      <span className="text-[#0b1c30] font-semibold">{task.assignedUnit?.callsign ?? 'Unassigned'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* COLUMN 2: Real Task Detail Panel */}
        <main className="flex-1 bg-white flex flex-col overflow-y-auto p-6">
          {!selectedDetail ? (
            <div className="flex-1 flex items-center justify-center text-[#76777d] text-sm">
              Select a task from the queue to view its real detail.
            </div>
          ) : (
            <div className="max-w-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold bg-[#0f172a] text-white px-2 py-0.5 rounded">#{selectedDetail.taskCode}</span>
                  <h3 className="text-lg font-bold text-[#0b1c30] mt-2">{selectedDetail.title}</h3>
                  {selectedDetail.incident?.title && <p className="text-xs text-[#45464d]">{selectedDetail.incident.title}</p>}
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a] text-[10px] font-bold">
                  {selectedDetail.priority}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#eff4ff] p-2.5 rounded-xl text-center border border-[#d3e4fe]">
                  <span className="text-[10px] text-[#45464d] block">Status</span>
                  <span className="text-sm font-extrabold text-[#0b1c30] block">{selectedDetail.status.replace(/_/g, ' ')}</span>
                </div>
                <div className="bg-[#eff4ff] p-2.5 rounded-xl text-center border border-[#d3e4fe]">
                  <span className="text-[10px] text-[#45464d] block">SLA</span>
                  <span className="text-sm font-extrabold text-[#0b1c30] block">{slaLabel(selectedDetail.slaMinutesRemaining)}</span>
                </div>
                <div className="bg-[#eff4ff] p-2.5 rounded-xl text-center border border-[#d3e4fe]">
                  <span className="text-[10px] text-[#45464d] block">Unit</span>
                  <span className="text-sm font-extrabold text-[#0b1c30] block">{selectedDetail.assignedUnit?.callsign ?? '—'}</span>
                </div>
              </div>

              {selectedDetail.asset && (
                <div className="bg-[#eff4ff] p-3 rounded-xl border border-[#d3e4fe]">
                  <span className="text-[11px] text-[#45464d] uppercase font-bold block mb-1">Target Asset</span>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{selectedDetail.asset.name}</span>
                    <span className="text-xs text-[#0051d5] font-semibold">{selectedDetail.asset.operationalStatus}</span>
                  </div>
                </div>
              )}

              {selectedDetail.description && (
                <p className="text-xs text-[#45464d] leading-relaxed bg-[#f8f9ff] p-3 rounded-xl">{selectedDetail.description}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/rescue/mission/${selectedDetail.taskCode}`)}
                  className="flex-1 h-10 rounded-xl bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0b1c30] font-bold text-xs transition-colors border border-[#d3e4fe]"
                >
                  Open Full Dossier
                </button>
                <button
                  onClick={() => selectedDetail.incident && navigate(`/rescue/hazard/${selectedDetail.incident.id}`)}
                  className="flex-1 h-10 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Cascade / Hazard Intel</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
export default RescueCommandConsolePage;
