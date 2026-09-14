import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GovHqLayout } from '../../components/stitch/GovHqLayout';
import { fetchZoneCascade, explainIncident, createTask, fetchLiveWeather, type LiveWeather } from '../../services/api';
import { RealLeafletMap, type RouteSegment, type MapMarker } from '../../components/stitch/RealLeafletMap';
import { 
  getActiveRegion, 
  getActiveLocationDetails, 
  getDynamicAssetsForLocation, 
  getDynamicVehiclesForLocation,
  type RegionKey 
} from '../../citizen/geo';
import { 
  Waves, AlertTriangle, Hospital, Zap, ArrowRight, 
  Layers, Users, Shield, Radio, CheckCircle2, ChevronRight, Sparkles, Thermometer, Navigation, Siren
} from 'lucide-react';

const POLL_INTERVAL_MS = 15000;
const DEMO_INCIDENT_ID = 'INC-204';

const chainColors = ['#ba1a1a', '#ea580c', '#316bf3', '#0090a9'];

export const GovZoneCascadePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [activeRegion, setActiveRegionState] = useState<RegionKey>(getActiveRegion());
  const [activeLayer, setActiveLayer] = useState<'hydro' | 'arterials' | 'egress'>('hydro');
  const [mitigationDispatched, setMitigationDispatched] = useState(false);

  // Dynamic Location Details
  const locDetails = getActiveLocationDetails();

  // Dynamic Region Change Listener
  useEffect(() => {
    const handleRegionEvent = () => setActiveRegionState(getActiveRegion());
    window.addEventListener('climateshield_region_changed', handleRegionEvent);
    return () => window.removeEventListener('climateshield_region_changed', handleRegionEvent);
  }, []);

  const isNepal = activeRegion === 'NEPAL';
  const zoneId = id || (isNepal ? 'KTM' : 'EB');

  // Live zone cascade & weather
  const [cascadeData, setCascadeData] = useState<any | null>(null);
  const [liveWeather, setLiveWeather] = useState<LiveWeather | null>(null);

  // Grounded AI explanation
  const [explain, setExplain] = useState<any | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);

  // Operator approval state
  const [approved, setApproved] = useState<Record<number, 'idle' | 'pending' | 'done' | 'error'>>({});

  // Real-Time Vehicle Telemetry & Simulation State
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % 100);
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    const centerCoords = { lat: locDetails.latitude, lng: locDetails.longitude };

    const load = async () => {
      try {
        const [cData, wData] = await Promise.all([
          fetchZoneCascade(zoneId).catch(() => null),
          fetchLiveWeather(centerCoords.lat, centerCoords.lng).catch(() => null),
        ]);
        if (active) {
          if (cData) setCascadeData(cData);
          if (wData) setLiveWeather(wData);
        }
      } catch {
        // Fallback
      }
    };
    load();

    handleExplain();

    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [zoneId, activeRegion, locDetails.latitude, locDetails.longitude]);

  const handleExplain = async () => {
    setExplainLoading(true);
    setExplainError(null);
    try {
      const data = await explainIncident(DEMO_INCIDENT_ID);
      setExplain(data);
    } catch (err) {
      setExplainError(err instanceof Error ? err.message : 'AI explanation unavailable');
    } finally {
      setExplainLoading(false);
    }
  };

  const priorityToTask = (p?: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
    const up = (p || '').toUpperCase();
    if (up === 'CRITICAL') return 'CRITICAL';
    if (up === 'HIGH') return 'HIGH';
    if (up === 'MEDIUM' || up === 'MODERATE') return 'MEDIUM';
    return 'LOW';
  };

  const handleApprove = async (index: number, action: any) => {
    setApproved((prev) => ({ ...prev, [index]: 'pending' }));
    try {
      await createTask({
        title: action?.reason || action?.actionId || 'Operator-approved response action',
        incidentId: isNepal ? 'INC-KTM-01' : DEMO_INCIDENT_ID,
        priority: priorityToTask(action?.priority),
        description: `Approved from Zone ${zoneId} cascade AI recommendation (${action?.actionId ?? 'n/a'}).`,
      });
      setApproved((prev) => ({ ...prev, [index]: 'done' }));
    } catch {
      setApproved((prev) => ({ ...prev, [index]: 'error' }));
    }
  };

  const handleDispatchMitigation = () => {
    setMitigationDispatched(true);
    setTimeout(() => {
      navigate('/gov/response-center');
    }, 900);
  };

  // Dynamic Map Coordinates & Dynamic Datasets
  const mapCenter: [number, number] = [locDetails.latitude, locDetails.longitude];

  // Dynamic Assets & Vehicles anchored around active location
  const dynamicAssets = getDynamicAssetsForLocation(locDetails.latitude, locDetails.longitude, locDetails.name);
  const dynamicVehicles = getDynamicVehiclesForLocation(locDetails.latitude, locDetails.longitude);

  // Compute Animated Vehicle Positions along their respective Route Polylines
  const vehicleMarkers: MapMarker[] = dynamicVehicles.map((v) => {
    const pts = v.routePoints;
    const totalPts = pts.length;
    const progress = (stepIndex % 20) / 20; // smooth loop
    const segIdx = Math.floor(progress * (totalPts - 1));
    const nextIdx = Math.min(segIdx + 1, totalPts - 1);
    const fraction = (progress * (totalPts - 1)) - segIdx;

    const lat = pts[segIdx][0] + (pts[nextIdx][0] - pts[segIdx][0]) * fraction;
    const lng = pts[segIdx][1] + (pts[nextIdx][1] - pts[segIdx][1]) * fraction;

    let vType: MapMarker['type'] = 'ambulance';
    if (v.vehicleType === 'POLICE_CAR') vType = 'police';
    if (v.vehicleType === 'FIRE_EXTINGUISHER') vType = 'fire';
    if (v.vehicleType === 'RESCUE_BOAT') vType = 'boat';

    return {
      id: v.id,
      lat,
      lng,
      title: `${v.callsign} (${v.driverName})`,
      callsign: v.callsign,
      description: `Speed: ${v.speedKmh} km/h | Status: ${v.status} | Mission: Emergency Dispatch`,
      type: vType,
      speedKmh: v.speedKmh,
      status: v.status,
      severity: 'CRITICAL',
    };
  });

  // Construct Hazard-Colored Polyline Route Segments
  const routeSegments: RouteSegment[] = [
    // Water-logged hazard route segment (RED)
    {
      points: [
        [locDetails.latitude - 0.005, locDetails.longitude - 0.005],
        [locDetails.latitude, locDetails.longitude],
        [locDetails.latitude + 0.004, locDetails.longitude + 0.003],
      ],
      color: 'RED',
      status: 'WATER_LOGGING',
      label: '🔴 Water Logging Hazard Route (Depth +45cm) - Active Inundation',
      dashArray: '8,5',
    },
    // Landslide hazard route segment (ORANGE)
    {
      points: [
        [locDetails.latitude - 0.010, locDetails.longitude + 0.015],
        [locDetails.latitude - 0.010, locDetails.longitude + 0.012],
        [locDetails.latitude - 0.010, locDetails.longitude + 0.010],
      ],
      color: 'ORANGE',
      status: 'LANDSLIDE',
      label: '🟠 Landslide Calamity Debris Blockage - Extreme Caution',
      dashArray: '6,4',
    },
    // Clear emergency bypass route (GREEN)
    {
      points: [
        [locDetails.latitude + 0.004, locDetails.longitude + 0.003],
        [locDetails.latitude + 0.008, locDetails.longitude + 0.006],
      ],
      color: 'GREEN',
      status: 'CLEAR',
      label: '🟢 Safe Emergency Medical Bypass Corridor',
    },
  ];

  const mapZones = [
    {
      id: `zone_${zoneId}`,
      name: `Sector ${zoneId}: ${locDetails.name} Tactical Inundation Basin`,
      lat: locDetails.latitude,
      lng: locDetails.longitude,
      riskLevel: 'CRITICAL' as const,
      radiusMeters: 2000,
    },
  ];

  // Combine Incident, Asset, and Animated Vehicle Markers
  const mapMarkers: MapMarker[] = [
    {
      id: 'inc_active_main',
      lat: locDetails.latitude,
      lng: locDetails.longitude,
      title: `#INC-${zoneId} · ${locDetails.name} Primary Flash Breach`,
      description: `Threat: FLASH_FLOOD | Water depth 1.8m | Risk Score: 92/100`,
      severity: 'CRITICAL',
      type: 'incident',
    },
    {
      id: 'hazard_landslide_1',
      lat: locDetails.latitude - 0.010,
      lng: locDetails.longitude + 0.012,
      title: `Landslide Debris Corridor`,
      description: `Hillside Mudslide Obstructing Emergency Transit`,
      severity: 'CRITICAL',
      type: 'landslide',
    },
    ...dynamicAssets.map((a) => ({
      id: a.id,
      lat: a.latitude,
      lng: a.longitude,
      title: `${a.assetCode} · ${a.name}`,
      description: `Status: ${a.operationalStatus} | Vulnerability: ${a.vulnerability}/100`,
      severity: (a.criticality === 'CRITICAL' ? 'CRITICAL' : 'HIGH') as any,
      type: 'asset' as const,
    })),
    ...vehicleMarkers,
  ];

  // Region-Specific Chain Nodes
  const chainNodes = [
    { assetCode: 'DRAIN-01', asset: `${locDetails.name} Primary Sump Overflow`, impact: 'OVERWHELMED', impactScore: 92 },
    { assetCode: 'SUB-04', asset: `${locDetails.name} Power Substation Infiltration`, impact: 'INUNDATED', impactScore: 84 },
    { assetCode: 'HOSP-01', asset: `${locDetails.name} Regional Trauma Access Severed`, impact: 'ACCESS_BLOCKED', impactScore: 78 },
  ];

  const aiSummaryText = `Compound operational risk for ${locDetails.name}: Active flash flood breach and hillside landslide threaten emergency transit. Water depth +1.8m. Live rescue vehicles (Ambulance, Police, Fire Engine) en route on hazard-routed bypass paths.`;

  const recommendedActionsList = [
    { actionId: 'ACT-01', reason: `Inspect and clear ${locDetails.name} Primary Sump Drain immediately to lower inundation.`, priority: 'CRITICAL' },
    { actionId: 'ACT-02', reason: `Deploy high-ground barrier and re-route EMS units around water-logged red corridors.`, priority: 'CRITICAL' },
  ];

  return (
    <GovHqLayout activePath="/gov/zone-cascade/4B">
      <div className="flex flex-col xl:flex-row w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-[#f8f9ff]">
        
        {/* LEFT & CENTER CANVAS: Leaflet Interactive GIS Engine */}
        <section className="relative flex-1 h-full min-w-0 bg-slate-900 overflow-hidden">
          {/* Base Leaflet Map Component */}
          <div className="absolute inset-0 z-0">
            <RealLeafletMap
              center={mapCenter}
              zoom={14}
              tileTheme="osm"
              styleSwitcherPosition="bottom-right"
              showUserLocation={true}
              zones={mapZones}
              markers={mapMarkers}
              routeSegments={routeSegments}
              className="h-full w-full"
            />
          </div>

          {/* Top HUD Header Bar */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-3 pointer-events-auto bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-md border border-[#e5eeff] text-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#0b1c30]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a] animate-pulse" />
                <span>{locDetails.name}</span>
              </div>
              <span className="text-[#76777d]">|</span>
              <span className="font-mono text-[#45464d]">{locDetails.subtitle}</span>
              <span className="px-2 py-0.5 rounded bg-[#eff4ff] text-[#0051d5] font-semibold flex items-center gap-1">
                <Siren className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                Live GPS Vehicles: 4 Active
              </span>
              {liveWeather && (
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-mono font-bold flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-amber-600" />
                  {liveWeather.temperatureC}°C · Rain {liveWeather.rainfallMmPerHour} mm/h
                </span>
              )}
            </div>

            {/* Layer Switches */}
            <div className="flex items-center gap-1.5 pointer-events-auto bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-[#e5eeff] text-xs font-semibold">
              <button 
                onClick={() => setActiveLayer('hydro')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeLayer === 'hydro' ? 'bg-[#0f172a] text-white shadow-xs' : 'text-[#45464d] hover:bg-[#eff4ff]'
                }`}
              >
                Hydro Dynamics
              </button>
              <button 
                onClick={() => setActiveLayer('arterials')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeLayer === 'arterials' ? 'bg-[#0f172a] text-white shadow-xs' : 'text-[#45464d] hover:bg-[#eff4ff]'
                }`}
              >
                Road Arterials
              </button>
              <button 
                onClick={() => setActiveLayer('egress')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeLayer === 'egress' ? 'bg-[#0f172a] text-white shadow-xs' : 'text-[#45464d] hover:bg-[#eff4ff]'
                }`}
              >
                Egress Corridors
              </button>
            </div>
          </div>

          {/* Bottom-Left Live Telemetry & Vehicles HUD Overlay */}
          <div className="absolute bottom-4 left-4 z-20 hidden md:flex flex-col gap-2 max-w-sm pointer-events-auto">
            <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-3 shadow-2xl text-white">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-sky-400" />
                  Live Rescue Vehicle GPS Radar
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              </div>

              <div className="space-y-2 text-xs">
                {dynamicVehicles.map((v) => (
                  <div key={v.id} className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        {v.vehicleType === 'AMBULANCE' ? '🚑' : v.vehicleType === 'POLICE_CAR' ? '🚓' : v.vehicleType === 'FIRE_EXTINGUISHER' ? '🚒' : '🚤'}
                      </span>
                      <div>
                        <div className="font-bold text-white flex items-center gap-1">
                          <span>{v.callsign}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({v.driverName})</span>
                        </div>
                        <div className="text-[10px] text-slate-400">Status: <span className="text-emerald-400 font-semibold">{v.status}</span></div>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-xs font-bold text-sky-300">{v.speedKmh} km/h</div>
                      <div className="text-[9px] text-slate-500">{v.routeColor} ROUTE</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT SIDEBAR: Compound Cascade Intelligence & Action Center */}
        <aside className="w-full xl:w-96 h-full bg-white border-l border-[#e5eeff] flex flex-col justify-between overflow-y-auto shadow-xs z-10">
          <div className="p-5 space-y-6">
            
            {/* Sector Header */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#76777d] uppercase tracking-wider">
                  Zone Cascade Analysis
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ffece9] text-[#ba1a1a]">
                  LEVEL: CRITICAL
                </span>
              </div>
              <h2 className="text-lg font-bold text-[#0b1c30] mt-1 tracking-tight">
                {locDetails.name} Sector
              </h2>
              <p className="text-xs text-[#45464d] mt-0.5">
                {locDetails.subtitle}
              </p>
            </div>

            {/* Cascade Chain Graphic */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#0b1c30]">Cascade Impact Chain</span>
                <span className="text-[10px] font-mono text-[#76777d]">3 Nodes Compromised</span>
              </div>

              <div className="space-y-2 bg-[#f8f9ff] p-3 rounded-xl border border-[#e5eeff]">
                {chainNodes.map((node, i) => (
                  <div key={node.assetCode} className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-[#e5eeff] shadow-2xs">
                    <div 
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0"
                      style={{ backgroundColor: chainColors[i % chainColors.length] }}
                    >
                      0{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[#0b1c30] truncate">{node.asset}</div>
                      <div className="text-[10px] text-[#76777d] font-mono mt-0.5 flex items-center justify-between">
                        <span>{node.assetCode}</span>
                        <span className="font-bold text-[#ba1a1a]">{node.impact} ({node.impactScore}%)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grounded AI Operational Briefing */}
            <div className="p-3.5 rounded-xl bg-[#eff4ff] border border-[#d3e4fe]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0051d5] mb-1.5">
                <Sparkles className="w-4 h-4 text-[#0051d5]" />
                <span>Grounded AI Operational Briefing</span>
              </div>
              {explainLoading ? (
                <div className="text-xs text-[#76777d] italic">Analyzing cascade graph...</div>
              ) : explainError ? (
                <div className="text-xs text-[#ba1a1a]">{explainError}</div>
              ) : (
                <p className="text-xs text-[#0b1c30] leading-relaxed font-normal">
                  {aiSummaryText}
                </p>
              )}
            </div>

            {/* AI Action Recommendations */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#0b1c30]">Operator Response Plan</span>
                <span className="text-[10px] text-[#76777d]">Requires Approval</span>
              </div>

              <div className="space-y-2">
                {recommendedActionsList.map((act: any, idx: number) => {
                  const status = approved[idx] || 'idle';
                  return (
                    <div key={act.actionId || idx} className="p-3 rounded-xl border border-[#e5eeff] bg-white space-y-2 shadow-2xs">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#eff4ff] text-[#0051d5]">
                          {act.actionId}
                        </span>
                        <span className="text-[10px] font-bold text-[#ba1a1a] uppercase">{act.priority}</span>
                      </div>
                      <p className="text-xs text-[#0b1c30] font-medium leading-snug">
                        {act.reason}
                      </p>
                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={() => handleApprove(idx, act)}
                          disabled={status !== 'idle'}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                            status === 'done'
                              ? 'bg-emerald-600 text-white'
                              : status === 'pending'
                              ? 'bg-slate-300 text-slate-600 cursor-wait'
                              : status === 'error'
                              ? 'bg-red-600 text-white'
                              : 'bg-[#0f172a] text-white hover:bg-slate-800'
                          }`}
                        >
                          {status === 'done' ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                            </>
                          ) : status === 'pending' ? (
                            'Approving...'
                          ) : (
                            'Approve & Issue Task'
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Bottom Action Footer */}
          <div className="p-4 border-t border-[#e5eeff] bg-[#f8f9ff]">
            <button
              onClick={handleDispatchMitigation}
              className={`w-full py-2.5 rounded-xl font-bold text-xs text-white transition-all shadow-md flex items-center justify-center gap-2 ${
                mitigationDispatched ? 'bg-emerald-600' : 'bg-[#0f172a] hover:bg-slate-800'
              }`}
            >
              <span>{mitigationDispatched ? 'Mitigation Dispatched' : 'Execute Full Sector Dispatch'}</span>
              <ArrowRight className="w-4 h-4 text-sky-400" />
            </button>
          </div>
        </aside>

      </div>
    </GovHqLayout>
  );
};
export default GovZoneCascadePage;
