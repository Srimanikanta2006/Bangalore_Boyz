import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Shield, AlertTriangle, RefreshCw,
  Send, FileText, Map as MapIcon, ClipboardList, CheckCircle2,
} from 'lucide-react';
import { fetchTaskDetail, updateFieldTaskStatus, type TaskDto } from '../../services/api';

export const RescueStatusReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const taskCode = id ?? '';

  const [task, setTask] = useState<TaskDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [transmitting, setTransmitting] = useState(false);
  const [transmitted, setTransmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskCode) return;
    fetchTaskDetail(taskCode)
      .then(setTask)
      .catch((err) => setLoadError((err as Error)?.message ?? 'Failed to load mission.'))
      .finally(() => setLoading(false));
  }, [taskCode]);

  const handleTransmit = async () => {
    if (!task || transmitting) return;
    setTransmitting(true);
    setSubmitError(null);
    try {
      // Real state transition: task -> COMPLETED, with the field note persisted
      // to TaskStatusHistory (visible to Government via the task's audit trail).
      await updateFieldTaskStatus(task.taskCode, 'COMPLETED', notes || undefined);
      setTransmitted(true);
      setTimeout(() => setTransmitted(false), 3000);
    } catch (err) {
      setSubmitError((err as Error)?.message ?? 'Failed to transmit sitrep. The task may already be in a terminal state.');
    } finally {
      setTransmitting(false);
    }
  };

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen flex flex-col font-sans pb-36">
      <header className="fixed top-0 inset-x-0 z-50 bg-[#f8f9ff]/90 backdrop-blur-xl border-b border-[#e5eeff] shadow-sm">
        <div className="h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center text-[#0b1c30] hover:text-[#0051d5] active:scale-95 transition-all rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight leading-none text-[#0b1c30]">ClimateShield</span>
              <span className="text-[11px] text-[#45464d] leading-none mt-0.5">Sitrep Report • #{taskCode}</span>
            </div>
          </div>
          {task?.assignedUnit && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#dce9ff] text-[#0b1c30] text-xs font-semibold">
              {task.assignedUnit.callsign}
            </span>
          )}
        </div>
      </header>

      <main className="flex flex-col pt-20 flex-grow px-4 space-y-3 pb-8">
        {loading && (
          <div className="flex flex-col items-center py-16 gap-2 text-[#45464d]">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span className="text-sm">Loading mission…</span>
          </div>
        )}
        {loadError && <div className="rounded-xl bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">{loadError}</div>}

        {!loading && task && (
          <>
            {/* Mission Telemetry Overview Card — real */}
            <section className="bg-white rounded-xl p-4 shadow-sm border border-[#e5eeff] space-y-2 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#0051d5] text-white">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-xs text-[#0051d5] uppercase font-bold tracking-wider">{task.status.replace(/_/g, ' ')}</span>
                </div>
                <span className="text-xs text-[#45464d] bg-[#eff4ff] px-2.5 py-0.5 rounded-full font-mono font-semibold">
                  {task.priority}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#0b1c30] tracking-tight">{task.title}</h1>
                <div className="flex flex-wrap items-center gap-2 text-[#45464d] text-xs mt-1">
                  <span className="flex items-center gap-1 font-semibold text-[#0b1c30]">
                    <Shield className="w-3.5 h-3.5 text-[#0051d5]" />
                    {task.assignedUnit?.callsign ?? 'Unassigned'}
                  </span>
                  {task.incident?.title && (
                    <>
                      <span>•</span>
                      <span>{task.incident.title}</span>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* Field Commander Notes — the ONLY free-form field, persisted for real */}
            <section className="bg-white rounded-xl p-4 shadow-sm border border-[#e5eeff] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#0b1c30] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#0051d5]" />
                  Field Sitrep Notes
                </label>
                <span className="text-[11px] text-[#45464d]">{notes.length}/1000</span>
              </div>
              <textarea
                rows={5}
                maxLength={1000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe the outcome: civilians assisted, hazards encountered, equipment used, handoff notes for Government review…"
                className="w-full bg-[#eff4ff] rounded-xl p-3 text-xs text-[#0b1c30] focus:outline-none focus:ring-1 focus:ring-[#0051d5] resize-none leading-relaxed border border-[#d3e4fe]"
              />
              <p className="text-[11px] text-[#45464d]">
                This note is saved to the task's real status history and visible to Government operators reviewing this mission.
              </p>
            </section>

            {submitError && (
              <div className="rounded-xl bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">{submitError}</div>
            )}

            {/* Sticky Operational Bottom CTA */}
            <div className="pt-1 space-y-2">
              <button
                type="button"
                onClick={handleTransmit}
                disabled={transmitting || task.status === 'COMPLETED' || task.status === 'CANCELLED'}
                className={`w-full h-12 rounded-xl text-white font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-60 ${
                  transmitted ? 'bg-emerald-600' : transmitting ? 'bg-[#0051d5]' : 'bg-[#0f172a] hover:bg-[#1e293b]'
                }`}
              >
                {transmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>SUBMITTING…</span>
                  </>
                ) : transmitted ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                    <span>MISSION MARKED COMPLETE</span>
                  </>
                ) : task.status === 'COMPLETED' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>ALREADY COMPLETED</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>SUBMIT SITREP & MARK COMPLETE</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </main>

      {/* Rescue Role Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-t border-[#e5eeff] pb-safe shadow-md">
        <div className="grid grid-cols-4 items-center h-16 px-2 max-w-lg mx-auto">
          <Link to="/rescue/tactical" className="flex flex-col items-center justify-center min-h-[44px] gap-0.5 text-[#45464d] hover:text-[#0051d5] transition-colors">
            <MapIcon className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Map</span>
          </Link>
          <Link to={`/rescue/mission/${taskCode}`} className="flex flex-col items-center justify-center min-h-[44px] gap-0.5 text-[#45464d] hover:text-[#0051d5] transition-colors">
            <ClipboardList className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Missions</span>
          </Link>
          <Link to="/rescue/console" className="flex flex-col items-center justify-center min-h-[44px] gap-0.5 text-[#45464d] hover:text-[#0051d5] transition-colors">
            <Shield className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Console</span>
          </Link>
          <Link to={`/rescue/report/${taskCode}`} className="flex flex-col items-center justify-center min-h-[44px] gap-0.5 text-[#0051d5] font-bold">
            <FileText className="w-5 h-5" />
            <span className="text-[11px]">Reports</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};
export default RescueStatusReportPage;
