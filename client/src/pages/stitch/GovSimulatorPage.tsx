import React, { useState, useEffect } from 'react';
import { GovHqLayout } from '../../components/stitch/GovHqLayout';
import { RealLeafletMap, type RouteSegment, type MapMarker, type TrafficNode } from '../../components/stitch/RealLeafletMap';
import { 
  getActiveRegion, 
  getActiveLocationDetails, 
  getDynamicAssetsForLocation, 
  getDynamicVehiclesForLocation,
  type RegionKey 
} from '../../citizen/geo';
import { 
  Play, RotateCcw, Sliders, Waves, Thermometer, 
  Droplet, Wind, AlertTriangle, Shield, CheckCircle2, 
  RefreshCw, TrendingUp, Layers, Compass, ArrowRight, ChevronRight, Activity, Navigation
} from 'lucide-react';

export const GovSimulatorPage: React.FC = () => {
  const [activeRegion, setActiveRegionState] = useState<RegionKey>(getActiveRegion());
  const [selectedPreset, setSelectedPreset] = useState('100-Yr Atmospheric River');
  const [precipRate, setPrecipRate] = useState(65);
  const [stormDuration, setStormDuration] = useState(4.5);
  const [drainageThroughput, setDrainageThroughput] = useState(75);
  const [tidalSurge, setTidalSurge] = useState(1.8);
  const [simulating, setSimulating] = useState(false);
  const [simRunComplete, setSimRunComplete] = useState(false);
  const [showTraffic, setShowTraffic] = useState(true);

  const locDetails = getActiveLocationDetails();

  useEffect(() => {
    const handleRegionEvent = () => setActiveRegionState(getActiveRegion());
    window.addEventListener('climateshield_region_changed', handleRegionEvent);
    return () => window.removeEventListener('climateshield_region_changed', handleRegionEvent);
  }, []);

  const presets = [
    { id: '100-Yr Atmospheric River', icon: Waves },
    { id: 'Flash Flood + Cloudburst', icon: Thermometer },
    { id: 'Landslide + Road Blockade', icon: AlertTriangle },
    { id: 'Custom Hydro Sandbox', icon: Sliders },
  ];

  const handleRunSim = () => {
    setSimulating(true);
    setTimeout(() => {
      setSimulating(false);
      setSimRunComplete(true);
      setTimeout(() => setSimRunComplete(false), 3500);
    }, 1200);
  };

  const resetDefaults = () => {
    setPrecipRate(65);
    setStormDuration(4.5);
    setDrainageThroughput(75);
    setTidalSurge(1.8);
  };

  // Map center anchored to active location
  const mapCenter: [number, number] = [locDetails.latitude, locDetails.longitude];

  // Animated Water Flow & Traffic Simulation
  const routeSegments: RouteSegment[] = [
    // Water Flow Polyline from Point A to Point B
    {
      points: [
        [locDetails.latitude - 0.012, locDetails.longitude - 0.012],
        [locDetails.latitude - 0.005, locDetails.longitude - 0.005],
        [locDetails.latitude, locDetails.longitude],
        [locDetails.latitude + 0.006, locDetails.longitude + 0.005],
      ],
      color: 'RED',
      status: 'WATER_LOGGING',
      label: `🌊 Directional Water Flow (Depth +${(tidalSurge + 0.6).toFixed(1)}m) from Point A to Point B`,
      dashArray: '10,6',
    },
    // Landslide Blocked Segment (ORANGE)
    {
      points: [
        [locDetails.latitude + 0.008, locDetails.longitude - 0.008],
        [locDetails.latitude + 0.012, locDetails.longitude - 0.004],
      ],
      color: 'ORANGE',
      status: 'LANDSLIDE',
      label: '⛰️ Landslide Mudslide Blockade Corridor',
      dashArray: '6,4',
    },
    // Clear Vehicle Reroute Path (GREEN)
    {
      points: [
        [locDetails.latitude - 0.005, locDetails.longitude - 0.005],
        [locDetails.latitude + 0.002, locDetails.longitude + 0.010],
        [locDetails.latitude + 0.006, locDetails.longitude + 0.005],
      ],
      color: 'GREEN',
      status: 'CLEAR',
      label: '🟢 Clear Emergency Traffic Bypass Route',
    },
  ];

  // Dynamic Traffic Sensors & Density Nodes
  const trafficNodes: TrafficNode[] = [
    { lat: locDetails.latitude - 0.005, lng: locDetails.longitude - 0.005, congestion: 'BLOCKED', speedKmh: 4 },
    { lat: locDetails.latitude, lng: locDetails.longitude, congestion: 'HEAVY', speedKmh: 12 },
    { lat: locDetails.latitude + 0.006, lng: locDetails.longitude + 0.005, congestion: 'MODERATE', speedKmh: 28 },
    { lat: locDetails.latitude + 0.002, lng: locDetails.longitude + 0.010, congestion: 'LIGHT', speedKmh: 52 },
  ];

  const mapMarkers: MapMarker[] = [
    {
      id: 'sim_flow_head',
      lat: locDetails.latitude - 0.012,
      lng: locDetails.longitude - 0.012,
      title: 'Water Flow Source (Point A)',
      description: 'Atmospheric River Catchment Ingress Point',
      type: 'hazard',
      severity: 'CRITICAL',
    },
    {
      id: 'sim_flow_tail',
      lat: locDetails.latitude + 0.006,
      lng: locDetails.longitude + 0.005,
      title: 'Water Basin Outlet (Point B)',
      description: 'Urban Culvert Discharge Terminal',
      type: 'hazard',
      severity: 'HIGH',
    },
    {
      id: 'sim_landslide_1',
      lat: locDetails.latitude + 0.008,
      lng: locDetails.longitude - 0.008,
      title: 'Hillside Landslide Zone',
      description: 'Active Mudslide Blockade on Arterial Road',
      type: 'landslide',
      severity: 'CRITICAL',
    },
    {
      id: 'sim_amb_1',
      lat: locDetails.latitude + 0.002,
      lng: locDetails.longitude + 0.010,
      title: 'ALS Ambulance Unit #EMS-04',
      description: 'Navigating Clear Traffic Reroute Bypass | Speed: 48 km/h',
      type: 'ambulance',
      callsign: 'EMS-04',
      status: 'EN_ROUTE',
      speedKmh: 48,
    },
    {
      id: 'sim_fire_1',
      lat: locDetails.latitude - 0.005,
      lng: locDetails.longitude - 0.005,
      title: 'Fire Engine #FR-02',
      description: 'Deployed at Waterlogging Inundation Point | Speed: 0 km/h',
      type: 'fire',
      callsign: 'FR-02',
      status: 'ON_SCENE',
      speedKmh: 0,
    },
  ];

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
                  Predictive Risk Sandbox & CAD Flooding Simulator
                </h1>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#e5eeff] text-[#0051d5]">
                  {locDetails.name.toUpperCase()} REGION
                </span>
              </div>
              <p className="text-xs text-[#45464d] mt-0.5">
                Simulating directional water flow (A to B), landslide blockades, traffic heatmaps, and rescue vehicle rerouting.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTraffic((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                showTraffic ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-300'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Traffic Heatmap: {showTraffic ? 'ON' : 'OFF'}</span>
            </button>
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
              <span className="text-[10px] font-mono text-[#76777d] uppercase font-bold">CAD SIM-09</span>
            </div>

            {/* Presets */}
            <div className="space-y-1.5 mt-3">
              <label className="text-[10px] font-bold text-[#76777d] uppercase tracking-wider">
                Simulation Scenario
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
                  <span className="text-[#0b1c30]">Drainage Sump Capacity</span>
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
                  <span className="text-[#0b1c30]">Inundation Water Level</span>
                  <span className="font-mono text-[#0051d5] font-bold">+{tidalSurge} m</span>
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
              <span>{simulating ? 'Running Hydro CAD Engine…' : 'Execute Hydro Simulation'}</span>
            </button>
          </aside>

          {/* 2. RIGHT MAP & PREDICTIVE RESULTS (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* Interactive Simulation GIS Canvas */}
            <div className="h-96 w-full rounded-2xl overflow-hidden shadow-sm border border-[#e5eeff] relative bg-slate-900">
              <RealLeafletMap
                center={mapCenter}
                zoom={14}
                tileTheme="osm"
                routeSegments={routeSegments}
                markers={mapMarkers}
                trafficNodes={showTraffic ? trafficNodes : []}
                className="h-full w-full"
              />

              <div className="absolute top-3 left-3 z-[400] bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-white text-xs font-semibold flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                <span>Water Flow Simulation: Point A ➔ Point B</span>
              </div>
            </div>

            {/* Simulation Impact Readout */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#e5eeff] flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#76777d] tracking-wider block">
                    PROJECTED HYDRO & TRAFFIC IMPACT
                  </span>
                  <h3 className="font-bold text-base text-[#0b1c30] mt-0.5">
                    {locDetails.name} Hydro-CAD Inundation Model
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold font-mono">
                  {simRunComplete ? 'SIMULATION RUN COMPLETE ✓' : 'LIVE HYDRO MODEL'}
                </span>
              </div>

              {/* 3-Column Simulation Telemetry Deck */}
              <div className="grid grid-cols-3 gap-3 bg-[#eff4ff] p-3 rounded-xl border border-[#d3e4fe] text-center">
                <div>
                  <span className="text-[10px] text-[#76777d] uppercase font-bold block">Peak Inundation</span>
                  <span className="text-xl font-extrabold text-[#ba1a1a]">+{tidalSurge + 0.6}m</span>
                  <span className="text-[10px] text-[#45464d] block font-semibold">Point A to B Corridor</span>
                </div>
                <div className="border-x border-[#d3e4fe]">
                  <span className="text-[10px] text-[#76777d] uppercase font-bold block">Traffic Congestion Index</span>
                  <span className="text-xl font-extrabold text-[#ea580c]">84% (Blocked)</span>
                  <span className="text-[10px] text-[#45464d] block font-semibold">Red Corridor Segment</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#76777d] uppercase font-bold block">Emergency Bypass SLA</span>
                  <span className="text-xl font-extrabold text-emerald-600">12.4 min</span>
                  <span className="text-[10px] text-[#45464d] block font-semibold">Green Clear Path</span>
                </div>
              </div>

              {/* Scenario Explanation */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-snug">
                <span className="font-bold text-slate-900 block mb-1">
                  Hydro-CAD Simulation Result ({selectedPreset}):
                </span>
                Under {precipRate} mm/h rainfall over {stormDuration} hours, directional water flows from Point A to Point B on the road network, creating a waterlogged RED corridor (+{(tidalSurge + 0.6).toFixed(1)}m depth). Mudslide debris blocks the ORANGE segment, while ambulances and emergency vehicles dynamically reroute via the clear GREEN corridor.
              </div>
            </div>
          </div>
        </div>
      </div>
    </GovHqLayout>
  );
};

export default GovSimulatorPage;
