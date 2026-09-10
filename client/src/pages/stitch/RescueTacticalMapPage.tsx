import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/stitch/Header';
import { useAuth } from '../../auth/AuthContext';
import { fetchFieldTasks, type TaskDto } from '../../services/api';

const POLL_INTERVAL_MS = 15000;
const ACTIVE_STATUSES = ['ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS'] as const;

const PRIORITY_STYLE: Record<string, { border: string; badgeBg: string; badgeText: string }> = {
  CRITICAL: { border: 'border-error', badgeBg: 'bg-error-container', badgeText: 'text-on-error-container' },
  HIGH: { border: 'border-[#EA580C]', badgeBg: 'bg-[#FFEDD5]', badgeText: 'text-[#C2410C]' },
  MEDIUM: { border: 'border-secondary', badgeBg: 'bg-secondary-container', badgeText: 'text-on-secondary-container' },
  LOW: { border: 'border-outline-variant', badgeBg: 'bg-surface-container-high', badgeText: 'text-on-surface' },
};

function slaLabel(minutes: number | null): string {
  if (minutes == null) return 'No SLA';
  if (minutes <= 0) return 'OVERDUE';
  const m = Math.floor(minutes % 60);
  const h = Math.floor(minutes / 60);
  return h > 0 ? `${h}h ${m}m remaining` : `${m}m remaining`;
}

