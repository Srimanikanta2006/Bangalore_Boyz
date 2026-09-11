import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GovHqLayout } from '../../components/stitch/GovHqLayout';
import { RealLeafletMap } from '../../components/stitch/RealLeafletMap';
import {
  fetchGovernmentOverview, fetchLiveWeather, fetchLocationOverview,
  type LiveWeather, type LocationOverview,
} from '../../services/api';
import { useOperatorLocation } from '../../hooks/useOperatorLocation';
import { getActiveRegion } from '../../citizen/geo';
import { 
  AlertTriangle, Radio, Download, Send, TrendingUp, 
  Waves, Thermometer, Zap, Hospital, Building2, 
  Navigation, CheckCircle2, ChevronRight, Layers, Maximize2, MapPin, Crosshair
} from 'lucide-react';

const POLL_INTERVAL_MS = 15000;
const WEATHER_POLL_INTERVAL_MS = 60000;

export const GovCommandCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useOperatorLocation();
  const [alertBroadcasted, setAlertBroadcasted] = useState(false);
  const [overview, setOverview] = useState<any | null>(null);
  const [liveWeather, setLiveWeather] = useState<LiveWeather | null>(null);
  const [locationData, setLocationData] = useState<LocationOverview | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // PostgreSQL operational state refreshes every 15s. Provider weather + the
  // location overview (live weather + nearby assets + weather-derived risk for
  // the OPERATOR'S ACTUAL COORDINATES) refresh every minute.
  useEffect(() => {
    // Wait until geolocation has resolved (to GPS or fallback) before fetching.
    if (location.source === 'pending') return;
    const { latitude, longitude } = location;
    let active = true;
    const loadOverview = async () => {
      try {
        const data = await fetchGovernmentOverview();
        if (active) {
          setOverview(data);
          setLastSyncedAt(new Date().toISOString());
        }
      } catch (err) {
        if (active) setLiveError(err instanceof Error ? err.message : 'PostgreSQL dashboard data is unavailable');
      }
    };
    const loadWeather = async () => {
      try {
        const [weather, loc] = await Promise.all([
          fetchLiveWeather(latitude, longitude),
          fetchLocationOverview(latitude, longitude, 5).catch(() => null),
        ]);
        if (active) {
          setLiveWeather(weather);
          if (loc) setLocationData(loc);
          setLiveError(null);
          setLastSyncedAt(new Date().toISOString());
        }
      } catch (err) {
        if (active) setLiveError(err instanceof Error ? err.message : 'Live weather is unavailable');
      }
    };
    void loadOverview();
    void loadWeather();
    const overviewTimer = setInterval(() => void loadOverview(), POLL_INTERVAL_MS);
    const weatherTimer = setInterval(() => void loadWeather(), WEATHER_POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(overviewTimer);
      clearInterval(weatherTimer);
    };
  }, [location.source, location.latitude, location.longitude]);

  const fmtLevel = (level?: string) => (level ? level.replace(/_/g, ' ') : 'MODERATE CAUTION');
  const numberOrDash = (value: number | null | undefined, digits = 1) =>
    value == null ? '—' : value.toFixed(digits);

  // Live, location-derived values (from /api/location/overview for the operator's coords).
  const derived = locationData?.weather?.derivedAssessment;
  const liveSeverity = derived?.overallSeverity ?? null;
  const nearbyAssetCount = locationData?.nearbyAssets?.length ?? null;
  const resolvedZoneName = locationData?.zone?.name ?? null;
  const locLabel = location.source === 'gps'
    ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
    : `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)} (demo)`;
  const syncLabel = lastSyncedAt
    ? new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(lastSyncedAt))
    : 'Connecting…';

  const handleBroadcast = () => {
    setAlertBroadcasted(true);
    setTimeout(() => setAlertBroadcasted(false), 3000);
  };

  const handleExportSitrep = () => {
    const activeReg = getActiveRegion();
    const sitrepData = {
      title: `ClimateShield Emergency SITREP — ${activeReg}`,
      generatedAt: new Date().toISOString(),
      region: activeReg,
      threatLevel: 'TACTICAL ESCALATION LEVEL 2',
      activeThreats: overview?.activeThreats ?? 2,
      criticalAssetsCompromised: overview?.criticalInfrastructure?.compromised ?? 2,
      liveWeather: liveWeather ?? { temperatureC: 22, rainfallMmPerHour: 48.2 },
      notes: 'Operational SITREP generated for EOC Ops dispatch.',
    };

    const blob = new Blob([JSON.stringify(sitrepData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ClimateShield_SITREP_${activeReg}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <GovHqLayout activePath="/gov/overview">
      <div className="flex flex-col w-full">
        {/* Operational Sub-Header & Status Ribbon */}
        <div className="px-6 py-3 bg-white border-b border-[#e5eeff] flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d97706] animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0b1c30]">
                STATE: TACTICAL ESCALATION LEVEL 2
              </span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-[#dce9ff]" />
            <div className="flex items-center gap-1.5 text-xs text-[#0b1c30] font-semibold">
              {location.source === 'gps'
                ? <Crosshair className="w-3.5 h-3.5 text-emerald-600" />
                : <MapPin className="w-3.5 h-3.5 text-[#d97706]" />}
              <span className="text-[#0051d5]">{resolvedZoneName ?? 'Operator Location'}</span>
              <span className="font-mono text-[10px] text-[#45464d]">{locLabel}</span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${location.source === 'gps' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {location.source === 'gps' ? 'GPS LIVE' : 'DEMO LOC'}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded bg-[#eff4ff] text-[#45464d]">
              <span>SYNC {syncLabel}</span>
              <span className={`font-bold ${liveError ? 'text-[#dc2626]' : 'text-[#0051d5]'}`}>• {liveError ? 'DATA DEGRADED' : 'POSTGRES + WEATHER OK'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={handleExportSitrep}
              className="px-3.5 py-1.5 rounded-xl bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0b1c30] text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[#d3e4fe]"
            >
              <Download className="w-3.5 h-3.5 text-[#0051d5]" />
              <span>Export SITREP</span>
            </button>
            <button 
              type="button"
              onClick={handleBroadcast}
              className={`px-3.5 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all ${
                alertBroadcasted ? 'bg-emerald-600' : 'bg-[#dc2626] hover:bg-[#b91c1c]'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{alertBroadcasted ? 'Alert Sent to All Civilians' : 'Broadcast Emergency Alert'}</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col gap-6">
          {/* Top Bento KPI Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            {/* 2-Column: Threat Telemetry & Resilience Index */}
            <div className="xl:col-span-2 rounded-2xl bg-white p-4 shadow-sm border border-[#e5eeff] flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#76777d] tracking-wider">
                      MUNICIPAL RESILIENCE INDEX
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-extrabold text-[#0b1c30]">{overview?.resilienceIndex ?? 38}<span className="text-sm font-normal text-[#76777d]">/100</span></span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#b45309] text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                        {fmtLevel(overview?.resilienceLevel)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#76777d]">12h Trend Delta</span>
                    <div className="flex items-center justify-end gap-0.5 text-[#b91c1c] text-xs font-bold font-mono">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{overview?.resilienceTrend?.description ?? 'Awaiting PostgreSQL data'}</span>
                    </div>
                  </div>
                </div>

                {/* Trend Sparkline */}
                <div className="w-full h-10 my-2">
                  <svg className="w-full h-full text-[#0051d5]" fill="none" viewBox="0 0 320 48" preserveAspectRatio="none">
                    <path d="M0 40 L30 38 L60 35 L90 39 L120 30 L150 26 L180 28 L210 20 L240 16 L270 18 L300 9 L320 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M0 40 L30 38 L60 35 L90 39 L120 30 L150 26 L180 28 L210 20 L240 16 L270 18 L300 9 L320 4 L320 48 L0 48 Z" fill="currentColor" fillOpacity="0.08" />
                  </svg>
                </div>
              </div>

              {/* Data Strip */}
              <div className="grid grid-cols-4 gap-2 pt-2 bg-[#eff4ff] rounded-xl p-2.5 border border-[#d3e4fe] text-xs">
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#76777d]">Precipitation</span>
                  <span className="font-mono font-bold text-[#0b1c30]">{numberOrDash(liveWeather?.rainfallMmPerHour)} mm/h</span>
                  <span className="text-[10px] text-[#0051d5] font-semibold mt-0.5">{liveWeather?.dataQuality ?? 'CONNECTING'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#76777d]">Temperature</span>
                  <span className="font-mono font-bold text-[#0b1c30]">{numberOrDash(liveWeather?.temperatureC)} °C</span>
                  <span className="text-[10px] text-[#0051d5] font-semibold mt-0.5">Open-Meteo</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#76777d]">Wind</span>
                  <span className="font-mono font-bold text-[#0b1c30]">{numberOrDash(liveWeather?.windSpeedKmh)} km/h</span>
                  <span className="text-[10px] text-[#76777d] mt-0.5">{liveWeather?.windDirectionCardinal ?? '—'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#76777d]">DB Threats</span>
                  <span className="font-mono font-bold text-[#dc2626]">{overview?.activeThreats ?? '—'} active</span>
                  <span className="text-[10px] text-[#76777d] font-semibold mt-0.5">PostgreSQL state</span>
                </div>
              </div>
            </div>

            {/* KPI 2: Active Hazards */}
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-[#e5eeff] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[#76777d] tracking-wider">LIVE THREAT (YOUR AREA)</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  liveSeverity === 'CRITICAL' ? 'bg-[#fee2e2] text-[#b91c1c]'
                  : liveSeverity === 'HIGH' ? 'bg-[#ffedd5] text-[#c2410c]'
                  : liveSeverity === 'MODERATE' ? 'bg-[#fef3c7] text-[#b45309]'
                  : liveSeverity === 'LOW' ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-[#eff4ff] text-[#0051d5]'}`}>
                  {liveSeverity ?? 'NOMINAL'}
                </span>
              </div>
              <div className="my-1">
                <span className="text-3xl font-extrabold text-[#0b1c30]">{nearbyAssetCount ?? '—'}</span>
                <span className="text-xs text-[#76777d] block">Real assets within 5 km</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-[#eff4ff]">
                  <span className="font-semibold text-[#0b1c30]">Live rainfall</span>
                  <span className="font-mono text-[#0051d5] font-bold">{numberOrDash(liveWeather?.rainfallMmPerHour)} mm/h</span>
                </div>
                <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-[#eff4ff]">
                  <span className="font-semibold text-[#0b1c30]">Live temperature</span>
                  <span className="font-mono text-[#d97706] font-bold">{numberOrDash(liveWeather?.temperatureC)}°C</span>
                </div>
                <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-[#eff4ff]">
                  <span className="font-semibold text-[#0b1c30]">Weather condition</span>
                  <span className="font-mono text-[#76777d] font-bold">{liveWeather?.weatherCondition ?? '—'}</span>
                </div>
              </div>
            </div>

            {/* KPI 3: Critical Assets at Risk */}
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-[#e5eeff] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[#76777d] tracking-wider">CRITICAL INFRASTRUCTURE</span>
                <Hospital className="w-4 h-4 text-[#dc2626]" />
              </div>
              <div className="my-1">
                {locationData?.nearbyAssets?.length ? (
                  <>
                    <span className="text-2xl font-extrabold text-[#0b1c30]">{nearbyAssetCount} <span className="text-sm font-semibold text-[#0051d5]">Nearby</span></span>
                    <span className="text-xs text-[#76777d] block">Real infrastructure ≤ 5 km (OSM/DB)</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-extrabold text-[#0b1c30]">{overview?.criticalInfrastructure?.compromised ?? 2} <span className="text-sm font-semibold text-[#dc2626]">Compromised</span></span>
                    <span className="text-xs text-[#76777d] block">{overview?.criticalInfrastructure?.total ?? 14} Inspected / Normal</span>
                  </>
                )}
              </div>
              <div className="space-y-1.5 text-xs">
                {locationData?.nearbyAssets?.length ? (
                  locationData.nearbyAssets.slice(0, 2).map((a) => (
                    <div key={a.id} className="p-2 rounded-lg bg-[#eff4ff] flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="font-bold text-[#0b1c30] block truncate">{a.name}</span>
                        <span className="text-[10px] text-[#76777d]">{a.distanceKm} km • {a.operationalStatus}</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-[#d3e4fe] text-[#0051d5] text-[9px] font-bold shrink-0">{a.type}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="p-2 rounded-lg bg-[#fff7ed] flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#0b1c30] block truncate">Memorial Hospital</span>
                        <span className="text-[10px] text-[#76777d]">Arterial Access Blocked</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-[#ffedd5] text-[#c2410c] text-[9px] font-bold">HEAT/FLOOD</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#eff4ff] flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#0b1c30] block truncate">Substation #9</span>
                        <span className="text-[10px] text-[#76777d]">Runoff Threshold Exceeded</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-[#fef3c7] text-[#b45309] text-[9px] font-bold">MONITOR</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* KPI 4: Road Disruptions */}
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-[#e5eeff] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[#76777d] tracking-wider">ROAD MOBILITY</span>
                <Navigation className="w-4 h-4 text-[#0051d5]" />
              </div>
              <div className="my-1">
                <span className="text-2xl font-extrabold text-[#0b1c30]">7.2 <span className="text-xs font-normal text-[#76777d]">km</span></span>
                <span className="text-xs text-[#76777d] block">Total Closures</span>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#76777d]">Reroute Flow</span>
                  <span className="font-bold text-emerald-600">91% Adaptive</span>
                </div>
                <div className="w-full h-1.5 bg-[#dce9ff] rounded-full overflow-hidden mb-2">
                  <div className="w-[91%] h-full bg-emerald-500 rounded-full" />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-[#45464d]">
                  <span>Ring: Free</span>
                  <span className="text-[#dc2626] font-bold">Underpass 4: Flooded</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dominant Interactive GIS Canvas Container */}
          <div className="relative w-full h-[540px] rounded-2xl overflow-hidden shadow-sm bg-slate-100 flex flex-col justify-between border border-[#e5eeff]">
            <RealLeafletMap
              center={
                getActiveRegion() === 'NEPAL'
                  ? [27.7172, 85.3140]
                  : [13.062, 80.275]
              }
              zoom={13}
              tileTheme="osm" // Default Street Mode basemap
              showUserLocation={true}
              zones={[
                getActiveRegion() === 'NEPAL'
                  ? {
                      id: 'zone_ktm_nepal',
                      name: 'Kathmandu Bagmati River Inundation Sector',
                      lat: 27.7172,
                      lng: 85.3140,
                      riskLevel: 'CRITICAL',
                      radiusMeters: 2200,
                    }
                  : {
                      id: 'zone_eb',
                      name: 'East Basin Sector (Critical Inundation)',
                      lat: 13.062,
                      lng: 80.275,
                      riskLevel: 'CRITICAL',
                      radiusMeters: 1800,
                    },
              ]}
              markers={
                getActiveRegion() === 'NEPAL'
                  ? [
                      {
                        id: 'inc_ktm_main',
                        lat: 27.6830,
                        lng: 85.3080,
                        title: '#INC-KTM-01 Bagmati River Flood Breach',
                        description: 'Water depth: 2.1m | Flow: 2.4m/s | Risk Score: 94/100',
                        severity: 'CRITICAL',
                        type: 'incident',
                      },
                      {
                        id: 'asset_brg_ktm',
                        lat: 27.6890,
                        lng: 85.3190,
                        title: 'Bagmati River Bridge',
                        description: 'Status: COMPROMISED (94/100)',
                        severity: 'CRITICAL',
                        type: 'asset',
                      },
                      {
                        id: 'asset_hosp_ktm',
                        lat: 27.6966,
                        lng: 85.3591,
                        title: 'Tribhuvan Medical Emergency Hub',
                        description: 'Level-1 Emergency Trauma Center',
                        severity: 'HIGH',
                        type: 'asset',
                      },
                    ]
                  : [
                      ...(overview?.incidents || []).map((inc: any, idx: number) => ({
                        id: inc.id || `inc_${idx}`,
                        lat: inc.latitude || 13.062 + idx * 0.008,
                        lng: inc.longitude || 80.275 - idx * 0.006,
                        title: inc.title || `Incident #${inc.incidentCode || inc.id}`,
                        description: `${inc.threatType || 'HAZARD'} | Severity: ${inc.severity || 'CRITICAL'}`,
                        severity: (inc.severity || 'CRITICAL') as any,
                        type: 'incident' as const,
                      })),
                      {
                        id: 'inc_204_main',
                        lat: 13.064,
                        lng: 80.276,
                        title: '#INC-204 Bayshore Underpass Flooded',
                        description: 'Water depth: 1.4m | Risk Score: 84/100',
                        severity: 'CRITICAL',
                        type: 'incident',
                      },
                      {
                        id: 'asset_d07',
                        lat: 13.061,
                        lng: 80.273,
                        title: 'East Basin Drain D07',
                        description: 'Critical Drainage Pump Infrastructure',
                        type: 'asset',
                      },
                    ]
              }
              onMarkerClick={(m) => {
                if (m.id.includes('204') || m.id.includes('eb')) {
                  navigate('/gov/zone-cascade/inc_204');
                }
              }}
            />

            {/* Top GIS HUD Overlays */}
            <div className="relative z-10 flex items-center justify-between p-4">
              <div className="flex items-center gap-3 bg-black/75 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-white text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626] animate-pulse" />
                <span className="font-bold">LIVE EOC SYNTHETIC GIS</span>
                <span className="text-slate-400">|</span>
                <span className="font-mono text-[#38bdf8]">SECTOR 04-B WATERFRONT</span>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => navigate('/gov/zone-cascade/EB')}
                  className="px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 text-white text-xs font-semibold hover:bg-white/10 transition-colors flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>Cascade Impact View</span>
                </button>
              </div>
            </div>

            {/* Interactive Target Callouts on Canvas */}
            <div 
              onClick={() => navigate('/gov/zone-cascade/EB')}
              className="absolute top-[48%] left-[45%] z-20 flex flex-col items-center cursor-pointer group"
            >
              <div className="w-6 h-6 rounded-full bg-[#dc2626] text-white flex items-center justify-center font-bold shadow-lg animate-bounce">
                !
              </div>
              <div className="mt-1 bg-black/85 backdrop-blur px-3 py-1.5 rounded-xl border border-red-500/50 text-white text-center">
                <span className="text-[10px] text-red-400 font-mono font-bold block">#INC-204 • CRITICAL</span>
                <span className="text-xs font-bold block">Bayshore Underpass Flooded</span>
                <span className="text-[10px] text-slate-300">Water Depth 1.4m</span>
              </div>
            </div>

            {/* Bottom HUD Bar */}
            <div className="relative z-10 bg-black/80 backdrop-blur-md px-4 py-2.5 border-t border-white/10 flex items-center justify-between text-xs text-white font-mono">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Sensors: 14/14 Online
                </span>
                <span>Precip Peak: 42 mm/h</span>
                <span>Runoff Surge: +18cm/20m</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => navigate('/gov/response-center')}
                  className="text-[#38bdf8] hover:underline font-semibold"
                >
                  View Incident Queue →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GovHqLayout>
  );
};
export default GovCommandCenterPage;
