import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Shield, Radio, AlertTriangle, Layers, LocateFixed, 
  Waves, Timer, ChevronDown, ChevronRight, FolderOpen, 
  Send, Map as MapIcon, ClipboardList, CheckSquare,
  AlertOctagon, Truck, User
} from 'lucide-react';

export const GovMobileMapPage: React.FC = () => {
  const navigate = useNavigate();

  const [activeSector, setActiveSector] = useState('Sector 4');
  const [activeCardIndex, setActiveCardIndex] = useState(1);
  const [dispatchedBackup, setDispatchedBackup] = useState(false);

  const handleDispatch = () => {
    setDispatchedBackup(true);
    setTimeout(() => {
      navigate('/gov/mobile/triage');
    }, 900);
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
              <span className="font-bold text-base tracking-tight text-[#0b1c30]">Map</span>
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
      <main className="flex-1 flex flex-col relative w-full pt-20">
        {/* Map Viewport Canvas */}
        <div className="relative w-full h-[520px] bg-slate-900 overflow-hidden">
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center opacity-75"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80')` }}
          />

          {/* Interactive Simulated GIS Vector Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 580" preserveAspectRatio="none">
            {/* Inundation Vector Polygon */}
            <polygon 
              points="40,240 180,210 290,260 260,380 110,390 30,320" 
              fill="#0090a9" 
              fillOpacity="0.25" 
              stroke="#0090a9" 
              strokeWidth="2" 
              strokeDasharray="4 2" 
            />
            {/* Blocked Roads Vector (Red Dashed) */}
            <path d="M60,330 L160,290 L240,310" fill="none" stroke="#ba1a1a" strokeWidth="4" strokeDasharray="6 4" strokeLinecap="round" />
            <path d="M160,290 L190,210" fill="none" stroke="#ba1a1a" strokeWidth="3.5" strokeDasharray="5 3" strokeLinecap="round" />
          </svg>

          {/* Hospital Pin (St. Jude Medical) */}
          <div className="absolute top-[230px] left-[175px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer">
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-0.5 rounded-full shadow-md text-xs font-bold text-[#0b1c30]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] animate-ping" />
              St. Jude Trauma Hub
            </div>
            <div className="w-8 h-8 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center shadow-lg mt-1 font-bold text-xs">
              H
            </div>
          </div>

          {/* Active Unit 4 Beacon */}
          <div className="absolute top-[340px] left-[95px] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-[#0f172a] text-white px-3 py-1 rounded-full shadow-md text-xs font-mono font-semibold">
            <Truck className="w-3.5 h-3.5 text-[#4cd7f6]" />
            <span>Pump Unit 4</span>
          </div>

          {/* Floating Top Overlay: EOC Status & Sector Select */}
          <div className="absolute top-3 inset-x-4 flex items-center justify-between gap-2 z-10">
            <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm text-xs">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ba1a1a] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ba1a1a]" />
              </span>
              <span className="font-bold text-[#ba1a1a] uppercase">Lvl 2 Escalation</span>
              <span className="text-slate-300">•</span>
              <span className="text-[#45464d]">Bayshore</span>
            </div>

            <button 
              onClick={() => setActiveSector(s => s === 'Sector 4' ? 'All Sectors' : 'Sector 4')}
              className="flex items-center gap-1 bg-white/95 backdrop-blur-md h-8 px-3 rounded-full text-xs font-bold text-[#0b1c30] shadow-sm active:scale-95 transition-transform"
            >
              <span>{activeSector}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Map Control Tools */}
          <div className="absolute top-14 right-4 flex flex-col gap-2 z-10">
            <button className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-md text-[#0b1c30] shadow-md flex items-center justify-center active:scale-95">
              <Layers className="w-4 h-4 text-[#45464d]" />
            </button>
            <button className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-md text-[#0051d5] shadow-md flex items-center justify-center active:scale-95">
              <LocateFixed className="w-4 h-4" />
            </button>
            <button className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-md text-[#0090a9] shadow-md flex items-center justify-center active:scale-95">
              <Waves className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Swipeable Incident Card Stack Module */}
        <div className="w-full px-4 -mt-10 relative z-20 flex flex-col gap-2">
          {/* Stack Header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#0b1c30]">Active Inundations</span>
              <span className="px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a] text-[10px] font-bold">
                1 Urgent
              </span>
            </div>
            <div className="text-xs text-[#45464d] font-mono">
              <span className="font-bold text-[#0b1c30]">Card {activeCardIndex}</span> / 3
            </div>
          </div>

          {/* Primary Foreground Critical Incident Card */}
          <div className="relative w-full bg-white rounded-2xl shadow-lg border border-[#e5eeff] overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#ba1a1a]" />
            <div className="p-4 pl-5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a] text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]" />
                    CRITICAL
                  </span>
                  <span className="text-xs text-[#45464d] font-mono">#INC-204</span>
                </div>
                <div className="flex items-center gap-1 bg-[#ffdad6]/70 text-[#93000a] px-2 py-0.5 rounded-full text-xs font-mono font-bold">
                  <Timer className="w-3.5 h-3.5 text-[#ba1a1a] animate-pulse" />
                  <span>04:12 SLA</span>
                </div>
              </div>

              <div>
                <h2 className="text-base font-bold text-[#0b1c30] leading-tight">
                  Flash Inundation on Bayshore Arterial
                </h2>
                <p className="text-xs text-[#ba1a1a] font-medium flex items-center gap-1 mt-0.5">
                  <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                  Hospital Corridor Trauma Route Impassable
                </p>
              </div>

              {/* Metrics Matrix */}
              <div className="grid grid-cols-3 gap-2 bg-[#eff4ff] p-2.5 rounded-xl border border-[#d3e4fe]">
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#45464d] uppercase font-semibold">Water Depth</span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-xl font-extrabold text-[#ba1a1a]">1.1</span>
                    <span className="text-xs text-[#45464d]">m</span>
                  </div>
                  <span className="text-[10px] text-[#ba1a1a] font-mono font-bold">+0.2m/15m</span>
                </div>
                <div className="flex flex-col col-span-2">
                  <span className="text-[10px] text-[#45464d] uppercase font-semibold">Threatened Target</span>
                  <span className="text-xs font-bold text-[#0b1c30] truncate">St. Jude Medical</span>
                  <span className="text-[10px] text-[#45464d]">Level 1 Trauma Wing</span>
                </div>
              </div>

              {/* Telemetry Row */}
              <div className="flex items-center justify-between py-2 bg-[#e5eeff]/70 px-3 rounded-xl border border-[#dce9ff]">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#0051d5]" />
                  <div>
                    <span className="text-xs font-bold text-[#0b1c30] block">Unit 4 (Heavy High-Cap Pump)</span>
                    <span className="text-[10px] text-[#45464d] font-mono">ETA 3 mins • 0.4 mi away</span>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#0051d5] animate-ping" />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button 
                  onClick={() => navigate('/gov/mobile/triage')}
                  className="flex-1 h-11 bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0b1c30] rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-[#d3e4fe]"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Full Dossier</span>
                </button>
                <button 
                  onClick={handleDispatch}
                  disabled={dispatchedBackup}
                  className={`flex-[1.4] h-11 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition-all ${
                    dispatchedBackup ? 'bg-emerald-600' : 'bg-[#0f172a] hover:bg-[#1e293b]'
                  }`}
                >
                  <Send className="w-3.5 h-3.5 text-[#4cd7f6]" />
                  <span>{dispatchedBackup ? 'Dispatched' : 'Dispatch Backup'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Secondary Incident Strip */}
          <div 
            onClick={() => setActiveCardIndex(2)}
            className="w-full bg-white p-3 rounded-xl shadow-xs border border-[#e5eeff] flex items-center justify-between cursor-pointer hover:bg-[#f8f9ff]"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#316bf3]" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-[#0b1c30] truncate">#INC-205 • Substation 9 Grid Inflow</span>
                <span className="text-[10px] text-[#45464d] font-mono truncate">Water at 0.35m barrier margin</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#76777d]" />
          </div>
        </div>
      </main>

      {/* Floating Dispatch FAB */}
      <aside className="fixed bottom-20 right-4 z-40">
        <button 
          onClick={() => navigate('/gov/mobile/triage')}
          className="flex items-center gap-1.5 h-12 px-4 rounded-full bg-[#ba1a1a] text-white shadow-xl hover:bg-[#93000a] transition-all font-bold text-xs uppercase tracking-wide"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Dispatch</span>
        </button>
      </aside>

      {/* Gov Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-t border-[#e5eeff] pb-safe shadow-md">
        <div className="flex justify-around items-center h-16 px-4 max-w-lg mx-auto">
          <Link to="/gov/mobile/map" className="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] gap-0.5 text-[#0051d5] font-bold">
            <MapIcon className="w-5 h-5" />
            <span className="text-[11px]">Map</span>
          </Link>
          <Link to="/gov/mobile/triage" className="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] gap-0.5 text-[#45464d] hover:text-[#0051d5] transition-colors">
            <ClipboardList className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Incidents</span>
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
export default GovMobileMapPage;
