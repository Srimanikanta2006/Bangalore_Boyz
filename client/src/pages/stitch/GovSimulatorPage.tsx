import React, { useState, useEffect } from 'react';
import { GovHqLayout } from '../../components/stitch/GovHqLayout';
import { getActiveRegion, type RegionKey } from '../../citizen/geo';
import { 
  Play, RotateCcw, Sliders, Waves, Thermometer, 
  Droplet, Wind, AlertTriangle, Shield, CheckCircle2, 
  RefreshCw, TrendingUp, Layers, Compass, ArrowRight, ChevronRight
} from 'lucide-react';

export const GovSimulatorPage: React.FC = () => {
  const [activeRegion, setActiveRegionState] = useState<RegionKey>(getActiveRegion());
  const [selectedPreset, setSelectedPreset] = useState('100-Yr Atmospheric River');
  const [precipRate, setPrecipRate] = useState(65);
  const [stormDuration, setStormDuration] = useState(4.5);
  const [drainageThroughput, setDrainageThroughput] = useState(75);
  const [tidalSurge, setTidalSurge] = useState(1.8);
  const [splitPos, setSplitPos] = useState(50);
  const [simulating, setSimulating] = useState(false);
  const [simRunComplete, setSimRunComplete] = useState(false);

  useEffect(() => {
    const handleRegionEvent = () => setActiveRegionState(getActiveRegion());
    window.addEventListener('climateshield_region_changed', handleRegionEvent);
    return () => window.removeEventListener('climateshield_region_changed', handleRegionEvent);
  }, []);

  const isNepal = activeRegion === 'NEPAL';

  const presets = isNepal
    ? [
        { id: 'Bagmati Monsoonal Flash Surge', icon: Waves },
        { id: 'Kathmandu Valley Cloudburst', icon: Thermometer },
        { id: 'Balkhu Highway Dam Breach', icon: AlertTriangle },
        { id: 'Custom Nepal Sandbox', icon: Sliders },
      ]
    : [
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
                  SIM-CAD V4.8 ACTIVE ({isNepal ? 'NEPAL REGION' : 'CHENNAI REGION'})
                </span>
              </div>
              <p className="text-xs text-[#45464d] mt-0.5">
                Stress-testing municipal resilience envelopes under compound extreme climatological events for {isNepal ? 'Kathmandu Valley' : 'East Basin'}.
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
                Simulation Preset ({isNepal ? 'Nepal' : 'Chennai'})
              </label>
              <div className="grid grid-cols-1 gap-1">
                {presets.map((p) => {
                  const Icon = p.icon;
                  const isSelected = selectedPreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPreset(p.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-[#0f172a] text-white shadow-xs'
                          : 'bg-[#eff4ff] text-[#45464d] hover:bg-[#e5eeff]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-[#4cd7f6]' : 'text-[#0051d5]'}`} />
                        <span>{p.id}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-4 mt-4 pt-3 border-t border-[#e5eeff]">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-[#0b1c30]">Precipitation Rate</span>
                  <span className="font-mono text-[#0051d5] font-bold">{precipRate} mm/h</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  value={precipRate}
                  onChange={(e) => setPrecipRate(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#e5eeff] rounded-lg appearance-none cursor-pointer accent-[#0051d5]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-[#0b1c30]">Storm Duration</span>
                  <span className="font-mono text-[#0051d5] font-bold">{stormDuration} hrs</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="24"
                  step="0.5"
                  value={stormDuration}
                  onChange={(e) => setStormDuration(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#e5eeff] rounded-lg appearance-none cursor-pointer accent-[#0051d5]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-[#0b1c30]">Sump/Pump Capacity</span>
                  <span className="font-mono text-[#0051d5] font-bold">{drainageThroughput}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={drainageThroughput}
                  onChange={(e) => setDrainageThroughput(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#e5eeff] rounded-lg appearance-none cursor-pointer accent-[#0051d5]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-[#0b1c30]">{isNepal ? 'Bagmati River Surge' : 'Tidal Surge Margin'}</span>
                  <span className="font-mono text-[#0051d5] font-bold">+{tidalSurge} m MSL</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="4.0"
                  step="0.1"
                  value={tidalSurge}
                  onChange={(e) => setTidalSurge(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#e5eeff] rounded-lg appearance-none cursor-pointer accent-[#0051d5]"
                />
              </div>
            </div>

            {/* Run Button */}
            <button
              type="button"
              onClick={handleRunSim}
              disabled={simulating}
              className="mt-6 w-full h-11 rounded-xl bg-[#0f172a] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#1e293b] transition-all shadow-md disabled:opacity-60"
            >
              <Play className={`w-4 h-4 text-[#4cd7f6] ${simulating ? 'animate-spin' : ''}`} />
              <span>{simulating ? 'Running Hydro CAD Engine…' : 'Execute Hydro CAD Simulation'}</span>
            </button>
          </aside>

          {/* 2. RIGHT PREDICTIVE RESULTS (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* Simulation Impact Readout */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#e5eeff] flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#76777d] tracking-wider block">
                    PROJECTED SIMULATION IMPACT
                  </span>
                  <h3 className="font-bold text-base text-[#0b1c30] mt-0.5">
                    {isNepal
                      ? 'Kathmandu Bagmati Corridor Hydro Inundation Model'
                      : 'Bayou Basin Hydro Inundation Model'}
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold font-mono">
                  {simRunComplete ? 'SIMULATION RUN COMPLETE ✓' : 'CASCADE PROJECTION'}
                </span>
              </div>

              {/* 3-Column Simulation Telemetry Deck */}
              <div className="grid grid-cols-3 gap-3 bg-[#eff4ff] p-3 rounded-xl border border-[#d3e4fe] text-center">
                <div>
                  <span className="text-[10px] text-[#76777d] uppercase font-bold block">Peak Water Level</span>
                  <span className="text-xl font-extrabold text-[#ba1a1a]">+{tidalSurge + 0.6}m</span>
                  <span className="text-[10px] text-[#45464d] block font-semibold">
                    {isNepal ? 'Bagmati Breach' : 'Bayou Culvert'}
                  </span>
                </div>
                <div className="border-x border-[#d3e4fe]">
                  <span className="text-[10px] text-[#76777d] uppercase font-bold block">Hospital Isolation SLA</span>
                  <span className="text-xl font-extrabold text-[#ea580c]">42 min</span>
                  <span className="text-[10px] text-[#45464d] block font-semibold">
                    {isNepal ? 'Tribhuvan Trauma Hub' : 'St. Jude Center'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#76777d] uppercase font-bold block">Highline Safety Margin</span>
                  <span className="text-xl font-extrabold text-emerald-600">+18.2m MSL</span>
                  <span className="text-[10px] text-[#45464d] block font-semibold">
                    {isNepal ? 'Pashupati Refuge' : 'Ridge Detour'}
                  </span>
                </div>
              </div>

              {/* Scenario Explanation */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-snug">
                <span className="font-bold text-slate-900 block mb-1">
                  Hydro-CAD Simulation Result ({selectedPreset}):
                </span>
                {isNepal
                  ? `Under ${precipRate} mm/h rainfall over ${stormDuration} hours, Bagmati River bank breach incurs severe lowland inundation reaching +${(tidalSurge + 0.6).toFixed(1)}m. Balkhu Highway is rendered impassable within 35 minutes. Safe highline ridge route via Pashupati maintains +18.2m MSL elevation margin.`
                  : `Under ${precipRate} mm/h rainfall over ${stormDuration} hours, Bayou Drain D07 reaches 100% capacity within 24 minutes. Substation 9 experiences perimeter berm infiltration. Safe corridor via Highline Ridge remains 100% operational.`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </GovHqLayout>
  );
};

export default GovSimulatorPage;
