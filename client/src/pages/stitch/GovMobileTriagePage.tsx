import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Radio, User, AlertTriangle, AlertOctagon, Timer, Zap, 
  Truck, Video, History, Layers, Map as MapIcon, 
  ClipboardList, CheckSquare, ChevronRight, Activity
} from 'lucide-react';

export const GovMobileTriagePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'infrastructure' | 'public-works'>('all');
  const [dispatchedId, setDispatchedId] = useState<string | null>(null);

  const handleDispatch = (id: string) => {
    setDispatchedId(id);
    setTimeout(() => {
      navigate('/gov/mobile/tasks');
    }, 800);
  };

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen flex flex-col font-sans pb-32">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#f8f9ff]/85 backdrop-blur-xl border-b border-[#e5eeff] shadow-xs">
        <div className="h-20 px-4 flex flex-col justify-center gap-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0f172a] text-white flex items-center justify-center font-bold text-xs">
                GOV
              </div>
              <span className="font-bold text-base tracking-tight text-[#0b1c30]">Incidents</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#e5eeff] px-2.5 py-1 rounded-full text-xs font-semibold text-[#0b1c30]">
                <span className="w-2 h-2 rounded-full bg-[#0051d5] animate-pulse" />
                <span>LVL 2 ALERT</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#0f172a] flex items-center justify-center text-white">
                <User className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-[#45464d] text-xs font-mono px-0.5">
            <div className="flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 text-[#0051d5]" />
              <span>Grid 99.8% Online</span>
            </div>
            <span className="text-[11px] text-[#45464d]">EOC Gov Operational Mobile</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative w-full pt-20 px-4 gap-4">
        {/* Operational Overview Strip */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-[#e5eeff] flex flex-col gap-2 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a] animate-ping" />
              <span className="font-bold text-sm text-[#0b1c30]">Queue Telemetry</span>
            </div>
            <span className="text-xs text-[#45464d] font-mono">SYNC: 14s ago</span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="bg-[#eff4ff] p-2.5 rounded-xl flex flex-col border border-[#d3e4fe]">
              <span className="text-[10px] text-[#45464d] uppercase font-semibold">Active Events</span>
              <span className="text-xl font-extrabold text-[#0b1c30] mt-0.5">12</span>
              <span className="text-[10px] text-[#ba1a1a] font-bold mt-0.5">2 Crit • 4 High</span>
            </div>
            <div className="bg-[#eff4ff] p-2.5 rounded-xl flex flex-col border border-[#d3e4fe]">
              <span className="text-[10px] text-[#45464d] uppercase font-semibold">Mean SLA Resp</span>
              <span className="text-xl font-extrabold text-[#0b1c30] mt-0.5">6.8<span className="text-xs font-normal">m</span></span>
              <span className="text-[10px] text-[#0051d5] font-bold mt-0.5">-1.2m vs 24h</span>
            </div>
            <div className="bg-[#eff4ff] p-2.5 rounded-xl flex flex-col border border-[#d3e4fe]">
              <span className="text-[10px] text-[#45464d] uppercase font-semibold">Fleet In Field</span>
              <span className="text-xl font-extrabold text-[#0b1c30] mt-0.5">14<span className="text-xs font-normal text-[#45464d]">/22</span></span>
              <span className="text-[10px] text-[#45464d] font-mono mt-0.5">64% Capacity</span>
            </div>
          </div>
        </section>

        {/* Filter Rail Tabs */}
        <section className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'All Incidents' },
            { id: 'critical', label: 'Critical Only (2)' },
            { id: 'infrastructure', label: 'Infrastructure' },
            { id: 'public-works', label: 'Public Works' }
          ].map(tab => {
            const active = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  active 
                    ? 'bg-[#0f172a] text-white shadow-xs' 
                    : 'bg-white text-[#45464d] hover:bg-[#eff4ff] border border-[#e5eeff]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </section>

        {/* Incidents Stack */}
        <div className="flex flex-col gap-4">
          {/* CRITICAL PRIORITY GROUP */}
          {(activeFilter === 'all' || activeFilter === 'critical') && (
            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#ba1a1a]" />
                  <h2 className="font-bold text-sm text-[#0b1c30]">Critical Priority</h2>
                </div>
                <span className="text-[10px] text-[#93000a] bg-[#ffdad6] px-2.5 py-0.5 rounded-full font-bold">
                  2 BREACH RISK
                </span>
              </div>

              {/* Card 1: INC-204 */}
              <article className="bg-white rounded-2xl shadow-sm border border-[#e5eeff] relative overflow-hidden flex flex-col">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#ba1a1a]" />
                <div className="p-4 pl-5 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-mono text-[#45464d]">#INC-204 • FLASH FLOOD</span>
                      <h3 className="font-bold text-sm text-[#0b1c30] mt-0.5">Bayshore Arterial Flash Inundation</h3>
                    </div>
                    <span className="text-[10px] bg-[#ffdad6] text-[#93000a] px-2 py-0.5 rounded-full font-bold whitespace-nowrap flex items-center gap-1 font-mono">
                      <Timer className="w-3 h-3" />
                      03:45 remaining
                    </span>
                  </div>

                  <div className="bg-[#eff4ff] rounded-xl p-2.5 flex items-center gap-2 border border-[#d3e4fe]">
                    <AlertOctagon className="w-4 h-4 text-[#ba1a1a] shrink-0" />
                    <p className="text-xs text-[#0b1c30] leading-tight">
                      Trauma Hospital Route 4 Severed. Ambulances redirected to South Basin.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-[#45464d] font-mono">
                      Grid Node 4B • Sector South
                    </span>
                    <button 
                      onClick={() => handleDispatch('INC-204')}
                      disabled={dispatchedId === 'INC-204'}
                      className={`h-10 px-4 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-xs transition-all ${
                        dispatchedId === 'INC-204' ? 'bg-emerald-600' : 'bg-[#0f172a] hover:bg-[#1e293b]'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 text-[#4cd7f6]" />
                      <span>{dispatchedId === 'INC-204' ? 'Dispatched' : 'Dispatch Team'}</span>
                    </button>
                  </div>
                </div>
              </article>

              {/* Card 2: INC-202 */}
              <article className="bg-white rounded-2xl shadow-sm border border-[#e5eeff] relative overflow-hidden flex flex-col">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#ba1a1a]" />
                <div className="p-4 pl-5 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-mono text-[#45464d]">#INC-202 • WATER RESCUE</span>
                      <h3 className="font-bold text-sm text-[#0b1c30] mt-0.5">Stranded Civilian in Underpass</h3>
                    </div>
                    <span className="text-[10px] bg-[#ffdad6] text-[#93000a] px-2 py-0.5 rounded-full font-bold whitespace-nowrap flex items-center gap-1 font-mono">
                      <Timer className="w-3 h-3" />
                      01:15
                    </span>
                  </div>

                  {/* Tactical camera feed and depth */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-24 rounded-xl relative overflow-hidden bg-slate-900">
                      <img 
                        src="https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80" 
                        alt="Traffic camera"
                        className="w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute bottom-1.5 left-1.5 bg-black/75 text-white font-mono text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]" /> CAM-109
                      </div>
                    </div>
                    <div className="bg-[#eff4ff] rounded-xl p-2.5 flex flex-col justify-between border border-[#d3e4fe]">
                      <div>
                        <span className="text-[10px] text-[#45464d] uppercase font-semibold">Depth Sensor</span>
                        <p className="text-lg font-extrabold text-[#0b1c30] mt-0.5">1.1<span className="text-xs font-normal">m</span></p>
                      </div>
                      <span className="text-[10px] text-[#ba1a1a] font-bold font-mono">+0.2m / 10m</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-[#45464d] font-mono">
                      Aquatic Taskforce Alpha alerted
                    </span>
                    <button 
                      onClick={() => navigate('/rescue/mission/MIS-104')}
                      className="h-10 px-4 rounded-xl bg-[#eff4ff] text-[#0b1c30] text-xs font-bold hover:bg-[#e5eeff] transition-colors flex items-center gap-1.5 border border-[#d3e4fe]"
                    >
                      <Video className="w-3.5 h-3.5 text-[#0051d5]" />
                      <span>Tactical Feed</span>
                    </button>
                  </div>
                </div>
              </article>
            </section>
          )}

          {/* HIGH PRIORITY GROUP */}
          {(activeFilter === 'all' || activeFilter === 'infrastructure') && (
            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#ea580c]" />
                  <h2 className="font-bold text-sm text-[#0b1c30]">High Priority</h2>
                </div>
                <span className="text-[10px] bg-[#ffedd5] text-[#c2410c] px-2.5 py-0.5 rounded-full font-bold">
                  GRID HAZARD
                </span>
              </div>

              {/* Card 3: Downed High-Voltage Line */}
              <article className="bg-white rounded-2xl shadow-sm border border-[#e5eeff] relative overflow-hidden flex flex-col">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#ea580c]" />
                <div className="p-4 pl-5 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-mono text-[#45464d]">#INC-198 • ELECTRICAL UTILITY</span>
                      <h3 className="font-bold text-sm text-[#0b1c30] mt-0.5">Downed High-Voltage Line across 7th Ave</h3>
                    </div>
                    <span className="text-[10px] bg-[#ffedd5] text-[#c2410c] px-2 py-0.5 rounded-full font-bold whitespace-nowrap font-mono">
                      16:20 remaining
                    </span>
                  </div>

                  <div className="bg-[#eff4ff] rounded-xl p-2.5 flex items-center justify-between border border-[#d3e4fe]">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#ea580c]" />
                      <span className="text-xs text-[#0b1c30] font-medium">Utility Crew Unit 4 En Route (ETA 4 min)</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#45464d]">Substation 12G</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-[#ea580c] font-mono font-semibold">
                      13.8 kV Line • De-energized
                    </span>
                    <button 
                      onClick={() => navigate('/gov/mobile/tasks')}
                      className="h-10 px-4 rounded-xl bg-[#eff4ff] text-[#0b1c30] text-xs font-bold hover:bg-[#e5eeff] transition-colors flex items-center gap-1.5 border border-[#d3e4fe]"
                    >
                      <Truck className="w-3.5 h-3.5 text-[#ea580c]" />
                      <span>Manage Fleet</span>
                    </button>
                  </div>
                </div>
              </article>
            </section>
          )}

          {/* MODERATE PRIORITY GROUP */}
          {(activeFilter === 'all' || activeFilter === 'public-works') && (
            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#d97706]" />
                  <h2 className="font-bold text-sm text-[#0b1c30]">Moderate Priority</h2>
                </div>
                <span className="text-[10px] bg-[#fef3c7] text-[#b45309] px-2.5 py-0.5 rounded-full font-bold">
                  CONTAINED
                </span>
              </div>

              {/* Card 4: Cooling Center Generator Trip */}
              <article className="bg-white rounded-2xl shadow-sm border border-[#e5eeff] relative overflow-hidden flex flex-col">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#d97706]" />
                <div className="p-4 pl-5 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-mono text-[#45464d]">#INC-195 • MUNICIPAL FACILITY</span>
                      <h3 className="font-bold text-sm text-[#0b1c30] mt-0.5">Cooling Center Generator Trip</h3>
                    </div>
                    <span className="text-[10px] bg-[#fef3c7] text-[#b45309] px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                      Facility Tech Assigned
                    </span>
                  </div>

                  <p className="text-xs text-[#45464d] leading-relaxed">
                    North Civic Center backup gen offline after surge. HVAC running on internal battery backup (approx 42 min reserves).
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-[#45464d] font-mono">
                      Eng. R. Chavez on-site
                    </span>
                    <button 
                      onClick={() => navigate('/gov/mobile/tasks')}
                      className="h-10 px-4 rounded-xl bg-[#eff4ff] text-[#0b1c30] text-xs font-bold hover:bg-[#e5eeff] transition-colors flex items-center gap-1.5 border border-[#d3e4fe]"
                    >
                      <History className="w-3.5 h-3.5 text-[#0051d5]" />
                      <span>Status Log</span>
                    </button>
                  </div>
                </div>
              </article>
            </section>
          )}

          {/* Tactical Map Inset Tile */}
          <section className="bg-white rounded-2xl p-4 shadow-sm border border-[#e5eeff] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0051d5]" />
                <span className="font-bold text-xs text-[#0b1c30]">Live GIS Vector Overlay</span>
              </div>
              <span className="text-xs font-mono text-[#0051d5] font-semibold">LAYER: FLOOD+RADAR</span>
            </div>
            <div 
              onClick={() => navigate('/gov/mobile/map')}
              className="w-full h-36 bg-cover bg-center rounded-xl relative overflow-hidden flex items-end p-3 cursor-pointer shadow-xs"
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80')` }}
            >
              <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ba1a1a] animate-pulse" />
                <span className="text-xs font-bold text-[#0b1c30]">3 Incident Hotspots within 2.4 km radius</span>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Gov Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-t border-[#e5eeff] pb-safe shadow-md">
        <div className="flex justify-around items-center h-16 px-4 max-w-lg mx-auto">
          <Link to="/gov/mobile/map" className="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] gap-0.5 text-[#45464d] hover:text-[#0051d5] transition-colors">
            <MapIcon className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Map</span>
          </Link>
          <Link to="/gov/mobile/triage" className="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] gap-0.5 text-[#0051d5] font-bold">
            <ClipboardList className="w-5 h-5" />
            <span className="text-[11px]">Incidents</span>
          </Link>
          <Link to="/gov/mobile/tasks" className="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] gap-0.5 text-[#45464d] hover:text-[#0051d5] transition-colors">
            <CheckSquare className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Tasks</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};
export default GovMobileTriagePage;
