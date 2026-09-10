import React, { useState } from 'react';
import {
  CheckSquare,
  AlertTriangle,
  Clock,
  UserCheck,
  Search,
  Filter,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { ResponseTask } from '../types';

interface TasksPageProps {
  tasks: ResponseTask[];
  onUpdateTaskStatus: (taskId: string, status: ResponseTask['status'], notes?: string) => Promise<void>;
  onEscalateTask: (taskId: string) => Promise<void>;
  onNavigate: (route: string) => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({
  tasks,
  onUpdateTaskStatus,
  onEscalateTask,
  onNavigate,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.assignedTeam.toLowerCase().includes(q) ||
        t.assignedPerson.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const escalatedCount = tasks.filter((t) => t.status === 'ESCALATED').length;
  const pendingCount = tasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-sky-800" />
            <span>Response Tasks & Field Dispatch Queue</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational tactical tasks assigned to municipal mitigation squads, facility units, and contractors
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {escalatedCount > 0 && (
            <span className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{escalatedCount} Escalated to Supervisor</span>
            </span>
          )}
          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
            {pendingCount} Active
          </span>
        </div>
      </div>

      {/* Escalation Workflow Banner (from master prompt) */}
      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Standard Escalation Protocol Active:</span>
          <p className="text-[11px] text-amber-800 mt-0.5">
            Tasks unacknowledged after 15 minutes automatically escalate to Field Supervisor (Tier 1). If still incomplete at 30 minutes, notifications escalate directly to District Command (Tier 2).
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tasks, squads, or assignees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-1.5 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="ESCALATED">Escalated</option>
          <option value="COMPLETED">Completed</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
        >
          <option value="ALL">All Priorities</option>
          <option value="CRITICAL">Critical Priority</option>
          <option value="HIGH">High Priority</option>
          <option value="MEDIUM">Medium Priority</option>
        </select>
      </div>

      {/* Tasks Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Task Directive</th>
                <th className="py-2.5 px-3">Assigned Squad & Person</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Due Target</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                    No tasks found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const isDone = task.status === 'COMPLETED';
                  const isEscalated = task.status === 'ESCALATED';

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/70 transition">
                      {/* Status checkbox */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => onUpdateTaskStatus(task.id, isDone ? 'PENDING' : 'COMPLETED')}
                          className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                            isDone
                              ? 'bg-emerald-600 border-emerald-600 text-white font-bold'
                              : 'border-slate-300 hover:border-slate-400 bg-white'
                          }`}
                        >
                          {isDone && '✓'}
                        </button>
                      </td>

                      {/* Task Directive */}
                      <td className="py-3 px-3 max-w-sm">
                        <div className={`font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {task.title}
                        </div>
                        {task.incidentNumber && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Incident #{task.incidentNumber} &bull; {task.incidentTitle}
                          </div>
                        )}
                      </td>

                      {/* Assigned Squad */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">{task.assignedTeam}</div>
                        <div className="text-[10px] text-slate-500">{task.assignedPerson}</div>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                            task.priority === 'CRITICAL'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : task.priority === 'HIGH'
                              ? 'bg-orange-50 text-orange-800 border-orange-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>

                      {/* Due Time & Escalation Badge */}
                      <td className="py-3 px-3">
                        <div className="font-mono text-slate-700">{task.dueTime}</div>
                        {isEscalated && (
                          <span className="inline-block mt-0.5 text-[9px] font-black uppercase text-rose-700 bg-rose-50 px-1 py-0.2 rounded border border-rose-200">
                            Escalated (Tier {task.escalationLevel})
                          </span>
                        )}
                        {isDone && (
                          <span className="text-[10px] text-emerald-700">Verified Completed</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isDone && (
                            <button
                              onClick={() => onEscalateTask(task.id)}
                              className="px-2 py-1 rounded text-[10px] font-semibold border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 transition"
                            >
                              Escalate
                            </button>
                          )}
                          <button
                            onClick={() => onNavigate('incidents')}
                            className="text-sky-700 hover:text-sky-900 font-semibold text-[11px] underline"
                          >
                            View Incident &rarr;
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
