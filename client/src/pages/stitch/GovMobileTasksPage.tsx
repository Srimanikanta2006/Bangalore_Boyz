import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Radio, User, Shield, CheckCircle2, RefreshCw,
  Map as MapIcon, ClipboardList, CheckSquare, Clock, Zap,
} from 'lucide-react';
import { fetchFieldTasks, verifyTask, type TaskDto, type TaskStatusValue } from '../../services/api';

const POLL_INTERVAL_MS = 15000;
const STEPS: TaskStatusValue[] = ['ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED'];

function slaLabel(minutes: number | null): string {
  if (minutes == null) return 'No SLA';
  if (minutes <= 0) return 'OVERDUE';
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export const GovMobileTasksPage: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | TaskStatusValue>('all');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const results = await Promise.all(
        (['ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED'] as TaskStatusValue[]).map((status) => fetchFieldTasks({ status, limit: 25 })),
      );
      setTasks(results.flatMap((r) => r.items));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  const handleVerify = async (task: TaskDto) => {
    setVerifyingId(task.id);
    setVerifyError(null);
    try {
      await verifyTask(task.taskCode);
      await load();
    } catch (err) {
      setVerifyError((err as Error)?.message ?? 'Verification failed.');
    } finally {
      setVerifyingId(null);
    }
  };

  const deployed = tasks.filter((t) => t.status === 'ASSIGNED').length;
  const mobilizing = tasks.filter((t) => t.status === 'ACKNOWLEDGED').length;
  const operating = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const pendingVerification = tasks.filter((t) => t.status === 'COMPLETED' && !t.verifiedAt);

  const filtered = activeFilter === 'all' ? tasks : tasks.filter((t) => t.status === activeFilter);

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen flex flex-col font-sans pb-32">
      <header className="fixed top-0 inset-x-0 z-50 bg-[#f8f9ff]/85 backdrop-blur-xl border-b border-[#e5eeff] shadow-xs">
        <div className="h-20 px-4 flex flex-col justify-center gap-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0f172a] text-white flex items-center justify-center font-bold text-xs">GOV</div>
              <span className="font-bold text-base tracking-tight text-[#0b1c30]">Tasks</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#0f172a] flex items-center justify-center text-white">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full pt-20 px-4 gap-3">
        <div className="flex items-center justify-between bg-[#eff4ff] px-3.5 py-2 rounded-xl border border-[#d3e4fe] mt-2 text-xs">
          <span className="font-bold text-[#0b1c30]">Real Task State (live)</span>
          <button onClick={load} className="flex items-center gap-1.5 text-[#45464d] font-mono">
            <RefreshCw className={`w-3 h-3 text-[#0051d5] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Real Operational Metrics */}
        <section className="grid grid-cols-2 gap-2">
          <div className="bg-white p-3 rounded-2xl shadow-xs border border-[#e5eeff] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] uppercase text-[#45464d] font-semibold">
              <span>Assigned</span>
              <Shield className="w-4 h-4 text-[#0051d5]" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold text-[#0b1c30]">{deployed}</span>
              <span className="text-xs text-[#45464d]">Tasks</span>
            </div>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-xs border border-[#e5eeff] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] uppercase text-[#45464d] font-semibold">
              <span>Mobilizing</span>
              <Clock className="w-4 h-4 text-[#316bf3]" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold text-[#0b1c30]">{mobilizing}</span>
              <span className="text-xs text-[#45464d]">Acknowledged</span>
            </div>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-xs border border-[#e5eeff] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] uppercase text-[#45464d] font-semibold">
              <span>Operating</span>
              <Zap className="w-4 h-4 text-[#0051d5]" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold text-[#0b1c30]">{operating}</span>
              <span className="text-xs text-[#45464d]">On Scene</span>
            </div>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-xs border border-[#e5eeff] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] uppercase text-[#45464d] font-semibold">
              <span>Verification</span>
              <CheckCircle2 className="w-4 h-4 text-[#0090a9]" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold text-[#0b1c30]">{pendingVerification.length}</span>
              <span className="text-xs text-[#45464d]">Pending Audit</span>
            </div>
          </div>
        </section>

        <div className="flex items-center overflow-x-auto gap-1.5 pb-1 no-scrollbar text-xs font-semibold">
          {(['all', 'ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
                activeFilter === f ? 'bg-[#0f172a] text-white shadow-xs' : 'bg-white text-[#45464d] border border-[#e5eeff]'
              }`}
            >
              {f === 'all' ? 'All Tasks' : f.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {verifyError && <div className="rounded-xl bg-red-50 border border-red-200 text-red-800 px-3 py-2 text-xs">{verifyError}</div>}

        {/* Real Task Cards */}
        <div className="flex flex-col gap-3">
          {!loading && filtered.length === 0 && (
            <div className="p-6 text-center text-sm text-[#76777d] bg-white rounded-2xl border border-[#e5eeff]">No tasks match this filter.</div>
          )}
          {filtered.map((task) => {
            const stepIndex = STEPS.indexOf(task.status);
            const canVerify = task.status === 'COMPLETED' && !task.verifiedAt;
            return (
              <article key={task.id} className="bg-white rounded-2xl shadow-sm border border-[#e5eeff] p-4 flex flex-col gap-2.5 relative overflow-hidden">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-[#45464d] uppercase tracking-wider font-semibold">
                      {task.assignedDepartment?.name ?? 'Unassigned Dept'} • {task.priority}
                    </span>
                    <h2 className="text-base font-bold text-[#0b1c30] leading-snug mt-0.5">{task.title}</h2>
                    {task.incident?.title && <p className="text-xs text-[#45464d] mt-0.5">{task.incident.title}</p>}
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#eff4ff] text-[#0051d5] text-xs font-bold shrink-0">
                    {slaLabel(task.slaMinutesRemaining)}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-[#eff4ff] px-3 py-2 rounded-xl border border-[#d3e4fe]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#dbe1ff] text-[#0051d5] flex items-center justify-center">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#0b1c30] block">{task.assignedUnit?.callsign ?? 'Unassigned unit'}</span>
                      <span className="text-[10px] text-[#45464d]">{task.assignedUnit?.name ?? '—'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/rescue/mission/${task.taskCode}`)}
                    className="text-[10px] text-[#0051d5] font-bold uppercase"
                  >
                    View Dossier
                  </button>
                </div>

                {/* Real workflow progress (from actual task.status) */}
                <div className="grid grid-cols-4 gap-1 py-1 text-center">
                  {STEPS.map((s, i) => (
                    <div key={s}>
                      <div className={`w-full h-1.5 rounded-full ${i <= stepIndex ? 'bg-[#0051d5]' : 'bg-[#dbe1ff]'}`} />
                      <span className={`text-[9px] mt-1 block ${i === stepIndex ? 'text-[#0b1c30] font-bold' : 'text-[#45464d]'}`}>
                        {s.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleVerify(task)}
                  disabled={!canVerify || verifyingId === task.id}
                  className={`w-full h-11 rounded-xl text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 ${
                    task.verifiedAt ? 'bg-emerald-600' : 'bg-[#0f172a] hover:bg-[#1e293b]'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>
                    {verifyingId === task.id
                      ? 'Verifying…'
                      : task.verifiedAt
                        ? 'Verified & Closed'
                        : canVerify
                          ? 'Verify & Clear Task'
                          : `Awaiting ${task.status === 'COMPLETED' ? 'closure' : task.status.replace(/_/g, ' ').toLowerCase()}`}
                  </span>
                </button>
              </article>
            );
          })}
        </div>
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-t border-[#e5eeff] pb-safe shadow-md">
        <div className="flex justify-around items-center h-16 px-4 max-w-lg mx-auto">
          <Link to="/gov/mobile/map" className="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] gap-0.5 text-[#45464d] hover:text-[#0051d5] transition-colors">
            <MapIcon className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Map</span>
          </Link>
          <Link to="/gov/mobile/triage" className="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] gap-0.5 text-[#45464d] hover:text-[#0051d5] transition-colors">
            <ClipboardList className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Incidents</span>
          </Link>
          <Link to="/gov/mobile/tasks" className="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] gap-0.5 text-[#0051d5] font-bold">
            <CheckSquare className="w-5 h-5" />
            <span className="text-[11px]">Tasks</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};
export default GovMobileTasksPage;
