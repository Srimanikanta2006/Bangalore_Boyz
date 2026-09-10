import React, { useState } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  Ward,
  Asset,
  WeatherReading,
  AssetRiskAssessment,
  Alert,
  Incident,
  ResponseTask,
  SimulationScenario,
  CitySummaryStats,
  DataQualityStatus,
} from '../../../types';

// Custom Map Marker Icons for Government GIS
const criticalAssetIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #0F172A; width: 24px; height: 24px; border-radius: 6px; border: 2px solid #0051D5; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.4);">⚡</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const hospitalAssetIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #DC2626; width: 24px; height: 24px; border-radius: 6px; border: 2px solid #ffffff; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.4);">🏥</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface GovernmentHubProps {
  wards: Ward[];
  assets: Asset[];
  risks: AssetRiskAssessment[];
  weather: WeatherReading | null;
  alerts: Alert[];
  incidents: Incident[];
  tasks: ResponseTask[];
  stats: CitySummaryStats | null;
  dataQuality: DataQualityStatus | null;
  scenarios: SimulationScenario[];
  activeScenarioId: string | null;
  onApplyScenario: (scenarioId: string) => Promise<void>;
  onRefreshLiveWeather: () => Promise<void>;
  onOpenCreatePlan: (asset: Asset, risk: AssetRiskAssessment) => void;
  onSelectAssetForExplain: (asset: Asset, risk: AssetRiskAssessment) => void;
  onBackToRoles: () => void;
}

