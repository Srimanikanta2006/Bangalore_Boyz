import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Search, Radio, Bell, User, LayoutGrid, Radar, 
  Users, Layers, FileText, Settings, AlertTriangle, 
  Navigation, Waves, Droplet, Wind, Eye, CheckCircle2,
  PhoneCall, LifeBuoy, Zap, ChevronRight, Plus, Minus, LocateFixed
} from 'lucide-react';

export const RescueCommandConsolePage: React.FC = () => {
  const navigate = useNavigate();

  const [selectedMission, setSelectedMission] = useState('MIS-104');
  const [activeLayers, setActiveLayers] = useState({
    flood: true,
    impassable: true,
    corridors: true,
    beacons: true,
    hydro: true
  });
  const [airBackupDispatched, setAirBackupDispatched] = useState(false);

  const missions = [
    {
      id: 'MIS-104',
      code: 'CRITICAL',
      title: 'Flash Inundation Extraction',
      location: '412 Bayshore Blvd • Sector 4B',
      sla: '04:12 SLA',
      atRisk: '4 At Risk',
      unit: 'Alpha-02 (En Route)',
      severity: 'error'
    },
    {
      id: 'MIS-102',
      code: 'HIGH',
      title: 'Elderly Care Power Loss',
      location: '89 Harbor Mist Dr • Sector 4A',
      sla: '16:30 SLA',
      atRisk: '12 At Risk',
      unit: 'Medic-04 (Staged)',
      severity: 'warning'
    },
    {
      id: 'MIS-099',
      code: 'MODERATE',
      title: 'Downed Feeder Clearing',
      location: 'Cypress Cross @ Route 9',
      sla: '44:00 SLA',
      atRisk: 'Grid Threat',
      unit: 'Utility-08',
      severity: 'neutral'
    },
    {
      id: 'MIS-094',
      code: 'STANDBY',
      title: 'Levee Crest Inspection',
      location: 'Reservoir Spillway 2',
      sla: 'Continuous',
      atRisk: 'Monitored',
      unit: 'Drone-03',
      severity: 'neutral'
    }
  ];

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen flex flex-col font-sans">
      {/* Top Header */}
      <header className="fixed top-0 inset-x-0 z-50 h-14 bg-white/95 backdrop-blur-md border-b border-[#e5eeff] shadow-xs">
        <div className="h-14 px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-[#0f172a] text-white flex items-center justify-center font-bold">
                CS
              </div>
              <span className="font-bold text-base tracking-tight text-[#0b1c30] shrink-0">
                ClimateShield
              </span>
            </div>
            <div className="h-4 w-px bg-[#c6c6cd] shrink-0" />
            <div className="hidden md:flex items-center gap-1 text-[#45464d] text-xs shrink-0">
              <span className="hover:text-[#0b1c30] transition-colors cursor-pointer">Rescue Operations Command</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#0b1c30] font-semibold">Sector 04 Tactical Matrix</span>
            </div>
            <div className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#dbe1ff] text-[#00174b] text-xs font-bold shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0051d5] animate-pulse" />
              DEFCON 2 ACTIVE
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#eff4ff] text-xs font-mono text-[#45464d]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0090a9]" />
              LEO Mesh 99.8%
            </div>
            <button 
              onClick={() => navigate('/rescue/tactical')}
              className="px-3 py-1.5 rounded-lg bg-[#eff4ff] hover:bg-[#dce9ff] text-xs font-semibold text-[#0051d5] transition-colors"
            >
              Mobile View
            </button>
            <div className="w-8 h-8 rounded-full bg-[#0f172a] flex items-center justify-center text-white">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>
      </header>

      {/* Left Icon Rail */}
      <aside className="fixed left-0 top-14 bottom-0 w-16 bg-white border-r border-[#e5eeff] z-40 flex flex-col items-center py-4 justify-between shadow-xs">
        <nav className="flex flex-col items-center gap-2 w-full px-2">
          <button 
            title="Tactical Matrix"
            className="w-10 h-10 flex items-center justify-center bg-[#0f172a] text-white rounded-xl shadow-xs"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button 
            onClick={() => navigate('/rescue/mission/MIS-104')}
            title="Mission Queue"
            className="w-10 h-10 flex items-center justify-center text-[#45464d] hover:text-[#0b1c30] hover:bg-[#eff4ff] rounded-xl transition-colors"
          >
            <Radar className="w-5 h-5" />
          </button>
          <button 
            onClick={() => navigate('/rescue/hazard/SEC-04B')}
            title="Hazard Intel"
            className="w-10 h-10 flex items-center justify-center text-[#45464d] hover:text-[#0b1c30] hover:bg-[#eff4ff] rounded-xl transition-colors"
          >
            <AlertTriangle className="w-5 h-5" />
          </button>
          <button 
            onClick={() => navigate('/rescue/report/MIS-104')}
            title="Sitrep Reports"
            className="w-10 h-10 flex items-center justify-center text-[#45464d] hover:text-[#0b1c30] hover:bg-[#eff4ff] rounded-xl transition-colors"
          >
            <FileText className="w-5 h-5" />
          </button>
        </nav>

        <div className="flex flex-col items-center gap-2">
          <button 
            onClick={() => navigate('/login')}
            title="Exit to Roles"
            className="w-10 h-10 flex items-center justify-center rounded-xl text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Three Column Tactical Viewport */}
      <div className="pl-16 pt-14 h-screen overflow-hidden flex">
        {/* COLUMN 1: Priority Mission Queue (320px) */}
        <aside className="w-80 shrink-0 bg-white border-r border-[#e5eeff] flex flex-col shadow-xs z-20">
          <div className="p-3 bg-[#eff4ff]/60 border-b border-[#e5eeff]">
            <div className="relative w-full mb-2.5">
              <Search className="w-4 h-4 absolute left-3 top-3 text-[#76777d]" />
              <input 
                placeholder="Filter priority, sector, callsign..."
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-white text-xs text-[#0b1c30] border border-[#d3e4fe] focus:outline-none focus:ring-1 focus:ring-[#0051d5]"
              />
            </div>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5 text-[#0b1c30]">
                <span className="w-2 h-2 rounded-full bg-[#ba1a1a] animate-ping" />
                ACTIVE MISSIONS (7)
              </span>
              <span className="bg-[#ffdad6] text-[#93000a] px-2 py-0.5 rounded-full text-[10px]">
                2 CRITICAL
              </span>
            </div>
          </div>

          {/* Mission List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {missions.map(item => {
              const selected = selectedMission === item.id;
              return (
                <div 
                  key={item.id}
                  onClick={() => setSelectedMission(item.id)}
                  className={`relative rounded-xl p-3 cursor-pointer transition-all border ${
                    selected 
                      ? 'bg-[#eff4ff] border-[#0051d5] shadow-xs' 
                      : 'bg-white border-[#e5eeff] hover:bg-[#f8f9ff]'
                  }`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${
                    item.code === 'CRITICAL' ? 'bg-[#ba1a1a]' : item.code === 'HIGH' ? 'bg-[#316bf3]' : 'bg-[#c6c6cd]'
                  }`} />
                  <div className="pl-1.5">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono text-xs font-bold text-[#0051d5]">#{item.id}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        item.code === 'CRITICAL' 
                          ? 'bg-[#ffdad6] text-[#93000a]' 
                          : item.code === 'HIGH' 
                            ? 'bg-[#dbe1ff] text-[#00174b]' 
                            : 'bg-[#e5eeff] text-[#45464d]'
                      }`}>
                        {item.code}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-[#0b1c30] leading-snug">{item.title}</h4>
                    <p className="text-[11px] text-[#45464d] truncate mt-0.5">{item.location}</p>
                    <div className="mt-2 pt-2 border-t border-[#e5eeff] flex items-center justify-between text-[11px]">
                      <span className="text-[#ba1a1a] font-bold font-mono">{item.sla}</span>
                      <span className="text-[#0b1c30] font-semibold">{item.unit}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Fleet Status */}
          <div className="p-3 bg-[#eff4ff] border-t border-[#d3e4fe] flex flex-col gap-1 text-xs font-mono text-[#45464d]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#0b1c30] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#0051d5]" />
                LEO Satlink Active
              </span>
              <span className="text-[#0051d5] font-bold">100%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Fleet Deployment</span>
              <span className="font-semibold text-[#0b1c30]">14 / 18 Units</span>
            </div>
          </div>
        </aside>

        {/* COLUMN 2: Tactical GIS Vector Map Canvas (Flex-1) */}
        <main className="relative flex-1 bg-[#e9f0fc] flex flex-col overflow-hidden">
          {/* Top Left Sector Header Overlay */}
          <div className="absolute top-4 left-4 z-30 flex items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-md border border-[#e5eeff]">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a] animate-pulse" />
            <div>
              <span className="text-[10px] text-[#45464d] uppercase font-bold tracking-wider block">Operational Basin</span>
              <h2 className="text-sm font-bold text-[#0b1c30] leading-tight">Sector 04-B Coastal Basin</h2>
            </div>
            <div className="h-5 w-px bg-[#e5eeff]" />
            <span className="px-2 py-0.5 rounded bg-[#ffdad6] text-[#93000a] text-xs font-bold font-mono">
              STORM SURGE +1.8m
            </span>
          </div>

          {/* Top Right GIS Layer Controls */}
          <div className="absolute top-4 right-4 z-30 bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-md border border-[#e5eeff] w-56 space-y-1.5 text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-[#e5eeff] font-bold text-[#0b1c30]">
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#0051d5]" /> GIS Data Layers
              </span>
              <span className="text-[10px] text-[#45464d] font-mono">5 Active</span>
            </div>
            <label className="flex items-center justify-between cursor-pointer text-[#0b1c30]">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#0051d5]" /> Flood Inundation
              </span>
              <input 
                type="checkbox" 
                checked={activeLayers.flood} 
                onChange={() => setActiveLayers(l => ({ ...l, flood: !l.flood }))}
                className="rounded accent-[#0f172a]"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer text-[#0b1c30]">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#ba1a1a]" /> Impassable Roads
              </span>
              <input 
                type="checkbox" 
                checked={activeLayers.impassable} 
                onChange={() => setActiveLayers(l => ({ ...l, impassable: !l.impassable }))}
                className="rounded accent-[#0f172a]"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer text-[#0b1c30]">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#0090a9]" /> Evac Corridors
              </span>
              <input 
                type="checkbox" 
                checked={activeLayers.corridors} 
                onChange={() => setActiveLayers(l => ({ ...l, corridors: !l.corridors }))}
                className="rounded accent-[#0f172a]"
              />
            </label>
          </div>

          {/* Simulated Vector Canvas Graphics */}
          <div className="relative w-full h-full flex-1 overflow-hidden select-none bg-[#e9f0fc]">
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="tactical-grid-large" width="48" height="48" patternUnits="userSpaceOnUse">
                  <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#d5e3fc" strokeWidth="0.7" />
                  <circle cx="0" cy="0" r="1.5" fill="#a4c2f4" />
                </pattern>
                <pattern id="flooded-hatch-large" width="12" height="12" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="12" stroke="#ba1a1a" strokeWidth="2.5" opacity="0.35" />
                </pattern>
              </defs>

              <rect width="100%" height="100%" fill="url(#tactical-grid-large)" />

              {/* Water Inundation Polygon */}
              {activeLayers.flood && (
                <>
                  <path d="M-50,180 Q160,210 280,310 T680,380 T1100,520 L1200,900 L-50,900 Z" fill="#c3daf9" opacity="0.65" />
                  <path d="M-50,230 Q180,260 300,380 T710,430 T1100,600 L1200,900 L-50,900 Z" fill="#9ec5f7" opacity="0.8" />
                  <path d="M120,380 Q320,400 480,510 T840,620 L840,780 L180,780 Z" fill="url(#flooded-hatch-large)" />
                </>
              )}

              {/* Evac Safe Corridor */}
              {activeLayers.corridors && (
                <>
                  <path d="M-20,90 L240,110 L380,180 L520,190 L720,130 L950,150" fill="none" stroke="#0051d5" strokeWidth="6" opacity="0.9" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M-20,90 L240,110 L380,180 L520,190 L720,130 L950,150" fill="none" stroke="#dbe1ff" strokeWidth="2" strokeDasharray="8 6" strokeLinecap="round" />
                </>
              )}

              {/* Impassable Flooded Roads */}
              {activeLayers.impassable && (
                <>
                  <line x1="380" y1="180" x2="440" y2="340" stroke="#ba1a1a" strokeWidth="5" strokeLinecap="round" />
                  <line x1="440" y1="340" x2="520" y2="460" stroke="#ba1a1a" strokeWidth="5" strokeDasharray="6 4" strokeLinecap="round" />
                </>
              )}
            </svg>

            {/* Target Callout: #MIS-104 */}
            <div 
              onClick={() => navigate('/rescue/mission/MIS-104')}
              className="absolute top-[44%] left-[46%] -translate-x-1/2 -translate-y-full flex flex-col items-center z-20 cursor-pointer group"
            >
              <div className="relative flex items-center justify-center">
                <span className="absolute w-12 h-12 rounded-full bg-[#ba1a1a] opacity-40 animate-ping" />
                <span className="absolute w-8 h-8 rounded-full bg-[#ba1a1a] opacity-60" />
                <div className="w-6 h-6 rounded-full bg-[#0f172a] text-white flex items-center justify-center font-bold shadow-lg ring-2 ring-[#ba1a1a]">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#ba1a1a]" />
                </div>
              </div>
              <div className="mt-2 bg-[#0f172a] text-white px-3 py-1.5 rounded-lg shadow-xl text-center">
                <div className="flex items-center gap-1 font-mono text-[10px] text-[#ffdad6]">
                  <span className="font-bold">#MIS-104</span>
                  <span>• Extraction</span>
                </div>
                <span className="font-bold text-xs text-white block">412 Bayshore Blvd</span>
                <span className="text-[#ba1a1a] font-mono text-[10px] font-bold">Water: +1.4m Depth</span>
              </div>
            </div>

            {/* Unit Beacon: Taskforce Alpha-02 */}
            <div className="absolute top-[34%] left-[38%] -translate-x-1/2 -translate-y-1/2 z-20 flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-md border border-[#e5eeff]">
              <div className="w-6 h-6 rounded-full bg-[#0051d5] text-white flex items-center justify-center">
                <Navigation className="w-3.5 h-3.5 rotate-45" />
              </div>
              <div>
                <div className="font-mono text-[11px] font-bold text-[#0b1c30]">ALPHA-02</div>
                <div className="text-[10px] text-[#0051d5] font-semibold">ETA 4m • Speed 28kt</div>
              </div>
            </div>

            {/* Drone Beacon */}
            <div className="absolute top-[18%] left-[45%] z-20 flex items-center gap-1.5 bg-white/90 px-3 py-1 rounded-full shadow-xs border border-[#e5eeff] text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-[#0b1c30]">DRONE-03 ALT 140m</span>
            </div>

            {/* Map Tools */}
            <div className="absolute bottom-14 left-4 z-30 flex flex-col bg-white rounded-xl shadow-md border border-[#e5eeff] overflow-hidden">
              <button className="w-9 h-9 flex items-center justify-center text-[#0b1c30] hover:bg-[#eff4ff] transition-colors">
                <Plus className="w-4 h-4" />
              </button>
              <div className="h-px bg-[#e5eeff]" />
              <button className="w-9 h-9 flex items-center justify-center text-[#0b1c30] hover:bg-[#eff4ff] transition-colors">
                <Minus className="w-4 h-4" />
              </button>
              <div className="h-px bg-[#e5eeff]" />
              <button className="w-9 h-9 flex items-center justify-center text-[#0b1c30] hover:bg-[#eff4ff] transition-colors">
                <LocateFixed className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom Telemetry Ticker */}
          <div className="h-10 shrink-0 bg-white border-t border-[#e5eeff] px-4 flex items-center justify-between text-xs font-mono text-[#45464d] shadow-sm z-20">
            <div className="flex items-center gap-3 truncate">
              <span className="flex items-center gap-1.5 font-bold text-[#0b1c30]">
                <span className="w-2 h-2 rounded-full bg-[#0051d5]" />
                LIVE TELEMETRY:
              </span>
              <span className="truncate">Drone-03 airborne over Bayshore Blvd</span>
              <span>• Wind: 24kt ENE</span>
              <span>• Precip: 38mm/h</span>
              <span>• Ping: 18ms</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 shrink-0 font-bold text-[#ba1a1a]">
              <span>ST. JUDE BASIN ELEV: +0.4m MSL</span>
            </div>
          </div>
        </main>

        {/* COLUMN 3: Contextual Mission Detail Panel (420px) */}
        <aside className="w-[420px] shrink-0 bg-white border-l border-[#e5eeff] flex flex-col shadow-lg z-30 overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-[#eff4ff]/60 border-b border-[#e5eeff] flex flex-col gap-1 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold bg-[#0f172a] text-white px-2 py-0.5 rounded">
                  #MIS-104
                </span>
                <span className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider">Tactical Dossier</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a] text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] animate-pulse" />
                LIFE SAFETY CRITICAL
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#0b1c30] mt-1">412 Bayshore Blvd</h3>
            <p className="text-xs text-[#45464d]">
              St. Jude Trauma Zone • Residential Ground-Floor Trap
            </p>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* Real-time Hydro Metrics */}
            <div>
              <span className="text-[11px] text-[#45464d] uppercase font-bold tracking-wider block mb-1.5">
                Real-Time Hydro Metrics (Gauge S-04)
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#eff4ff] p-2.5 rounded-xl text-center border border-[#d3e4fe]">
                  <span className="text-[10px] text-[#45464d] block">Water Depth</span>
                  <span className="text-lg font-extrabold text-[#ba1a1a] block">1.4 m</span>
                  <span className="text-[10px] text-[#ba1a1a] font-bold font-mono">▲ +0.2m/15m</span>
                </div>
                <div className="bg-[#eff4ff] p-2.5 rounded-xl text-center border border-[#d3e4fe]">
                  <span className="text-[10px] text-[#45464d] block">Current Flow</span>
                  <span className="text-lg font-extrabold text-[#0b1c30] block">3.1 m/s</span>
                  <span className="text-[10px] text-[#0051d5] font-bold font-mono">Turbulent</span>
                </div>
                <div className="bg-[#eff4ff] p-2.5 rounded-xl text-center border border-[#d3e4fe]">
                  <span className="text-[10px] text-[#45464d] block">Sump Press.</span>
                  <span className="text-lg font-extrabold text-[#0b1c30] block">1.42 bar</span>
                  <span className="text-[10px] text-[#45464d] font-mono">Head Limit</span>
                </div>
              </div>
            </div>

            {/* Stepper */}
            <div className="bg-[#eff4ff]/60 p-3 rounded-xl border border-[#e5eeff]">
              <span className="text-[11px] text-[#45464d] uppercase font-bold tracking-wider block mb-2">
                Incident Escalation Status
              </span>
              <div className="flex items-center justify-between text-center relative px-2">
                <div className="flex flex-col items-center z-10">
                  <div className="w-6 h-6 rounded-full bg-[#0f172a] text-white text-[11px] flex items-center justify-center font-bold">✓</div>
                  <span className="text-[10px] text-[#0b1c30] mt-1 font-semibold">Assigned</span>
                </div>
                <div className="flex-1 h-0.5 bg-[#0f172a] -mt-3" />
                <div className="flex flex-col items-center z-10">
                  <div className="w-6 h-6 rounded-full bg-[#0051d5] text-white text-[11px] flex items-center justify-center font-bold ring-2 ring-[#dbe1ff]">2</div>
                  <span className="text-[10px] text-[#0051d5] mt-1 font-bold">En Route</span>
                </div>
                <div className="flex-1 h-0.5 bg-[#dce9ff] -mt-3" />
                <div className="flex flex-col items-center z-10">
                  <div className="w-6 h-6 rounded-full bg-[#dce9ff] text-[#45464d] text-[11px] flex items-center justify-center">3</div>
                  <span className="text-[10px] text-[#45464d] mt-1">On Scene</span>
                </div>
                <div className="flex-1 h-0.5 bg-[#dce9ff] -mt-3" />
                <div className="flex flex-col items-center z-10">
                  <div className="w-6 h-6 rounded-full bg-[#dce9ff] text-[#45464d] text-[11px] flex items-center justify-center">4</div>
                  <span className="text-[10px] text-[#45464d] mt-1">Clearing</span>
                </div>
              </div>
            </div>

            {/* Assigned Unit & Comms */}
            <div className="bg-[#eff4ff] p-3 rounded-xl border border-[#d3e4fe] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#0051d5] text-white flex items-center justify-center">
                    <LifeBuoy className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[#0b1c30] block">Taskforce Alpha-02</span>
                    <span className="text-[10px] text-[#45464d]">4 Specialists • Swiftwater Zodiac 1</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-[#0051d5] bg-white px-2 py-0.5 rounded">
                  ETA 04:12
                </span>
              </div>
              <div className="h-px bg-[#d3e4fe]" />
              <div className="flex items-center justify-between text-[11px] text-[#45464d] font-mono">
                <span className="flex items-center gap-1">
                  Comms: Tac Ch 4 (Encrypted)
                </span>
                <button className="text-[#0051d5] font-bold hover:underline">Patch EOC Audio</button>
              </div>
            </div>

            {/* Drone Thermal FLIR Feed with Reticle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-[#45464d] uppercase font-bold tracking-wider flex items-center gap-1">
                  FLIR Optical Drone Feed (Eagle-03)
                </span>
                <span className="text-[10px] font-bold text-[#ba1a1a] font-mono">LIVE 1080p</span>
              </div>
              <div className="relative w-full h-40 rounded-xl overflow-hidden shadow-xs bg-black flex items-center justify-center">
                <img 
                  className="w-full h-full object-cover opacity-80"
                  alt="Drone thermal view"
                  src="https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80"
                />
                <div className="absolute inset-0 p-2.5 flex flex-col justify-between text-white/90 text-[10px] font-mono pointer-events-none">
                  <div className="flex justify-between">
                    <span className="bg-black/60 px-1 rounded">REC ● 00:28:14</span>
                    <span className="bg-black/60 px-1 rounded">FOV 48° • TGT LOCK</span>
                  </div>
                  <div className="self-center">
                    <div className="w-12 h-12 rounded-full border border-dashed border-white/60 flex items-center justify-center">
                      <div className="w-1 h-1 bg-red-500 rounded-full" />
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="bg-black/60 px-1 rounded">LAT: 29.7418 N</span>
                    <span className="bg-black/60 px-1 rounded">SURVIVORS: 4 VISIBLE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Civilian Manifest */}
            <div className="bg-[#eff4ff]/60 p-3 rounded-xl border border-[#e5eeff] space-y-1.5">
              <span className="text-[11px] text-[#45464d] uppercase font-bold tracking-wider block mb-1">
                Civilian Manifest & Mobility
              </span>
              <div className="flex items-center justify-between">
                <span>Adult (74) • Oxygen Dependent</span>
                <span className="font-mono font-bold text-[#ba1a1a]">HIGH PRIORITY</span>
              </div>
              <div className="flex items-center justify-between text-[#45464d]">
                <span>Adult (42) + Child (6)</span>
                <span>Ambulatory</span>
              </div>
              <div className="flex items-center justify-between text-[#45464d]">
                <span>Domestic Canine (Golden)</span>
                <span>Crated</span>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Actions */}
          <div className="p-4 bg-white border-t border-[#e5eeff] flex flex-col gap-2 shrink-0">
            <button 
              onClick={() => navigate('/rescue/mission/MIS-104')}
              className="w-full h-10 rounded-xl bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0b1c30] font-bold text-xs transition-colors border border-[#d3e4fe]"
            >
              Open Full Incident Dossier
            </button>
            <button 
              onClick={() => setAirBackupDispatched(true)}
              disabled={airBackupDispatched}
              className={`w-full h-12 rounded-xl text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] ${
                airBackupDispatched ? 'bg-emerald-600' : 'bg-[#ba1a1a] hover:bg-[#93000a] shadow-[#ba1a1a]/25'
              }`}
            >
              {airBackupDispatched ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>AIR RESCUE BACKUP EN ROUTE</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 fill-current" />
                  <span>DISPATCH AIR-RESCUE BACKUP</span>
                </>
              )}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
export default RescueCommandConsolePage;
