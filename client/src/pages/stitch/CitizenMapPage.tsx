import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/stitch/Header';
import { BottomNav } from '../../components/stitch/BottomNav';
import { SosFab } from '../../components/stitch/SosFab';
import { useCitizenNearby } from '../../citizen/useCitizenNearby';
import type { CorridorStatus, SafetyLevel } from '../../citizen/api';
import { RealLeafletMap } from '../../components/stitch/RealLeafletMap';
import { getActiveRegion, setActiveRegion, type RegionKey } from '../../citizen/geo';

const SAFETY_LABEL: Record<SafetyLevel, string> = {
  SAFE: 'All Clear',
  MODERATE: 'Moderate Caution',
  HIGH: 'High Risk',
  CRITICAL: 'Critical Danger',
};

const CORRIDOR_LABEL: Record<CorridorStatus, string> = {
  CLEAR: 'Safe Corridor Active',
  CAUTION: 'Use Caution',
  BLOCKED: 'Corridor Blocked',
};

export const CitizenMapPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeRegion, setActiveRegionState] = useState<RegionKey>(getActiveRegion());
  const [activeLayer, setActiveLayer] = useState<'all' | 'rain' | 'aqi'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, loading, coords, refetch } = useCitizenNearby(5);

  const handleRegionChange = (region: RegionKey) => {
    setActiveRegion(region);
    setActiveRegionState(region);
    if (region === 'GPS') refetch();
  };

  // Dynamic Center based on active selected region
  const currentCenter: [number, number] =
    activeRegion === 'NEPAL'
      ? [27.7172, 85.3140]
      : activeRegion === 'CHENNAI'
      ? [13.062, 80.275]
      : [coords?.latitude ?? 13.062, coords?.longitude ?? 80.275];

  const wardName =
    activeRegion === 'NEPAL'
      ? 'Kathmandu Valley (Bagmati Basin, Nepal)'
      : activeRegion === 'CHENNAI'
      ? 'East Basin (Chennai)'
      : data?.ward?.name ?? (loading ? 'Locating…' : 'Your Location');

  const aqiLabel =
    activeRegion === 'NEPAL'
      ? 'Air AQI 142 (Moderate)'
      : data?.airQuality?.usAqi
      ? `Air AQI ${data.airQuality.usAqi}`
      : 'Air AQI 106';

  const riskSummary =
    activeRegion === 'NEPAL'
      ? '2 Flash Floods Nearby • Active Bagmati Inundation'
      : activeRegion === 'CHENNAI'
      ? '1 Flood Risk Nearby • East Basin Overflow'
      : data
      ? `${data.hazards?.length ?? 0} Risks Nearby`
      : '0 Risks Nearby';

  const safetyLabel =
    activeRegion === 'NEPAL'
      ? 'High Hazard Zone'
      : activeRegion === 'CHENNAI'
      ? 'Moderate Caution'
      : data
      ? SAFETY_LABEL[data.safety.level]
      : 'Safe Corridor';

  const corridorLabel =
    activeRegion === 'NEPAL'
      ? 'Safe Ridge Route Active'
      : activeRegion === 'CHENNAI'
      ? 'East Basin Corridor'
      : data
      ? CORRIDOR_LABEL[data.corridorStatus]
      : 'Safe Corridor Active';

  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md min-h-screen flex flex-col relative w-full max-w-[440px] mx-auto shadow-2xl border-x border-outline-variant/20 overflow-hidden">
      {/* Fixed App Header */}
      <Header title="Map & Navigation" subtitle={wardName} />

      {/* Main Map Content Viewport */}
      <main className="flex-1 flex flex-col relative w-full pt-16 pb-16 bg-surface">
        <div className="flex flex-col w-full relative select-none h-[calc(100vh-8rem)] min-h-[580px]">
          
          {/* TOP DEMO REGION & SEARCH CONTROL BAR (Strictly non-overlapping stack) */}
          <div className="bg-slate-900 text-white p-2 flex flex-col gap-2 z-20 shadow-md border-b border-slate-800">
            {/* Region Selector Ribbon */}
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1 shrink-0">
                LOCATION REGION:
              </span>
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => handleRegionChange('GPS')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 ${
                    activeRegion === 'GPS' ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  📍 My GPS
                </button>
                <button
                  onClick={() => handleRegionChange('NEPAL')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 ${
                    activeRegion === 'NEPAL' ? 'bg-red-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  🇳🇵 Nepal (Katmandu Flood)
                </button>
                <button
                  onClick={() => handleRegionChange('CHENNAI')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 ${
                    activeRegion === 'CHENNAI' ? 'bg-amber-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  🇮🇳 Chennai
                </button>
              </div>
            </div>

            {/* Origin & Destination Search Input Bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-800/90 rounded-xl px-3 py-1.5 flex items-center gap-2 border border-slate-700">
                <span className="material-symbols-outlined text-slate-400 text-[18px]">search</span>
                <input
                  className="flex-1 min-w-0 bg-transparent text-white font-medium text-xs placeholder:text-slate-400 focus:outline-none"
                  placeholder={
                    activeRegion === 'NEPAL'
                      ? 'Thamel Tourist Quarter → Pashupati Shelter…'
                      : 'Search origin & destination for safe route…'
                  }
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') navigate('/citizen/routes');
                  }}
                />
              </div>
              <button
                onClick={() => navigate('/citizen/routes')}
                className="px-3 py-2 rounded-xl bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 transition shrink-0 flex items-center gap-1 shadow"
              >
                <span className="material-symbols-outlined text-[16px]">alt_route</span>
                <span>Find Route</span>
              </button>
            </div>
          </div>

          {/* Interactive Map Canvas */}
          <div className="relative flex-1 w-full overflow-hidden bg-surface-container-low">
            <RealLeafletMap
              center={currentCenter}
              zoom={13}
              tileTheme="osm"
              showUserLocation={activeRegion === 'GPS'}
              zones={[
                activeRegion === 'NEPAL'
                  ? {
                      id: 'zone_ktm_nepal',
                      name: 'Kathmandu Bagmati River Inundation Sector',
                      lat: 27.7172,
                      lng: 85.3140,
                      riskLevel: 'CRITICAL',
                      radiusMeters: 2200,
                    }
                  : {
                      id: 'zone_eb_chennai',
                      name: 'East Basin Flood Catchment',
                      lat: 13.062,
                      lng: 80.275,
                      riskLevel: 'HIGH',
                      radiusMeters: 1600,
                    },
              ]}
              markers={
                activeRegion === 'NEPAL'
                  ? [
                      {
                        id: 'ktm_origin',
                        lat: 27.7172,
                        lng: 85.3140,
                        title: 'Origin: Thamel Quarter, Kathmandu',
                        description: 'Start Location | City Center',
                        type: 'user' as const,
                      },
                      {
                        id: 'ktm_hazard_1',
                        lat: 27.6830,
                        lng: 85.3080,
                        title: 'Bagmati River Bank Breach',
                        description: 'Water depth: 2.1m | Flow: 2.4 m/s | BRIDGE COMPROMISED',
                        severity: 'CRITICAL' as const,
                        type: 'hazard' as const,
                      },
                      {
                        id: 'ktm_hazard_2',
                        lat: 27.6890,
                        lng: 85.3190,
                        title: 'Balkhu Highway Submersion',
                        description: 'Primary road submerged by flash runoff',
                        severity: 'HIGH' as const,
                        type: 'hazard' as const,
                      },
                      {
                        id: 'ktm_shelter',
                        lat: 27.7080,
                        lng: 85.3400,
                        title: 'Destination: Pashupati High-Ground Relief Center',
                        description: 'Safe Evacuation Shelter | Capacity: 1200 beds',
                        type: 'unit' as const,
                      },
                      {
                        id: 'ktm_hospital',
                        lat: 27.6966,
                        lng: 85.3591,
                        title: 'Tribhuvan Medical Emergency Center',
                        description: 'Level-1 Emergency Trauma Hospital',
                        type: 'asset' as const,
                      },
                    ]
                  : [
                      {
                        id: 'chennai_user',
                        lat: 13.062,
                        lng: 80.275,
                        title: 'Your Location: East Basin',
                        description: 'Start Location',
                        type: 'user' as const,
                      },
                      {
                        id: 'chennai_hazard',
                        lat: 13.064,
                        lng: 80.276,
                        title: 'East Basin Culvert Overflow',
                        description: 'Water depth: 1.4m',
                        severity: 'HIGH' as const,
                        type: 'hazard' as const,
                      },
                      {
                        id: 'chennai_shelter',
                        lat: 13.070,
                        lng: 80.260,
                        title: 'East Basin Safe Shelter',
                        description: 'Safe Destination',
                        type: 'unit' as const,
                      },
                    ]
              }
              routes={
                activeRegion === 'NEPAL'
                  ? [[[27.7172, 85.3140], [27.7120, 85.3250], [27.7080, 85.3400]]]
                  : [[[13.062, 80.275], [13.070, 80.260]]]
              }
            />

            {/* RIGHT RAIL MAP UTILITY CONTROLS */}
            <div className="absolute right-3 top-3 z-20 flex flex-col gap-2 pointer-events-auto">
              <button
                className="w-9 h-9 rounded-xl bg-slate-900/90 text-white border border-slate-700 shadow-lg flex items-center justify-center hover:bg-slate-800 transition active:scale-95"
                title="Switch Hazard Layers"
                type="button"
                onClick={() => setActiveLayer(activeLayer === 'all' ? 'rain' : activeLayer === 'rain' ? 'aqi' : 'all')}
              >
                <span className="material-symbols-outlined text-[18px]">layers</span>
              </button>
              <button
                className="w-9 h-9 rounded-xl bg-slate-900/90 text-white border border-slate-700 shadow-lg flex items-center justify-center hover:bg-slate-800 transition active:scale-95"
                title="Recenter Map"
                type="button"
                onClick={() => handleRegionChange(activeRegion)}
              >
                <span className="material-symbols-outlined text-[18px]">my_location</span>
              </button>
            </div>

            {/* LEFT OVERLAY RADAR PILLS */}
            <div className="absolute left-3 top-3 z-20 flex flex-col gap-1.5 pointer-events-auto">
              <button
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur shadow text-xs font-bold transition-all ${
                  activeLayer === 'rain' || activeLayer === 'all'
                    ? 'bg-slate-900/90 text-blue-400 border border-blue-500/40'
                    : 'bg-slate-900/50 text-slate-400'
                }`}
                type="button"
                onClick={() => setActiveLayer(activeLayer === 'rain' ? 'all' : 'rain')}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span>Rain Radar</span>
              </button>
              <button
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur shadow text-xs font-bold transition-all ${
                  activeLayer === 'aqi' || activeLayer === 'all'
                    ? 'bg-slate-900/90 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-900/50 text-slate-400'
                }`}
                type="button"
                onClick={() => setActiveLayer(activeLayer === 'aqi' ? 'all' : 'aqi')}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{aqiLabel}</span>
              </button>
            </div>

            {/* FLOATING RISK SUMMARY CARD */}
            <div className="absolute left-3 right-16 bottom-3 z-20 pointer-events-auto">
              <div
                className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-900/95 backdrop-blur-xl rounded-xl shadow-xl border border-slate-700/80 cursor-pointer hover:bg-slate-900 transition"
                onClick={() => navigate('/citizen/alerts')}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                  <span className="text-xs font-bold text-white truncate">
                    {riskSummary}
                  </span>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-[16px] shrink-0">arrow_forward</span>
              </div>
            </div>
          </div>

          {/* METROPOLITAN SAFETY INDEX BOTTOM BAR */}
          <div className="w-full px-4 py-3 bg-surface border-t border-outline-variant/30 flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                SAFETY INDEX: {wardName}
              </p>
              <p className="text-sm font-bold text-on-surface">
                {safetyLabel} • <span className="text-blue-600 font-semibold">{corridorLabel}</span>
              </p>
            </div>
            <button
              onClick={() => navigate('/citizen/routes')}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition shadow flex items-center gap-1 shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">navigation</span>
              <span>Safe Route</span>
            </button>
          </div>
        </div>
      </main>

      {/* Floating SOS Emergency Alert Button (Positioned safely above bottom nav) */}
      <SosFab />

      {/* Persistent Bottom Nav */}
      <BottomNav activeTab="map" />
    </div>
  );
};