export const GovernmentHub: React.FC<GovernmentHubProps> = ({
  wards,
  assets,
  risks,
  weather,
  alerts,
  incidents,
  tasks,
  stats,
  scenarios,
  activeScenarioId,
  onApplyScenario,
  onRefreshLiveWeather,
  onOpenCreatePlan,
  onSelectAssetForExplain,
  onBackToRoles,
}) => {
  // Navigation tabs: 'overview' | 'simulator' | 'assets' | 'cascade' | 'dispatch'
  const [activeTab, setActiveTab] = useState<'overview' | 'simulator' | 'assets' | 'cascade' | 'dispatch'>('overview');
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [searchAssetQuery, setSearchAssetQuery] = useState('');

  // Simulator custom rainfall / temp inputs
  const [simRainfall, setSimRainfall] = useState(weather?.precipitationRateMmHr || 65);
  const [simTemp, setSimTemp] = useState(weather?.temperatureC || 31);

  // Default Bangalore Center
  const bangaloreCenter: [number, number] = [12.9716, 77.5946];

  // Helper to calculate ward risk score
  const getWardRiskScore = (wardId: string) => {
    const wardRisks = risks.filter((r) => r.wardId === wardId);
    if (!wardRisks.length) return 45;
    const sum = wardRisks.reduce((acc, r) => acc + r.compositeRiskScore, 0);
    return Math.round(sum / wardRisks.length);
  };

  const handleScenarioClick = async (scenarioId: string) => {
    setIsSimulating(true);
    try {
      await onApplyScenario(scenarioId);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setIsSimulating(false);
    }
  };

  const filteredAssets = assets.filter(
    (a) =>
      a.name.toLowerCase().includes(searchAssetQuery.toLowerCase()) ||
      a.type.toLowerCase().includes(searchAssetQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-surface text-on-surface font-body select-none">
      {/* Top Command Bar */}
      <header className="h-16 px-4 sm:px-6 flex items-center justify-between bg-surface-container-lowest border-b border-outline-variant/30 shrink-0 z-30 shadow-swiss-ambient">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToRoles}
            className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
            title="Switch Persona"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">domain</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-primary uppercase tracking-wider">
                BBMP DISASTER COMMAND HQ
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.2 rounded-full font-bold">
                GIS TWIN SYNCED
              </span>
            </div>
            <h1 className="font-heading font-bold text-sm text-on-surface">
              Bangalore Urban Resilience & Emergency Dispatch
            </h1>
          </div>
        </div>

        {/* Persona Sub-navigation tabs */}
        <div className="flex items-center gap-1 bg-surface-container p-1 rounded-xl border border-outline-variant/30 text-xs font-heading">
          {[
            { id: 'overview', label: 'Command Overview', icon: 'grid_view' },
            { id: 'simulator', label: 'Disaster Simulator', icon: 'cyclone' },
            { id: 'assets', label: 'Critical Assets', icon: 'apartment' },
            { id: 'cascade', label: 'Cascade Impact', icon: 'account_tree' },
            { id: 'dispatch', label: 'Response & Dispatch', icon: 'send_time_extension' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* View 1: COMMAND CENTER OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Top Key Performance Metric Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-surface-container-low border-b border-outline-variant/30 shrink-0">
              <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm flex items-center justify-between">
                <div>
                  <span className="font-mono text-[10px] uppercase text-on-surface-variant block font-semibold">
                    Critical Risk Assets
                  </span>
                  <span className="font-mono font-black text-2xl text-severity-critical">
                    {stats?.criticalRisks || 3} Assets
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">warning</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm flex items-center justify-between">
                <div>
                  <span className="font-mono text-[10px] uppercase text-on-surface-variant block font-semibold">
                    High Risk Assets
                  </span>
                  <span className="font-mono font-black text-2xl text-severity-high">
                    {stats?.highRiskAssets || 8} Assets
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">map</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm flex items-center justify-between">
                <div>
                  <span className="font-mono text-[10px] uppercase text-on-surface-variant block font-semibold">
                    Active Incidents
                  </span>
                  <span className="font-mono font-black text-2xl text-secondary">
                    {stats?.activeIncidents || incidents.length}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">groups</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm flex items-center justify-between">
                <div>
                  <span className="font-mono text-[10px] uppercase text-on-surface-variant block font-semibold">
                    Total Monitored
                  </span>
                  <span className="font-mono font-black text-2xl text-emerald-700">
                    {stats?.totalAssets || assets.length} Assets
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">emergency</span>
                </div>
              </div>
            </div>

            {/* Split Canvas: Left Map + Right Incident Triage Deck */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Center GIS Map */}
              <div className="flex-1 relative h-full">
                <MapContainer
                  center={bangaloreCenter}
                  zoom={12}
                  className="w-full h-full"
                  zoomControl={false}
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {/* Ward polygons/circles with heat/flood risk fills */}
                  {wards.map((w) => {
                    const score = getWardRiskScore(w.id);
                    const isHigh = score > 60;
                    return (
                      <Circle
                        key={w.id}
                        center={w.center}
                        radius={isHigh ? 1200 : 800}
                        pathOptions={{
                          color: isHigh ? '#DC2626' : '#2563EB',
                          fillColor: isHigh ? '#DC2626' : '#2563EB',
                          fillOpacity: isHigh ? 0.3 : 0.1,
                          weight: isHigh ? 2 : 1,
                        }}
                        eventHandlers={{
                          click: () => setSelectedWard(w),
                        }}
                      />
                    );
                  })}

                  {/* Critical Infrastructure Markers */}
                  {assets.map((a) => {
                    const isHospital = a.type === 'HOSPITAL';
                    return (
                      <Marker
                        key={a.id}
                        position={[a.location.lat, a.location.lng]}
                        icon={isHospital ? hospitalAssetIcon : criticalAssetIcon}
                      >
                        <Popup>
                          <div className="p-2 text-xs font-body">
                            <span className="font-mono text-[10px] font-bold text-secondary uppercase block">
                              {a.type} // Criticality {a.criticality}
                            </span>
                            <h4 className="font-bold text-slate-900 mt-0.5">{a.name}</h4>
                            <p className="text-slate-600 mt-1">
                              Capacity: <strong>{a.populationServed.toLocaleString()} citizens</strong>
                            </p>
                            <button
                              onClick={() => {
                                const r = risks.find((rk) => rk.assetId === a.id);
                                if (r) onOpenCreatePlan(a, r);
                              }}
                              className="mt-2 w-full py-1 bg-primary text-white rounded text-[11px] font-semibold"
                            >
                              Dispatch Emergency Plan
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>

              {/* Right Priority Triage Rail */}
              <div className="w-full md:w-96 bg-surface-container-lowest border-l border-outline-variant/30 flex flex-col shrink-0 overflow-y-auto p-4 gap-3">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-severity-critical text-[18px]">emergency</span>
                    <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-on-surface">
                      Urgent Incident Queue
                    </h3>
                  </div>
                  <span className="font-mono text-[10px] text-on-surface-variant font-bold">
                    {incidents.length} PENDING
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {incidents.map((inc) => {
                    const asset = assets.find((a) => a.id === inc.assetId);
                    const risk = risks.find((r) => r.assetId === inc.assetId);

                    return (
                      <div
                        key={inc.id}
                        className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 hover:bg-surface-container transition-all flex flex-col gap-2 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                            {inc.severity} // {inc.hazardType}
                          </span>
                          <span className="font-mono text-[10px] text-on-surface-variant">
                            {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <h4 className="font-heading font-bold text-xs text-on-surface">
                          {inc.title}
                        </h4>

                        <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1 border-t border-outline-variant/20">
                          <span>Team: {inc.assignedTeam}</span>
                          <span className="text-secondary font-semibold">{inc.status}</span>
                        </div>

                        {asset && risk && (
                          <div className="flex gap-2 mt-1">
                            <button
                              onClick={() => onSelectAssetForExplain(asset, risk)}
                              className="flex-1 py-1 rounded-lg bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-container-high"
                            >
                              Risk Factors
                            </button>
                            <button
                              onClick={() => onOpenCreatePlan(asset, risk)}
                              className="flex-1 py-1 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-slate-800"
                            >
                              Deploy SOP
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View 2: DISASTER SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="flex-1 p-6 overflow-y-auto max-w-4xl mx-auto w-full flex flex-col gap-6">
            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/30 shadow-swiss-ambient flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-hazard-flood/10 text-hazard-flood flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px]">cyclone</span>
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-lg text-on-surface">
                      Bangalore Climate Crisis & Disaster Simulator
                    </h2>
                    <p className="font-body text-xs text-on-surface-variant">
                      Model urban flash floods, severe heatwaves, and cascade critical asset failures.
                    </p>
                  </div>
                </div>

                <button
                  disabled={isSimulating}
                  onClick={onRefreshLiveWeather}
                  className="px-3.5 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-heading font-semibold flex items-center gap-1.5 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">sync</span>
                  <span>Sync Live Open-Meteo</span>
                </button>
              </div>

              {/* Pre-configured Simulation Scenarios */}
              <div className="flex flex-col gap-2.5">
                <span className="font-heading text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Preset Multi-Hazard Scenarios
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {scenarios.map((sc) => {
                    const isActive = activeScenarioId === sc.id;
                    return (
                      <div
                        key={sc.id}
                        onClick={() => handleScenarioClick(sc.id)}
                        className={`p-4 rounded-xl cursor-pointer border transition-all flex flex-col justify-between ${
                          isActive
                            ? 'bg-primary text-white border-primary shadow-md ring-2 ring-primary/20'
                            : 'bg-surface-container-low border-outline-variant/30 hover:bg-surface-container hover:border-outline-variant/60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span
                              className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isActive ? 'bg-white/20 text-white' : 'bg-surface-container text-on-surface-variant'
                              }`}
                            >
                              {sc.category}
                            </span>
                            {isActive && (
                              <span className="font-mono text-[10px] font-bold text-emerald-400">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <h4 className={`font-heading font-bold text-sm mt-2 ${isActive ? 'text-white' : 'text-on-surface'}`}>
                            {sc.name}
                          </h4>
                          <p className={`font-body text-xs mt-1 line-clamp-2 ${isActive ? 'text-slate-300' : 'text-on-surface-variant'}`}>
                            {sc.description}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-current/20 flex justify-between font-mono text-[11px]">
                          <span>Rain: {sc.weatherOverrides.precipitationRateMmHr ?? 0}mm/h</span>
                          <span>Temp: {sc.weatherOverrides.temperatureC ?? 28}°C</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Weather Scrubbers */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-4">
                <span className="font-heading text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Interactive Stress Parameters
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between font-mono text-xs">
                      <span>Monsoon Precipitation Rate</span>
                      <strong className="text-secondary">{simRainfall} mm/hour</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="140"
                      value={simRainfall}
                      onChange={(e) => setSimRainfall(Number(e.target.value))}
                      className="w-full accent-secondary"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between font-mono text-xs">
                      <span>Urban Heat Island Index</span>
                      <strong className="text-hazard-heat">{simTemp} °C</strong>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="48"
                      value={simTemp}
                      onChange={(e) => setSimTemp(Number(e.target.value))}
                      className="w-full accent-hazard-heat"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View 3: CRITICAL ASSETS MONITOR */}
        {activeTab === 'assets' && (
          <div className="flex-1 p-6 overflow-y-auto max-w-5xl mx-auto w-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading font-bold text-lg text-on-surface">
                  Critical Urban Infrastructure Monitor
                </h2>
                <p className="font-body text-xs text-on-surface-variant">
                  {assets.length} monitored assets including power substations, hospitals, flyovers, and water treatment plants.
                </p>
              </div>

              <input
                type="text"
                value={searchAssetQuery}
                onChange={(e) => setSearchAssetQuery(e.target.value)}
                placeholder="Search assets by name or type..."
                className="h-9 px-3 rounded-xl bg-surface-container border border-outline-variant/30 text-xs font-medium focus:outline-none focus:border-secondary w-64"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredAssets.map((asset) => {
                const risk = risks.find((r) => r.assetId === asset.id);
                const ward = wards.find((w) => w.id === asset.wardId);
                const score = risk?.compositeRiskScore || 70;
                const isHigh = score > 60;

                return (
                  <div
                    key={asset.id}
                    className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-swiss-ambient flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                          {asset.type} // Criticality {asset.criticality}
                        </span>
                        <span
                          className={`font-mono text-xs font-black px-2 py-0.5 rounded-full ${
                            isHigh ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          Risk: {score}/100
                        </span>
                      </div>

                      <h3 className="font-heading font-bold text-sm text-on-surface mt-2">
                        {asset.name}
                      </h3>
                      <p className="font-body text-xs text-on-surface-variant mt-0.5">
                        Ward: <strong>{ward?.name || 'Central Bangalore'}</strong> &bull; Protected Pop:{' '}
                        <strong>{asset.populationServed.toLocaleString()}</strong>
                      </p>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-outline-variant/20">
                      {risk && (
                        <button
                          onClick={() => onSelectAssetForExplain(asset, risk)}
                          className="flex-1 py-1.5 rounded-lg bg-surface-container text-xs font-heading font-semibold text-on-surface hover:bg-surface-container-high"
                        >
                          Explain Factors
                        </button>
                      )}
                      {risk && (
                        <button
                          onClick={() => onOpenCreatePlan(asset, risk)}
                          className="flex-1 py-1.5 rounded-lg bg-primary text-white text-xs font-heading font-bold hover:bg-slate-800"
                        >
                          Launch SOP Plan
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* View 4: CASCADE IMPACT SIMULATION */}
        {activeTab === 'cascade' && (
          <div className="flex-1 p-6 overflow-y-auto max-w-4xl mx-auto w-full flex flex-col gap-5">
            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/30 shadow-swiss-ambient flex flex-col gap-4">
              <div className="flex items-center gap-2.5 border-b border-outline-variant/20 pb-3">
                <span className="material-symbols-outlined text-secondary text-[24px]">account_tree</span>
                <div>
                  <h2 className="font-heading font-bold text-base text-on-surface">
                    Critical Infrastructure Cascade Failure Graph
                  </h2>
                  <p className="font-body text-xs text-on-surface-variant">
                    Deterministic interdependency simulation: Substation waterlogging triggers cascading healthcare and transport stalls.
                  </p>
                </div>
              </div>

              {/* Cascade Visual Chains */}
              <div className="flex flex-col gap-3">
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-red-800">
                    <span className="w-3 h-3 rounded-full bg-red-600" />
                    PRIMARY NODE FAILURE: St. Philomena Substation (Inundation Level 1.4m)
                  </div>
                  <div className="pl-5 border-l-2 border-red-300 ml-1.5 flex flex-col gap-2 text-xs text-red-900 mt-1">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                      <span>Cascade 1: Victoria Hospital Emergency ICU switches to auxiliary generator (Fuel: 6 hrs)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                      <span>Cascade 2: Adugodi Stormwater Dewatering Pump Grid drops power, accelerating backflow</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                      <span>Cascade 3: Outer Ring Road Sony World Underpass submerged (Traffic stalled 8 km)</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      if (assets[0] && risks[0]) onOpenCreatePlan(assets[0], risks[0]);
                    }}
                    className="px-4 py-2 rounded-xl bg-primary text-white font-heading font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-slate-800"
                  >
                    <span className="material-symbols-outlined text-[16px]">shield</span>
                    <span>Deploy Cascade Intercept SOP</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View 5: RESPONSE & INCIDENT DISPATCH */}
        {activeTab === 'dispatch' && (
          <div className="flex-1 p-6 overflow-y-auto max-w-4xl mx-auto w-full flex flex-col gap-4">
            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/30 shadow-swiss-ambient flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-emerald-700 text-[24px]">send_time_extension</span>
                  <div>
                    <h2 className="font-heading font-bold text-base text-on-surface">
                      Municipal Emergency Response & Brigade Dispatch
                    </h2>
                    <p className="font-body text-xs text-on-surface-variant">
                      Formulate action plans, assign response teams, and coordinate disaster field units.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (assets[0] && risks[0]) onOpenCreatePlan(assets[0], risks[0]);
                  }}
                  className="px-4 py-2 rounded-xl bg-secondary text-white font-heading font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-blue-700"
                >
                  <span className="material-symbols-outlined text-[16px]">add_task</span>
                  <span>Create Incident Plan</span>
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <span className="font-heading text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Active Dispatch Roster ({tasks.length} Assigned Tasks)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-secondary">
                            {task.assignedTeam}
                          </span>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-surface-container font-bold text-on-surface">
                            {task.status}
                          </span>
                        </div>
                        <h4 className="font-heading font-bold text-xs text-on-surface mt-1">
                          {task.title}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-on-surface-variant pt-2 border-t border-outline-variant/20">
                        <span>Lead: {task.assignedPerson || 'Brigade Unit'}</span>
                        <span className="text-emerald-700 font-semibold">{task.priority} Priority</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GovernmentHub;
