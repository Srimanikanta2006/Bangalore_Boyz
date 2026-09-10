import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, AlertTriangle, Timer, Shield,
  Navigation, User, CheckCircle2,
} from 'lucide-react';
import { fetchTaskDetail, updateFieldTaskStatus, type TaskDto, type TaskHistoryEntry } from '../../services/api';

type TaskDetail = TaskDto & { history: TaskHistoryEntry[] };

function slaLabel(minutes: number | null): string {
  if (minutes == null) return 'No SLA deadline';
  if (minutes <= 0) return 'SLA OVERDUE';
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return h > 0 ? `${h}h ${m}m to SLA` : `${m}m to SLA`;
}

const SEVERITY_STYLE: Record<string, { bar: string; badgeBg: string; badgeText: string }> = {
  CRITICAL: { bar: 'bg-[#ba1a1a]', badgeBg: 'bg-[#ffdad6]', badgeText: 'text-[#93000a]' },
  HIGH: { bar: 'bg-[#ea580c]', badgeBg: 'bg-[#ffedd5]', badgeText: 'text-[#c2410c]' },
  MODERATE: { bar: 'bg-[#d97706]', badgeBg: 'bg-[#fef3c7]', badgeText: 'text-[#b45309]' },
  LOW: { bar: 'bg-[#16a34a]', badgeBg: 'bg-[#dcfce7]', badgeText: 'text-[#15803d]' },
};

