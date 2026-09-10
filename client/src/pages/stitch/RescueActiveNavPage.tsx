import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../../components/stitch/Header';
import { fetchTaskDetail, updateFieldTaskStatus, type TaskDto } from '../../services/api';

type Stage = 'assigned' | 'acknowledged' | 'in_progress' | 'done';

function stageFor(status: string | undefined): Stage {
  if (status === 'ASSIGNED') return 'assigned';
  if (status === 'ACKNOWLEDGED') return 'acknowledged';
  if (status === 'IN_PROGRESS') return 'in_progress';
  return 'done';
}

const STAGES: { key: Stage; label: string; icon: string }[] = [
  { key: 'assigned', label: 'Assigned', icon: 'assignment' },
  { key: 'acknowledged', label: 'En Route', icon: 'near_me' },
  { key: 'in_progress', label: 'On Scene', icon: 'pin_drop' },
  { key: 'done', label: 'Cleared', icon: 'task_alt' },
];

export const RescueActiveNavPage: React.FC = () => {
  const navigate = useNavigate();
  const { routeId } = useParams<{ routeId: string }>();
  const taskCode = routeId ?? '';

  const [task, setTask] = useState<TaskDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const load = () => {
    if (!taskCode) return;
    setLoading(true);
    fetchTaskDetail(taskCode)
      .then(setTask)
      .catch((err) => setError((err as Error)?.message ?? 'Failed to load mission.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [taskCode]);

  const stage = stageFor(task?.status);
  const stageIndex = STAGES.findIndex((s) => s.key === stage);

  const handleArrival = async () => {
    if (!task || updating) return;
    setUpdating(true);
    setError(null);
    try {
      await updateFieldTaskStatus(task.taskCode, 'IN_PROGRESS');
      load();
    } catch (err) {
      setError((err as Error)?.message ?? 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleReportHazard = () => task?.incident && navigate(`/rescue/hazard/${task.incident.id}`);

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen w-full max-w-[440px] mx-auto shadow-2xl border-x border-outline-variant/20">
      <Header
        title="Active Navigation"
        subtitle="ClimateShield Rescue"
        hasBack={true}
        onBack={() => navigate(-1)}
        rightElement={
          task?.assignedUnit ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm">
              {task.assignedUnit.callsign}
            </span>
          ) : undefined
        }
      />

      <main className="flex flex-col relative w-full pt-16 bg-surface flex-grow">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant gap-2">
            <span className="material-symbols-outlined text-[28px] animate-spin">progress_activity</span>
            <span className="text-sm">Loading mission…</span>
          </div>
        )}

        {error && (
          <div className="mx-4 mt-3 rounded-xl bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">{error}</div>
        )}

        {!loading && task && (
          <div className="flex flex-col w-full relative select-none">
            {/* Real Progress Stepper (reflects the actual Task state machine) */}
            <div className="sticky top-0 z-30 w-full bg-surface-container-lowest/95 backdrop-blur-md shadow-sm px-edge-margin-mobile py-2.5">
              <div className="flex items-center justify-between relative max-w-md mx-auto">
                <div className="absolute left-4 right-4 top-3.5 h-[2px] bg-surface-container-highest -z-0"></div>
                <div
                  className="absolute left-4 top-3.5 h-[2px] bg-secondary -z-0 transition-all duration-300"
                  style={{ width: `${(stageIndex / (STAGES.length - 1)) * 84 + 16}%` }}
                ></div>
                {STAGES.map((s, i) => (
                  <div key={s.key} className={`flex flex-col items-center gap-1 z-10 ${i === stageIndex ? '' : 'opacity-70'}`}>
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        i === stageIndex ? 'bg-secondary text-on-secondary shadow-md ring-4 ring-secondary/20' : 'bg-surface-container-high text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">{s.icon}</span>
                    </div>
                    <span className={`font-label-sm text-label-sm ${i === stageIndex ? 'text-secondary font-bold' : 'text-on-surface-variant font-medium'}`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Decorative map placeholder (chrome only — no fabricated telemetry) */}
            <div className="relative w-full h-[260px] overflow-hidden bg-surface-dim flex items-center justify-center">
              <span className="material-symbols-outlined text-[56px] text-on-surface/20">navigation</span>
            </div>

            {/* Mission summary sheet — real data */}
            <div className="relative w-full -mt-4 bg-surface-container-lowest rounded-t-2xl shadow-xl px-edge-margin-mobile pt-3 pb-8 z-20">
              <div className="w-10 h-1 rounded-full bg-surface-variant mx-auto mb-3"></div>

              <div className="p-3.5 rounded-xl bg-surface-container-low mb-3">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">
                  #{task.taskCode} · {task.priority}
                </span>
                <p className="font-title-lg text-title-lg text-on-surface mt-1">{task.title}</p>
                {task.incident?.title && (
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{task.incident.title}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 py-2 mb-3">
                <div className="flex flex-col p-2.5 rounded-lg bg-surface">
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Status</span>
                  <span className="font-data-metric-lg text-data-metric-lg text-on-surface tracking-tight mt-0.5">
                    {task.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex flex-col p-2.5 rounded-lg bg-surface">
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Target Asset</span>
                  <span className="font-body-md text-body-md font-bold text-on-surface truncate mt-1">
                    {task.asset?.name ?? 'No linked asset'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  className="w-full h-11 rounded-lg bg-primary text-on-primary font-title-lg text-title-lg font-semibold shadow-md active:scale-[0.99] transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
                  type="button"
                  onClick={handleArrival}
                  disabled={updating || task.status === 'IN_PROGRESS' || task.status === 'COMPLETED'}
                >
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  <span>{updating ? 'Updating…' : task.status === 'IN_PROGRESS' ? 'On Scene' : 'Mark Arrived On Scene'}</span>
                </button>

                <button
                  className="w-full h-10 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md font-medium shadow-sm active:bg-surface-container-low transition-colors flex items-center justify-center gap-2"
                  type="button"
                  onClick={handleReportHazard}
                >
                  <span className="material-symbols-outlined text-[18px] text-error">report_problem</span>
                  <span>View Hazard / Zone Detail</span>
                </button>

                <button
                  className="w-full h-10 rounded-lg bg-surface-container text-on-surface font-body-md text-body-md font-medium transition-colors flex items-center justify-center gap-2"
                  type="button"
                  onClick={() => navigate(`/rescue/report/${task.taskCode}`)}
                >
                  <span className="material-symbols-outlined text-[18px]">description</span>
                  <span>Submit Field Sitrep</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
export default RescueActiveNavPage;
