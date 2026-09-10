import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Radio, User, Shield, CheckCircle2, Waves, ArrowRight,
  TrendingUp, Wrench, Video, RefreshCw, Layers, 
  Map as MapIcon, ClipboardList, CheckSquare, Zap, Clock
} from 'lucide-react';

export const GovMobileTasksPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<'all' | 'assigned' | 'en-route' | 'on-scene' | 'audit'>('all');
  const [verifiedTask1, setVerifiedTask1] = useState(false);

  const handleVerify = (taskNum: number) => {
    if (taskNum === 1) {
      setVerifiedTask1(true);
    }
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
              <span className="font-bold text-base tracking-tight text-[#0b1c30]">Tasks</span>
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
      <main className="flex-1 flex flex-col relative w-full pt-20 px-4 gap-3">
        {/* Telemetry Bar */}
        <div className="flex items-center justify-between bg-[#eff4ff] px-3.5 py-2 rounded-xl border border-[#d3e4fe] mt-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0051d5] animate-ping" />
            <span className="font-bold text-[#0b1c30]">FirstNet LEO Satellite</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#45464d] font-mono">
            <RefreshCw className="w-3 h-3 text-[#0051d5]" />
            <span>Telemetry Synced 12s ago</span>
          </div>
        </div>

        {/* Operational Metrics Grid (4 tiles) */}
        <section className="grid grid-cols-2 gap-2">
          <div className="bg-white p-3 rounded-2xl shadow-xs border border-[#e5eeff] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] uppercase text-[#45464d] font-semibold">
              <span>Deployed</span>
              <Shield className="w-4 h-4 text-[#0051d5]" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold text-[#0b1c30]">14</span>
              <span className="text-xs text-[#45464d]">Active Units</span>
            </div>
            <div className="w-full bg-[#e5eeff] rounded-full h-1 mt-2 overflow-hidden">
              <div className="bg-[#0051d5] h-full rounded-full w-4/5" />
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl shadow-xs border border-[#e5eeff] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] uppercase text-[#45464d] font-semibold">
              <span>Mobilizing</span>
              <Clock className="w-4 h-4 text-[#316bf3]" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold text-[#0b1c30]">3</span>
              <span className="text-xs text-[#45464d]">In Transit</span>
            </div>
            <div className="w-full bg-[#e5eeff] rounded-full h-1 mt-2 overflow-hidden">
              <div className="bg-[#316bf3] h-full rounded-full w-1/3" />
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl shadow-xs border border-[#e5eeff] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] uppercase text-[#45464d] font-semibold">
              <span>Operating</span>
              <Zap className="w-4 h-4 text-[#0051d5]" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold text-[#0b1c30]">4</span>
              <span className="text-xs text-[#45464d]">On Scene</span>
            </div>
            <div className="w-full bg-[#e5eeff] rounded-full h-1 mt-2 overflow-hidden">
              <div className="bg-[#0051d5] h-full rounded-full w-2/5" />
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl shadow-xs border border-[#e5eeff] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] uppercase text-[#45464d] font-semibold">
              <span>Verification</span>
              <CheckCircle2 className="w-4 h-4 text-[#0090a9]" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold text-[#0b1c30]">2</span>
              <span className="text-xs text-[#45464d]">Pending Audit</span>
            </div>
            <div className="w-full bg-[#e5eeff] rounded-full h-1 mt-2 overflow-hidden">
              <div className="bg-[#0090a9] h-full rounded-full w-1/2" />
            </div>
          </div>
        </section>

        {/* Section Header & Stepper Filter */}
        <div className="flex flex-col gap-2 mt-1">
          <div className="flex items-center justify-between px-1">
            <span className="font-bold text-sm text-[#0b1c30]">Field Operations</span>
            <span className="text-xs text-[#45464d] font-mono">District 4 Resilience</span>
          </div>

          <div className="flex items-center overflow-x-auto gap-1.5 pb-1 no-scrollbar text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                activeFilter === 'all' 
                  ? 'bg-[#0f172a] text-white shadow-xs' 
                  : 'bg-white text-[#45464d] border border-[#e5eeff]'
              }`}
            >
              <span>All Tasks</span>
              <span className="w-4 h-4 rounded-full bg-[#eff4ff] text-[#0b1c30] text-[10px] flex items-center justify-center font-bold">
                3
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('assigned')}
              className={`px-3 py-1.5 rounded-full transition-all ${
                activeFilter === 'assigned' 
                  ? 'bg-[#0f172a] text-white shadow-xs' 
                  : 'bg-white text-[#45464d] border border-[#e5eeff]'
              }`}
            >
              Assigned
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('on-scene')}
              className={`px-3 py-1.5 rounded-full transition-all ${
                activeFilter === 'on-scene' 
                  ? 'bg-[#0f172a] text-white shadow-xs' 
                  : 'bg-white text-[#45464d] border border-[#e5eeff]'
              }`}
            >
              On Scene
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('audit')}
              className={`px-3 py-1.5 rounded-full transition-all ${
                activeFilter === 'audit' 
                  ? 'bg-[#0f172a] text-white shadow-xs' 
                  : 'bg-white text-[#45464d] border border-[#e5eeff]'
              }`}
            >
              Audit
            </button>
          </div>
        </div>

        {/* Task Cards Stack */}
        <div className="flex flex-col gap-3">
          {/* Task 1 */}
          <article className="bg-white rounded-2xl shadow-sm border border-[#e5eeff] p-4 flex flex-col gap-2.5 relative overflow-hidden">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] text-[#45464d] uppercase tracking-wider font-semibold">
                  SECTOR 4C • FLOOD DEFENSE
                </span>
                <h2 className="text-base font-bold text-[#0b1c30] leading-snug mt-0.5">
                  Deploy Rapid Inflatable Dam at Culvert 4
                </h2>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#eff4ff] text-[#0051d5] text-xs font-bold shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0051d5] mr-1 animate-pulse" />
                72%
              </span>
            </div>

            {/* Crew Unit Info */}
            <div className="flex items-center justify-between bg-[#eff4ff] px-3 py-2 rounded-xl border border-[#d3e4fe]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#dbe1ff] text-[#0051d5] flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#0b1c30] block">DPW Tactical Crew 04</span>
                  <span className="text-[10px] text-[#45464d]">Heavy Barrier Rig 2 • 6 Specialists</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#45464d] block uppercase font-semibold">EST. REMAINING</span>
                <span className="text-sm font-bold text-[#0051d5]">18 mins</span>
              </div>
            </div>

            {/* Sparkline Visual */}
            <div className="flex flex-col gap-1 bg-white p-2 rounded-xl border border-[#e5eeff]">
              <div className="flex items-center justify-between text-xs text-[#45464d]">
                <span className="flex items-center gap-1 text-[11px]">
                  <Waves className="w-3.5 h-3.5 text-[#0051d5]" /> Hydro Pressure: 1.42 bar
                </span>
                <span className="text-[10px] text-[#0051d5] font-mono font-bold">Telemetry Live</span>
              </div>
              <div className="h-6 w-full">
                <svg className="w-full h-full text-[#0051d5]" fill="none" viewBox="0 0 300 40" preserveAspectRatio="none">
                  <path d="M0 32 Q 40 28, 80 30 T 150 18 T 220 12 T 300 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M0 32 Q 40 28, 80 30 T 150 18 T 220 12 T 300 6 L 300 40 L 0 40 Z" fill="currentColor" fillOpacity="0.1" />
                </svg>
              </div>
            </div>

            {/* 5-step Workflow Progress */}
            <div className="grid grid-cols-5 gap-1 py-1 text-center">
              <div>
                <div className="w-full h-1.5 rounded-full bg-[#0051d5]" />
                <span className="text-[9px] text-[#45464d] mt-1 block">Assigned</span>
              </div>
              <div>
                <div className="w-full h-1.5 rounded-full bg-[#0051d5]" />
                <span className="text-[9px] text-[#45464d] mt-1 block">En Route</span>
              </div>
              <div>
                <div className="w-full h-1.5 rounded-full bg-[#0051d5]" />
                <span className="text-[9px] text-[#0b1c30] font-bold mt-1 block">On Scene</span>
              </div>
              <div>
                <div className={`w-full h-1.5 rounded-full ${verifiedTask1 ? 'bg-[#0051d5]' : 'bg-[#dbe1ff]'}`} />
                <span className="text-[9px] text-[#45464d] mt-1 block">Verify</span>
              </div>
              <div>
                <div className={`w-full h-1.5 rounded-full ${verifiedTask1 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                <span className="text-[9px] text-[#45464d] mt-1 block">Closed</span>
              </div>
            </div>

            {/* Verify Action */}
            <button 
              type="button"
              onClick={() => handleVerify(1)}
              className={`w-full h-11 rounded-xl text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all ${
                verifiedTask1 ? 'bg-emerald-600' : 'bg-[#0f172a] hover:bg-[#1e293b]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>{verifiedTask1 ? 'Sector Cleared & Verified' : 'Verify & Clear Sector'}</span>
            </button>
          </article>

          {/* Task 2 */}
          <article className="bg-white rounded-2xl shadow-sm border border-[#e5eeff] p-4 flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] text-[#45464d] uppercase tracking-wider font-semibold">
                  ACCESS CORRIDOR • TRAUMA ACCESS
                </span>
                <h2 className="text-base font-bold text-[#0b1c30] leading-snug mt-0.5">
                  Ambulance Route Clearance — St. Jude Gate B
                </h2>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#eff4ff] text-[#0b1c30] text-xs font-bold shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0051d5] mr-1" />
                ON SCENE
              </span>
            </div>

            <div className="flex items-center justify-between bg-[#eff4ff] px-3 py-2 rounded-xl border border-[#d3e4fe]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#0051d5] text-white flex items-center justify-center">
                  <Waves className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#0b1c30] block">Heavy Pump 02</span>
                  <span className="text-[10px] text-[#45464d]">Submersible 4000 GPM</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#45464d] block uppercase font-semibold">RECESSION RATE</span>
                <span className="text-sm font-bold text-[#0b1c30]">-12 cm/hr</span>
              </div>
            </div>

            <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#e5eeff] text-xs">
              <span className="font-bold text-[#0b1c30]">Water Depth: 14cm</span>
              <span className="text-[#0051d5] font-semibold">Target &lt; 5cm (Clear for EMS)</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button 
                type="button"
                onClick={() => navigate('/gov/mobile/triage')}
                className="h-10 rounded-xl bg-[#eff4ff] text-[#0b1c30] text-xs font-bold hover:bg-[#e5eeff] transition-colors flex items-center justify-center gap-1.5 border border-[#d3e4fe]"
              >
                <span>Reassign Unit</span>
              </button>
              <button 
                type="button"
                onClick={() => navigate('/gov/mobile/map')}
                className="h-10 rounded-xl bg-[#0f172a] text-white text-xs font-bold hover:bg-[#1e293b] transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Video className="w-3.5 h-3.5 text-[#4cd7f6]" />
                <span>Open Video Feed</span>
              </button>
            </div>
          </article>
        </div>
      </main>

      {/* Gov Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-t border-[#e5eeff] pb-safe shadow-md">
        <div className="flex justify-around items-center h-16 px-4 max-w-lg mx-auto">
          <Link to="/gov/mobile/map" className="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] gap-0.5 text-[#45464d] hover:text-[#0051d5] transition-colors">
            <MapIcon className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Map</span>
          </Link>
          <Link to="/gov/mobile/triage" className="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] gap-0.5 text-[#45464d] hover:text-[#0051d5] transition-colors">
            <ClipboardList className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Incidents</span>
          </Link>
          <Link to="/gov/mobile/tasks" className="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] gap-0.5 text-[#0051d5] font-bold">
            <CheckSquare className="w-5 h-5" />
            <span className="text-[11px]">Tasks</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};
export default GovMobileTasksPage;