export const RescueMissionDossierPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const missionId = id ?? '';

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (!missionId) return;
    let cancelled = false;
    setLoading(true);
    fetchTaskDetail(missionId)
      .then((d) => !cancelled && setTask(d))
      .catch((err) => !cancelled && setError((err as Error)?.message ?? 'Failed to load mission.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [missionId]);

  const handleActivate = async () => {
    if (!task || activating) return;
    setActivating(true);
    setError(null);
    try {
      // Real status transition: ASSIGNED -> ACKNOWLEDGED, or straight to IN_PROGRESS if already acknowledged.
      const nextStatus = task.status === 'ASSIGNED' ? 'ACKNOWLEDGED' : 'IN_PROGRESS';
      await updateFieldTaskStatus(task.taskCode, nextStatus);
      navigate(`/rescue/navigate/${task.taskCode}`);
    } catch (err) {
      setError((err as Error)?.message ?? 'Failed to update mission status.');
    } finally {
      setActivating(false);
    }
  };

  const severity = task?.incident?.severity ?? 'MODERATE';
  const style = SEVERITY_STYLE[severity] ?? SEVERITY_STYLE.MODERATE;

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen flex flex-col font-sans pb-36">
      {/* Fixed Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#f8f9ff]/90 backdrop-blur-xl border-b border-[#e5eeff] shadow-sm">
        <div className="h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              aria-label="Go back"
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center text-[#0b1c30] hover:text-[#0051d5] active:scale-95 transition-all rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight uppercase leading-none text-[#0b1c30]">Mission Detail</span>
              <span className="text-[11px] text-[#45464d] font-mono mt-0.5">#{missionId}</span>
            </div>
          </div>
          {task?.assignedUnit && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#dce9ff] text-[#0b1c30] text-xs font-semibold">
              {task.assignedUnit.callsign}
            </span>
          )}
        </div>
      </header>

      <main className="flex flex-col pt-16 flex-grow">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 text-[#45464d] gap-2">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span className="text-sm">Loading mission…</span>
          </div>
        )}

        {error && !loading && (
          <div className="mx-4 mt-3 rounded-xl bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">{error}</div>
        )}

        {!loading && task && (
          <div className="flex flex-col px-4 pt-3 space-y-3">
            {/* Primary Tactical Briefing Card — real task/incident data */}
            <div className="relative overflow-hidden rounded-xl bg-white shadow-sm border border-[#e5eeff] p-4">
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${style.bar}`} />
              <div className="flex items-center justify-between gap-2 mb-2 pl-1 flex-wrap">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${style.badgeBg} ${style.badgeText}`}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span className="text-[11px] tracking-wide font-bold uppercase">{task.priority} Priority</span>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#d3e4fe] text-[#0b1c30]">
                  <Timer className="w-3.5 h-3.5 text-[#ba1a1a]" />
                  <span className="text-xs font-bold text-[#ba1a1a] tracking-tight font-mono">{slaLabel(task.slaMinutesRemaining)}</span>
                </div>
              </div>

              <div className="space-y-1 pl-1">
                <span className="text-xs uppercase tracking-wider text-[#0051d5] font-bold">
                  {task.incident ? `Incident #${task.incident.incidentCode}` : 'No linked incident'}
                </span>
                <h2 className="text-xl font-bold text-[#0b1c30] leading-tight">{task.title}</h2>
                {task.incident?.title && <p className="text-sm text-[#45464d]">{task.incident.title}</p>}
              </div>

              {task.description && (
                <div className="mt-3 p-3 rounded-lg bg-[#eff4ff] border border-[#d3e4fe]">
                  <p className="text-sm text-[#0b1c30] leading-snug">{task.description}</p>
                </div>
              )}
            </div>

            {/* Asset context (real) */}
            {task.asset && (
              <div className="rounded-xl bg-white p-4 shadow-sm border border-[#e5eeff]">
                <h3 className="font-bold text-sm text-[#0b1c30] uppercase tracking-wide mb-2">Target Asset</h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{task.asset.name} ({task.asset.assetCode})</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#0051d5] font-bold">{task.asset.operationalStatus}</span>
                </div>
                <span className="text-xs text-[#45464d] mt-1 block">{task.asset.type.replace(/_/g, ' ')}</span>
              </div>
            )}

            {/* Assigned Unit — real */}
            <div className="rounded-xl bg-white p-4 shadow-sm border border-[#e5eeff]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#0051d5]" />
                  <h3 className="font-bold text-sm text-[#0b1c30] uppercase tracking-wide">Assigned Unit</h3>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#dbe1ff] text-[#00174b] font-bold">
                  {task.assignedUnit?.callsign ?? 'Unassigned'}
                </span>
              </div>
              {task.assignedUnit ? (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-[#eff4ff]">
                  <div className="w-7 h-7 rounded-full bg-[#131b2e] text-white flex items-center justify-center text-xs font-bold font-mono">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#0b1c30] block truncate">{task.assignedUnit.name}</span>
                    <span className="text-[10px] text-[#45464d] block truncate">
                      {task.assignedUnit.type.replace(/_/g, ' ')} · {task.assignedUnit.departmentName ?? 'No department'} · {task.assignedUnit.status}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#45464d]">No unit assigned to this task yet.</p>
              )}
            </div>

            {/* Status history — real */}
            {task.history?.length > 0 && (
              <div className="rounded-xl bg-white p-4 shadow-sm border border-[#e5eeff]">
                <h3 className="font-bold text-sm text-[#0b1c30] uppercase tracking-wide mb-2">Status History</h3>
                <div className="flex flex-col gap-1.5">
                  {task.history.map((h) => (
                    <div key={h.id} className="flex items-center justify-between text-xs">
                      <span className="text-[#0b1c30] font-semibold">{h.fromStatus ?? '—'} → {h.toStatus}</span>
                      <span className="text-[#45464d]">{new Date(h.createdAt).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Docked Sticky Bottom Operational Action Bar */}
      {!loading && task && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md pb-safe border-t border-[#e5eeff] shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col items-center px-4 pt-2.5 pb-3 space-y-2 max-w-lg mx-auto">
            <button
              onClick={handleActivate}
              disabled={activating || task.status === 'COMPLETED' || task.status === 'CANCELLED'}
              className={`w-full h-12 rounded-xl flex items-center justify-center gap-2 text-white font-bold uppercase tracking-wider text-sm shadow-md transition-all active:scale-[0.99] disabled:opacity-60 ${
                activating ? 'bg-[#0f172a]' : 'bg-[#ba1a1a] hover:bg-[#93000a] shadow-[#ba1a1a]/25'
              }`}
            >
              {activating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>UPDATING STATUS…</span>
                </>
              ) : task.status === 'COMPLETED' ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>MISSION COMPLETED</span>
                </>
              ) : (
                <>
                  <Navigation className="w-5 h-5 fill-current" />
                  <span>{task.status === 'ASSIGNED' ? 'ACKNOWLEDGE & ACTIVATE NAV' : 'START MISSION & ACTIVATE NAV'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default RescueMissionDossierPage;
