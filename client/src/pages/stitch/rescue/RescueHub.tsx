import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import {
  Incident,
  ResponseTask,
  Asset,
  Ward,
  WeatherReading,
  AssetRiskAssessment,
} from '../../../types';

// Custom Map Marker Icons for Rescue
const rescueVehicleIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #0EA5E9; width: 28px; height: 28px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 14px rgba(14,165,233,0.8); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: bold;">🚒</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const incidentPinIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div class="marker-critical-ring" style="background-color: #DC2626; width: 28px; height: 28px; border-radius: 2px solid #ffffff; color: white; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold;">🚨</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

interface RescueHubProps {
  incidents: Incident[];
  tasks: ResponseTask[];
  assets: Asset[];
  wards: Ward[];
  risks: AssetRiskAssessment[];
  weather: WeatherReading | null;
  onUpdateTaskStatus: (taskId: string, status: ResponseTask['status'], notes?: string) => Promise<void>;
  onEscalateTask: (taskId: string) => Promise<void>;
  onBackToRoles: () => void;
}

export const RescueHub: React.FC<RescueHubProps> = ({
  incidents,
  tasks,
  assets,
  wards,
  risks,
  weather,
  onUpdateTaskStatus,
  onEscalateTask,
  onBackToRoles,
}) => {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(incidents[0] || null);
  const [activeView, setActiveView] = useState<'console' | 'navigation' | 'dossier' | 'report'>('console');
  const [reportNotes, setReportNotes] = useState('');
  const [rescuedCount, setRescuedCount] = useState(4);
  const [isUpdating, setIsUpdating] = useState(false);

  // Selected incident's associated asset and risk
  const currentAsset = assets.find((a) => a.id === selectedIncident?.assetId);
  const currentRisk = risks.find((r) => r.assetId === selectedIncident?.assetId);
  const currentWard = wards.find((w) => w.id === currentAsset?.wardId);

  // Filter tasks for this incident
  const incidentTasks = tasks.filter((t) => t.incidentId === selectedIncident?.id);

  // Responder Unit Info
  const responderUnit = {
    unitId: 'BRIGADE-UNIT-04',
    lead: 'Capt. Suresh Rao (KDRF)',
    vehicle: 'Heavy Water-Rescue Truck #12',
    status: 'ON_MISSION',
    battery: '94%',
    gps: [12.9360, 77.6210] as [number, number],
  };

  // Mock Route from Responder to Incident
  const rescueRouteCoords: [number, number][] = [
    [12.9360, 77.6210], // Unit location
    [12.9380, 77.6260],
    [12.9420, 77.6280], // Target Incident Location
  ];

  const handleStatusChange = async (taskId: string, newStatus: ResponseTask['status']) => {
    setIsUpdating(true);
    try {
      await onUpdateTaskStatus(taskId, newStatus, reportNotes);
      setReportNotes('');
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEscalate = async (taskId: string) => {
    setIsUpdating(true);
    try {
      await onEscalateTask(taskId);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-body select-none">
      {/* Top Tactical Command Bar */}
      <header className="h-16 px-4 sm:px-6 flex items-center justify-between bg-slate-900 border-b border-slate-800 shrink-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToRoles}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Switch Persona"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white shrink-0 font-bold shadow-sm">
            <span className="material-symbols-outlined text-[18px]">emergency</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-sky-400 uppercase tracking-wider">
                {responderUnit.unitId}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[10px] text-emerald-400 uppercase">ONLINE</span>
            </div>
            <h1 className="font-heading font-bold text-sm text-slate-200">
              {responderUnit.lead} &bull; {responderUnit.vehicle}
            </h1>
          </div>
        </div>

        {/* View Switcher buttons */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs font-heading">
          <button
            onClick={() => setActiveView('console')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'console' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tactical Console
          </button>
          <button
            onClick={() => setActiveView('navigation')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'navigation' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Mission Nav
          </button>
          <button
            onClick={() => setActiveView('dossier')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'dossier' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Dossier & Risk
          </button>
          <button
            onClick={() => setActiveView('report')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'report' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Field Report
          </button>
        </div>
      </header>

      {/* Main Tactical Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Mission Queue Sidebar */}
        <div className="w-80 sm:w-96 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-400 text-[18px]">crisis_alert</span>
              <span className="font-heading font-bold text-xs uppercase tracking-wider text-slate-300">
                Active Mission Queue ({incidents.length})
              </span>
            </div>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 font-bold animate-pulse">
              LIVE PRIORITY
            </span>
          </div>

          <div className="flex flex-col p-2 gap-2">
            {incidents.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;
              const isCritical = inc.severity === 'CRITICAL';
              const incAsset = assets.find((a) => a.id === inc.assetId);

              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-3.5 rounded-xl cursor-pointer border transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-sky-500 shadow-md ring-1 ring-sky-500/30'
                      : 'bg-slate-900/80 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCritical ? 'bg-red-900/60 text-red-300 border border-red-700' : 'bg-amber-900/60 text-amber-300 border border-amber-700'
                      }`}
                    >
                      {inc.severity} // {inc.hazardType}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-sm text-slate-100 mt-2">
                    {inc.title}
                  </h3>

                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 mt-2 pt-2 border-t border-slate-800">
                    <span>{incAsset?.name || 'Critical Asset'}</span>
                    <span className="text-sky-400 font-semibold">{inc.status}</span>
                  </div>
                </div>
              );
            })}

            {incidents.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-500">
                No active rescue missions in queue. Standby mode active.
              </div>
            )}
          </div>
        </div>

        {/* Center / Right Content Panel */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-950">
          {/* View 1: TACTICAL CONSOLE / MAP */}
          {activeView === 'console' && (
            <div className="flex-1 relative flex flex-col h-full">
              <div className="flex-1 relative z-0">
                <MapContainer
                  center={[12.9400, 77.6250]}
                  zoom={14}
                  className="w-full h-full"
                  zoomControl={false}
                >
                  <TileLayer
                    attribution="&copy; CartoDB Dark Matter"
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  />

                  {/* Responder Vehicle Beacon */}
                  <Marker position={responderUnit.gps} icon={rescueVehicleIcon}>
                    <Popup>
                      <div className="p-2 text-xs text-slate-900">
                        <strong>{responderUnit.unitId}</strong>
                        <br />
                        {responderUnit.lead}
                      </div>
                    </Popup>
                  </Marker>

                  {/* Incident Marker */}
                  {selectedIncident && (
                    <Marker position={[12.9420, 77.6280]} icon={incidentPinIcon}>
                      <Popup>
                        <div className="p-2 text-xs text-slate-900">
                          <strong>{selectedIncident.title}</strong>
                          <br />
                          Status: {selectedIncident.status}
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Tactical Trajectory Line */}
                  <Polyline
                    positions={rescueRouteCoords}
                    pathOptions={{ color: '#0EA5E9', weight: 5, dashArray: '6, 6', opacity: 0.9 }}
                  />
                </MapContainer>

                {/* Floating HUD Widget */}
                <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
                  <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700 text-xs font-mono text-slate-300 flex items-center gap-3 pointer-events-auto shadow-lg">
                    <span className="flex items-center gap-1.5 text-sky-400 font-bold">
                      <span className="material-symbols-outlined text-[16px]">navigation</span>
                      ETA: 4 min (1.4 km)
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="text-amber-400">Flood Inundation: 0.9m</span>
                  </div>

                  <button
                    onClick={() => setActiveView('navigation')}
                    className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl font-heading font-bold text-xs flex items-center gap-1.5 pointer-events-auto shadow-lg transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">explore</span>
                    <span>Launch Tactical HUD</span>
                  </button>
                </div>
              </div>

              {/* Bottom Mission Status & Task Checklist */}
              {selectedIncident && (
                <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-sky-400 uppercase tracking-wider font-bold">
                        ASSIGNED INCIDENT TASKS
                      </span>
                      <h4 className="font-heading font-bold text-sm text-slate-100">
                        {selectedIncident.title}
                      </h4>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveView('report')}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-heading font-semibold"
                      >
                        Update Dossier
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {incidentTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <span className="font-heading font-semibold text-xs text-slate-200 block truncate">
                            {t.title}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            Status: <strong className="text-sky-400">{t.status}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {t.status !== 'COMPLETED' && (
                            <button
                              disabled={isUpdating}
                              onClick={() => handleStatusChange(t.id, 'COMPLETED')}
                              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-mono font-bold"
                            >
                              Done
                            </button>
                          )}
                          {t.status !== 'ESCALATED' && (
                            <button
                              disabled={isUpdating}
                              onClick={() => handleEscalate(t.id)}
                              className="px-2 py-1 rounded bg-red-950 text-red-400 border border-red-800 hover:bg-red-900 text-[10px] font-mono font-bold"
                            >
                              Escalate
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {incidentTasks.length === 0 && (
                      <div className="text-xs text-slate-500 col-span-3">
                        No sub-tasks attached. Main incident response active.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* View 2: MISSION NAVIGATION HUD */}
          {activeView === 'navigation' && (
            <div className="flex-1 p-6 flex flex-col gap-4 max-w-2xl mx-auto w-full overflow-y-auto">
              <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 flex flex-col gap-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sky-400 text-[24px] animate-pulse">
                      near_me
                    </span>
                    <div>
                      <h2 className="font-heading font-bold text-base text-slate-100">
                        Live Tactical Mission Navigation
                      </h2>
                      <span className="font-mono text-xs text-slate-400">
                        Target: {selectedIncident?.title || 'Koramangala Incident'}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800">
                    GPS LOCK HIGH
                  </span>
                </div>

                {/* Big HUD Telemetry Display */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-mono text-[10px] uppercase text-slate-400 block">Distance to Point</span>
                    <span className="font-mono font-bold text-xl text-sky-400">1.4 km</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-mono text-[10px] uppercase text-slate-400 block">Est. Time of Arrival</span>
                    <span className="font-mono font-bold text-xl text-emerald-400">04:15</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-mono text-[10px] uppercase text-slate-400 block">Water Clearance</span>
                    <span className="font-mono font-bold text-xl text-amber-400">0.9m (Passable)</span>
                  </div>
                </div>

                {/* Live Navigation Step */}
                <div className="p-4 rounded-xl bg-sky-950/40 border border-sky-800/60 flex items-start gap-3">
                  <span className="material-symbols-outlined text-sky-400 text-[28px] mt-0.5">
                    turn_sharp_right
                  </span>
                  <div>
                    <span className="font-mono text-[10px] uppercase font-bold text-sky-400">
                      NEXT MANEUVER (IN 350 METERS)
                    </span>
                    <p className="font-heading font-bold text-sm text-slate-100 mt-0.5">
                      Turn right onto 80 Feet Road. Elevated corridor cleared by Traffic Command.
                    </p>
                    <span className="font-mono text-xs text-slate-400 mt-1 block">
                      Avoid service lane: 1.6m water accumulation reported by drone telemetry.
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setActiveView('console')}
                    className="flex-1 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-heading font-semibold text-xs"
                  >
                    Back to Tactical Map
                  </button>
                  <button
                    onClick={() => setActiveView('report')}
                    className="flex-1 h-11 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-heading font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>Confirm On-Scene Arrival</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* View 3: DOSSIER & HAZARD RISK DETAIL */}
          {activeView === 'dossier' && (
            <div className="flex-1 p-6 flex flex-col gap-4 max-w-3xl mx-auto w-full overflow-y-auto">
              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col gap-5 shadow-xl">
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="font-mono text-xs font-bold text-red-400 bg-red-950 px-2.5 py-0.5 rounded-full border border-red-800">
                      TACTICAL DOSSIER // {selectedIncident?.id}
                    </span>
                    <h2 className="font-heading font-bold text-xl text-slate-100 mt-2">
                      {selectedIncident?.title}
                    </h2>
                    <p className="font-body text-xs text-slate-400 mt-0.5">
                      Ward: <strong>{currentWard?.name || 'Koramangala'}</strong> &bull; Asset:{' '}
                      <strong>{currentAsset?.name || 'Primary Substation'}</strong>
                    </p>
                  </div>
                </div>

                {/* Risk & Vulnerability Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-mono text-[10px] uppercase text-slate-400 block">Compound Risk</span>
                    <span className="font-mono font-bold text-xl text-red-400">
                      {currentRisk?.compositeRiskScore ? `${currentRisk.compositeRiskScore}/100` : '84/100'}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-mono text-[10px] uppercase text-slate-400 block">Criticality Tier</span>
                    <span className="font-mono font-bold text-xl text-amber-400">
                      TIER-{currentAsset?.criticality || 4}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-mono text-[10px] uppercase text-slate-400 block">Population Protected</span>
                    <span className="font-mono font-bold text-xl text-sky-400">
                      {currentAsset?.populationServed?.toLocaleString() || '45,000'}
                    </span>
                  </div>
                </div>

                {/* Tactical Recommendations / SOP */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                  <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-300">
                    Standard Operational Procedure (SOP) Action Checklist
                  </h4>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                    <li>Isolate low-voltage switchgears to prevent electrical arc blast.</li>
                    <li>Deploy high-capacity dewatering pump (Minimum 500 GPM capacity).</li>
                    <li>Erect sandbag perimeter along south perimeter wall (elevation 912m).</li>
                    <li>Maintain emergency power link for adjacent health clinics.</li>
                  </ul>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setActiveView('console')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-heading font-semibold"
                  >
                    Return to Map
                  </button>
                  <button
                    onClick={() => setActiveView('report')}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-heading font-bold"
                  >
                    Log Tactical Field Report
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* View 4: STATUS UPDATE & FIELD REPORTING */}
          {activeView === 'report' && (
            <div className="flex-1 p-6 flex flex-col gap-4 max-w-xl mx-auto w-full overflow-y-auto">
              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col gap-4 shadow-xl">
                <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                  <div className="w-9 h-9 rounded-lg bg-sky-600/20 text-sky-400 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-base text-slate-100">
                      Field Mission Status Update
                    </h2>
                    <p className="font-body text-xs text-slate-400">
                      Broadcast real-time task completion, casualties extracted, and resource requests.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div>
                    <label className="font-heading text-xs font-semibold text-slate-400 uppercase block mb-1">
                      Assigned Incident
                    </label>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-medium text-slate-200">
                      {selectedIncident?.title || 'Active Incident'}
                    </div>
                  </div>

                  <div>
                    <label className="font-heading text-xs font-semibold text-slate-400 uppercase block mb-1">
                      Citizens / Casualties Extracted
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setRescuedCount((c) => Math.max(0, c - 1))}
                        className="w-10 h-10 rounded-xl bg-slate-800 text-slate-200 font-bold hover:bg-slate-700"
                      >
                        -
                      </button>
                      <span className="font-mono text-xl font-bold text-emerald-400 w-12 text-center">
                        {rescuedCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setRescuedCount((c) => c + 1)}
                        className="w-10 h-10 rounded-xl bg-slate-800 text-slate-200 font-bold hover:bg-slate-700"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-heading text-xs font-semibold text-slate-400 uppercase block mb-1">
                      Tactical Field Log / Commander Notes
                    </label>
                    <textarea
                      rows={3}
                      value={reportNotes}
                      onChange={(e) => setReportNotes(e.target.value)}
                      placeholder="e.g. Pump #2 operational, water level receding by 5cm/hr. Road clearance underway..."
                      className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isUpdating || !selectedIncident}
                      onClick={async () => {
                        if (selectedIncident && incidentTasks[0]) {
                          await handleStatusChange(incidentTasks[0].id, 'COMPLETED');
                        }
                        setActiveView('console');
                      }}
                      className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      <span>Mark Mission Resolved</span>
                    </button>
                    <button
                      type="button"
                      disabled={isUpdating || !selectedIncident}
                      onClick={async () => {
                        if (selectedIncident && incidentTasks[0]) {
                          await handleEscalate(incidentTasks[0].id);
                        }
                        setActiveView('console');
                      }}
                      className="h-11 rounded-xl bg-red-950 border border-red-800 text-red-300 hover:bg-red-900 font-heading font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">emergency</span>
                      <span>Request Reinforcements</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RescueHub;
