import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/stitch/Header';
import { BottomNav } from '../../components/stitch/BottomNav';
import { SosFab } from '../../components/stitch/SosFab';
import { fetchMyCitizenReports, fetchMySosEvents, type CitizenReport, type SosEvent } from '../../citizen/api';

/**
 * Closes the citizen -> government feedback loop: shows the REAL, live status
 * of every report/SOS this citizen submitted, including the linked government
 * Incident's own status as it moves through triage/dispatch/resolution.
 * Reuses GET /api/citizen/reports and GET /api/citizen/sos - no new backend.
 */

const REPORT_STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  SUBMITTED: { bg: 'bg-surface-container-high', text: 'text-on-surface', label: 'Submitted' },
  UNDER_REVIEW: { bg: 'bg-secondary-container', text: 'text-on-secondary-container', label: 'Under Review' },
  VERIFIED: { bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', label: 'Verified' },
  DISMISSED: { bg: 'bg-surface-container', text: 'text-on-surface-variant', label: 'Dismissed' },
  RESOLVED: { bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', label: 'Resolved' },
};

const SOS_STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  OPEN: { bg: 'bg-error-container', text: 'text-on-error-container', label: 'Open' },
  ACKNOWLEDGED: { bg: 'bg-secondary-container', text: 'text-on-secondary-container', label: 'Acknowledged' },
  DISPATCHED: { bg: 'bg-[#FFEDD5]', text: 'text-[#C2410C]', label: 'Dispatched' },
  RESOLVED: { bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', label: 'Resolved' },
  CANCELLED: { bg: 'bg-surface-container', text: 'text-on-surface-variant', label: 'Cancelled' },
};

const INCIDENT_STATUS_LABEL: Record<string, string> = {
  NEW: 'Reported — awaiting operator review',
  ACKNOWLEDGED: 'Acknowledged by Government',
  IN_PROGRESS: 'Response in progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

function prettyCategory(v: string): string {
  return v.toLowerCase().split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
}

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export const CitizenMyActivityPage: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<CitizenReport[] | null>(null);
  const [sosEvents, setSosEvents] = useState<SosEvent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'reports' | 'sos'>('reports');

  useEffect(() => {
    Promise.all([fetchMyCitizenReports(), fetchMySosEvents()])
      .then(([r, s]) => {
        setReports(r);
        setSosEvents(s);
      })
      .catch((err) => setError((err as Error)?.message ?? 'Failed to load your activity.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md min-h-screen flex flex-col relative w-full max-w-[440px] mx-auto shadow-2xl border-x border-outline-variant/20">
      <Header title="My Activity" subtitle="ClimateShield Citizen" hasBack onBack={() => navigate('/citizen/map')} />

      <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface">
        <div className="flex flex-col w-full px-edge-margin-mobile pt-space-sm gap-space-sm">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Real-time status of everything you've reported — including what Government has done about it.
          </p>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab('reports')}
              className={`flex-1 h-10 rounded-lg font-label-md text-label-md font-bold transition-colors ${
                tab === 'reports' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'
              }`}
            >
              Hazard Reports {reports ? `(${reports.length})` : ''}
            </button>
            <button
              type="button"
              onClick={() => setTab('sos')}
              className={`flex-1 h-10 rounded-lg font-label-md text-label-md font-bold transition-colors ${
                tab === 'sos' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'
              }`}
            >
              SOS History {sosEvents ? `(${sosEvents.length})` : ''}
            </button>
          </div>

          {loading && (
            <div className="flex flex-col items-center py-12 gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[28px] animate-spin">progress_activity</span>
              <span className="text-sm">Loading your activity…</span>
            </div>
          )}
          {error && !loading && (
            <div role="alert" className="rounded-lg bg-error-container/60 text-on-error-container px-3 py-2 text-sm">{error}</div>
          )}

          {!loading && tab === 'reports' && (
            <div className="flex flex-col gap-space-sm">
              {reports?.length === 0 && (
                <div className="p-6 text-center text-sm text-on-surface-variant bg-surface-container-lowest rounded-xl">
                  You haven't submitted any hazard reports yet.
                </div>
              )}
              {reports?.map((r) => {
                const style = REPORT_STATUS_STYLE[r.status] ?? REPORT_STATUS_STYLE.SUBMITTED;
                return (
                  <div key={r.id} className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-code-sm text-code-sm font-bold text-on-surface">{r.reportCode}</span>
                      <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold ${style.bg} ${style.text}`}>
                        {style.label}
                      </span>
                    </div>
                    <span className="font-title-lg text-title-lg text-on-surface font-bold">{prettyCategory(r.category)}</span>
                    {r.description && <p className="font-body-sm text-body-sm text-on-surface-variant">{r.description}</p>}
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{timeAgo(r.createdAt)}</span>
                      {r.incident && (
                        <span className="font-label-sm text-label-sm text-secondary font-semibold">
                          {INCIDENT_STATUS_LABEL[r.incident.status] ?? r.incident.status}
                        </span>
                      )}
                    </div>
                    {r.evidence.length > 0 && (
                      <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                        {r.evidence.length} photo(s) attached
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!loading && tab === 'sos' && (
            <div className="flex flex-col gap-space-sm">
              {sosEvents?.length === 0 && (
                <div className="p-6 text-center text-sm text-on-surface-variant bg-surface-container-lowest rounded-xl">
                  No SOS requests sent.
                </div>
              )}
              {sosEvents?.map((s) => {
                const style = SOS_STATUS_STYLE[s.status] ?? SOS_STATUS_STYLE.OPEN;
                return (
                  <div key={s.id} className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-code-sm text-code-sm font-bold text-on-surface">{s.sosCode}</span>
                      <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold ${style.bg} ${style.text}`}>
                        {style.label}
                      </span>
                    </div>
                    <span className="font-title-lg text-title-lg text-on-surface font-bold">{prettyCategory(s.primaryThreat)}</span>
                    {s.note && <p className="font-body-sm text-body-sm text-on-surface-variant">{s.note}</p>}
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{timeAgo(s.createdAt)}</span>
                      {s.incident && (
                        <span className="font-label-sm text-label-sm text-secondary font-semibold">
                          {INCIDENT_STATUS_LABEL[s.incident.status] ?? s.incident.status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <SosFab />
      <BottomNav activeTab="profile" />
    </div>
  );
};

export default CitizenMyActivityPage;
