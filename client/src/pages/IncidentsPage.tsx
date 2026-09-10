import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  UserCheck,
  CheckSquare,
  ChevronRight,
  Send,
  PlusCircle,
  TrendingUp,
  FileCheck,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Incident, ResponseTask } from '../types';

interface IncidentsPageProps {
  incidents: Incident[];
  onUpdateTaskStatus: (taskId: string, status: ResponseTask['status'], notes?: string) => Promise<void>;
  onEscalateTask: (taskId: string) => Promise<void>;
  onNavigate: (route: string) => void;
}

export const IncidentsPage: React.FC<IncidentsPageProps> = ({
  incidents,
  onUpdateTaskStatus,
  onEscalateTask,
  onNavigate,
}) => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    incidents[0]?.id || null
  );

  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId) || incidents[0];

  const handleTaskToggle = async (task: ResponseTask) => {
    const nextStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    await onUpdateTaskStatus(task.id, nextStatus);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-700" />
            <span>Operational Incident Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active command response lifecycle from detection through tactical recovery and closed-loop verification
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
            {incidents.filter((i) => i.status === 'RESPONDING').length} Responding
          </span>
          <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
            {incidents.filter((i) => i.status === 'RESOLVED').length} Resolved
          </span>
        </div>
      </div>

      {/* Main 2-Column Layout: Incidents List (5 cols) + Incident Details & Timeline (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Incidents List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Incident Register ({incidents.length})
          </div>

          {incidents.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-xs text-slate-400">
              No incidents on record.
            </div>
          ) : (
            incidents.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;
              const completedTasks = inc.tasks.filter((t) => t.status === 'COMPLETED').length;
              const totalTasks = inc.tasks.length;

              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncidentId(inc.id)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition ${
                    isSelected
                      ? 'bg-sky-50/70 border-sky-400 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-500">
                        #{inc.incidentNumber}
                      </span>
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.2 rounded border uppercase ${
                          inc.severity === 'CRITICAL'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-orange-50 text-orange-800 border-orange-200'
                        }`}
                      >
                        {inc.severity}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{inc.hazardType}</span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        inc.status === 'RESPONDING'
                          ? 'bg-sky-50 text-sky-800 border-sky-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {inc.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-slate-800 line-clamp-1 mt-1">
                    {inc.title}
                  </h4>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {inc.wardName} &bull; Assigned: {inc.assignedTeam}
                  </div>

                  {/* Task Progress Bar */}
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600 mb-1">
                    <span>Tactical Tasks</span>
                    <span className="font-mono font-semibold">
                      {completedTasks} / {totalTasks} Completed
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-700 h-full rounded-full transition-all duration-300"
                      style={{ width: `${(completedTasks / Math.max(1, totalTasks)) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed Incident View, Tasks Checklist & Auditable Timeline */}
        {selectedIncident && (
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-5 text-xs">
            {/* Incident Header */}
            <div className="pb-3 border-b border-slate-200 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-black text-slate-700">
                    Incident #{selectedIncident.incidentNumber}
                  </span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase ${
                      selectedIncident.severity === 'CRITICAL'
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : 'bg-orange-50 text-orange-800 border-orange-300'
                    }`}
                  >
                    {selectedIncident.severity}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200 uppercase">
                    {selectedIncident.status}
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900 leading-snug">
                  {selectedIncident.title}
                </h2>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Target Facility: <strong className="text-slate-800">{selectedIncident.assetName}</strong> &bull; {selectedIncident.wardName}
                </div>
              </div>
            </div>

            {/* Operational Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
              <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Assigned Team</span>
                <span className="font-bold text-slate-800">{selectedIncident.assignedTeam}</span>
              </div>
              <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Lead Responder</span>
                <span className="font-bold text-slate-800">{selectedIncident.leadResponder}</span>
              </div>
              <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Created Timestamp</span>
                <span className="font-mono text-slate-700">{new Date(selectedIncident.createdAt).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Response Tasks Checklist */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Response Action Tasks Checklist
                </h3>
                <span className="text-[11px] text-slate-400">Click checkmark to toggle status</span>
              </div>

              <div className="space-y-2">
                {selectedIncident.tasks.map((task) => {
                  const isDone = task.status === 'COMPLETED';
                  const isEscalated = task.status === 'ESCALATED';

                  return (
                    <div
                      key={task.id}
                      className={`p-3 rounded-lg border transition flex items-start justify-between gap-3 ${
                        isDone
                          ? 'bg-slate-50/60 border-slate-200'
                          : isEscalated
                          ? 'bg-rose-50/50 border-rose-200'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 flex-1">
                        <button
                          onClick={() => handleTaskToggle(task)}
                          className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition ${
                            isDone
                              ? 'bg-emerald-600 border-emerald-600 text-white font-bold'
                              : 'border-slate-300 hover:border-slate-400 bg-white'
                          }`}
                        >
                          {isDone && '✓'}
                        </button>
                        <div>
                          <p
                            className={`text-xs font-medium ${
                              isDone ? 'line-through text-slate-400' : 'text-slate-900'
                            }`}
                          >
                            {task.title}
                          </p>
                          <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>Assignee: {task.assignedPerson}</span>
                            <span>&bull;</span>
                            <span>Due: {task.dueTime}</span>
                            {isEscalated && (
                              <span className="font-bold text-rose-700 bg-rose-100 px-1 rounded">
                                ESCALATED (Tier {task.escalationLevel})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Escalate button if incomplete */}
                      {!isDone && (
                        <button
                          onClick={() => onEscalateTask(task.id)}
                          className="px-2 py-1 text-[10px] font-semibold rounded border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                        >
                          Escalate
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Auditable Event Timeline (from master prompt) */}
            <div className="pt-3 border-t border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Auditable Incident Timeline
              </h3>

              <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {selectedIncident.timeline.map((event, idx) => (
                  <div key={idx} className="flex items-start gap-3 relative pl-6">
                    <span className="absolute left-1 top-1 w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-white" />
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between text-[11px]">
                        <span className="font-bold text-slate-900">{event.title}</span>
                        <span className="font-mono text-slate-400 text-[10px]">{event.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{event.description}</p>
                      <div className="text-[10px] text-slate-400 mt-0.5">Actor: {event.actor}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