export const RescueTacticalMapPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const results = await Promise.all(ACTIVE_STATUSES.map((status) => fetchFieldTasks({ status })));
      const merged = results.flatMap((r) => r.items);
      merged.sort((a, b) => (a.slaMinutesRemaining ?? Infinity) - (b.slaMinutesRemaining ?? Infinity));
      setTasks(merged);
      setError(null);
    } catch (err) {
      setError((err as Error)?.message ?? 'Failed to load assigned missions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  const handleOpenDossier = (taskCode: string) => navigate(`/rescue/mission/${taskCode}`);
  const handleStartMission = (taskCode: string) => navigate(`/rescue/navigate/${taskCode}`);

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen w-full max-w-[440px] mx-auto shadow-2xl border-x border-outline-variant/20 select-none">
      {/* Tactical Header */}
      <Header
        title="Tactical Map"
        subtitle="ClimateShield Rescue"
        rightElement={
          <div className="flex items-center gap-space-xs">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              {user?.name ?? 'Field Operator'}
            </span>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
          </div>
        }
      />

      {/* Main Tactical Canvas */}
      <main className="flex flex-col relative w-full pt-16 pb-24 bg-surface flex-grow">
        {/* Telemetry Status Ribbon */}
        <div className="flex items-center justify-between px-edge-margin-mobile py-1 bg-surface-container-low text-on-surface-variant font-code-sm text-code-sm border-b border-surface-container">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-secondary">hub</span>
            <span>ClimateShield Backend Connected</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${error ? 'bg-error' : 'bg-emerald-600'}`}></span>
            <span className="font-label-sm text-label-sm uppercase text-on-surface font-bold">
              {error ? 'OFFLINE' : 'OP-READY'}
            </span>
          </div>
        </div>

        {/* Simplified decorative map viewport (chrome only; mission data below is real) */}
        <div className="relative w-full h-[220px] overflow-hidden bg-surface-container-low shadow-sm flex items-center justify-center">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30">map</span>
          <div className="absolute top-2.5 inset-x-edge-margin-mobile z-20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface/90 backdrop-blur-md shadow-md">
              <span className="material-symbols-outlined text-secondary text-[16px]">pin_drop</span>
              <span className="font-label-sm text-label-sm text-on-surface font-bold">
                {tasks[0]?.incident?.title ? tasks[0].incident!.title.slice(0, 28) : 'No active zone'}
              </span>
            </div>
          </div>
        </div>

        {/* Assigned Missions List — real active tasks */}
        <div className="flex flex-col w-full px-edge-margin-mobile pt-space-md gap-space-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-headline-md text-headline-md text-on-surface font-bold">Assigned Missions</span>
              <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-code-sm text-code-sm font-bold">
                {tasks.length}
              </span>
            </div>
            <span className="font-code-sm text-code-sm text-on-surface-variant flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-secondary animate-pulse' : 'bg-emerald-600'}`}></span>
              {loading ? 'Syncing…' : 'Live Sync'}
            </span>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-800 px-3 py-2 text-xs">{error}</div>
          )}

          {!loading && tasks.length === 0 && !error && (
            <div className="p-6 text-center text-sm text-on-surface-variant bg-surface-container-lowest rounded-xl">
              No active missions assigned right now.
            </div>
          )}

          <div className="w-full flex flex-col gap-space-sm pt-1">
            {tasks.map((task) => {
              const style = PRIORITY_STYLE[task.priority] ?? PRIORITY_STYLE.MEDIUM;
              return (
                <div
                  key={task.id}
                  className={`bg-surface-container-lowest rounded-xl shadow-md overflow-hidden flex flex-col relative border-l-4 ${style.border}`}
                >
                  <div className="p-space-md flex flex-col gap-space-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-code-sm text-code-sm font-bold text-on-surface tracking-wider">#{task.taskCode}</span>
                        {task.incident && (
                          <span className="font-label-sm text-label-sm text-on-surface-variant">• {task.incident.severity}</span>
                        )}
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold ${style.badgeBg} ${style.badgeText}`}>
                        <span className="material-symbols-outlined text-[13px]">timer</span>
                        <span>{slaLabel(task.slaMinutesRemaining)}</span>
                      </div>
                    </div>

                    <h3 className="font-title-lg text-title-lg text-on-surface leading-snug font-bold">
                      {task.title}
                    </h3>
                    {task.incident?.title && (
                      <span className="font-body-sm text-body-sm text-on-surface-variant">{task.incident.title}</span>
                    )}

                    <div className="grid grid-cols-2 gap-1.5 bg-surface-container-low p-2 rounded-lg text-on-surface">
                      <div className="flex flex-col">
                        <span className="font-label-sm text-[10px] text-on-surface-variant uppercase">Priority</span>
                        <span className="font-data-metric-md text-[14px] leading-tight font-bold">{task.priority}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-sm text-[10px] text-on-surface-variant uppercase">Status</span>
                        <span className="font-data-metric-md text-[14px] leading-tight font-bold text-secondary">{task.status.replace(/_/g, ' ')}</span>
                      </div>
                    </div>

                    {task.description && (
                      <div className="flex items-start gap-2 bg-surface-container p-2 rounded-lg text-on-surface">
                        <span className="material-symbols-outlined text-on-tertiary-container text-[18px] shrink-0">info</span>
                        <p className="font-body-sm text-body-sm text-on-surface-variant leading-tight">{task.description}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleOpenDossier(task.taskCode)}
                        className="flex-1 h-10 px-3 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md font-bold flex items-center justify-center gap-1 hover:bg-surface-container-highest transition-colors active:scale-95"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">folder_open</span>
                        <span>Dossier</span>
                      </button>
                      <button
                        onClick={() => handleStartMission(task.taskCode)}
                        className="flex-[2] h-10 px-4 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold flex items-center justify-center gap-1.5 shadow-md hover:bg-primary-container transition-all active:scale-95"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">near_me</span>
                        <span>Start Mission</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Floating Tactical Navigation Trigger */}
      {tasks[0] && (
        <aside className="fixed right-edge-margin-mobile bottom-20 z-40 pointer-events-auto">
          <button
            onClick={() => navigate(`/rescue/navigate/${tasks[0].taskCode}`)}
            aria-label="Navigate Mission"
            className="w-14 h-14 rounded-full bg-primary text-on-primary shadow-xl flex items-center justify-center hover:bg-surface-tint active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[26px]">navigation</span>
          </button>
        </aside>
      )}

      {/* Persistent Tactical Bottom Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_-1px_8px_rgba(0,0,0,0.06)]">
        <div className="grid grid-cols-4 items-center h-16 px-space-xs max-w-[440px] mx-auto">
          <button
            onClick={() => navigate('/rescue/tactical')}
            className="flex flex-col items-center justify-center min-h-[44px] gap-0.5 text-secondary font-bold"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">map</span>
            <span className="font-label-sm text-label-sm">Map</span>
          </button>
          <button
            onClick={() => tasks[0] && navigate(`/rescue/mission/${tasks[0].taskCode}`)}
            className="flex flex-col items-center justify-center min-h-[44px] gap-0.5 text-on-surface-variant hover:text-on-surface transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">assignment</span>
            <span className="font-label-sm text-label-sm">Missions</span>
          </button>
          <button
            onClick={() => navigate('/rescue/console')}
            className="flex flex-col items-center justify-center min-h-[44px] gap-0.5 text-on-surface-variant hover:text-on-surface transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">hub</span>
            <span className="font-label-sm text-label-sm">Console</span>
          </button>
          <button
            onClick={() => tasks[0] && navigate(`/rescue/report/${tasks[0].taskCode}`)}
            className="flex flex-col items-center justify-center min-h-[44px] gap-0.5 text-on-surface-variant hover:text-on-surface transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">description</span>
            <span className="font-label-sm text-label-sm">Sitrep</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default RescueTacticalMapPage;
