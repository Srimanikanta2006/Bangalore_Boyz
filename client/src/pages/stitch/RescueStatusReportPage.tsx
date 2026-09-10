import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Shield, AlertTriangle, Users, Waves, Plus, Minus,
  Zap, Home, Ban, Camera, Radio, CheckCircle2, RefreshCw,
  Send, FileText, Map as MapIcon, ClipboardList
} from 'lucide-react';

export const RescueStatusReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const reportId = id || 'MIS-104';

  const [phase, setPhase] = useState<'On Scene' | 'Extracting' | 'Evac En Route' | 'Resolved'>('On Scene');
  const [depthTier, setDepthTier] = useState<string>('1.0–1.5m');
  const [civilianCount, setCivilianCount] = useState(4);
  const [toggles, setToggles] = useState({
    powerGrid: true,
    structuralCollapse: false,
    roadBlockage: true
  });
  const [notes, setNotes] = useState(
    '4 civilians extracted from attic window via Zodiac-02. Transferred to Medic Unit 9 for rapid transport to St. Jude Gate B. Sector 4B culvert needs immediate mechanical pump deployment.'
  );
  const [transmitting, setTransmitting] = useState(false);
  const [transmitted, setTransmitted] = useState(false);

  const handleTransmit = () => {
    setTransmitting(true);
    setTimeout(() => {
      setTransmitting(false);
      setTransmitted(true);
      setTimeout(() => setTransmitted(false), 3000);
    }, 1100);
  };

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen flex flex-col font-sans pb-36">
      {/* Fixed Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#f8f9ff]/90 backdrop-blur-xl border-b border-[#e5eeff] shadow-sm">
        <div className="h-20 px-4 flex flex-col justify-center gap-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate(-1)} 
                className="w-8 h-8 flex items-center justify-center text-[#0b1c30] hover:text-[#0051d5] active:scale-95 transition-all rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight leading-none text-[#0b1c30]">ClimateShield</span>
                <span className="text-[11px] text-[#45464d] leading-none mt-0.5">Sitrep Reports • #{reportId}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#dce9ff] text-[#0b1c30] text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0051d5] animate-pulse" />
                Alpha-02
              </span>
              <div className="w-8 h-8 rounded-full bg-[#0f172a] flex items-center justify-center text-white text-xs font-bold font-mono">
                A2
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-[#45464d] text-xs font-mono px-0.5">
            <div className="flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 text-[#0051d5]" />
              <span>Mesh P2P Active • 12 Nodes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span className="font-semibold text-[#0b1c30] uppercase text-[11px]">OP-READY</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-col pt-20 flex-grow px-4 space-y-3 pb-8">
        {/* Mission Telemetry Overview Card */}
        <section className="bg-white rounded-xl p-4 shadow-sm border border-[#e5eeff] space-y-2 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#0051d5] text-white">
                <AlertTriangle className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs text-[#0051d5] uppercase font-bold tracking-wider">Mission In Progress</span>
            </div>
            <span className="text-xs text-[#45464d] bg-[#eff4ff] px-2.5 py-0.5 rounded-full font-mono font-semibold">
              SYNC: T-00:42
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0b1c30] tracking-tight">
              Field Sitrep #{reportId}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-[#45464d] text-xs mt-1">
              <span className="flex items-center gap-1 font-semibold text-[#0b1c30]">
                <Shield className="w-3.5 h-3.5 text-[#0051d5]" />
                Taskforce Alpha-02
              </span>
              <span>•</span>
              <span>Sector 4B (Culvert Delta)</span>
            </div>
          </div>
        </section>

        {/* 1. Operational Status Radio Stepper */}
        <section className="bg-white rounded-xl p-4 shadow-sm border border-[#e5eeff] space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-[#0b1c30] flex items-center gap-1.5">
              Operational Phase
            </label>
            <span className="text-xs text-[#0051d5] bg-[#dbe1ff] px-2.5 py-0.5 rounded-full font-semibold">
              Active Stage
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['On Scene', 'Extracting', 'Evac En Route', 'Resolved'] as const).map(stage => {
              const active = phase === stage;
              return (
                <button
                  key={stage}
                  type="button"
                  onClick={() => setPhase(stage)}
                  className={`h-11 flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all px-2 ${
                    active 
                      ? 'bg-[#0f172a] text-white shadow-sm' 
                      : 'bg-[#eff4ff] text-[#45464d] hover:bg-[#e5eeff]'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                  <span>{stage}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. Live Environmental Gauge Input */}
        <section className="bg-white rounded-xl p-4 shadow-sm border border-[#e5eeff] space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-[#0b1c30] flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-[#0051d5]" />
              Hydro Telemetry
            </label>
            <span className="text-xs text-[#ba1a1a] bg-[#ffdad6] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] animate-ping" />
              High Hazard
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-[#45464d] uppercase tracking-wider font-semibold">Water Level Incursion</span>
            <div className="grid grid-cols-4 gap-1.5">
              {['<0.5m', '0.5–1.0m', '1.0–1.5m', '>1.5m Crit'].map(depth => {
                const active = depthTier === depth;
                const isCrit = depth.includes('Crit');
                return (
                  <button
                    key={depth}
                    type="button"
                    onClick={() => setDepthTier(depth)}
                    className={`py-2 rounded-lg text-xs font-mono font-semibold transition-all ${
                      active 
                        ? (isCrit ? 'bg-[#ba1a1a] text-white' : 'bg-[#0f172a] text-white')
                        : (isCrit ? 'bg-[#ffdad6] text-[#93000a]' : 'bg-[#eff4ff] text-[#0b1c30] hover:bg-[#e5eeff]')
                    }`}
                  >
                    {depth}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between bg-[#eff4ff] rounded-xl p-3 border border-[#d3e4fe]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#dbe1ff] flex items-center justify-center shrink-0 text-[#0051d5]">
                <Waves className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-[#45464d]">Hydro Surface State</span>
                <span className="text-xs font-bold text-[#0b1c30] truncate">Fast Runoff / Strong Current</span>
              </div>
            </div>
            <span className="text-xs font-bold text-[#ba1a1a] bg-[#ffdad6] px-2 py-1 rounded font-mono">
              4.2 kt
            </span>
          </div>
        </section>

        {/* 3. Civilians Secured Stepper */}
        <section className="bg-white rounded-xl p-4 shadow-sm border border-[#e5eeff] space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-[#0b1c30] flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#0051d5]" />
              Civilians Secured
            </label>
            <span className="text-xs text-[#0090a9] bg-[#acedff] px-2 py-0.5 rounded-full font-bold">
              Primary Triage
            </span>
          </div>

          <div className="flex items-center justify-between bg-[#eff4ff] rounded-xl p-2 border border-[#d3e4fe]">
            <button
              type="button"
              onClick={() => setCivilianCount(c => Math.max(0, c - 1))}
              className="w-12 h-12 rounded-lg bg-white text-[#0b1c30] active:scale-95 shadow-xs flex items-center justify-center font-bold transition-all"
            >
              <Minus className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-[#0b1c30] leading-none">{civilianCount}</span>
                <span className="text-xs text-[#45464d] font-semibold">SOULS</span>
              </div>
              <span className="text-xs text-[#0051d5] font-semibold mt-0.5">Secured On Zodiac-02</span>
            </div>
            <button
              type="button"
              onClick={() => setCivilianCount(c => c + 1)}
              className="w-12 h-12 rounded-lg bg-[#0f172a] text-white active:scale-95 shadow-xs flex items-center justify-center font-bold transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-[#eff4ff] rounded-lg py-1.5 px-2">
              <span className="text-[10px] text-[#45464d] block uppercase font-semibold">Adults</span>
              <span className="text-base font-bold text-[#0b1c30]">2</span>
            </div>
            <div className="bg-[#eff4ff] rounded-lg py-1.5 px-2">
              <span className="text-[10px] text-[#45464d] block uppercase font-semibold">Elderly</span>
              <span className="text-base font-bold text-[#0b1c30]">1</span>
            </div>
            <div className="bg-[#eff4ff] rounded-lg py-1.5 px-2">
              <span className="text-[10px] text-[#45464d] block uppercase font-semibold">Infant</span>
              <span className="text-base font-bold text-[#0b1c30]">1</span>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-[#ffdad6]/40 p-2.5 rounded-lg border border-[#ffdad6]">
            <AlertTriangle className="w-4 h-4 text-[#ba1a1a] shrink-0 mt-0.5" />
            <div className="flex flex-col min-w-0 text-xs">
              <span className="font-bold text-[#ba1a1a] uppercase">Medical Urgency Tag</span>
              <span className="text-[#0b1c30] mt-0.5">1 Non-ambulatory / Moderate Hypothermia Triage</span>
            </div>
          </div>
        </section>

        {/* 4. Hazard Vectors & Obstacle Toggles */}
        <section className="bg-white rounded-xl p-4 shadow-sm border border-[#e5eeff] space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-[#0b1c30] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#0051d5]" />
              Hazard Vectors & Obstacles
            </label>
            <span className="text-xs text-[#45464d] font-mono">Live Mesh Flags</span>
          </div>

          <div className="space-y-2">
            {/* Toggle 1 */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#eff4ff]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-md bg-[#ffdad6] text-[#93000a] flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-[#ba1a1a]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-[#0b1c30] truncate">Power Grid / Arcing Wires</span>
                  <span className="text-[11px] text-[#ba1a1a] font-semibold">Active Electrical Threat</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setToggles(t => ({ ...t, powerGrid: !t.powerGrid }))}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative flex items-center ${
                  toggles.powerGrid ? 'bg-[#0f172a] justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <span className="w-5 h-5 bg-white rounded-full shadow-sm" />
              </button>
            </div>

            {/* Toggle 2 */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#eff4ff]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-md bg-[#e5eeff] text-[#0b1c30] flex items-center justify-center shrink-0">
                  <Home className="w-4 h-4 text-[#0051d5]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-[#0b1c30] truncate">Structural Collapse Risk</span>
                  <span className="text-[11px] text-[#45464d]">Perimeter Evaluated Clear</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setToggles(t => ({ ...t, structuralCollapse: !t.structuralCollapse }))}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative flex items-center ${
                  toggles.structuralCollapse ? 'bg-[#0f172a] justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <span className="w-5 h-5 bg-white rounded-full shadow-sm" />
              </button>
            </div>

            {/* Toggle 3 */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#eff4ff]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-md bg-[#ffdad6] text-[#93000a] flex items-center justify-center shrink-0">
                  <Ban className="w-4 h-4 text-[#ba1a1a]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-[#0b1c30] truncate">Road Blockage Complete</span>
                  <span className="text-[11px] text-[#ba1a1a] font-semibold">Ambulance Inaccessible</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setToggles(t => ({ ...t, roadBlockage: !t.roadBlockage }))}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative flex items-center ${
                  toggles.roadBlockage ? 'bg-[#0f172a] justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <span className="w-5 h-5 bg-white rounded-full shadow-sm" />
              </button>
            </div>
          </div>
        </section>

        {/* 5. Tactical Visual Stamp Card */}
        <section className="bg-white rounded-xl p-4 shadow-sm border border-[#e5eeff] space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-[#0b1c30] flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-[#0051d5]" />
              Tactical Visual Stamp
            </label>
            <span className="text-xs text-[#45464d] bg-[#eff4ff] px-2 py-0.5 rounded font-mono font-semibold">
              GPS Tagged
            </span>
          </div>

          <div className="relative rounded-xl overflow-hidden shadow-xs bg-slate-900">
            <img 
              className="w-full h-44 object-cover opacity-90"
              alt="Rescue inflatable boat operating in urban flood waters"
              src="https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 text-white space-y-1 text-xs">
              <div className="flex items-center justify-between font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]" />
                  LAT 30.2741° N, LON 97.7404° W
                </span>
                <span>ELEV +14.2m</span>
              </div>
              <div className="flex items-center justify-between text-[#c6c6cd] text-[10px]">
                <span>STAMP: 2026-09-10 14:38:09 UTC</span>
                <span>DEVICE: Alpha-BodyCam-02</span>
              </div>
            </div>
          </div>

          <button 
            type="button"
            className="w-full h-10 rounded-xl bg-[#eff4ff] hover:bg-[#e5eeff] active:scale-[0.99] text-[#0b1c30] text-xs font-bold flex items-center justify-center gap-2 transition-all border border-[#d3e4fe]"
          >
            <Camera className="w-4 h-4 text-[#0051d5]" />
            <span>+ Add Thermal / Drone Photo</span>
          </button>
        </section>

        {/* 6. Field Commander Notes */}
        <section className="bg-white rounded-xl p-4 shadow-sm border border-[#e5eeff] space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-[#0b1c30] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#0051d5]" />
              Field Commander Notes
            </label>
            <span className="text-[11px] text-[#45464d]">Auto-saved</span>
          </div>
          <textarea 
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full bg-[#eff4ff] rounded-xl p-3 text-xs text-[#0b1c30] focus:outline-none focus:ring-1 focus:ring-[#0051d5] resize-none leading-relaxed border border-[#d3e4fe]"
          />
        </section>

        {/* Sticky Operational Bottom CTA */}
        <div className="pt-1 space-y-2">
          <button 
            type="button"
            onClick={handleTransmit}
            disabled={transmitting}
            className={`w-full h-12 rounded-xl text-white font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] ${
              transmitted 
                ? 'bg-emerald-600' 
                : transmitting 
                  ? 'bg-[#0051d5]' 
                  : 'bg-[#0f172a] hover:bg-[#1e293b]'
            }`}
          >
            {transmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>TRANSMITTING VIA MESH...</span>
              </>
            ) : transmitted ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                <span>TRANSMITTED TO EOC (ACK-200)</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>TRANSMIT FIELD SITREP TO EOC</span>
              </>
            )}
          </button>

          <div className="flex justify-center">
            <button 
              type="button"
              className="text-xs text-[#0051d5] font-semibold hover:underline flex items-center gap-1.5 py-1 px-3"
            >
              <span>Save Offline Draft (P2P Mesh Buffer)</span>
            </button>
          </div>
        </div>
      </main>

      {/* Rescue Role Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-t border-[#e5eeff] pb-safe shadow-md">
        <div className="grid grid-cols-4 items-center h-16 px-2 max-w-lg mx-auto">
          <Link to="/rescue/tactical" className="flex flex-col items-center justify-center min-h-[44px] gap-0.5 text-[#45464d] hover:text-[#0051d5] transition-colors">
            <MapIcon className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Map</span>
          </Link>
          <Link to="/rescue/mission/MIS-104" className="flex flex-col items-center justify-center min-h-[44px] gap-0.5 text-[#45464d] hover:text-[#0051d5] transition-colors">
            <ClipboardList className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Missions</span>
          </Link>
          <Link to="/rescue/hazard/SEC-04B" className="flex flex-col items-center justify-center min-h-[44px] gap-0.5 text-[#45464d] hover:text-[#0051d5] transition-colors">
            <Shield className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Team</span>
          </Link>
          <Link to="/rescue/report/MIS-104" className="flex flex-col items-center justify-center min-h-[44px] gap-0.5 text-[#0051d5] font-bold">
            <FileText className="w-5 h-5" />
            <span className="text-[11px]">Reports</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};
export default RescueStatusReportPage;
