import React, { useState } from 'react';
import {
  ShieldAlert,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertOctagon,
  ChevronRight,
  Flame,
  CloudRain,
  Wrench,
  Users,
  Send,
  History,
  FileCheck,
} from 'lucide-react';
import { Alert } from '../types';

interface AlertsPanelProps {
  alerts: Alert[];
  onUpdateAlertStatus: (
    alertId: string,
    newStatus: Alert['status'],
    actorName: string,
    notes?: string
  ) => void;
  onSelectAssetForExplain: (assetId: string) => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  onUpdateAlertStatus,
  onSelectAssetForExplain,
}) => {
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(
    alerts.length > 0 ? alerts[0].id : null
  );
  const [actorName, setActorName] = useState('Incident Commander - Vijay K.');
  const [actionNotes, setActionNotes] = useState('');

  const activeAlerts = alerts.filter((a) => a.status !== 'RESOLVED');
  const resolvedAlerts = alerts.filter((a) => a.status === 'RESOLVED');

  const selectedAlert = alerts.find((a) => a.id === selectedAlertId) || alerts[0];

  const handleNextStatus = (currentStatus: Alert['status']) => {
    if (!selectedAlert) return;
    let nextStatus: Alert['status'] = 'ACKNOWLEDGED';

    if (currentStatus === 'TRIGGERED') nextStatus = 'ACKNOWLEDGED';
    else if (currentStatus === 'ACKNOWLEDGED') nextStatus = 'DISPATCHED';
    else if (currentStatus === 'DISPATCHED') nextStatus = 'IN_PROGRESS';
    else if (currentStatus === 'IN_PROGRESS') nextStatus = 'RESOLVED';

    onUpdateAlertStatus(selectedAlert.id, nextStatus, actorName, actionNotes || undefined);
    setActionNotes('');
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 lg:p-6 shadow-xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            Active Climate Alerts & Response Playbooks (SOPs)
          </h2>
          <p className="text-xs text-slate-400">
            Automated environmental-data-to-action workflow with designated responder teams & SLAs
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-red-950/80 border border-red-500 text-red-300 font-bold">
            {activeAlerts.length} Active Incidents
          </span>
          <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
            {resolvedAlerts.length} Resolved
          </span>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-80" />
          <h3 className="text-base font-semibold text-slate-200">All Systems Nominal</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            No active flood inundation or extreme heat alerts currently exceed intervention thresholds.
            Use the simulation bar above to stress-test high-water or heatwave scenarios.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Alerts List */}
          <div className="lg:col-span-5 space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {alerts.map((alert) => {
              const isSelected = selectedAlert?.id === alert.id;
              const isCritical = alert.severity === 'CRITICAL';
              const isHigh = alert.severity === 'HIGH';

              return (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlertId(alert.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-500 shadow-md shadow-cyan-950/40'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        isCritical
                          ? 'bg-red-900 text-red-200 border border-red-500 animate-pulse'
                          : isHigh
                          ? 'bg-orange-900 text-orange-200 border border-orange-500'
                          : 'bg-amber-900 text-amber-200 border border-amber-500'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        alert.status === 'RESOLVED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : alert.status === 'IN_PROGRESS'
                          ? 'bg-blue-950 text-blue-300 border border-blue-700'
                          : alert.status === 'DISPATCHED'
                          ? 'bg-purple-950 text-purple-300 border border-purple-700'
                          : 'bg-amber-950 text-amber-300 border border-amber-700'
                      }`}
                    >
                      {alert.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-100 line-clamp-1">
                    {alert.assetName}
                  </h4>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <span>{alert.wardName}</span>
                    <span>&bull;</span>
                    <span className="font-medium text-cyan-300">
                      Score: {alert.triggerMetrics.compositeScore}/100
                    </span>
                  </div>

                  {/* Trigger metric pills */}
                  <div className="flex flex-wrap gap-1.5 mt-2 text-[10px]">
                    {alert.triggerMetrics.rainfallMmHr !== undefined && alert.triggerMetrics.rainfallMmHr > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60">
                        Rain {alert.triggerMetrics.rainfallMmHr} mm/h
                      </span>
                    )}
                    {alert.triggerMetrics.inundationDepthCm !== undefined && alert.triggerMetrics.inundationDepthCm > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60">
                        Depth ~{alert.triggerMetrics.inundationDepthCm}cm
                      </span>
                    )}
                    {alert.triggerMetrics.apparentTempC !== undefined && (
                      <span className="px-1.5 py-0.5 rounded bg-orange-950/80 text-orange-300 border border-orange-800/60">
                        Heat {alert.triggerMetrics.apparentTempC}°C
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Selected Alert Detailed SOP Playbook */}
          {selectedAlert && (
            <div className="lg:col-span-7 bg-slate-950 rounded-xl border border-slate-800 p-4 lg:p-5 flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3 mb-4">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">
                      {selectedAlert.sop.sopId}
                    </span>
                    <h3 className="text-base font-extrabold text-white mt-0.5">
                      {selectedAlert.sop.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedAlert.description}
                    </p>
                  </div>
                  <button
                    onClick={() => onSelectAssetForExplain(selectedAlert.assetId)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 whitespace-nowrap"
                  >
                    View Risk Formula
                  </button>
                </div>

                {/* Primary Action Callout Box */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-red-950/40 via-slate-900 to-amber-950/30 border border-red-500/40 mb-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-400 uppercase tracking-wider mb-1">
                    <AlertOctagon className="w-4 h-4" />
                    Mandatory Operational Directive:
                  </div>
                  <p className="text-sm font-semibold text-slate-100">
                    {selectedAlert.sop.primaryAction}
                  </p>
                </div>

                {/* Tactical Steps Checklist */}
                <div className="mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
                    Standard Operating Procedure Execution Steps:
                  </h4>
                  <div className="space-y-1.5">
                    {selectedAlert.sop.tacticalSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Operational Details: Team, Equipment, SLA */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400 mb-1">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      Assigned Squad:
                    </div>
                    <div className="font-semibold text-slate-200">
                      {selectedAlert.sop.assignedTeam}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400 mb-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Response SLA:
                    </div>
                    <div className="font-semibold text-amber-300">
                      Within {selectedAlert.sop.prioritySlaMinutes} Minutes
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400 mb-1">
                      <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                      Equipment Required:
                    </div>
                    <div className="font-medium text-slate-300 text-[11px]">
                      {selectedAlert.sop.equipmentRequired.join(', ')}
                    </div>
                  </div>
                </div>

                {/* Incident Action Audit History */}
                <div className="mb-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                    <History className="w-3 h-3 text-cyan-400" />
                    Incident Action Trail:
                  </h4>
                  <div className="space-y-1 max-h-24 overflow-y-auto pr-1 text-[11px]">
                    {selectedAlert.actionHistory.map((hist, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-slate-400 bg-slate-900/60 px-2 py-1 rounded border border-slate-850"
                      >
                        <span className="font-mono text-[10px] text-cyan-400">
                          {new Date(hist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="font-semibold text-slate-200">{hist.action}</span>
                        <span className="text-slate-400">{hist.actor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Dispatch & Status Transition Controls */}
              <div className="pt-3 border-t border-slate-800 mt-2">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    placeholder="Dispatcher notes (e.g. Pump Squad-4 mobilized)..."
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="w-full sm:w-2/3 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />

                  {selectedAlert.status !== 'RESOLVED' ? (
                    <button
                      onClick={() => handleNextStatus(selectedAlert.status)}
                      className="w-full sm:w-1/3 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/50 transition hover:scale-[1.02]"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {selectedAlert.status === 'TRIGGERED' && 'Acknowledge Alert'}
                      {selectedAlert.status === 'ACKNOWLEDGED' && 'Dispatch Squad'}
                      {selectedAlert.status === 'DISPATCHED' && 'Mark In-Progress'}
                      {selectedAlert.status === 'IN_PROGRESS' && 'Verify & Resolve'}
                    </button>
                  ) : (
                    <div className="w-full sm:w-1/3 flex items-center justify-center gap-1 py-2 px-3 rounded-lg bg-emerald-950/80 border border-emerald-600 text-emerald-300 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Incident Resolved</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
