import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Share2, RefreshCw, AlertTriangle, Timer, Users, 
  Crosshair, Waves, TrendingUp, Wrench, Zap, CheckCircle2, 
  Shield, Navigation, User, Compass
} from 'lucide-react';

export const RescueMissionDossierPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const missionId = id || 'MIS-104';

  const [secondsRemaining, setSecondsRemaining] = useState(6 * 60 + 14);
  const [mutualAidRequested, setMutualAidRequested] = useState(false);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  const handleMutualAid = () => {
    setMutualAidRequested(true);
    setTimeout(() => {
      setMutualAidRequested(false);
    }, 3500);
  };

  const handleActivate = () => {
    setActivating(true);
    setTimeout(() => {
      navigate('/rescue/navigate/MIS-104');
    }, 800);
  };

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen flex flex-col font-sans pb-36">
      {/* Fixed Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#f8f9ff]/90 backdrop-blur-xl border-b border-[#e5eeff] shadow-sm">
        <div className="h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              aria-label="Go back"
              onClick={() => navigate(-1)} 
              className="w-10 h-10 flex items-center justify-center text-[#0b1c30] hover:text-[#0051d5] active:scale-95 transition-all rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight uppercase leading-none text-[#0b1c30]">Mission Detail</span>
              <span className="text-[11px] text-[#45464d] font-mono mt-0.5">#{missionId}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#dce9ff] text-[#0b1c30] text-xs font-semibold">
              Alpha-02
            </span>
            <div className="w-8 h-8 rounded-full bg-[#0f172a] flex items-center justify-center text-white">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-col pt-16 flex-grow">
        {/* Telemetry Bar & Sync Status */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#e5eeff] text-[#0b1c30] border-b border-[#d3e4fe]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-2 w-2 rounded-full bg-[#ba1a1a] animate-pulse" />
            <span className="text-xs uppercase tracking-wider text-[#ba1a1a] truncate font-bold">
              Live Uplink Active
            </span>
            <span className="text-xs text-[#45464d] font-mono">98.4% SNR</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="flex items-center gap-1 px-2.5 py-1 rounded bg-white text-[#0b1c30] hover:bg-[#dce9ff] transition-colors text-xs font-semibold shadow-xs">
              <RefreshCw className="w-3.5 h-3.5 text-[#0051d5]" />
              <span>Sync</span>
            </button>
            <button aria-label="Share tactical file" className="p-1.5 rounded bg-white text-[#45464d] hover:bg-[#dce9ff] transition-colors shadow-xs">
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tactical Canvas Cards */}
        <div className="flex flex-col px-4 pt-3 space-y-3">
          {/* Primary Tactical Briefing Card */}
          <div className="relative overflow-hidden rounded-xl bg-white shadow-sm border border-[#e5eeff] p-4">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#ba1a1a]" />
            <div className="flex items-center justify-between gap-2 mb-2 pl-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffdad6] text-[#93000a]">
                <AlertTriangle className="w-3.5 h-3.5 text-[#ba1a1a]" />
                <span className="text-[11px] tracking-wide font-bold uppercase">Critical • Life Safety</span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#d3e4fe] text-[#0b1c30]">
                <Timer className="w-3.5 h-3.5 text-[#ba1a1a]" />
                <span className="text-xs font-bold text-[#ba1a1a] tracking-tight font-mono">
                  {formatTime(secondsRemaining)} to breach
                </span>
              </div>
            </div>

            <div className="space-y-1 pl-1">
              <span className="text-xs uppercase tracking-wider text-[#0051d5] font-bold">
                Incident #{missionId} • Sector 9
              </span>
              <h2 className="text-xl font-bold text-[#0b1c30] leading-tight">
                Flash Inundation Extraction — 412 Bayshore Blvd
              </h2>
            </div>

            {/* Civilian Roster Banner */}
            <div className="mt-3 p-3 rounded-lg bg-[#ffdad6]/40 flex items-start gap-2.5 border border-[#ffdad6]">
              <div className="w-7 h-7 rounded-full bg-[#ba1a1a] flex items-center justify-center shrink-0 mt-0.5 text-white">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs uppercase tracking-wider text-[#ba1a1a] font-bold block">Critical Target Civilians</span>
                <p className="text-sm text-[#0b1c30] font-semibold leading-snug">
                  Vulnerable Civilians: 4 <span className="font-normal text-[#45464d]">(including 1 infant, 1 mobility impaired)</span>
                </p>
              </div>
            </div>
          </div>

          {/* Drone Recon Visual Tile */}
          <div className="relative rounded-xl overflow-hidden bg-[#eff4ff] shadow-sm border border-[#d3e4fe]">
            <div className="relative h-48 w-full bg-slate-900">
              <img 
                className="w-full h-full object-cover opacity-90"
                alt="Aerial drone reconnaissance photograph of residential suburban flash flooding"
                src="https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131b2e]/90 via-[#131b2e]/30 to-transparent" />
              
              {/* Timestamp Badge */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#131b2e]/85 backdrop-blur text-white text-xs flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-[#ba1a1a] animate-ping" />
                <span>T-4m ago via Drone-03</span>
              </div>

              {/* Telemetry Overlay */}
              <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-white">
                <div className="flex items-center gap-1.5">
                  <Crosshair className="w-4 h-4 text-[#4cd7f6]" />
                  <span className="text-xs font-bold tracking-tight">Attic Refuge Confirmed</span>
                </div>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-mono">LAT 27.914° N</span>
              </div>
            </div>
          </div>

          {/* Situation Intel & Hydrology Metrics */}
          <div className="rounded-xl bg-white p-4 shadow-sm border border-[#e5eeff] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Waves className="w-5 h-5 text-[#0051d5]" />
                <h3 className="font-bold text-base text-[#0b1c30]">Situation Intel</h3>
              </div>
              <span className="text-xs text-[#45464d] font-mono">Gauge #44B</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-[#eff4ff] flex flex-col justify-between">
                <span className="text-[11px] text-[#45464d] uppercase font-semibold">Water Depth</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-extrabold text-[#0b1c30] leading-none">1.42</span>
                  <span className="text-xs text-[#45464d]">m</span>
                </div>
                <span className="text-xs text-[#ba1a1a] font-bold mt-1 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" />
                  +18cm / 20min
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#eff4ff] flex flex-col justify-between">
                <div>
                  <span className="text-[11px] text-[#45464d] uppercase font-semibold">Flow Velocity</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-extrabold text-[#0b1c30] leading-none">3.8</span>
                    <span className="text-xs text-[#45464d]">m/s</span>
                  </div>
                </div>
                <span className="text-xs text-[#0051d5] font-bold mt-1">Swiftwater Hazard</span>
              </div>
            </div>

            {/* Structural and Hazard Breakdown */}
            <div className="space-y-2 pt-1">
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#eff4ff]">
                <div className="p-1.5 rounded bg-[#d3e4fe] text-[#0b1c30] shrink-0 mt-0.5">
                  <Wrench className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-[#0b1c30] block uppercase">Structural Risk</span>
                  <p className="text-xs text-[#45464d] leading-snug mt-0.5">
                    Residential 1-story timber framing, attic refuge. Structural load degraded by fast current.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#ffdad6]/40 border border-[#ffdad6]">
                <div className="p-1.5 rounded bg-[#ba1a1a]/10 text-[#ba1a1a] shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-[#ba1a1a] block uppercase">Grid & Utility Hazard</span>
                  <p className="text-xs text-[#0b1c30] leading-snug mt-0.5">
                    Transformer pole down 40m upstream, energized lines severed. Maintain 25m standoff radius.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Required Equipment & Loadout */}
          <div className="rounded-xl bg-white p-4 shadow-sm border border-[#e5eeff]">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-bold text-sm text-[#0b1c30] uppercase tracking-wide">Equipment & Loadout</h3>
              <span className="text-xs text-[#0051d5] font-bold">4 Requisites</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#dce9ff] text-[#0b1c30] text-xs font-semibold">
                <Compass className="w-3.5 h-3.5 text-[#0051d5]" />
                <span>Zodiac Rescue Boat #2</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#dce9ff] text-[#0b1c30] text-xs font-semibold">
                <Shield className="w-3.5 h-3.5 text-[#0051d5]" />
                <span>Drysuits (3)</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#dce9ff] text-[#0b1c30] text-xs font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-[#ba1a1a]" />
                <span>Pediatric Trauma Kit</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#dce9ff] text-[#0b1c30] text-xs font-semibold">
                <Wrench className="w-3.5 h-3.5 text-[#0051d5]" />
                <span>Winch Rig</span>
              </div>
            </div>
          </div>

          {/* Ingress / Route Advisory */}
          <div className="rounded-xl bg-white p-4 shadow-sm border border-[#e5eeff]">
            <div className="flex items-center gap-2 mb-2">
              <Navigation className="w-4 h-4 text-[#ba1a1a]" />
              <h3 className="font-bold text-sm text-[#0b1c30] uppercase tracking-wide">Ingress / Route Advisory</h3>
            </div>
            <div className="p-3 rounded-lg bg-[#eff4ff] space-y-2 text-xs leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#ba1a1a] uppercase shrink-0 mt-0.5">AVOID:</span>
                <p className="text-[#0b1c30]">
                  Do <span className="text-[#ba1a1a] uppercase font-bold underline">NOT</span> approach via Bayshore Ave (impassable &gt;1.8m depth, heavy debris flow).
                </p>
              </div>
              <div className="flex items-start gap-2 pt-2 border-t border-[#e5eeff]">
                <span className="font-bold text-[#0051d5] uppercase shrink-0 mt-0.5">CORRIDOR:</span>
                <p className="text-[#0b1c30]">
                  Authorized vector: Use <span className="text-[#0051d5] font-bold">Highline Ridge access ramp 3B</span> to boat launch staging point Alpha.
                </p>
              </div>
            </div>
          </div>

          {/* Assigned Tactical Unit */}
          <div className="rounded-xl bg-white p-4 shadow-sm border border-[#e5eeff]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#0051d5]" />
                <h3 className="font-bold text-sm text-[#0b1c30] uppercase tracking-wide">Assigned Unit</h3>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#dbe1ff] text-[#00174b] font-bold">
                Taskforce Alpha-02
              </span>
            </div>
            <p className="text-xs text-[#45464d] mb-3">4 Certified Extraction Specialists</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#eff4ff]">
                <div className="w-7 h-7 rounded-full bg-[#131b2e] text-white flex items-center justify-center text-xs font-bold font-mono">
                  SK
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-[#0b1c30] block truncate">Sgt. Kowalski</span>
                  <span className="text-[10px] text-[#45464d] block truncate">Team Lead</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#eff4ff]">
                <div className="w-7 h-7 rounded-full bg-[#0051d5] text-white flex items-center justify-center text-xs font-bold font-mono">
                  TR
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-[#0b1c30] block truncate">Tech Rivera</span>
                  <span className="text-[10px] text-[#45464d] block truncate">Boat Pilot</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#ba1a1a] text-white flex items-center justify-center text-xs font-bold font-mono">
                PC
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#0b1c30] block truncate">Paramedic Chen</span>
                <span className="text-[10px] text-[#45464d] block truncate">Tactical Medic</span>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#eff4ff]">
                <div className="w-7 h-7 rounded-full bg-[#45464d] text-white flex items-center justify-center text-xs font-bold font-mono">
                  DV
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-[#0b1c30] block truncate">Diver Vance</span>
                  <span className="text-[10px] text-[#45464d] block truncate">Rescue Swimmer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Docked Sticky Bottom Operational Action Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md pb-safe border-t border-[#e5eeff] shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col items-center px-4 pt-2.5 pb-3 space-y-2 max-w-lg mx-auto">
          <button 
            onClick={handleMutualAid}
            className="text-xs text-[#0051d5] font-bold tracking-wide hover:underline active:opacity-75 flex items-center gap-1 py-0.5"
          >
            {mutualAidRequested ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#ba1a1a]" />
                <span className="text-[#ba1a1a]">Request Broadcasted to Dispatch</span>
              </>
            ) : (
              <>
                <Shield className="w-3.5 h-3.5" />
                <span>Request Additional Mutual Aid Unit</span>
              </>
            )}
          </button>

          <button 
            onClick={handleActivate}
            disabled={activating}
            className={`w-full h-12 rounded-xl flex items-center justify-center gap-2 text-white font-bold uppercase tracking-wider text-sm shadow-md transition-all active:scale-[0.99] ${
              activating ? 'bg-[#0f172a]' : 'bg-[#ba1a1a] hover:bg-[#93000a] shadow-[#ba1a1a]/25'
            }`}
          >
            {activating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>ENGAGING VECTOR & TELEMETRY...</span>
              </>
            ) : (
              <>
                <Navigation className="w-5 h-5 fill-current" />
                <span>START MISSION & ACTIVATE NAV</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
export default RescueMissionDossierPage;
