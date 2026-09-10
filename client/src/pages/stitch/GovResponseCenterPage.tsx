import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GovHqLayout } from '../../components/stitch/GovHqLayout';
import { 
  AlertTriangle, Radio, Users, Timer, CheckCircle2, 
  MapPin, Shield, Plus, ArrowRight, Truck, Hospital, 
  Zap, Search, ChevronRight, Layers, Bell
} from 'lucide-react';

export const GovResponseCenterPage: React.FC = () => {
  const navigate = useNavigate();

  const [assignedModal, setAssignedModal] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const incidents = [
    {
      id: 'INC-204',
      level: 'Critical',
      tag: 'FLOOD',
      dept: 'Rescue / DPW Unified',
      sla: '04:12 remaining',
      title: 'Flash Inundation on Bayshore Arterial — Hospital Access Threatened',
      location: 'Bayshore Blvd at Marker 4A (Trauma Center Route)',
      unit: 'Unit 4 (Heavy Pump 02) En Route',
      elapsed: '+3m elapsed',
      color: '#ba1a1a'
    },
    {
      id: 'INC-202',
      level: 'Critical',
      tag: 'FLOOD RESCUE',
      dept: 'Fire & Water Rescue',
      sla: '01:45 remaining',
      title: 'Stranded Civilian Vehicle in Underpass (Water Depth 1.1m)',
      location: 'Mission Valley Underpass / 4th St',
      unit: 'Taskforce Alpha-02 Assigned',
      elapsed: '+1m elapsed',
      color: '#ba1a1a'
    },
    {
      id: 'INC-198',
      level: 'High',
      tag: 'ELECTRICAL UTILITY',
      dept: 'Power Grid Services',
      sla: '16:20 remaining',
      title: 'Downed High-Voltage Line across 7th Ave',
      location: '7th Ave @ Pine St • Substation 12G',
      unit: 'Utility Crew Unit 4 En Route',
      elapsed: '+8m elapsed',
      color: '#ea580c'
    },
    {
      id: 'INC-195',
      level: 'Moderate',
      tag: 'MUNICIPAL FACILITY',
      dept: 'Facility Maintenance',
      sla: '42:00 remaining',
      title: 'Cooling Center Generator Trip',
      location: 'North Civic Center • Ward 2',
      unit: 'Eng. R. Chavez on-site',
      elapsed: '+14m elapsed',
      color: '#d97706'
    }
  ];

  const handleAssign = (id: string) => {
    setAssignedModal(id);
    setTimeout(() => {
      setAssignedModal(null);
      setSuccessToast(`Dispatch instructions updated for #${id}`);
      setTimeout(() => setSuccessToast(null), 3000);
    }, 1000);
  };

  return (
    <GovHqLayout activePath="/gov/response-center">
      <div className="flex flex-col w-full">
        {/* Top Command Telemetry Ribbon */}
        <div className="w-full bg-white border-b border-[#e5eeff] px-6 py-3 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6 flex-wrap text-xs">
              <div className="flex items-baseline gap-2">
                <span className="text-[#76777d] uppercase font-bold text-[10px]">Active Incidents</span>
                <span className="text-xl font-extrabold text-[#0b1c30]">12</span>
                <span className="text-[#ba1a1a] font-bold font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] animate-ping" />
                  2 P1 Critical
                </span>
              </div>
              <div className="h-6 w-px bg-[#e5eeff]" />
              <div className="flex items-baseline gap-2">
                <span className="text-[#76777d] uppercase font-bold text-[10px]">Dispatched Units</span>
                <span className="text-xl font-extrabold text-[#0051d5]">08</span>
                <span className="text-[#45464d]">/ 14 deployed</span>
              </div>
              <div className="h-6 w-px bg-[#e5eeff]" />
              <div className="flex items-baseline gap-2">
                <span className="text-[#76777d] uppercase font-bold text-[10px]">Unassigned</span>
                <span className="text-xl font-extrabold text-[#ba1a1a]">04</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#ffdad6] text-[#93000a] font-bold">
                  Triage Bottleneck
                </span>
              </div>
              <div className="h-6 w-px bg-[#e5eeff]" />
              <div className="flex items-baseline gap-2">
                <span className="text-[#76777d] uppercase font-bold text-[10px]">Mean Resp Time</span>
                <span className="text-xl font-extrabold text-[#0b1c30]">6.8<span className="text-xs font-normal">m</span></span>
                <span className="text-emerald-600 font-bold text-[11px]">-1.4m vs last week</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => navigate('/gov/zone-cascade/4B')}
                className="px-3.5 py-1.5 rounded-xl bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0b1c30] text-xs font-semibold flex items-center gap-1.5 border border-[#d3e4fe]"
              >
                <Layers className="w-3.5 h-3.5 text-[#0051d5]" />
                <span>Zone Matrix</span>
              </button>
            </div>
          </div>
        </div>

        {/* Operational Split Workspace */}
        <div className="p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Incident Priority Queues (Left & Center: 8 Cols) */}
          <div className="xl:col-span-8 flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-bold text-base text-[#0b1c30]">Response Dispatch Matrix</h2>
              <span className="text-xs text-[#76777d] font-mono">Real-time Triage Priority Queue</span>
            </div>

            <div className="flex flex-col gap-3">
              {incidents.map(inc => (
                <article 
                  key={inc.id}
                  className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white rounded-2xl shadow-sm border border-[#e5eeff] hover:border-[#0051d5] transition-all overflow-hidden"
                >
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-1.5" 
                    style={{ backgroundColor: inc.color }}
                  />

                  <div className="flex flex-col gap-1 pl-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-mono font-bold text-[#0b1c30]">#{inc.id}</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        inc.level === 'Critical' 
                          ? 'bg-[#ffdad6] text-[#93000a]' 
                          : inc.level === 'High' 
                            ? 'bg-[#ffedd5] text-[#c2410c]' 
                            : 'bg-[#fef3c7] text-[#b45309]'
                      }`}>
                        {inc.tag}
                      </span>
                      <span className="text-[#76777d]">•</span>
                      <span className="text-[#45464d]">{inc.dept}</span>
                      <span className="text-[#ba1a1a] font-mono font-bold ml-auto flex items-center gap-1">
                        <Timer className="w-3.5 h-3.5" />
                        {inc.sla}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-[#0b1c30] mt-0.5 leading-snug">
                      {inc.title}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-[#45464d] mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#0051d5]" />
                        {inc.location}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-[#0b1c30]">{inc.unit}</span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={() => handleAssign(inc.id)}
                      disabled={assignedModal === inc.id}
                      className={`h-10 px-4 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-sm transition-all ${
                        assignedModal === inc.id ? 'bg-emerald-600' : 'bg-[#0f172a] hover:bg-[#1e293b]'
                      }`}
                    >
                      <span>{assignedModal === inc.id ? 'Assigning...' : 'Assign Team'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Right Tactical Map HUD (4 Cols) */}
          <aside className="xl:col-span-4 flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#e5eeff] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#0b1c30]">Tactical Deployment HUD</span>
                <span className="text-[10px] font-mono text-[#0051d5] font-bold">SECTOR 04</span>
              </div>

              <div 
                onClick={() => navigate('/gov/zone-cascade/4B')}
                className="w-full h-48 bg-cover bg-center rounded-xl relative overflow-hidden flex items-end p-3 cursor-pointer shadow-xs border border-[#d3e4fe]"
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80')` }}
              >
                <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#ba1a1a] animate-ping" />
                  <span className="font-bold">4 Active Field Units Operating</span>
                </div>
              </div>

              {/* Roster Strip */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#eff4ff]">
                  <span className="font-bold text-[#0b1c30]">Unit 4 (Heavy Pump 02)</span>
                  <span className="text-[#0051d5] font-mono font-semibold">On Scene</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#eff4ff]">
                  <span className="font-bold text-[#0b1c30]">Aquatic Alpha-02 (Zodiac)</span>
                  <span className="text-[#ba1a1a] font-mono font-semibold">En Route (4m)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#eff4ff]">
                  <span className="font-bold text-[#0b1c30]">Utility Crew 08</span>
                  <span className="text-[#ea580c] font-mono font-semibold">De-energizing</span>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => navigate('/gov/overview')}
                className="w-full py-2.5 rounded-xl bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0051d5] font-bold text-xs transition-colors border border-[#d3e4fe]"
              >
                Open Overview Dashboard
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#0f172a] text-white px-4 py-2.5 rounded-full shadow-xl text-xs font-semibold flex items-center gap-2 border border-white/20 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}
    </GovHqLayout>
  );
};
export default GovResponseCenterPage;
