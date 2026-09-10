import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  CheckSquare,
  ShieldAlert,
  CloudRain,
  Flame,
  UserCheck,
  Zap,
} from 'lucide-react';
import { Alert, Asset, AssetRiskAssessment } from '../types';

interface AlertsPageProps {
  alerts: Alert[];
  assets: Asset[];
  risks: AssetRiskAssessment[];
  onUpdateAlertStatus: (
    alertId: string,
    status: Alert['status'],
    actorName: string,
    notes?: string
  ) => void;
  onOpenCreatePlan: (asset: Asset, risk: AssetRiskAssessment) => void;
  onNavigate: (route: string) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  alerts,
  assets,
  risks,
  onUpdateAlertStatus,
  onOpenCreatePlan,
  onNavigate,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | Alert['status']>('ALL');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(alerts[0]?.id || null);

  const riskMap = new Map<string, AssetRiskAssessment>();
  for (const r of risks) riskMap.set(r.assetId, r);

  const filteredAlerts = alerts.filter((a) => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    return true;
  });

  const selectedAlert = alerts.find((a) => a.id === selectedAlertId) || alerts[0];
  const targetAsset = selectedAlert ? assets.find((a) => a.id === selectedAlert.assetId) : null;
  const targetRisk = selectedAlert ? riskMap.get(selectedAlert.assetId) : null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-sky-800" />
            <span>Operational Hazard Alerts</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated alerts triggered by threshold breaches in pluvial runoff or heat strain indices
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 text-xs bg-white p-1 rounded-lg border border-slate-200">
          {(['ALL', 'NEW', 'ACKNOWLEDGED', 'ESCALATED', 'RESOLVED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                statusFilter === st
                  ? 'bg-sky-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Alerts List on Left (7 cols) + Detail Panel on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-2.5">
          {filteredAlerts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-slate-400 text-xs">
              No alerts found for the selected status.
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isSelected = selectedAlert?.id === alert.id;
              const isCritical = alert.severity === 'CRITICAL';
              const isHigh = alert.severity === 'HIGH';

              return (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlertId(alert.id)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition ${
                    isSelected
                      ? 'bg-sky-50/60 border-sky-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded border uppercase ${
                          isCritical
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : isHigh
                            ? 'bg-orange-50 text-orange-800 border-orange-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        {alert.severity} {alert.hazardType}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{alert.assetName}</span>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        alert.status === 'NEW'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : alert.status === 'ACKNOWLEDGED'
                          ? 'bg-sky-50 text-sky-800 border-sky-200'
                          : alert.status === 'ESCALATED'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {alert.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 flex items-center gap-2">
                    <span>{alert.wardName}</span>
                    <span>&bull;</span>
                    <span className="font-semibold text-slate-800">
                      Risk Score: {alert.triggerMetrics.compositeScore}/100
                    </span>
                    <span>&bull;</span>
                    <span className="text-slate-400 font-mono">
                      Detected: {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 mt-1.5 line-clamp-1">
                    {alert.sop.primaryAction}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Right 5 Cols: Selected Alert Action Drawer */}
        {selectedAlert && (
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between text-xs space-y-4">
            <div>
              <div className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold mb-1">
                  <span>Alert Directive</span>
                  <span className="font-mono">{selectedAlert.sop.sopId}</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 leading-tight">
                  {selectedAlert.title}
                </h3>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Affected Facility: <strong className="text-slate-700">{selectedAlert.assetName}</strong>
                </div>
              </div>

              {/* Primary Directive Box */}
              <div className="p-3 rounded-md bg-slate-50 border border-slate-200 mt-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Primary SOP Directive
                </div>
                <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                  {selectedAlert.sop.primaryAction}
                </p>
              </div>

              {/* Tactical Steps */}
              <div className="mt-3 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Execution Checklist:
                </div>
                {selectedAlert.sop.tacticalSteps.map((step, idx) => (
                  <div key={idx} className="p-2 rounded bg-white border border-slate-200 text-[11px] text-slate-700">
                    {step}
                  </div>
                ))}
              </div>

              {/* Responder Squad & SLA */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Designated Squad</span>
                  <span className="font-semibold text-slate-800">{selectedAlert.sop.assignedTeam}</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Priority SLA</span>
                  <span className="font-semibold text-slate-800">{selectedAlert.sop.prioritySlaMinutes} Minutes</span>
                </div>
              </div>
            </div>

            {/* Workflow Action Buttons */}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              {targetAsset && targetRisk && (
                <button
                  onClick={() => onOpenCreatePlan(targetAsset, targetRisk)}
                  className="w-full py-2 px-3 rounded-md bg-sky-900 hover:bg-sky-800 text-white font-semibold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Create Response Plan & Deploy Tasks</span>
                </button>
              )}

              <div className="flex items-center gap-2">
                {selectedAlert.status !== 'ACKNOWLEDGED' && selectedAlert.status !== 'RESOLVED' && (
                  <button
                    onClick={() =>
                      onUpdateAlertStatus(selectedAlert.id, 'ACKNOWLEDGED', 'Duty Dispatcher', 'Acknowledged by operator')
                    }
                    className="flex-1 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs text-center transition"
                  >
                    Acknowledge
                  </button>
                )}

                {selectedAlert.status !== 'ESCALATED' && selectedAlert.status !== 'RESOLVED' && (
                  <button
                    onClick={() =>
                      onUpdateAlertStatus(selectedAlert.id, 'ESCALATED', 'Duty Dispatcher', 'Escalated to District Lead')
                    }
                    className="flex-1 py-1.5 rounded-md border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium text-xs text-center transition"
                  >
                    Escalate
                  </button>
                )}

                {selectedAlert.status !== 'RESOLVED' && (
                  <button
                    onClick={() =>
                      onUpdateAlertStatus(selectedAlert.id, 'RESOLVED', 'Duty Dispatcher', 'Hazard condition cleared')
                    }
                    className="flex-1 py-1.5 rounded-md border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium text-xs text-center transition"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
