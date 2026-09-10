import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import {
  Ward,
  Asset,
  WeatherReading,
  AssetRiskAssessment,
  Alert,
  Incident,
} from '../../../types';

// Custom Map Marker Icons for Leaflet
const citizenIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #0051D5; width: 22px; height: 22px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 12px rgba(0,81,213,0.6); display: flex; align-items: center; justify-content: center;"><div style="width: 6px; height: 6px; background-color: #ffffff; border-radius: 50%;"></div></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const hazardIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div class="marker-critical-ring" style="background-color: #DC2626; width: 26px; height: 26px; border-radius: 50%; border: 2px solid #ffffff; color: white; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold;">⚠️</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

const shelterIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #16A34A; width: 24px; height: 24px; border-radius: 8px; border: 2px solid #ffffff; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">🏠</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface CitizenHubProps {
  wards: Ward[];
  assets: Asset[];
  risks: AssetRiskAssessment[];
  weather: WeatherReading | null;
  alerts: Alert[];
  incidents: Incident[];
  onReportHazard: (report: {
    assetId: string;
    hazardType: 'FLOOD' | 'HEAT' | 'COMPOUND';
    title: string;
    assignedTeam: string;
    leadResponder: string;
    notes?: string;
    taskTitles: string[];
  }) => Promise<void>;
  onTriggerSOS: (sosData: {
    locationName: string;
    coordinates: [number, number];
    description: string;
    urgency: 'CRITICAL';
  }) => Promise<void>;
  onBackToRoles: () => void;
}

