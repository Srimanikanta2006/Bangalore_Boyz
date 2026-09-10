import React, { useState } from 'react';
import { GovHqLayout } from '../../components/stitch/GovHqLayout';
import { 
  Play, RotateCcw, Sliders, Waves, Thermometer, 
  Droplet, Wind, AlertTriangle, Shield, CheckCircle2, 
  RefreshCw, TrendingUp, Layers, Compass, ArrowRight
} from 'lucide-react';

export const GovSimulatorPage: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState('100-Yr Atmospheric River');
  const [precipRate, setPrecipRate] = useState(65);
  const [stormDuration, setStormDuration] = useState(4.5);
  const [drainageThroughput, setDrainageThroughput] = useState(75);
  const [tidalSurge, setTidalSurge] = useState(1.8);
  const [splitPos, setSplitPos] = useState(50);
  const [simulating, setSimulating] = useState(false);
  const [simRunComplete, setSimRunComplete] = useState(false);

  const presets = [
    { id: '100-Yr Atmospheric River', icon: Waves },
    { id: 'Heat Dome + Grid Strain', icon: Thermometer },
    { id: 'Flash Surge + Dam Breach', icon: AlertTriangle },
    { id: 'Custom Scenario Sandbox', icon: Sliders },
  ];

  const handleRunSim = () => {
    setSimulating(true);
    setTimeout(() => {
      setSimulating(false);
      setSimRunComplete(true);
      setTimeout(() => setSimRunComplete(false), 3000);
    }, 1200);
  };

  const resetDefaults = () => {
    setPrecipRate(65);
    setStormDuration(4.5);
    setDrainageThroughput(75);
    setTidalSurge(1.8);
    setSplitPos(50);
  };

  return (
    <GovHqLayout activePath="/gov/simulator">
      <div className="p-6 flex flex-col gap-6 w-full max-w-7xl mx-auto">
        {/* Top Command Strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#e5eeff] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0f172a] flex items-center justify-center text-white">
              <Play className="w-5 h-5 fill-current text-[#4cd7f6]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-[#0b1c30]">
                  Predictive Risk Sandbox & Hydro-Strain Engine
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a]">
                  SIM-CAD V4.8 ACTIVE
                </span>
              </div>
              <p className="text-xs text-[#45464d] mt-0.5">
                Stress-testing municipal resilience envelopes under compound extreme climatological events.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#eff4ff] text-xs font-mono text-[#0b1c30] border border-[#d3e4fe]">
              <span className="w-2 h-2 rounded-full bg-[#0051d5]" />
              <span>Compute: 128 Nodes (0.04s Delta)</span>
            </div>
            <button 
              type="button"
              onClick={resetDefaults}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#eff4ff] text-xs font-semibold text-[#0b1c30] flex items-center gap-1 border border-[#e5eeff] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#0051d5]" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 1. LEFT CONTROL PANEL (4 cols) */}
          <aside className="lg:col-span-4 flex flex-col bg-white rounded-2xl p-4 shadow-sm border border-[#e5eeff]">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5eeff]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#0051d5]" />
                <span className="font-bold text-sm text-[#0b1c30]">Scenario Parameters</span>
              </div>
              <span className="text-[10px] font-mono text-[#76777d] uppercase font-bold">CONFIG 09</span>
            </div>

            {/* Presets */}
            <div className="space-y-1.5 mt-3">
              <label className="text-[10px] font-bold text-[#76777d] uppercase tracking-wider">
                Simulation Preset
              </label>
              <div className="grid grid-cols-1 gap-1">
                {presets.map(preset => {
                  const Icon = preset.icon;
                  const active = selectedPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedPreset(preset.id)}
                      className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                        active 
                          ? 'bg-[#0f172a] text-white shadow-xs' 
                          : 'bg-[#eff4ff] text-[#0b1c30] hover:bg-[#e5eeff]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#4cd7f6]' : 'text-[#0051d5]'}`} />
                        <span>{preset.id}</span>
                      </div>
                      {active && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Parametric Sliders */}
            <div className="flex flex-col gap-3 mt-4">
              {/* Precipitation */}
              <div className="bg-[#eff4ff] p-3 rounded-xl border border-[#d3e4fe] flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#0b1c30]">Precipitation Rate</span>
                  <span className="font-mono font-bold text-[#ba1a1a] bg-white px-2 py-0.5 rounded border border-[#d3e4fe]">
                    {precipRate} mm/hr
                  </span>
                </div>
                <input 
                  type="range"
                  min="10"
                  max="120"
                  value={precipRate}
                  onChange={e => setPrecipRate(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#dce9ff] rounded-lg appearance-none cursor-pointer accent-[#ba1a1a]"
                />
                <div className="flex justify-between text-[10px] text-[#76777d] mt-0.5">
                  <span>Historical Avg (24mm)</span>
                  <span className="text-[#ba1a1a] font-semibold">+35% Extreme Surge</span>
                </div>
              </div>

              {/* Duration */}
              <div className="bg-[#eff4ff] p-3 rounded-xl border border-[#d3e4fe] flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#0b1c30]">Storm Duration</span>
                  <span className="font-mono font-bold text-[#0051d5] bg-white px-2 py-0.5 rounded border border-[#d3e4fe]">
                    {stormDuration} Hours
                  </span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max="18"
                  step="0.5"
                  value={stormDuration}
                  onChange={e => setStormDuration(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#dce9ff] rounded-lg appearance-none cursor-pointer accent-[#0051d5]"
                />
                <div className="flex justify-between text-[10px] text-[#76777d] mt-0.5">
                  <span>Min: 1.0 hr</span>
                  <span>Sustained Deluge Band</span>
                </div>
              </div>

              {/* Drainage */}
              <div className="bg-[#eff4ff] p-3 rounded-xl border border-[#d3e4fe] flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#0b1c30]">Drainage Throughput</span>
                  <span className="font-mono font-bold text-[#0b1c30] bg-white px-2 py-0.5 rounded border border-[#d3e4fe]">
                    {drainageThroughput}% Nominal
                  </span>
                </div>
                <input 
                  type="range"
                  min="20"
                  max="100"
                  value={drainageThroughput}
                  onChange={e => setDrainageThroughput(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#dce9ff] rounded-lg appearance-none cursor-pointer accent-[#0f172a]"
                />
                <div className="flex justify-between text-[10px] text-[#76777d] mt-0.5">
                  <span>25% Silt Occlusion</span>
                  <span>Canal Gate Delta</span>
                </div>
              </div>

              {/* Tidal Surge */}
              <div className="bg-[#eff4ff] p-3 rounded-xl border border-[#d3e4fe] flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#0b1c30]">Tidal Surge Level</span>
                  <span className="font-mono font-bold text-[#0051d5] bg-white px-2 py-0.5 rounded border border-[#d3e4fe]">
                    +{tidalSurge}m MSL
                  </span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="4"
                  step="0.1"
                  value={tidalSurge}
                  onChange={e => setTidalSurge(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#dce9ff] rounded-lg appearance-none cursor-pointer accent-[#0051d5]"
                />
                <div className="flex justify-between text-[10px] text-[#76777d] mt-0.5">
                  <span>Astronomical High</span>
                  <span>King Tide Vector</span>
                </div>
              </div>
            </div>

            {/* Run Button */}
            <div className="mt-5">
              <button 
                type="button"
                onClick={handleRunSim}
                disabled={simulating}
                className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all ${
                  simRunComplete 
                    ? 'bg-emerald-600 text-white' 
                    : simulating 
                      ? 'bg-[#0051d5] text-white' 
                      : 'bg-[#0f172a] hover:bg-[#1e293b] text-white'
                }`}
              >
                {simulating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>CALCULATING CASCADE VECTORS...</span>
                  </>
                ) : simRunComplete ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>SIMULATION COMPLETE • VECTORS PROJECTED</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-[#4cd7f6] fill-current" />
                    <span>RUN RESILIENCE SIMULATION</span>
                  </>
                )}
              </button>
            </div>
          </aside>

          {/* 2. SPLIT VIEW MAP AREA (8 cols) */}
          <section className="lg:col-span-8 flex flex-col gap-4">
            {/* Split Comparison Canvas */}
            <div className="relative w-full h-[460px] rounded-2xl overflow-hidden shadow-sm bg-slate-900 border border-[#1f344d]">
              <div 
                className="absolute inset-0 w-full h-full bg-cover bg-center opacity-70"
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80')` }}
              />

              {/* Vector Overlay based on slider */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 600" preserveAspectRatio="none">
                <path d="M 0 320 Q 250 300 480 340 T 1000 310" fill="none" stroke="#0051d5" strokeWidth="24" opacity="0.4" />
                {/* Simulated Flood Area */}
                <polygon 
                  points="200,180 480,210 680,380 540,560 320,520 180,340" 
                  fill="#0090a9" 
                  fillOpacity="0.35" 
                  stroke="#ba1a1a" 
                  strokeWidth="3" 
                  strokeDasharray="6 3" 
                />
              </svg>

              {/* Top Split Indicators */}
              <div className="absolute top-4 inset-x-4 flex justify-between z-20 pointer-events-none text-xs font-bold font-mono">
                <span className="bg-black/80 backdrop-blur px-3 py-1 rounded-full text-white border border-white/10">
                  BASELINE (CURRENT STATE)
                </span>
                <span className="bg-red-950/80 backdrop-blur px-3 py-1 rounded-full text-red-300 border border-red-500/30">
                  +2.5H SYNTHETIC IMPACT
                </span>
              </div>

              {/* Split Slider Bar */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-30 shadow-lg"
                style={{ left: `${splitPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-[#0b1c30] shadow-xl flex items-center justify-center font-bold text-xs">
                  ⇄
                </div>
              </div>

              {/* Hidden Range Input for interactive scrubbing */}
              <input 
                type="range"
                min="10"
                max="90"
                value={splitPos}
                onChange={e => setSplitPos(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-40"
              />
            </div>

            {/* Impact Prediction Metrics Bento */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white rounded-2xl shadow-xs border border-[#e5eeff] text-xs">
                <span className="text-[10px] text-[#76777d] uppercase font-bold">Predicted At-Risk</span>
                <span className="text-xl font-extrabold text-[#ba1a1a] block mt-1">14 Facilities</span>
                <span className="text-[10px] text-[#ba1a1a] font-semibold mt-0.5 block">+6 vs baseline</span>
              </div>

              <div className="p-3 bg-white rounded-2xl shadow-xs border border-[#e5eeff] text-xs">
                <span className="text-[10px] text-[#76777d] uppercase font-bold">Transit Flow</span>
                <span className="text-xl font-extrabold text-[#ea580c] block mt-1">-42% Flow</span>
                <span className="text-[10px] text-[#ea580c] font-semibold mt-0.5 block">3 Arterials Severed</span>
              </div>

              <div className="p-3 bg-white rounded-2xl shadow-xs border border-[#e5eeff] text-xs">
                <span className="text-[10px] text-[#76777d] uppercase font-bold">Pop. Exposure</span>
                <span className="text-xl font-extrabold text-[#0b1c30] block mt-1">24,800 Souls</span>
                <span className="text-[10px] text-[#0051d5] font-semibold mt-0.5 block">Low ground basin</span>
              </div>

              <div className="p-3 bg-white rounded-2xl shadow-xs border border-[#e5eeff] text-xs">
                <span className="text-[10px] text-[#76777d] uppercase font-bold">Peak Water Level</span>
                <span className="text-xl font-extrabold text-[#ba1a1a] block mt-1">+2.1m Depth</span>
                <span className="text-[10px] text-[#ba1a1a] font-semibold mt-0.5 block">Underpass 4 culvert</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </GovHqLayout>
  );
};
export default GovSimulatorPage;
