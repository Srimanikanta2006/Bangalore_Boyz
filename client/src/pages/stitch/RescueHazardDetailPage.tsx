import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Shield, Radio, Activity, AlertTriangle, AlertOctagon, 
  Waves, Gauge, Maximize2, CheckCircle2, Navigation, Compass,
  Send, Flag, TrendingUp
} from 'lucide-react';

export const RescueHazardDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const hazardId = id || 'SEC-04B';

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [broadcasting, setBroadcasting] = useState(false);
  const [barrierDeployed, setBarrierDeployed] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleBroadcast = () => {
    setBroadcasting(true);
    showToast('Hazard priority broadcast sent to 4 tactical units');
    setTimeout(() => setBroadcasting(false), 1200);
  };

  const handleDeployBarrier = () => {
    setBarrierDeployed(true);
    showToast('Engineering Taskforce Bravo en route to Sec-04B');
  };

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen flex flex-col font-sans pb-32">
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
                <span className="text-[11px] text-[#45464d] leading-none mt-0.5">Tactical Hazard • {hazardId}</span>
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
      <main className="flex flex-col pt-20 flex-grow px-4 gap-3">
        {/* Tactical Inset GIS Map Preview */}
        <div className="relative w-full rounded-xl overflow-hidden shadow-sm border border-[#d3e4fe] bg-slate-900 mt-2">
          <div 
            className="w-full h-48 bg-cover bg-center opacity-85"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/80 via-[#0f172a]/20 to-transparent pointer-events-none" />

          {/* Top Badge Row */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-auto">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-[#0b1c30] text-xs font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#ba1a1a] animate-ping" />
              LIVE GIS: SEC-04B
            </span>
            <button 
              aria-label="Expand Tactical View"
              onClick={() => navigate('/rescue/tactical')}
              className="w-8 h-8 rounded-full bg-white/90 backdrop-blur text-[#0b1c30] flex items-center justify-center shadow-xs active:scale-95 transition-transform"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Map Bottom Label Strip */}
          <div className="absolute bottom-3 inset-x-3 flex items-end justify-between text-white">
            <div className="flex flex-col">
              <span className="text-[11px] text-[#dce9ff] tracking-wide uppercase font-mono">Pinch Point Focus</span>
              <span className="text-base font-bold leading-tight">Bayshore Underpass Culvert</span>
            </div>
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-white text-xs font-mono">
              <Compass className="w-3.5 h-3.5 text-[#4cd7f6]" />
              <span>LAT 37.7649 N</span>
            </div>
          </div>
        </div>

        {/* Incident Status & Classification Header */}
        <div className="flex flex-col bg-white rounded-xl p-4 shadow-sm border border-[#e5eeff] gap-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e5eeff] text-[#0b1c30] text-xs font-semibold uppercase">
              <span className="w-2 h-2 rounded-sm bg-[#0090a9]" />
              <span>Flood / Flash Inundation</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffdad6] text-[#93000a] text-xs font-bold uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]" />
              Critical • Do Not Enter
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div>
              <span className="text-[11px] uppercase text-[#45464d] tracking-wider font-semibold">Dynamic Risk Index</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-extrabold text-[#ba1a1a] leading-none">94</span>
                <span className="text-sm text-[#45464d] font-normal">/ 100</span>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="inline-flex items-center gap-1 text-xs text-[#0051d5] font-semibold">
                <Activity className="w-3.5 h-3.5" />
                LEO Sat-Link Sync
              </span>
              <span className="text-xs text-[#45464d] font-mono mt-0.5">Sensor Telemetry: 18s ago</span>
            </div>
          </div>

          {/* Micro telemetry rate progress indicator */}
          <div className="w-full bg-[#e5eeff] rounded-full h-1.5 overflow-hidden mt-1">
            <div className="bg-[#ba1a1a] h-full rounded-full transition-all duration-500" style={{ width: '94%' }} />
          </div>
        </div>

        {/* RESTRICTED ACCESS CORRIDOR DIRECTIVE */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[#ffdad6] text-[#93000a] shadow-sm border border-[#ffdad6]">
          <AlertOctagon className="w-7 h-7 text-[#ba1a1a] shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-sm tracking-wide uppercase text-[#93000a]">RESTRICTED ACCESS CORRIDOR</span>
            <p className="text-xs text-[#0b1c30] leading-snug">
              Heavy hydraulic undertow active at railway culvert. Light and standard high-water rescue vehicles will capsize. Amphibious tracked craft and zodiacs only.
            </p>
          </div>
        </div>

        {/* High-Consequence Telemetry Grid (2x2) */}
        <div className="grid grid-cols-2 gap-2">
          {/* Depth Metric */}
          <div className="flex flex-col p-3 bg-white rounded-xl shadow-sm border border-[#e5eeff]">
            <div className="flex items-center justify-between text-[#45464d]">
              <span className="text-[11px] uppercase font-semibold">Water Depth</span>
              <Waves className="w-4 h-4 text-[#ba1a1a]" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold text-[#0b1c30]">1.65</span>
              <span className="text-xs text-[#45464d]">m</span>
            </div>
            <span className="text-xs text-[#ba1a1a] font-bold mt-1 flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              +22 cm / 10m
            </span>
          </div>

          {/* Velocity Metric */}
          <div className="flex flex-col p-3 bg-white rounded-xl shadow-sm border border-[#e5eeff]">
            <div className="flex items-center justify-between text-[#45464d]">
              <span className="text-[11px] uppercase font-semibold">Flow Velocity</span>
              <Gauge className="w-4 h-4 text-[#ba1a1a]" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold text-[#0b1c30]">3.4</span>
              <span className="text-xs text-[#45464d]">m/s</span>
            </div>
            <span className="text-xs text-[#ba1a1a] font-medium truncate mt-1">
              Extreme drag force
            </span>
          </div>

          {/* Debris Load */}
          <div className="flex flex-col p-3 bg-white rounded-xl shadow-sm border border-[#e5eeff] col-span-2">
            <div className="flex items-center justify-between text-[#45464d] mb-1">
              <span className="text-[11px] uppercase font-semibold">Subsurface Debris Load</span>
              <AlertTriangle className="w-4 h-4 text-[#0051d5]" />
            </div>
            <p className="text-sm text-[#0b1c30] font-bold leading-snug">
              Submerged Sedans (2) • Fallen Utility Timber
            </p>
            <span className="text-xs text-[#45464d] mt-1 leading-snug">
              Acoustic sonar echoes indicate vehicle chassis pinned against intake grating.
            </span>
          </div>

          {/* Clearance Margin Status */}
          <div className="flex flex-col p-3 bg-white rounded-xl shadow-sm border border-[#e5eeff] col-span-2">
            <div className="flex items-center justify-between text-[#45464d] mb-0.5">
              <span className="text-[11px] uppercase font-semibold">Vehicle Clearance Status</span>
              <AlertOctagon className="w-4 h-4 text-[#ba1a1a]" />
            </div>
            <p className="text-sm text-[#ba1a1a] font-bold">
              Impassable for all non-amphibious ground vehicles
            </p>
          </div>
        </div>

        {/* Tactical Alternate Route Detour Sequence */}
        <div className="flex flex-col p-4 bg-white rounded-xl shadow-sm border border-[#e5eeff] gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-[#0051d5]" />
              <span className="font-bold text-sm text-[#0b1c30]">Recommended Detour</span>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#0051d5] font-mono text-xs font-semibold">
              +3.2 km • +7 min
            </span>
          </div>
          <p className="text-xs text-[#45464d]">
            High-ground bypass established around underpass basin:
          </p>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mt-1">
            <div className="shrink-0 flex items-center px-2.5 py-1.5 rounded-lg bg-[#e5eeff] text-[#0b1c30] text-xs font-semibold">
              Gate 3 Ramp
            </div>
            <span className="text-[#45464d] shrink-0 text-xs">→</span>
            <div className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#dbe1ff] text-[#00174b] text-xs font-semibold">
              Skyline (+18m MSL)
            </div>
            <span className="text-[#45464d] shrink-0 text-xs">→</span>
            <div className="shrink-0 flex items-center px-2.5 py-1.5 rounded-lg bg-[#e5eeff] text-[#0b1c30] text-xs font-semibold">
              East Canal Levee
            </div>
            <span className="text-[#45464d] shrink-0 text-xs">→</span>
            <div className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0f172a] text-white text-xs font-semibold">
              <Flag className="w-3.5 h-3.5 text-[#4cd7f6]" />
              Objective
            </div>
          </div>
        </div>

        {/* Hardware Telemetry Diagnostics Strip */}
        <div className="flex flex-col p-4 bg-[#eff4ff] rounded-xl border border-[#d3e4fe] gap-1.5">
          <span className="text-xs uppercase text-[#45464d] font-bold">Hardware Sensor Diagnostics</span>
          <div className="grid grid-cols-3 gap-2 text-center mt-1">
            <div className="bg-white p-2 rounded-lg border border-[#e5eeff]">
              <span className="text-[11px] text-[#45464d] block font-mono">Flowmeter</span>
              <span className="text-xs font-bold text-[#0b1c30]">#44B Acoustic</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-[#e5eeff]">
              <span className="text-[11px] text-[#45464d] block font-mono">Head Pres.</span>
              <span className="text-xs font-bold text-[#0b1c30]">2.1 bar</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-[#e5eeff]">
              <span className="text-[11px] text-[#45464d] block font-mono">Turbidity</span>
              <span className="text-xs font-bold text-[#ba1a1a]">Severe / High</span>
            </div>
          </div>
        </div>

        {/* Operational Field Actions Stack */}
        <div className="flex flex-col gap-2 mt-2">
          <button 
            type="button"
            onClick={handleBroadcast}
            disabled={broadcasting}
            className="w-full h-11 px-4 rounded-xl bg-[#e5eeff] text-[#0b1c30] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#dce9ff] active:scale-[0.99] transition-all"
          >
            <Radio className="w-4 h-4 text-[#ba1a1a]" />
            <span>{broadcasting ? 'Broadcasting Emergency Packet...' : 'Broadcast Warning to Nearby Units'}</span>
          </button>

          <button 
            type="button"
            onClick={handleDeployBarrier}
            className={`w-full h-12 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all ${
              barrierDeployed 
                ? 'bg-emerald-600 text-white shadow-emerald-500/25' 
                : 'bg-[#0f172a] text-white hover:bg-[#1e293b] shadow-slate-900/25'
            }`}
          >
            {barrierDeployed ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                <span>Barrier Team Dispatched</span>
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 text-[#4cd7f6]" />
                <span>Request Corridor Barrier Deployment</span>
              </>
            )}
          </button>
        </div>
      </main>

      {/* Micro-Interaction Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#0f172a] text-white px-4 py-2.5 rounded-full shadow-xl text-xs font-semibold flex items-center gap-2 border border-white/20 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
export default RescueHazardDetailPage;
