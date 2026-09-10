import React, { useState } from 'react';
import { X, CheckSquare, ShieldAlert, ArrowRight, Building } from 'lucide-react';
import { Asset, AssetRiskAssessment } from '../../types';

interface CreatePlanModalProps {
  asset: Asset | null;
  risk: AssetRiskAssessment | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitPlan: (planData: {
    assetId: string;
    hazardType: 'FLOOD' | 'HEAT' | 'COMPOUND';
    title: string;
    assignedTeam: string;
    leadResponder: string;
    notes?: string;
    taskTitles: string[];
  }) => Promise<void>;
}

export const CreatePlanModal: React.FC<CreatePlanModalProps> = ({
  asset,
  risk,
  isOpen,
  onClose,
  onSubmitPlan,
}) => {
  if (!isOpen || !asset || !risk) return null;

  const isFlood = risk.primaryThreat === 'FLOOD' || risk.floodRisk.score >= risk.heatRisk.score;

  // Default suggested tasks based on asset type & hazard
  const defaultTaskSuggestions = isFlood
    ? [
        `Place barricades & perimeter seals along ${asset.name} ingress ramp`,
        `Inspect gravity stormwater outfall grates for debris choke`,
        `Mobilize auxiliary trailer dewatering pump (400 m³/hr) from central depot`,
        `Notify ${asset.contactTeam} of elevated flood inundation depth (~${risk.floodRisk.projectedInundationDepthCm}cm)`,
      ]
    : [
        `Activate high-volume misting cooling units across ${asset.name} waiting platforms`,
        `Establish shaded hydration booths with emergency ORS sachets`,
        `Monitor electrical transformer cooling oil temperature and feeder load`,
        `Issue heat health advisory for vulnerable cohorts in ${asset.wardName}`,
      ];

  const [selectedTasks, setSelectedTasks] = useState<string[]>(defaultTaskSuggestions);
  const [assignedTeam, setAssignedTeam] = useState(asset.contactTeam || 'BBMP Rapid Response Taskforce');
  const [leadResponder, setLeadResponder] = useState('Officer R. Nair (Duty Dispatcher)');
  const [notes, setNotes] = useState(`Immediate response plan authorized for ${asset.name} under ${risk.compositeLevel} risk conditions.`);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTask = (task: string) => {
    if (selectedTasks.includes(task)) {
      setSelectedTasks(selectedTasks.filter((t) => t !== task));
    } else {
      setSelectedTasks([...selectedTasks, task]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTasks.length === 0) {
      alert('Please select at least one response task.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitPlan({
        assetId: asset.id,
        hazardType: isFlood ? 'FLOOD' : 'HEAT',
        title: `${isFlood ? 'Pluvial Inundation Surge' : 'Extreme Thermal Stress'} — ${asset.name}`,
        assignedTeam,
        leadResponder,
        notes,
        taskTitles: selectedTasks,
      });
      onClose();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-sky-100 text-sky-800 border border-sky-200">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Create Operational Response Plan
              </h3>
              <p className="text-[11px] text-slate-500">
                Converts risk detection into an active tracked incident with assigned tasks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700">
          {/* Target Asset Summary */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
              Target Facility & Current Threat
            </div>
            <div className="font-bold text-slate-900 text-sm">{asset.name}</div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-600">
              <span>{asset.wardName}</span>
              <span>&bull;</span>
              <span className="font-semibold text-rose-700">
                Score {risk.compositeRiskScore}/100 ({risk.compositeLevel})
              </span>
              <span>&bull;</span>
              <span>Elevation: {asset.elevationM}m MSL</span>
            </div>
          </div>

          {/* Tactical Tasks Selection Checklist */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              Tactical Response Tasks (SOP Checklist)
            </label>
            <div className="space-y-2 border border-slate-200 rounded-lg p-2.5 bg-slate-50/50">
              {defaultTaskSuggestions.map((taskTitle, idx) => {
                const isChecked = selectedTasks.includes(taskTitle);
                return (
                  <label
                    key={idx}
                    className={`flex items-start gap-2.5 p-2 rounded border cursor-pointer transition ${
                      isChecked
                        ? 'bg-white border-sky-300 text-slate-900 shadow-xs'
                        : 'border-transparent text-slate-500 hover:bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleTask(taskTitle)}
                      className="mt-0.5 rounded border-slate-300 text-sky-700 focus:ring-0"
                    />
                    <span className="text-xs font-medium leading-relaxed">{taskTitle}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Assigned Squad & Lead Responder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Response Team</label>
              <select
                value={assignedTeam}
                onChange={(e) => setAssignedTeam(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
              >
                <option value="BBMP Stormwater Drain Division">BBMP Stormwater Drain Division</option>
                <option value="BESCOM Grid Defense & Substation Unit">BESCOM Grid Defense Unit</option>
                <option value="Bangalore Traffic Police (Rapid Divert)">Bangalore Traffic Police (Rapid Divert)</option>
                <option value="SDRF Quick Response Squad">SDRF Quick Response Squad</option>
                <option value="Municipal Public Health & Heat Taskforce">Municipal Public Health Taskforce</option>
                <option value="Hospital Facilities Emergency Unit">Hospital Facilities Unit</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Lead Operations Officer</label>
              <input
                type="text"
                required
                value={leadResponder}
                onChange={(e) => setLeadResponder(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Operational Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Operational Notes / Authorization</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-md bg-sky-900 hover:bg-sky-800 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Dispatching...' : 'Dispatch Response Plan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