export const CitizenHub: React.FC<CitizenHubProps> = ({
  wards,
  assets,
  risks,
  weather,
  alerts,
  incidents,
  onReportHazard,
  onTriggerSOS,
  onBackToRoles,
}) => {
  // Tab view: 'map' | 'routes' | 'alerts' | 'report' | 'sos'
  const [activeTab, setActiveTab] = useState<'map' | 'routes' | 'alerts' | 'report' | 'sos'>('map');
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  // Routing State
  const [routeOrigin, setRouteOrigin] = useState<string>('Koramangala 4th Block');
  const [routeDest, setRouteDest] = useState<string>('Indiranagar 100ft Road');
  const [isNavigating, setIsNavigating] = useState(false);
  const [avoidFloods, setAvoidFloods] = useState(true);
  const [activeRouteType, setActiveRouteType] = useState<'safe' | 'fast'>('safe');
  const [navigationStep, setNavigationStep] = useState(0);

  // Citizen Report Form State
  const [reportHazardType, setReportHazardType] = useState<'FLOOD' | 'HEAT' | 'FALLEN_TREE'>('FLOOD');
  const [reportWardId, setReportWardId] = useState(wards[0]?.id || 'ward-151');
  const [reportTitle, setReportTitle] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportDepth, setReportDepth] = useState('2.5 ft');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // SOS State
  const [sosSent, setSosSent] = useState(false);

  // Default Map center on Bangalore
  const bangaloreCenter: [number, number] = [12.9352, 77.6245];

  // Helper to calculate ward risk score from assets in that ward
  const getWardRiskScore = (wardId: string) => {
    const wardRisks = risks.filter((r) => r.wardId === wardId);
    if (!wardRisks.length) return 45;
    const sum = wardRisks.reduce((acc, r) => acc + r.compositeRiskScore, 0);
    return Math.round(sum / wardRisks.length);
  };

  // Mock Route coordinates for Demo
  const safeRouteCoords: [number, number][] = [
    [12.9352, 77.6245], // Koramangala
    [12.9450, 77.6320], // Intermediate Elevated ring road
    [12.9600, 77.6400], // Domlur Flyover (Safe)
    [12.9719, 77.6412], // Indiranagar
  ];

  const directFloodedRouteCoords: [number, number][] = [
    [12.9352, 77.6245], // Koramangala
    [12.9380, 77.6300], // Sony World Underpass (Waterlogged 3.5ft)
    [12.9550, 77.6380], // Inner Ring Road (Slow flow)
    [12.9719, 77.6412], // Indiranagar
  ];

  const navigationSteps = [
    { text: 'Head north on 80 Feet Rd toward 12th Main', distance: '400 m', time: '1 min', safe: true },
    { text: 'Take Domlur Flyover Ramp (Elevated flood-safe corridor)', distance: '1.8 km', time: '4 min', safe: true },
    { text: 'Rerouting: Sony World junction blocked. Keep right on Flyover.', distance: '900 m', time: '2 min', safe: true },
    { text: 'Continue straight onto 100 Feet Rd, Indiranagar', distance: '600 m', time: '2 min', safe: true },
  ];

  // Handle Hazard Submission
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim()) return;

    setIsSubmittingReport(true);
    try {
      const selectedWardObj = wards.find((w) => w.id === reportWardId) || wards[0];
      const associatedAsset = assets.find((a) => a.wardId === selectedWardObj?.id) || assets[0];

      await onReportHazard({
        assetId: associatedAsset?.id || 'asset-1',
        hazardType: reportHazardType === 'HEAT' ? 'HEAT' : 'FLOOD',
        title: `[Citizen Report] ${reportTitle}`,
        assignedTeam: 'Civic Response Brigade',
        leadResponder: 'Public Telemetry Ingestion',
        notes: `Reported by Citizen at ${selectedWardObj?.name || 'Bangalore'}. Water depth: ${reportDepth}. Notes: ${reportDesc}`,
        taskTitles: ['Verify citizen visual report', 'Deploy pump unit if waterlogged'],
      });

      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
        setReportTitle('');
        setReportDesc('');
        setActiveTab('map');
      }, 2000);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Handle SOS
  const handleTriggerSOSNow = async () => {
    setSosSent(true);
    try {
      await onTriggerSOS({
        locationName: 'Live Citizen GPS Position (Koramangala 4th Block)',
        coordinates: [12.9352, 77.6245],
        description: 'Citizen triggered emergency SOS via ClimateShield Mobile App.',
        urgency: 'CRITICAL',
      });
    } catch (e) {
      // silent handle
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface text-on-surface font-body select-none">
      {/* Top Citizen App Bar */}
      <header className="h-16 px-4 flex items-center justify-between bg-surface-container-lowest border-b border-outline-variant/30 shrink-0 z-30 shadow-swiss-ambient">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBackToRoles}
            className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
            title="Switch Persona"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-white shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">explore</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-mono text-[10px] font-bold text-secondary uppercase tracking-wider">
              Citizen Mobility Safe-Shield
            </span>
            <h1 className="font-heading font-bold text-sm text-on-surface truncate">
              Bangalore Urban Resilience
            </h1>
          </div>
        </div>

        {/* Live Weather & Status Badge */}
        <div className="flex items-center gap-2">
          {weather && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container text-xs font-mono">
              <span className="text-secondary font-bold">{weather.temperatureC}°C</span>
              <span className="text-outline-variant">|</span>
              <span className="text-hazard-flood font-semibold">{weather.precipitationRateMmHr}mm/h</span>
            </div>
          )}
          <button
            onClick={() => setActiveTab('sos')}
            className="h-8 px-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-heading font-bold text-xs flex items-center gap-1.5 shadow-sm animate-pulse"
          >
            <span className="material-symbols-outlined text-[16px]">sos</span>
            <span>SOS</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 relative flex overflow-hidden">
        <div className="flex-1 flex flex-col relative w-full h-full">
          {/* View 1: MAP VIEW & HAZARDS */}
          {activeTab === 'map' && (
            <div className="flex-1 relative flex flex-col h-full">
              {/* Map Canvas */}
              <div className="flex-1 relative z-0">
                <MapContainer
                  center={bangaloreCenter}
                  zoom={13}
                  className="w-full h-full"
                  zoomControl={false}
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {/* Citizen GPS position */}
                  <Marker position={[12.9352, 77.6245]} icon={citizenIcon}>
                    <Popup>
                      <div className="p-2 text-xs">
                        <strong>Your Live Location</strong>
                        <br />
                        Koramangala 4th Block
                        <br />
                        <span className="text-emerald-600 font-semibold">Elevated Terrain (Safe)</span>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Ward High Risk Zones / Hazard Circles */}
                  {wards.map((ward) => {
                    const riskScore = getWardRiskScore(ward.id);
                    const isFlooded = riskScore > 60;
                    return (
                      <React.Fragment key={ward.id}>
                        <Circle
                          center={ward.center}
                          radius={isFlooded ? 900 : 600}
                          pathOptions={{
                            color: isFlooded ? '#DC2626' : '#0051D5',
                            fillColor: isFlooded ? '#DC2626' : '#0051D5',
                            fillOpacity: isFlooded ? 0.25 : 0.08,
                            weight: isFlooded ? 2 : 1,
                          }}
                          eventHandlers={{
                            click: () => setSelectedWard(ward),
                          }}
                        />
                        {isFlooded && (
                          <Marker position={ward.center} icon={hazardIcon}>
                            <Popup>
                              <div className="p-2 text-xs font-body">
                                <span className="font-heading font-bold text-red-600 uppercase">
                                  Flood Hazard Zone
                                </span>
                                <h4 className="font-bold text-slate-900 mt-0.5">{ward.name}</h4>
                                <p className="text-slate-600 mt-1">
                                  Risk Index: <strong>{riskScore}/100</strong>
                                </p>
                                <p className="text-slate-600">
                                  Drainage Cap: <strong>{ward.drainageCapacityMmHr} mm/h</strong>
                                </p>
                                <button
                                  onClick={() => {
                                    setSelectedWard(ward);
                                    setActiveTab('routes');
                                  }}
                                  className="mt-2 w-full py-1 bg-secondary text-white rounded text-[11px] font-semibold"
                                >
                                  Plan Safe Bypass
                                </button>
                              </div>
                            </Popup>
                          </Marker>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {/* Open Shelters */}
                  <Marker position={[12.9500, 77.6200]} icon={shelterIcon}>
                    <Popup>
                      <div className="p-2 text-xs font-body">
                        <span className="text-emerald-700 font-bold uppercase">Open Relief Shelter</span>
                        <h4 className="font-bold text-slate-900">Adugodi Community Center</h4>
                        <p className="text-slate-600 mt-0.5">Capacity: 450 / 800 beds available</p>
                        <p className="text-slate-600">Equipped with clean water & medical triage.</p>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>

                {/* Floating Quick Action Overlay on Map */}
                <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
                  <div className="bg-surface-container-lowest/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-swiss-ambient border border-outline-variant/30 flex items-center gap-2 pointer-events-auto">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-mono text-xs font-semibold text-on-surface">
                      3 Safe Evacuation Corridors Open
                    </span>
                  </div>

                  <button
                    onClick={() => setActiveTab('routes')}
                    className="bg-primary text-white px-4 py-2 rounded-xl font-heading font-semibold text-xs shadow-swiss-ambient hover:bg-slate-800 flex items-center gap-1.5 pointer-events-auto transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">alt_route</span>
                    <span>Safe Navigation</span>
                  </button>
                </div>
              </div>

              {/* Bottom Flood Zone Hazard Sheet */}
              {selectedWard && (
                <div className="absolute bottom-0 left-0 right-0 z-30 bg-surface-container-lowest p-4 rounded-t-2xl shadow-swiss-raised border-t border-outline-variant/30 flex flex-col gap-3 transition-all">
                  <div className="w-10 h-1 bg-outline-variant/60 rounded-full mx-auto" />
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          SEVERITY: HIGH ALERT
                        </span>
                        <span className="font-mono text-xs text-on-surface-variant">
                          Ward #{selectedWard.code}
                        </span>
                      </div>
                      <h3 className="font-heading font-bold text-lg text-on-surface mt-1">
                        {selectedWard.name} Flood Advisory
                      </h3>
                    </div>
                    <button
                      onClick={() => setSelectedWard(null)}
                      className="p-1 text-on-surface-variant hover:text-on-surface"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-center">
                      <span className="font-mono text-[10px] text-on-surface-variant block">Flood Risk</span>
                      <span className="font-mono font-bold text-base text-severity-critical">
                        {getWardRiskScore(selectedWard.id)}/100
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-center">
                      <span className="font-mono text-[10px] text-on-surface-variant block">Avg Elevation</span>
                      <span className="font-mono font-bold text-base text-hazard-flood">
                        {selectedWard.avgElevationM} m
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-center">
                      <span className="font-mono text-[10px] text-on-surface-variant block">Population</span>
                      <span className="font-mono font-bold text-base text-on-surface">
                        {selectedWard.population.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setRouteDest(selectedWard.name);
                        setActiveTab('routes');
                      }}
                      className="flex-1 h-10 rounded-xl bg-secondary text-white font-heading font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:bg-blue-700"
                    >
                      <span className="material-symbols-outlined text-[16px]">directions</span>
                      <span>Calculate Safe Bypass Route</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('report')}
                      className="px-3 h-10 rounded-xl bg-surface-container text-on-surface font-heading font-semibold text-xs flex items-center justify-center gap-1 hover:bg-surface-container-high"
                    >
                      <span className="material-symbols-outlined text-[16px]">report</span>
                      <span>Report Spot</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* View 2: SAFE ROUTE SELECTION & ACTIVE NAVIGATION */}
          {activeTab === 'routes' && (
            <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
              {/* Route Control Panel */}
              <div className="w-full md:w-96 bg-surface-container-lowest p-4 sm:p-5 border-r border-outline-variant/30 flex flex-col gap-4 overflow-y-auto shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[20px]">alt_route</span>
                    <h2 className="font-heading font-bold text-base text-on-surface">Safe Mobility Engine</h2>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                    AI Flood Guard Active
                  </span>
                </div>

                {/* Origin / Destination inputs */}
                <div className="flex flex-col gap-2 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-secondary shrink-0" />
                    <input
                      type="text"
                      value={routeOrigin}
                      onChange={(e) => setRouteOrigin(e.target.value)}
                      className="w-full bg-transparent text-xs font-semibold text-on-surface focus:outline-none"
                      placeholder="Start point"
                    />
                  </div>
                  <div className="h-px bg-outline-variant/30 my-1 ml-5" />
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                    <input
                      type="text"
                      value={routeDest}
                      onChange={(e) => setRouteDest(e.target.value)}
                      className="w-full bg-transparent text-xs font-semibold text-on-surface focus:outline-none"
                      placeholder="Destination point"
                    />
                  </div>
                </div>

                {/* Flood Hazard Avoidance Toggle */}
                <div className="flex items-center justify-between px-1">
                  <span className="font-body text-xs text-on-surface-variant font-medium">
                    Automatically Bypass Waterlogged Underpasses
                  </span>
                  <button
                    type="button"
                    onClick={() => setAvoidFloods(!avoidFloods)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      avoidFloods ? 'bg-secondary' : 'bg-outline-variant'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                        avoidFloods ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Route Alternatives */}
                <div className="flex flex-col gap-2">
                  <span className="font-heading text-xs uppercase font-bold text-on-surface-variant">
                    Calculated Trajectories
                  </span>

                  {/* Option 1: Safe Elevated Route */}
                  <div
                    onClick={() => setActiveRouteType('safe')}
                    className={`p-3 rounded-xl cursor-pointer border transition-all ${
                      activeRouteType === 'safe'
                        ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'bg-surface-container-low border-outline-variant/30 hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
                        <span className="font-heading font-bold text-xs text-emerald-900">
                          Recommended Safe Corridor
                        </span>
                      </div>
                      <span className="font-mono font-bold text-xs text-emerald-700">18 min (4.2 km)</span>
                    </div>
                    <p className="font-body text-[11px] text-emerald-800 mt-1">
                      Via Domlur Flyover & Intermediate Ring Road. <strong>0% Waterlogging Risk</strong>.
                    </p>
                  </div>

                  {/* Option 2: Direct Low-Lying Route */}
                  <div
                    onClick={() => setActiveRouteType('fast')}
                    className={`p-3 rounded-xl cursor-pointer border transition-all ${
                      activeRouteType === 'fast'
                        ? 'bg-red-50 border-red-500 ring-2 ring-red-500/20 shadow-sm'
                        : 'bg-surface-container-low border-outline-variant/30 hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-red-600 text-[18px]">warning</span>
                        <span className="font-heading font-bold text-xs text-red-900">
                          Direct Route (High Hazard)
                        </span>
                      </div>
                      <span className="font-mono font-bold text-xs text-red-700">14 min (3.1 km)</span>
                    </div>
                    <p className="font-body text-[11px] text-red-800 mt-1">
                      Sony World Underpass flooded (3.2 ft). <strong>78% Stalling Probability</strong>.
                    </p>
                  </div>
                </div>

                {/* Start Navigation Action */}
                {!isNavigating ? (
                  <button
                    onClick={() => setIsNavigating(true)}
                    className="w-full h-11 rounded-xl bg-primary text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-swiss-ambient hover:bg-slate-800"
                  >
                    <span className="material-symbols-outlined text-[18px]">navigation</span>
                    <span>Start Turn-by-Turn Safe Navigation</span>
                  </button>
                ) : (
                  <div className="flex flex-col gap-2 p-3 rounded-xl bg-surface-container border border-secondary/30">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-secondary flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
                        ACTIVE NAVIGATION
                      </span>
                      <button
                        onClick={() => setIsNavigating(false)}
                        className="text-xs text-red-600 font-semibold hover:underline"
                      >
                        Exit Guidance
                      </button>
                    </div>

                    <div className="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/30 mt-1">
                      <span className="font-mono text-[10px] text-on-surface-variant uppercase block">
                        Current Instruction (Step {navigationStep + 1}/4)
                      </span>
                      <p className="font-heading font-bold text-xs text-on-surface mt-0.5">
                        {navigationSteps[navigationStep].text}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-outline-variant/20 font-mono text-[11px]">
                        <span className="text-secondary font-bold">
                          {navigationSteps[navigationStep].distance}
                        </span>
                        <span className="text-on-surface-variant">
                          ETA: {navigationSteps[navigationStep].time}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-1">
                      <button
                        disabled={navigationStep === 0}
                        onClick={() => setNavigationStep((p) => Math.max(0, p - 1))}
                        className="flex-1 py-1.5 rounded-lg bg-surface-container-low text-xs font-semibold disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <button
                        disabled={navigationStep === navigationSteps.length - 1}
                        onClick={() => setNavigationStep((p) => Math.min(navigationSteps.length - 1, p + 1))}
                        className="flex-1 py-1.5 rounded-lg bg-secondary text-white text-xs font-semibold disabled:opacity-40"
                      >
                        Next Waypoint
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Route Map Preview */}
              <div className="flex-1 relative h-full">
                <MapContainer
                  center={[12.9500, 77.6330]}
                  zoom={13}
                  className="w-full h-full"
                  zoomControl={false}
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {/* Origin & Destination Markers */}
                  <Marker position={[12.9352, 77.6245]} icon={citizenIcon}>
                    <Popup>Origin: Koramangala 4th Block</Popup>
                  </Marker>
                  <Marker position={[12.9719, 77.6412]} icon={citizenIcon}>
                    <Popup>Destination: Indiranagar</Popup>
                  </Marker>

                  {/* Draw Safe Route */}
                  {activeRouteType === 'safe' && (
                    <Polyline
                      positions={safeRouteCoords}
                      pathOptions={{ color: '#16A34A', weight: 6, opacity: 0.9 }}
                    />
                  )}

                  {/* Draw Flooded Route */}
                  {activeRouteType === 'fast' && (
                    <>
                      <Polyline
                        positions={directFloodedRouteCoords}
                        pathOptions={{ color: '#DC2626', weight: 5, dashArray: '8, 8', opacity: 0.8 }}
                      />
                      <Marker position={[12.9380, 77.6300]} icon={hazardIcon}>
                        <Popup>Sony World Underpass Flooded (3.2ft)</Popup>
                      </Marker>
                    </>
                  )}
                </MapContainer>
              </div>
            </div>
          )}

          {/* View 3: REAL-TIME ALERTS FEED */}
          {activeTab === 'alerts' && (
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-3xl mx-auto w-full">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-heading font-bold text-lg text-on-surface">
                    Public Emergency Alerts
                  </h2>
                  <p className="font-body text-xs text-on-surface-variant">
                    Verified municipal broadcasts, weather warnings & flood alerts
                  </p>
                </div>
                <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-surface-container font-semibold">
                  {alerts.length} Active Bulletins
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {alerts.map((alert) => {
                  const isCrit = alert.severity === 'CRITICAL' || alert.severity === 'HIGH';
                  return (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-2xl border shadow-swiss-ambient transition-all ${
                        isCrit
                          ? 'bg-red-50/70 border-red-200'
                          : 'bg-surface-container-lowest border-outline-variant/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isCrit ? 'bg-red-600 text-white' : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {alert.severity}
                          </span>
                          <span className="font-mono text-xs text-on-surface-variant">
                            {alert.hazardType}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-on-surface-variant">
                          {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h3 className="font-heading font-bold text-sm text-on-surface mt-2">
                        {alert.title}
                      </h3>
                      <p className="font-body text-xs text-on-surface-variant mt-1 leading-relaxed">
                        {alert.description}
                      </p>

                      {alert.sop && (
                        <div className="mt-2.5 p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/20 flex items-center gap-2 text-xs">
                          <span className="material-symbols-outlined text-secondary text-[16px]">info</span>
                          <span className="font-medium text-on-surface">
                            Advisory: {alert.sop.primaryAction}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* View 4: REPORT HAZARD FLOW */}
          {activeTab === 'report' && (
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-xl mx-auto w-full">
              <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-6 shadow-swiss-ambient border border-outline-variant/30">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-hazard-flood/10 text-hazard-flood flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">add_alert</span>
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-base text-on-surface">
                      Report Road Hazard
                    </h2>
                    <p className="font-body text-xs text-on-surface-variant">
                      Tag waterlogging, fallen trees, or trapped vehicles for immediate municipal dispatch.
                    </p>
                  </div>
                </div>

                {reportSuccess ? (
                  <div className="p-6 text-center flex flex-col items-center gap-2 my-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="material-symbols-outlined text-emerald-600 text-[36px]">
                      check_circle
                    </span>
                    <h3 className="font-heading font-bold text-emerald-900 text-sm">
                      Hazard Report Broadcasted!
                    </h3>
                    <p className="font-body text-xs text-emerald-700">
                      Dispatched to Bangalore Urban Disaster Brigade & reflected on the live digital twin map.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReport} className="flex flex-col gap-4 mt-4">
                    {/* Hazard Category */}
                    <div className="flex flex-col gap-1.5">
                      <label className="font-heading text-xs font-semibold text-on-surface-variant uppercase">
                        Hazard Category
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'FLOOD', label: 'Waterlogging', icon: 'flood' },
                          { id: 'HEAT', label: 'Heat Stress', icon: 'thermostat' },
                          { id: 'FALLEN_TREE', label: 'Road Obstacle', icon: 'park' },
                        ].map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setReportHazardType(cat.id as any)}
                            className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                              reportHazardType === cat.id
                                ? 'bg-secondary text-white border-secondary'
                                : 'bg-surface-container-low border-outline-variant/30 text-on-surface hover:bg-surface-container'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
                            <span>{cat.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Ward Selector */}
                    <div className="flex flex-col gap-1.5">
                      <label className="font-heading text-xs font-semibold text-on-surface-variant uppercase">
                        Ward Location
                      </label>
                      <select
                        value={reportWardId}
                        onChange={(e) => setReportWardId(e.target.value)}
                        className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface text-xs font-medium focus:outline-none focus:border-secondary"
                      >
                        {wards.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name} ({w.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Hazard Title */}
                    <div className="flex flex-col gap-1.5">
                      <label className="font-heading text-xs font-semibold text-on-surface-variant uppercase">
                        Incident Headline
                      </label>
                      <input
                        type="text"
                        required
                        value={reportTitle}
                        onChange={(e) => setReportTitle(e.target.value)}
                        placeholder="e.g. 100ft Road underpass flooded, 2 cars stranded"
                        className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface text-xs font-medium focus:outline-none focus:border-secondary"
                      />
                    </div>

                    {/* Depth & Description */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="font-heading text-xs font-semibold text-on-surface-variant uppercase">
                          Estimated Water Depth
                        </label>
                        <input
                          type="text"
                          value={reportDepth}
                          onChange={(e) => setReportDepth(e.target.value)}
                          placeholder="e.g. 2.5 ft / Knee high"
                          className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface text-xs font-medium focus:outline-none focus:border-secondary"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-heading text-xs font-semibold text-on-surface-variant uppercase">
                          GPS Coordinate Lock
                        </label>
                        <div className="h-10 px-3 rounded-xl bg-surface-container flex items-center font-mono text-xs text-on-surface-variant">
                          12.9352° N, 77.6245° E
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-heading text-xs font-semibold text-on-surface-variant uppercase">
                        Additional Details / Landmark
                      </label>
                      <textarea
                        rows={2}
                        value={reportDesc}
                        onChange={(e) => setReportDesc(e.target.value)}
                        placeholder="Near Sony World signal, traffic diverted to side lane..."
                        className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface text-xs font-medium focus:outline-none focus:border-secondary"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingReport}
                      className="w-full h-11 rounded-xl bg-secondary text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-swiss-ambient hover:bg-blue-700 disabled:opacity-50 transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">send</span>
                      <span>{isSubmittingReport ? 'Broadcasting...' : 'Submit Citizen Report'}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* View 5: EMERGENCY SOS FLOW */}
          {activeTab === 'sos' && (
            <div className="flex-1 p-4 sm:p-6 flex flex-col items-center justify-center max-w-lg mx-auto w-full text-center">
              <div className="bg-red-50 border-2 border-red-500 rounded-3xl p-6 sm:p-8 shadow-swiss-raised flex flex-col items-center gap-4 w-full">
                <div className="w-16 h-16 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg animate-pulse">
                  <span className="material-symbols-outlined text-[36px]">emergency</span>
                </div>

                <h2 className="font-heading font-extrabold text-2xl text-red-950">
                  Emergency Assistance SOS
                </h2>
                <p className="font-body text-xs text-red-900 max-w-xs leading-relaxed">
                  Triggering SOS immediately dispatches your GPS telemetry, medical profile, and nearest shelter request to Disaster Response Units.
                </p>

                {sosSent ? (
                  <div className="p-4 rounded-xl bg-red-600 text-white w-full flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-[32px]">check_circle</span>
                    <span className="font-heading font-bold text-sm">
                      SOS SIGNAL BROADCASTED!
                    </span>
                    <p className="text-xs text-red-100">
                      Disaster Rescue Team #4 dispatched to Koramangala 4th Block (ETA: 6 mins). Keep phone on.
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleTriggerSOSNow}
                    className="w-36 h-36 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white font-heading font-black text-2xl shadow-xl flex flex-col items-center justify-center gap-1 transition-all border-4 border-white"
                  >
                    <span className="material-symbols-outlined text-[32px]">warning</span>
                    <span>SOS</span>
                  </button>
                )}

                <div className="p-3 bg-white/80 rounded-xl border border-red-200 text-left w-full text-xs font-mono text-red-900">
                  <div><strong>Live Coordinate:</strong> 12.9352° N, 77.6245° E</div>
                  <div><strong>Nearest Safe Hub:</strong> Adugodi Shelter (1.2 km)</div>
                  <div><strong>Disaster Hotline:</strong> 1077 / 112 (BBMP Emergency)</div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('map')}
                  className="text-xs font-heading font-semibold text-slate-600 hover:underline"
                >
                  Return to Live Map
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Floating Navigation Bar (Mobile & Desktop) */}
      <nav className="h-16 px-4 bg-surface-container-lowest border-t border-outline-variant/30 flex items-center justify-around shrink-0 z-30 shadow-swiss-ambient">
        {[
          { id: 'map', label: 'Live Map', icon: 'map' },
          { id: 'routes', label: 'Safe Routes', icon: 'alt_route' },
          { id: 'alerts', label: 'Alerts', icon: 'notifications' },
          { id: 'report', label: 'Report', icon: 'add_alert' },
          { id: 'sos', label: 'SOS', icon: 'sos' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-secondary font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
              <span className="font-heading text-[10px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default CitizenHub;
